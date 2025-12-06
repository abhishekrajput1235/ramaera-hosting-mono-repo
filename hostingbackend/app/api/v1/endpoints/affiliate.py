"""
Affiliate API Endpoints
Handles subscription, referrals, commissions, and payouts
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin_user
from app.services.affiliate_service import AffiliateService
from app.schemas.affiliate import (
    AffiliateSubscriptionCreate, AffiliateSubscriptionResponse,
    AffiliateStatsResponse, PayoutRequest, PayoutResponse,
    PayoutActionRequest, CommissionDetail, TeamMember,
    AffiliateDashboard, CommissionRuleResponse
)
from app.models.users import UserProfile

router = APIRouter()
affiliate_service = AffiliateService()


# ==================== Subscription Management ====================

@router.get("/validate-code")
async def validate_referral_code(
    code: str = Query(..., min_length=3, description="Referral code to validate"),
    db: AsyncSession = Depends(get_db)
):
    """Public: validate a referral code and return inviter details if valid.
    Accepts both AffiliateSubscription.referral_code and legacy UserProfile.referral_code.
    """
    from sqlalchemy import select
    from app.models.affiliate import AffiliateSubscription

    # 1) Try affiliate subscription code (primary)
    result = await db.execute(
        select(AffiliateSubscription).where(AffiliateSubscription.referral_code == code)
    )
    aff = result.scalar_one_or_none()

    inviter: Optional[UserProfile] = None
    normalized_code: Optional[str] = None

    if aff and aff.is_active:
        normalized_code = aff.referral_code
        inviter_result = await db.execute(
            select(UserProfile).where(UserProfile.id == aff.user_id)
        )
        inviter = inviter_result.scalar_one_or_none()
    else:
        # 2) Try legacy user referral codes and map to their affiliate code if any
        legacy_user_result = await db.execute(
            select(UserProfile).where(UserProfile.referral_code == code)
        )
        legacy_user = legacy_user_result.scalar_one_or_none()
        if legacy_user:
            # If user has affiliate subscription, use that code; else still return basic inviter info
            aff2_result = await db.execute(
                select(AffiliateSubscription).where(AffiliateSubscription.user_id == legacy_user.id)
            )
            aff2 = aff2_result.scalar_one_or_none()
            normalized_code = aff2.referral_code if (aff2 and aff2.is_active) else None
            inviter = legacy_user

    if not inviter:
        return {"valid": False}

    return {
        "valid": True,
        "code": normalized_code or code,
        "inviter": {
            "id": inviter.id,
            "full_name": inviter.full_name,
            "email": inviter.email,
        },
        "has_active_affiliate": bool(normalized_code)
    }

@router.post("/subscription/create", response_model=AffiliateSubscriptionResponse)
async def create_affiliate_subscription(
    subscription_data: AffiliateSubscriptionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Create affiliate subscription (₹499 payment)
    Auto-free if user already bought a server
    """
    # Check if user already has a server
    subscription = await affiliate_service.check_and_activate_from_server_purchase(
        db, current_user.id
    )
    
    if subscription:
        return subscription

    # Create paid subscription
    subscription = await affiliate_service.create_affiliate_subscription(
        db,
        current_user.id,
        subscription_data,
        is_free_with_server=False
    )
    
    return subscription


@router.get("/subscription/status", response_model=AffiliateSubscriptionResponse)
async def get_subscription_status(
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    """Get user's affiliate subscription status"""
    subscription = await affiliate_service.get_user_subscription(db, current_user.id)
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No affiliate subscription found. Please subscribe to the affiliate program."
        )
    
    return subscription


