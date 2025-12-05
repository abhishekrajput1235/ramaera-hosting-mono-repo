"""
Sync Affiliate Stats with Actual Referral Data

This script updates affiliate_stats table to reflect the actual counts
from the referrals table for all users.
"""
import asyncio
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_session
from app.models.affiliate import AffiliateStats, AffiliateSubscription, Referral


async def sync_all_affiliate_stats():
    """Sync all affiliate stats with actual referral counts"""
    async for db in get_session():
        try:
            # Get all active affiliate subscriptions
            result = await db.execute(
                select(AffiliateSubscription).where(
                    AffiliateSubscription.is_active == True
                )
            )
            subscriptions = result.scalars().all()
            
            print(f"Found {len(subscriptions)} active affiliate subscriptions")
            
            for sub in subscriptions:
                user_id = sub.user_id
                print(f"\nSyncing stats for user {user_id} ({sub.referral_code})...")
                
                # Get or create stats record
                stats_result = await db.execute(
                    select(AffiliateStats).where(
                        AffiliateStats.affiliate_user_id == user_id
                    )
                )
                stats = stats_result.scalar_one_or_none()
                
                if not stats:
                    print(f"  No stats found, creating new record...")
                    stats = AffiliateStats(
                        affiliate_user_id=user_id,
                        total_referrals_level1=0,
                        total_referrals_level2=0,
                        total_referrals_level3=0,
                        total_referrals=0,
                        active_referrals_level1=0,
                        active_referrals_level2=0,
                        active_referrals_level3=0,
                        active_referrals=0
                    )
                    db.add(stats)
                    await db.flush()
                
                # Count referrals by level
                for level in [1, 2, 3]:
                    # Total referrals at this level
                    total_result = await db.execute(
                        select(func.count(Referral.id)).where(
                            and_(
                                Referral.referrer_id == user_id,
                                Referral.level == level
                            )
                        )
                    )
                    total = total_result.scalar() or 0
                    
                    # Active referrals (with purchases)
                    active_result = await db.execute(
                        select(func.count(Referral.id)).where(
                            and_(
                                Referral.referrer_id == user_id,
                                Referral.level == level,
                                Referral.has_purchased == True
                            )
                        )
                    )
                    active = active_result.scalar() or 0
                    
                    # Update stats
                    if level == 1:
                        stats.total_referrals_level1 = total
                        stats.active_referrals_level1 = active
                    elif level == 2:
                        stats.total_referrals_level2 = total
                        stats.active_referrals_level2 = active
                    else:  # level 3
                        stats.total_referrals_level3 = total
                        stats.active_referrals_level3 = active
                    
                    print(f"  Level {level}: {total} total, {active} active")
                
                # Update totals
                stats.total_referrals = (
                    stats.total_referrals_level1 + 
                    stats.total_referrals_level2 + 
                    stats.total_referrals_level3
                )
                stats.active_referrals = (
                    stats.active_referrals_level1 + 
                    stats.active_referrals_level2 + 
                    stats.active_referrals_level3
                )
                
                print(f"  Total referrals: {stats.total_referrals}")
                
            await db.commit()
            print("\n✅ All affiliate stats synced successfully!")
            
        except Exception as e:
            print(f"❌ Error syncing stats: {e}")
            await db.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(sync_all_affiliate_stats())
