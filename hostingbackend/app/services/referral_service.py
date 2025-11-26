
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Any

from app.models.referrals import ReferralEarning, ReferralPayout
from app.models.users import UserProfile
from app.schemas.referrals import ReferralPayoutCreate, ReferralStats


class ReferralService:
    """Handles multi-level referral commissions, payout requests, and admin tracking."""

    # --------------------------------------------------------
    # 🔹 Commission structures
    # --------------------------------------------------------
    RECURRING_COMMISSIONS = {1: Decimal("0.05"), 2: Decimal("0.01"), 3: Decimal("0.01")}
    LONGTERM_COMMISSIONS = {1: Decimal("0.15"), 2: Decimal("0.03"), 3: Decimal("0.02")}

    # --------------------------------------------------------
    # ✅ Record commissions when an order completes
    # --------------------------------------------------------
    async def record_commission_earnings(
        self,
        db: AsyncSession,
        user_id: int,
        order_id: int,
        plan_amount: Decimal,
        plan_type: str
    ):
        """
        Create 3-level referral earnings whenever an order completes.
        Automatically tracks commissions for up to 3 upline users.
        If user has no referrer, commission goes to L1 referrer only.
        """
        result = await db.execute(select(UserProfile).where(UserProfile.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return  # ❌ User not found
        
        if not user.referred_by:
            print(f"ℹ️ User {user_id} has no referrer, skipping commission")
            return  # No referrer chain

        structure = (
            self.RECURRING_COMMISSIONS if plan_type == "recurring"
            else self.LONGTERM_COMMISSIONS
        )

        current_referrer_id = user.referred_by

        for level, percent in structure.items():
            if not current_referrer_id:
                break

            commission_amount = plan_amount * percent

            earning = ReferralEarning(
                # user_id=current_referrer_id,        # Who earned
                # referred_user_id=user_id,           # Who made the purchase

                user_id=current_referrer_id,        # ✅ The referrer who earned
                referred_user_id=user_id, 
                order_id=order_id,
                level=level,
                commission_rate=percent * 100,
                order_amount=plan_amount,
                commission_amount=commission_amount,
                status="pending",
            )

            db.add(earning)
            await db.flush()

            # Find next-level referrer
            next_ref = await db.execute(
                select(UserProfile.referred_by).where(UserProfile.id == current_referrer_id)
            )
            current_referrer_id = next_ref.scalar_one_or_none()

        await db.commit()

    # --------------------------------------------------------
    # ✅ User stats (Dashboard)
    # --------------------------------------------------------
    async def get_user_referral_stats(self, db: AsyncSession, user_id: int) -> ReferralStats:
        """Return detailed stats for user's referrals and earnings."""

        # --- Level 1 ---
        l1_result = await db.execute(select(func.count(UserProfile.id)).where(UserProfile.referred_by == user_id))
        l1_referrals = l1_result.scalar() or 0

        # --- Level 2 ---
        l2_result = await db.execute(
            select(func.count(UserProfile.id)).where(
                UserProfile.referred_by.in_(
                    select(UserProfile.id).where(UserProfile.referred_by == user_id)
                )
            )
        )
        l2_referrals = l2_result.scalar() or 0

        # --- Level 3 ---
        l3_result = await db.execute(
            select(func.count(UserProfile.id)).where(
                UserProfile.referred_by.in_(
                    select(UserProfile.id).where(
                        UserProfile.referred_by.in_(
                            select(UserProfile.id).where(UserProfile.referred_by == user_id)
                        )
                    )
                )
            )
        )
        l3_referrals = l3_result.scalar() or 0

        total_referrals = l1_referrals + l2_referrals + l3_referrals

        total_earnings_result = await db.execute(
            select(func.coalesce(func.sum(ReferralEarning.commission_amount), 0))
            .where(ReferralEarning.user_id == user_id)
        )
        total_earnings = Decimal(total_earnings_result.scalar() or 0)

        pending_payouts_result = await db.execute(
            select(func.coalesce(func.sum(ReferralPayout.net_amount), 0))
            .where(ReferralPayout.user_id == user_id, ReferralPayout.status == "requested")
        )
        pending_payouts = Decimal(pending_payouts_result.scalar() or 0)

        completed_payouts_result = await db.execute(
            select(func.coalesce(func.sum(ReferralPayout.net_amount), 0))
            .where(ReferralPayout.user_id == user_id, ReferralPayout.status == "approved")
        )
        completed_payouts = Decimal(completed_payouts_result.scalar() or 0)

        available_balance = total_earnings - (pending_payouts + completed_payouts)

        return ReferralStats(
            total_referrals=total_referrals,
            l1_referrals=l1_referrals,
            l2_referrals=l2_referrals,
            l3_referrals=l3_referrals,
            total_earnings=total_earnings,
            pending_payouts=pending_payouts,
            completed_payouts=completed_payouts,
            available_balance=available_balance,
            total_withdrawn=completed_payouts,
            can_request_payout=available_balance >= Decimal("500"),
            referral_code=f"REF{user_id:04d}",
        )

    # --------------------------------------------------------
    # ✅ Fetch user's earnings
    # --------------------------------------------------------
    async def get_user_earnings(self, db: AsyncSession, user_id: int) -> List[ReferralEarning]:
        """List of referral earnings for a user."""
        result = await db.execute(
            select(ReferralEarning)
            .where(ReferralEarning.user_id == user_id)
            .order_by(ReferralEarning.earned_at.desc())
        )
        return result.scalars().all()

    # --------------------------------------------------------
    # ✅ Create payout request (User Side)
    # --------------------------------------------------------
    async def request_payout(self, db: AsyncSession, user_id: int, data: ReferralPayoutCreate) -> ReferralPayout:
        """
        Create a payout request entry.
        Auto-calculates tax, service charge, and net payable amount.
        """
        gross = Decimal(data.gross_amount)
        tds = gross * Decimal("0.10")       # 10% TDS
        gst = gross * Decimal("0.18")       # 18% Service Tax
        net = gross - (tds + gst)

        payout = ReferralPayout(
            user_id=user_id,
            gross_amount=gross,
            tds_amount=tds,
            service_tax_amount=gst,
            net_amount=net,
            payment_method=data.payment_method,
            tax_year=data.tax_year,
            tax_quarter=data.tax_quarter,
            status="requested",
            payout_number=f"PAY-{datetime.now().strftime('%Y%m%d%H%M%S')}-{user_id}",
            requested_at=datetime.now(),
        )

        async with db.begin():
            db.add(payout)
        await db.refresh(payout)
        return payout

    # --------------------------------------------------------
    # ✅ Admin: Approve / Reject Payout
    # --------------------------------------------------------
    async def approve_payout(self, db: AsyncSession, payout_id: int, payment_ref: str) -> bool:
        """Admin approves a payout request."""
        result = await db.execute(select(ReferralPayout).where(ReferralPayout.id == payout_id))
        payout = result.scalar_one_or_none()
        if not payout or payout.status != "requested":
            return False

        payout.status = "approved"
        payout.payment_reference = payment_ref
        payout.processed_at = datetime.now()

        async with db.begin():
            db.add(payout)
        return True

    async def reject_payout(self, db: AsyncSession, payout_id: int, reason: str) -> bool:
        """Admin rejects a payout request with reason."""
        result = await db.execute(select(ReferralPayout).where(ReferralPayout.id == payout_id))
        payout = result.scalar_one_or_none()
        if not payout or payout.status != "requested":
            return False

        payout.status = "rejected"
        payout.rejected_reason = reason
        payout.processed_at = datetime.now()

        async with db.begin():
            db.add(payout)
        return True

    async def complete_payout(self, db: AsyncSession, payout_id: int) -> bool:
        """Mark payout as completed after bank transfer"""
        result = await db.execute(select(ReferralPayout).where(ReferralPayout.id == payout_id))
        payout = result.scalar_one_or_none()
        if not payout or payout.status != "approved":
            return False

        payout.status = "completed"
        
        # Mark all related earnings as paid
        await db.execute(
            select(ReferralEarning)
            .where(ReferralEarning.user_id == payout.user_id, ReferralEarning.status == "pending")
        )
        earnings_result = await db.execute(
            select(ReferralEarning).where(
                ReferralEarning.user_id == payout.user_id,
                ReferralEarning.status == "pending"
            )
        )
        earnings = earnings_result.scalars().all()
        
        for earning in earnings:
            earning.status = "paid"
            earning.paid_at = datetime.now()

        async with db.begin():
            db.add(payout)
        return True

    async def get_user_payouts(self, db: AsyncSession, user_id: int) -> List[ReferralPayout]:
        """Get all payout requests for a user"""
        result = await db.execute(
            select(ReferralPayout)
            .where(ReferralPayout.user_id == user_id)
            .order_by(ReferralPayout.requested_at.desc())
        )
        return result.scalars().all()

    async def get_all_payouts(self, db: AsyncSession, status: str = "all") -> List[ReferralPayout]:
        """Get all payout requests (Admin)"""
        query = select(ReferralPayout).order_by(ReferralPayout.requested_at.desc())
        if status != "all":
            query = query.where(ReferralPayout.status == status)
        
        result = await db.execute(query)
        return result.scalars().all()

    async def get_referred_users(self, db: AsyncSession, user_id: int):
        """Get list of users referred by this user"""
        result = await db.execute(
            select(UserProfile).where(UserProfile.referred_by == user_id)
        )
        return result.scalars().all()

    # --------------------------------------------------------
    # ✅ Admin Overview Stats
    # --------------------------------------------------------
    async def get_admin_referral_stats(self, db: AsyncSession) -> Dict[str, Any]:
        """Get overall system-wide referral stats for admin dashboard."""
        total_payouts = (await db.execute(select(func.count(ReferralPayout.id)))).scalar() or 0
        approved_payouts = (
            await db.execute(select(func.count(ReferralPayout.id)).where(ReferralPayout.status == "approved"))
        ).scalar() or 0
        rejected_payouts = (
            await db.execute(select(func.count(ReferralPayout.id)).where(ReferralPayout.status == "rejected"))
        ).scalar() or 0
        pending_payouts = (
            await db.execute(select(func.count(ReferralPayout.id)).where(ReferralPayout.status == "requested"))
        ).scalar() or 0

        total_earnings = (
            await db.execute(select(func.sum(ReferralEarning.commission_amount)))
        ).scalar() or 0
        total_withdrawn = (
            await db.execute(select(func.sum(ReferralPayout.net_amount)))
        ).scalar() or 0

        return {
            "total_payouts": total_payouts,
            "approved_payouts": approved_payouts,
            "rejected_payouts": rejected_payouts,
            "pending_payouts": pending_payouts,
            "total_earnings": float(total_earnings),
            "total_withdrawn": float(total_withdrawn),
            "available_balance": float(total_earnings) - float(total_withdrawn),
        }