@router.post("/subscription/activate-from-server")
async def activate_from_server_purchase(
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Check if user bought a server and activate affiliate for free
    Called after successful server purchase
    """
    subscription = await affiliate_service.check_and_activate_from_server_purchase(
        db, current_user.id
    )
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No completed server purchase found"
        )
    
    return {"message": "Affiliate subscription activated for free!", "subscription": subscription}


# ==================== Stats & Dashboard ====================

@router.get("/stats", response_model=AffiliateStatsResponse)
async def get_affiliate_stats(
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    """Get comprehensive affiliate statistics"""
    return await affiliate_service.get_affiliate_stats(db, current_user.id)


@router.get("/dashboard")
async def get_affiliate_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Get complete affiliate dashboard data including:
    - Subscription status
    - Referral stats by level
    - Commission earnings (from ReferralEarning table)
    - Pending payouts
    """
    from app.models.affiliate import Payout, PayoutStatus
    from app.models.referrals import ReferralEarning
    from sqlalchemy import select, and_, func, desc
    from decimal import Decimal
    
    subscription = await affiliate_service.get_user_subscription(db, current_user.id)
    stats = await affiliate_service.get_affiliate_stats(db, current_user.id)
    
    # Get commission stats from ReferralEarning table
    # Total commission by status
    commission_stats_result = await db.execute(
        select(
            ReferralEarning.status,
            func.sum(ReferralEarning.commission_amount).label('total'),
            func.count(ReferralEarning.id).label('count')
        )
        .where(ReferralEarning.user_id == current_user.id)
        .group_by(ReferralEarning.status)
    )
    commission_stats = commission_stats_result.all()
    
    # Parse commission stats
    total_earned = Decimal('0.00')
    pending_earned = Decimal('0.00')
    approved_earned = Decimal('0.00')
    paid_earned = Decimal('0.00')
    
    for stat in commission_stats:
        amount = stat.total or Decimal('0.00')
        total_earned += amount
        if stat.status == 'pending':
            pending_earned = amount
        elif stat.status == 'approved':
            approved_earned = amount
        elif stat.status == 'paid':
            paid_earned = amount
    
    # Get commission breakdown by level
    level_stats_result = await db.execute(
        select(
            ReferralEarning.level,
            func.sum(ReferralEarning.commission_amount).label('total'),
            func.count(ReferralEarning.id).label('count')
        )
        .where(ReferralEarning.user_id == current_user.id)
        .group_by(ReferralEarning.level)
    )
    level_stats = level_stats_result.all()
    
    commission_by_level = {}
    for ls in level_stats:
        commission_by_level[f"L{ls.level}"] = {
            "count": ls.count,
            "total": float(ls.total or 0)
        }
    
    # Get recent commissions
    recent_result = await db.execute(
        select(ReferralEarning)
        .where(ReferralEarning.user_id == current_user.id)
        .order_by(desc(ReferralEarning.earned_at))
        .limit(10)
    )
    recent_earnings = recent_result.scalars().all()
    
    recent_commissions = []
    for e in recent_earnings:
        recent_commissions.append({
            "id": e.id,
            "level": e.level,
            "order_id": e.order_id,
            "order_amount": float(e.order_amount),
            "commission_rate": float(e.commission_rate),
            "commission_amount": float(e.commission_amount),
            "status": e.status,
            "earned_at": e.earned_at.isoformat() if e.earned_at else None
        })
    
    # Get pending payouts
    payout_result = await db.execute(
        select(Payout).where(
            and_(
                Payout.affiliate_user_id == current_user.id,
                Payout.status.in_([PayoutStatus.PENDING, PayoutStatus.PROCESSING])
            )
        )
    )
    pending_payouts = payout_result.scalars().all()

    return {
        "subscription": {
            "id": subscription.id if subscription else None,
            "status": subscription.status.value if subscription else None,
            "referral_code": subscription.referral_code if subscription else None,
            "is_active": subscription.is_active if subscription else False
        } if subscription else None,
        "referral_stats": {
            "level1_count": stats.total_referrals_level1 if stats else 0,
            "level2_count": stats.total_referrals_level2 if stats else 0,
            "level3_count": stats.total_referrals_level3 if stats else 0,
            "active_l1": stats.active_referrals_level1 if stats else 0,
            "active_l2": stats.active_referrals_level2 if stats else 0,
            "active_l3": stats.active_referrals_level3 if stats else 0,
            "total_referrals": (stats.total_referrals_level1 + stats.total_referrals_level2 + stats.total_referrals_level3) if stats else 0
        },
        "commission_stats": {
            "total_earned": float(total_earned),
            "pending": float(pending_earned),  # Awaiting admin approval
            "approved": float(approved_earned),  # Ready for payout
            "paid": float(paid_earned),  # Already paid out
            "available_for_payout": float(approved_earned),  # Can request payout
            "by_level": commission_by_level
        },
        "recent_commissions": recent_commissions,
        "pending_payouts": [
            {
                "id": p.id,
                "amount": float(p.gross_amount),
                "status": p.status,
                "requested_at": p.requested_at.isoformat() if p.requested_at else None
            } for p in pending_payouts
        ]
    }


# ==================== Team Management ====================

@router.get("/team/members", response_model=List[TeamMember])
async def get_team_members(
    level: Optional[int] = Query(None, ge=1, le=3, description="Filter by level (1, 2, or 3)"),
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    """Get team members with detailed info"""
    return await affiliate_service.get_team_members(db, current_user.id, level)


@router.get("/team/hierarchy")
async def get_team_hierarchy(
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    """Get complete team hierarchy (3 levels deep)"""
    # This would build a tree structure - simplified version
    l1_members = await affiliate_service.get_team_members(db, current_user.id, level=1)
    l2_members = await affiliate_service.get_team_members(db, current_user.id, level=2)
    l3_members = await affiliate_service.get_team_members(db, current_user.id, level=3)

    return {
        "level1": [m.dict() for m in l1_members],
        "level2": [m.dict() for m in l2_members],
        "level3": [m.dict() for m in l3_members],
        "totals": {
            "l1_count": len(l1_members),
            "l2_count": len(l2_members),
            "l3_count": len(l3_members),
            "total_count": len(l1_members) + len(l2_members) + len(l3_members)
        }
    }


# ==================== Commission Management ====================

@router.get("/commissions")
async def get_my_commissions(
    limit: int = Query(50, ge=1, le=200),
    status_filter: Optional[str] = Query(None, description="Filter by status: pending, approved, paid"),
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Get user's commission history from ReferralEarning table.
    These are commissions earned when referred users make purchases.
    
    Statuses:
    - pending: Commission recorded, awaiting admin approval
    - approved: Admin approved, available for payout
    - paid: Commission has been paid out
    """
    from app.models.referrals import ReferralEarning
    from sqlalchemy import select, desc, and_
    
    # Build query conditions
    conditions = [ReferralEarning.user_id == current_user.id]
    
    if status_filter:
        conditions.append(ReferralEarning.status == status_filter)
    
    # Query ReferralEarning table
    result = await db.execute(
        select(ReferralEarning)
        .where(and_(*conditions))
        .order_by(desc(ReferralEarning.earned_at))
        .limit(limit)
    )
    earnings = result.scalars().all()
    
    # Format response with referred user details
    commissions = []
    for earning in earnings:
        # Get referred user email
        referred_email = None
        if earning.referred_user_id:
            from app.models.users import UserProfile as UP
            user_result = await db.execute(
                select(UP.email, UP.full_name).where(UP.id == earning.referred_user_id)
            )
            referred_user = user_result.first()
            if referred_user:
                referred_email = referred_user.email
        
        commissions.append({
            "id": earning.id,
            "level": earning.level,
            "order_id": earning.order_id,
            "order_amount": float(earning.order_amount),
            "commission_rate": float(earning.commission_rate),
            "commission_amount": float(earning.commission_amount),
            "status": earning.status,
            "referred_user_email": referred_email,
            "earned_at": earning.earned_at.isoformat() if earning.earned_at else None,
            "paid_at": earning.paid_at.isoformat() if earning.paid_at else None
        })
    
    return commissions


@router.get("/commissions/{commission_id}", response_model=CommissionDetail)
async def get_commission_detail(
    commission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    """Get detailed commission information"""
    from app.models.affiliate import Commission
    from sqlalchemy import select, and_
    
    result = await db.execute(
        select(Commission).where(
            and_(
                Commission.id == commission_id,
                Commission.affiliate_user_id == current_user.id
            )
        )
    )
    commission = result.scalar_one_or_none()
    
    if not commission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commission not found"
        )
    
    # Build detailed response (simplified - use service method for full details)
    return CommissionDetail.from_orm(commission)


# ==================== Payout Management ====================

@router.post("/payouts/request", response_model=PayoutResponse)
async def request_payout(
    payout_request: PayoutRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Request payout (minimum ₹500)
    """
    try:
        payout = await affiliate_service.request_payout(
            db, current_user.id, payout_request
        )
        return PayoutResponse.from_orm(payout)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/payouts", response_model=List[PayoutResponse])
async def get_my_payouts(
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    """Get user's payout history"""
    from app.models.affiliate import Payout
    from sqlalchemy import select, desc
    
    result = await db.execute(
        select(Payout)
        .where(Payout.affiliate_user_id == current_user.id)
        .order_by(desc(Payout.requested_at))
    )
    payouts = result.scalars().all()
    
    return [PayoutResponse.from_orm(p) for p in payouts]


@router.get("/payouts/{payout_id}", response_model=PayoutResponse)
async def get_payout_detail(
    payout_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    """Get payout details"""
    from app.models.affiliate import Payout
    from sqlalchemy import select, and_
    
    result = await db.execute(
        select(Payout).where(
            and_(
                Payout.id == payout_id,
                Payout.affiliate_user_id == current_user.id
            )
        )
    )
    payout = result.scalar_one_or_none()
    
    if not payout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payout not found"
        )
    
    return PayoutResponse.from_orm(payout)


# ==================== Admin Endpoints ====================

@router.get("/admin/affiliates")
async def get_all_affiliates(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_admin_user)
):
    """Get all affiliate subscriptions with user details and stats (Admin only)"""
    from app.models.affiliate import AffiliateSubscription, AffiliateStats
    from app.models.users import UserProfile as UP
    from app.models.referrals import ReferralEarning
    from sqlalchemy import select, func, and_
    from sqlalchemy.orm import selectinload
    
    # Query affiliates with their stats
    result = await db.execute(
        select(AffiliateSubscription)
        .offset(skip)
        .limit(limit)
    )
    affiliates = result.scalars().all()
    
    # Build response with user details and stats
    response_data = []
    for aff in affiliates:
        # Get user details
        user_result = await db.execute(
            select(UP).where(UP.id == aff.user_id)
        )
        user = user_result.scalar_one_or_none()
        
        # Get affiliate stats
        stats_result = await db.execute(
            select(AffiliateStats).where(AffiliateStats.affiliate_user_id == aff.user_id)
        )
        stats = stats_result.scalar_one_or_none()
        
        # Calculate TOTAL commission from ReferralEarning (sum of L1, L2, L3)
        total_commission_result = await db.execute(
            select(func.coalesce(func.sum(ReferralEarning.commission_amount), 0))
            .where(ReferralEarning.user_id == aff.user_id)
        )
        total_commission = total_commission_result.scalar() or 0
        
        # Calculate approved commission (available for payout)
        approved_commission_result = await db.execute(
            select(func.coalesce(func.sum(ReferralEarning.commission_amount), 0))
            .where(
                and_(
                    ReferralEarning.user_id == aff.user_id,
                    ReferralEarning.status == 'approved'
                )
            )
        )
        approved_commission = approved_commission_result.scalar() or 0
        
        response_data.append({
            "id": aff.id,
            "user_id": aff.user_id,
            "referral_code": aff.referral_code,
            "status": aff.status.value if hasattr(aff.status, 'value') else aff.status,
            "is_active": aff.is_active,
            "total_referrals": stats.total_referrals if stats else 0,
            "total_commission": float(total_commission),  # Sum of all L1+L2+L3 commissions
            "available_balance": float(approved_commission),  # Approved commissions available for payout
            "created_at": aff.created_at.isoformat() if aff.created_at else None,
            "user": {
                "email": user.email if user else "N/A",
                "full_name": user.full_name if user else "N/A"
            }
        })
    
    return response_data


@router.get("/admin/payouts/pending")
async def get_pending_payouts(
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_admin_user)
):
    """Get all pending payouts with user details (Admin only)"""
    from app.models.affiliate import Payout, PayoutStatus
    from app.models.users import UserProfile as UP
    from sqlalchemy import select
    
    result = await db.execute(
        select(Payout).where(
            Payout.status.in_([PayoutStatus.PENDING, PayoutStatus.PROCESSING])
        )
    )
    payouts = result.scalars().all()
    
    # Build response with user details
    response_data = []
    for payout in payouts:
        # Get user details
        user_result = await db.execute(
            select(UP).where(UP.id == payout.affiliate_user_id)
        )
        user = user_result.scalar_one_or_none()
        
        response_data.append({
            "id": payout.id,
            "affiliate_user_id": payout.affiliate_user_id,
            "amount": float(payout.amount),
            "status": payout.status.value if hasattr(payout.status, 'value') else payout.status,
            "payment_method": payout.payment_method,
            "requested_at": payout.requested_at.isoformat() if payout.requested_at else None,
            "processed_at": payout.processed_at.isoformat() if payout.processed_at else None,
            "user": {
                "email": user.email if user else "N/A",
                "full_name": user.full_name if user else "N/A"
            }
        })
    
    return response_data


@router.post("/admin/payouts/{payout_id}/process", response_model=PayoutResponse)
async def process_payout_admin(
    payout_id: int,
    action_request: PayoutActionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_admin_user)
):
    """
    Process payout (Admin only)
    Actions: approve, complete, reject
    """
    payout = await affiliate_service.process_payout(
        db,
        payout_id,
        action_request.action,
        current_user.id,
        action_request.transaction_id,
        action_request.admin_notes
    )
    
    if not payout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payout not found"
        )
    
    return PayoutResponse.from_orm(payout)


@router.get("/admin/earnings/pending")
async def get_pending_earnings(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_admin_user)
):
    """Get all pending commission earnings awaiting approval (Admin only)"""
    from app.models.referrals import ReferralEarning
    from sqlalchemy import select, desc
    
    result = await db.execute(
        select(ReferralEarning)
        .where(ReferralEarning.status == 'pending')
        .order_by(desc(ReferralEarning.earned_at))
        .offset(skip)
        .limit(limit)
    )
    earnings = result.scalars().all()
    
    earnings_list = []
    for e in earnings:
        # Get user details
        from app.models.users import UserProfile as UP
        user_result = await db.execute(
            select(UP.email, UP.full_name).where(UP.id == e.user_id)
        )
        user_data = user_result.first()
        
        referred_result = await db.execute(
            select(UP.email, UP.full_name).where(UP.id == e.referred_user_id)
        )
        referred_data = referred_result.first()
        
        earnings_list.append({
            "id": e.id,
            "affiliate_user_id": e.user_id,
            "affiliate_email": user_data.email if user_data else None,
            "affiliate_name": user_data.full_name if user_data else None,
            "referred_user_id": e.referred_user_id,
            "referred_email": referred_data.email if referred_data else None,
            "referred_name": referred_data.full_name if referred_data else None,
            "order_id": e.order_id,
            "level": e.level,
            "order_amount": float(e.order_amount),
            "commission_rate": float(e.commission_rate),
            "commission_amount": float(e.commission_amount),
            "status": e.status,
            "earned_at": e.earned_at.isoformat() if e.earned_at else None
        })
    
    return earnings_list


@router.post("/admin/earnings/{earning_id}/approve")
async def approve_earning_admin(
    earning_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_admin_user)
):
    """
    Approve a commission earning (Admin only).
    Changes status from 'pending' to 'approved', making it available for payout.
    """
    from app.models.referrals import ReferralEarning
    from sqlalchemy import select
    from datetime import datetime
    
    result = await db.execute(
        select(ReferralEarning).where(ReferralEarning.id == earning_id)
    )
    earning = result.scalar_one_or_none()
    
    if not earning:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commission earning not found"
        )
    
    if earning.status != 'pending':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Commission is already {earning.status}, cannot approve"
        )
    
    # Update status to approved
    earning.status = 'approved'
    await db.commit()
    
    return {
        "message": "Commission approved successfully",
        "earning_id": earning.id,
        "amount": float(earning.commission_amount),
        "status": earning.status
    }


@router.post("/admin/earnings/bulk-approve")
async def bulk_approve_earnings(
    earning_ids: List[int],
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_admin_user)
):
    """Approve multiple commission earnings at once (Admin only)"""
    from app.models.referrals import ReferralEarning
    from sqlalchemy import select
    
    approved = []
    failed = []
    
    for earning_id in earning_ids:
        result = await db.execute(
            select(ReferralEarning).where(ReferralEarning.id == earning_id)
        )
        earning = result.scalar_one_or_none()
        
        if earning and earning.status == 'pending':
            earning.status = 'approved'
            approved.append(earning_id)
        else:
            failed.append(earning_id)
    
    await db.commit()
    
    return {
        "message": f"Approved {len(approved)} commissions",
        "approved": approved,
        "failed": failed
    }


@router.post("/admin/commissions/{commission_id}/approve")
async def approve_commission_admin(
    commission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_admin_user)
):
    """
    [DEPRECATED] Use /admin/earnings/{earning_id}/approve instead.
    Approve a commission (Admin only)
    """
    # Redirect to the new ReferralEarning approval
    from app.models.referrals import ReferralEarning
    from sqlalchemy import select
    
    result = await db.execute(
        select(ReferralEarning).where(ReferralEarning.id == commission_id)
    )
    earning = result.scalar_one_or_none()
    
    if not earning:
        # Try the old Commission model as fallback
        commission = await affiliate_service.approve_commission(
            db, commission_id, current_user.id
        )
        
        if not commission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Commission not found or already approved"
            )
        
        return {"message": "Commission approved successfully", "commission_id": commission.id}
    
    if earning.status != 'pending':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Commission is already {earning.status}"
        )
    
    earning.status = 'approved'
    await db.commit()
    
    return {"message": "Commission approved successfully", "commission_id": earning.id}


# ==================== Referral Tracking (Public) ====================

@router.post("/track-referral")
async def track_referral_signup(
    referral_code: str,
    referred_user_id: int,
    signup_ip: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Track referral when user signs up with referral code
    Called during signup process
    """
    referral = await affiliate_service.track_referral(
        db, referral_code, referred_user_id, signup_ip
    )
    
    if not referral:
        return {"message": "Invalid or inactive referral code"}
    
    return {
        "message": "Referral tracked successfully",
        "referral_id": referral.id,
        "level": referral.level
    }


# ==================== Commission Rules (Config) ====================

@router.get("/commission-rules", response_model=List[CommissionRuleResponse])
async def get_commission_rules(
    product_type: Optional[str] = Query(None, description="Filter by product type, e.g. 'server'"),
    level: Optional[int] = Query(None, ge=1, le=3, description="Filter by level (1-3)"),
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    """Get active commission rule configurations (for dynamic frontend display)"""
    from app.models.affiliate import CommissionRule
    from sqlalchemy import select, and_

    conditions = [CommissionRule.is_active == True]
    if product_type:
        conditions.append(CommissionRule.product_type == product_type)
    if level:
        conditions.append(CommissionRule.level == level)

    result = await db.execute(
        select(CommissionRule).where(and_(*conditions)).order_by(CommissionRule.level, CommissionRule.priority.desc())
    )
    rules = result.scalars().all()
    return [CommissionRuleResponse.from_orm(r) for r in rules]
