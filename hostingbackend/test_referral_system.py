"""
Comprehensive Referral System Load Test Script
Tests multi-level referral tracking (L1, L2, L3) with commission calculations
NOW SCALED TO ~50K USERS

High-level Flow:
1. Parent user registers and buys ₹499 affiliate plan
2. Parent refers MANY L1 users (configurable, e.g. 500)
3. Each L1 user refers MANY L2 users (configurable, e.g. 100) → 50,000 L2 total
4. A percentage of L2 users make server purchases
5. Verify referral chain + commission distribution at all levels
"""

import asyncio
import sys
import time
import random
from decimal import Decimal
from typing import Dict, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime

# Import models
from app.models.users import UserProfile
from app.models.affiliate import (
    AffiliateSubscription, Referral, Commission, CommissionRule,
    AffiliateStats, AffiliateStatus, CommissionStatus
)
from app.models.order import Order
from app.models.plan import HostingPlan
from app.models.payment import PaymentTransaction, PaymentStatus

# Import services
from app.services.user_service import UserService
from app.services.affiliate_service import AffiliateService
from app.services.payment_service import PaymentService
from app.services.plan_service import PlanService

# Import schemas
from app.schemas.users import UserCreate
from app.schemas.affiliate import AffiliateSubscriptionCreate

# Color codes for output
GREEN = '\033[92m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RED = '\033[91m'
RESET = '\033[0m'


class ReferralSystemTester:
    """Manages the end-to-end referral system test (scaled to many users)"""
    
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.user_service = UserService()
        self.affiliate_service = AffiliateService()
        self.payment_service = PaymentService()
        self.plan_service = PlanService()
        
        # Test data storage
        self.users: Dict[str, UserProfile] = {}
        self.tokens: Dict[str, str] = {}
        self.referral_codes: Dict[str, str] = {}
        self.orders: Dict[str, Order] = {}
        
    async def setup_commission_rules(self):
        """Set up commission rules for testing"""
        print(f"\n{BLUE}Setting up commission rules...{RESET}")
        
        rules = [
            # Level 1 rules
            {"name": "L1 Server Commission", "level": 1, "product_type": "server", 
             "commission_type": "percentage", "commission_value": Decimal("10.00")},
            {"name": "L1 Subscription Commission", "level": 1, "product_type": "subscription", 
             "commission_type": "percentage", "commission_value": Decimal("5.00")},
            
            # Level 2 rules
            {"name": "L2 Server Commission", "level": 2, "product_type": "server", 
             "commission_type": "percentage", "commission_value": Decimal("5.00")},
            {"name": "L2 Subscription Commission", "level": 2, "product_type": "subscription", 
             "commission_type": "percentage", "commission_value": Decimal("2.00")},
            
            # Level 3 rules
            {"name": "L3 Server Commission", "level": 3, "product_type": "server", 
             "commission_type": "percentage", "commission_value": Decimal("2.00")},
            {"name": "L3 Subscription Commission", "level": 3, "product_type": "subscription", 
             "commission_type": "percentage", "commission_value": Decimal("1.00")},
        ]
        
        # Clear existing rules if needed (optional, uncomment if required)
        # await self.db.execute(delete(CommissionRule))
        # await self.db.commit()
        
        for rule_data in rules:
            rule = CommissionRule(
                name=rule_data["name"],
                level=rule_data["level"],
                product_type=rule_data["product_type"],
                commission_type=rule_data["commission_type"],
                commission_value=rule_data["commission_value"],
                is_active=True,
                priority=0
            )
            self.db.add(rule)
        
        await self.db.commit()
        print(f"{GREEN}✅ Created {len(rules)} commission rules{RESET}")
    
    async def register_user(
        self,
        email: str,
        full_name: str,
        password: str = "Test@1234",
        referral_code: Optional[str] = None
    ) -> UserProfile:
        """Register a new user"""
        # Note: printing for 50k users can be huge; keep minimal
        print(f"{BLUE}Registering user: {email}{RESET}")
        
        user_data = UserCreate(
            email=email,
            full_name=full_name,
            password=password,
            referral_code=referral_code
        )
        
        # Create user
        user = await self.user_service.create_user(self.db, user_data)
        
        # Track referral if code provided
        if referral_code:
            await self.affiliate_service.track_referral(
                self.db, referral_code, user.id
            )
        
        self.users[email] = user
        print(f"{GREEN}✅ User registered: ID={user.id}, Email={email}{RESET}")
        
        return user

    async def bulk_register_users(
        self,
        emails: List[str],
        referral_code: Optional[str],
        concurrency: int = 50
    ):
        """
        Registers large user batches safely using async workers + semaphore.
        Each worker gets its own database session to avoid concurrency issues.
        """
        from app.core.database import AsyncSessionLocal
        
        sem = asyncio.Semaphore(concurrency)

        async def worker(email: str):
            async with sem:
                # Create a NEW session per task to avoid concurrent session conflicts
                async with AsyncSessionLocal() as worker_db:
                    # Create a temporary tester instance with this worker's session
                    worker_tester = ReferralSystemTester(worker_db)
                    worker_tester.users = self.users  # Share user registry
                    worker_tester.referral_codes = self.referral_codes  # Share codes
                    
                    await worker_tester.register_user(
                        email=email,
                        full_name=email.split("@")[0],
                        referral_code=referral_code
                    )

        await asyncio.gather(*(worker(e) for e in emails), return_exceptions=True)

    async def purchase_affiliate_plan(self, email: str) -> AffiliateSubscription:
        """Purchase ₹499 affiliate subscription"""
        print(f"\n{BLUE}Purchasing affiliate plan for: {email}{RESET}")
        
        user = self.users[email]
        
        # Create subscription (simulating payment completion)
        subscription_data = AffiliateSubscriptionCreate(
            payment_id=f"pay_test_{user.id}_{datetime.now().timestamp()}",
            payment_method="razorpay"
        )
        
        subscription = await self.affiliate_service.create_affiliate_subscription(
            self.db, user.id, subscription_data, is_free_with_server=False
        )
        
        self.referral_codes[email] = subscription.referral_code
        print(f"{GREEN}✅ Affiliate subscription created{RESET}")
        print(f"   Referral Code: {subscription.referral_code}")
        print(f"   Status: {subscription.status}")
        
        return subscription
    
    async def purchase_server(self, email: str, plan_id: int = 1) -> Order:
        """Purchase a server (simulates order completion)"""
        print(f"\n{BLUE}Purchasing server for: {email}{RESET}")
        
        user = self.users[email]
        
        # Get or create hosting plan
        plan_result = await self.db.execute(
            select(HostingPlan).where(HostingPlan.id == plan_id)
        )
        plan = plan_result.scalar_one_or_none()
        
        if not plan:
            # Create a test plan
            plan = HostingPlan(
                id=plan_id,
                name="Test VPS Plan",
                description="Test plan for referral system testing",
                plan_type="vps",
                cpu_cores=2,
                ram_gb=4,
                storage_gb=50,
                bandwidth_gb=1000,
                base_price=Decimal("999.00"),
                monthly_price=Decimal("999.00"),
                quarterly_price=Decimal("2700.00"),
                semiannual_price=Decimal("5000.00"),
                annual_price=Decimal("9000.00"),
                biennial_price=Decimal("17000.00"),
                triennial_price=Decimal("25000.00"),
                is_active=True
            )
            self.db.add(plan)
            await self.db.commit()
            await self.db.refresh(plan)
        
        # Create order
        order = Order(
            user_id=user.id,
            plan_id=plan.id,
            order_number=f"ORD{user.id}{int(datetime.now().timestamp())}",
            billing_cycle="monthly",
            total_amount=plan.monthly_price,
            discount_amount=Decimal("0.00"),
            tax_amount=Decimal("0.00"),
            grand_total=plan.monthly_price,
            order_status="completed",
            payment_status="paid",
            payment_type="server"
        )
        self.db.add(order)
        await self.db.commit()
        await self.db.refresh(order)
        
        self.orders[f"{email}_server"] = order
        
        # Auto-activate affiliate (free with server purchase)
        await self.affiliate_service.check_and_activate_from_server_purchase(self.db, user.id)
        
        # Mark referral as converted and calculate commissions
        await self.affiliate_service.mark_referral_converted(
            self.db, user.id, order.id, order.total_amount
        )
        
        await self.affiliate_service.calculate_and_record_commissions(
            self.db, order.id, user.id, order.total_amount, product_type="server"
        )
        
        # Get referral code
        subscription = await self.affiliate_service.get_user_subscription(self.db, user.id)
        if subscription:
            self.referral_codes[email] = subscription.referral_code
        
        print(f"{GREEN}✅ Server purchased: Order ID={order.id}, Amount={order.total_amount}{RESET}")
        
        return order

    async def bulk_purchase_servers(
        self,
        emails: List[str],
        concurrency: int = 25
    ):
        """
        Batch server purchases with connection throttling.
        Each worker gets its own database session to avoid concurrency issues.
        """
        from app.core.database import AsyncSessionLocal
        
        sem = asyncio.Semaphore(concurrency)

        async def worker(email: str):
            async with sem:
                # Create a NEW session per task to avoid concurrent session conflicts
                async with AsyncSessionLocal() as worker_db:
                    # Create a temporary tester instance with this worker's session
                    worker_tester = ReferralSystemTester(worker_db)
                    worker_tester.users = self.users  # Share user registry
                    worker_tester.referral_codes = self.referral_codes  # Share codes
                    worker_tester.orders = self.orders  # Share orders
                    
                    await worker_tester.purchase_server(email)

        await asyncio.gather(*(worker(e) for e in emails), return_exceptions=True)
    
    async def get_referral_stats(self, email: str) -> Dict:
        """Get referral statistics for a user"""
        user = self.users[email]
        
        # Get affiliate stats
        stats_result = await self.db.execute(
            select(AffiliateStats).where(AffiliateStats.affiliate_user_id == user.id)
        )
        stats = stats_result.scalar_one_or_none()
        
        # Check ReferralEarning table (used by dashboard)
        from app.models.referrals import ReferralEarning
        commissions = {}
        for level in [1, 2, 3]:
            count_result = await self.db.execute(
                select(func.count(ReferralEarning.id)).where(
                    ReferralEarning.user_id == user.id,
                    ReferralEarning.level == level
                )
            )
            commissions[f"L{level}"] = count_result.scalar() or 0
            
        return {
            "total_referrals_l1": stats.total_referrals_level1 if stats else 0,
            "total_referrals_l2": stats.total_referrals_level2 if stats else 0,
            "total_referrals_l3": stats.total_referrals_level3 if stats else 0,
            "active_referrals_l1": stats.active_referrals_level1 if stats else 0,
            "active_referrals_l2": stats.active_referrals_level2 if stats else 0,
            "active_referrals_l3": stats.active_referrals_level3 if stats else 0,
            "total_commission": stats.total_commission_earned if stats else Decimal("0"),
            "pending_commission": stats.pending_commission if stats else Decimal("0"),
            "approved_commission": stats.approved_commission if stats else Decimal("0"),
            "commissions_by_level": commissions
        }
    
    async def verify_referral_chain(
        self,
        parent_email: str,
        l1_emails: List[str],
        l2_emails: Optional[List[str]] = None
    ):
        """Verify the referral chain is correctly set up"""
        print(f"\n{BLUE}Verifying referral chain...{RESET}")
        
        parent = self.users[parent_email]
        
        # Verify L1 referrals
        l1_result = await self.db.execute(
            select(Referral).where(
                Referral.referrer_id == parent.id,
                Referral.level == 1
            )
        )
        l1_referrals = l1_result.scalars().all()
        
        assert len(l1_referrals) == len(l1_emails), \
            f"Expected {len(l1_emails)} L1 referrals, found {len(l1_referrals)}"
        print(f"{GREEN}✅ L1 referrals verified: {len(l1_referrals)}{RESET}")
        
        # Verify L2 referrals if provided
        if l2_emails is not None:
            l2_result = await self.db.execute(
                select(Referral).where(
                    Referral.referrer_id == parent.id,
                    Referral.level == 2
                )
            )
            l2_referrals = l2_result.scalars().all()
            
            assert len(l2_referrals) == len(l2_emails), \
                f"Expected {len(l2_emails)} L2 referrals, found {len(l2_referrals)}"
            print(f"{GREEN}✅ L2 referrals verified: {len(l2_referrals)}{RESET}")
    
    async def print_summary(self, email: str):
        """Print summary for a user"""
        print(f"\n{YELLOW}{'='*70}{RESET}")
        print(f"{YELLOW}Summary for: {email}{RESET}")
        print(f"{YELLOW}{'='*70}{RESET}")
        
        stats = await self.get_referral_stats(email)
        
        print(f"\n📊 Referral Stats:")
        print(f"   L1 Referrals: {stats['total_referrals_l1']} (Active: {stats['active_referrals_l1']})")
        print(f"   L2 Referrals: {stats['total_referrals_l2']} (Active: {stats['active_referrals_l2']})")
        print(f"   L3 Referrals: {stats['total_referrals_l3']} (Active: {stats['active_referrals_l3']})")
        
        print(f"\n💰 Commission Stats:")
        print(f"   Total Earned: ₹{stats['total_commission']}")
        print(f"   Pending: ₹{stats['pending_commission']}")
        print(f"   Approved: ₹{stats['approved_commission']}")
        
        print(f"\n📈 Commissions by Level:")
        for level, count in stats['commissions_by_level'].items():
            print(f"   {level}: {count} commissions")
        
        print(f"\n{YELLOW}{'='*70}{RESET}")


async def run_test():
    """Main test execution function (scaled to ~50K users)"""
    print(f"\n{BLUE}{'='*70}{RESET}")
    print(f"{BLUE}Starting Referral System Load Test (≈50K users){RESET}")
    print(f"{BLUE}{'='*70}{RESET}")
    
    # Generate unique timestamp for this test run
    test_id = int(time.time() * 1000)  # milliseconds since epoch
    print(f"\n{YELLOW}Test ID: {test_id}{RESET}\n")
    
    # CONFIG: scale here
    TOTAL_L1 = 500             # Parent -> 500 L1 users
    TOTAL_L2_PER_L1 = 100      # Each L1 -> 100 L2 users (500*100 = 50,000 L2)
    L2_PURCHASE_RATIO = 0.2    # 20% of L2 buy servers
    
    from app.core.config import settings
    from app.core.database import get_db
    
    # Create async session
    async for db in get_db():
        tester = ReferralSystemTester(db)
        
        try:
            # Step 1: Set up commission rules
            await tester.setup_commission_rules()
            
            # Step 2: Register parent and activate affiliate
            print(f"\n{YELLOW}{'='*70}{RESET}")
            print(f"{YELLOW}SCENARIO 1: Parent User Setup{RESET}")
            print(f"{YELLOW}{'='*70}{RESET}")
            
            parent_email = f"parent{test_id}@test.com"
            parent = await tester.register_user(parent_email, "Parent User")
            parent_subscription = await tester.purchase_affiliate_plan(parent_email)
            parent_code = parent_subscription.referral_code
            
            # Step 3: Register MANY L1 users
            print(f"\n{YELLOW}{'='*70}{RESET}")
            print(f"{YELLOW}SCENARIO 2: Massive Level 1 Referrals Registration ({TOTAL_L1}){RESET}")
            print(f"{YELLOW}{'='*70}{RESET}")
            
            l1_emails = [
                f"l1_user_{i}_{test_id}@test.com"
                for i in range(1, TOTAL_L1 + 1)
            ]
            
            await tester.bulk_register_users(
                emails=l1_emails,
                referral_code=parent_code,
                concurrency=100
            )
            
            # Verify L1 referrals
            await tester.verify_referral_chain(parent_email, l1_emails)
            
            # Step 4: All L1 users buy affiliate plans to become referrers
            print(f"\n{YELLOW}{'='*70}{RESET}")
            print(f"{YELLOW}SCENARIO 3: All L1 Users Purchase Affiliate Plan{RESET}")
            print(f"{YELLOW}{'='*70}{RESET}")
            
            for idx, email in enumerate(l1_emails, start=1):
                await tester.purchase_affiliate_plan(email)
                if idx % 50 == 0:
                    print(f"{GREEN}✅ L1 affiliate subscriptions created: {idx}/{TOTAL_L1}{RESET}")
            
            # Optional: print parent summary after L1 purchases
            await tester.print_summary(parent_email)
            
            # Step 5: Each L1 user refers MANY L2 users (creating L2 for parent)
            print(f"\n{YELLOW}{'='*70}{RESET}")
            print(f"{YELLOW}SCENARIO 4: L1 Users Refer L2 Users (Target ≈ {TOTAL_L1 * TOTAL_L2_PER_L1} L2){RESET}")
            print(f"{YELLOW}{'='*70}{RESET}")
            
            all_l2_users: List[str] = []
            
            for idx, l1_email in enumerate(l1_emails, start=1):
                l1_user_code = tester.referral_codes[l1_email]
                
                # Generate this L1's L2 batch
                l2_batch_emails = [
                    f"l2_from_l1_{idx}_user_{j}_{test_id}@test.com"
                    for j in range(1, TOTAL_L2_PER_L1 + 1)
                ]
                
                all_l2_users.extend(l2_batch_emails)
                
                print(f"\n{BLUE}L1 User {idx} referring {TOTAL_L2_PER_L1} L2 users...{RESET}")
                
                await tester.bulk_register_users(
                    emails=l2_batch_emails,
                    referral_code=l1_user_code,
                    concurrency=100
                )
                
                if idx % 10 == 0:
                    print(f"{GREEN}✅ L2 progress: {idx}/{TOTAL_L1} L1 batches completed ({idx * TOTAL_L2_PER_L1} L2 users){RESET}")
            
            print(f"\n{GREEN}✅ Total L2 users created: {len(all_l2_users)}{RESET}")
            
            # Verify referral chains - parent should have ALL L2 referrals
            await tester.verify_referral_chain(parent_email, l1_emails, all_l2_users)
            
            # Step 6: L2 users make server purchases (sample subset, e.g. 20%)
            print(f"\n{YELLOW}{'='*70}{RESET}")
            print(f"{YELLOW}SCENARIO 5: L2 Users Make Server Purchases{RESET}")
            print(f"{YELLOW}{'='*70}{RESET}")
            
            total_l2 = len(all_l2_users)
            buyers_count = max(1, int(total_l2 * L2_PURCHASE_RATIO))
            
            print(f"{BLUE}Selecting {buyers_count} L2 users ({L2_PURCHASE_RATIO*100:.0f}%) for server purchases...{RESET}")
            buyers = random.sample(all_l2_users, buyers_count)
            
            await tester.bulk_purchase_servers(
                emails=buyers,
                concurrency=25
            )
            
            # Final summaries
            print(f"\n{YELLOW}{'='*70}{RESET}")
            print(f"{YELLOW}FINAL RESULTS{RESET}")
            print(f"{YELLOW}{'='*70}{RESET}")
            
            await tester.print_summary(parent_email)
            
            # For load test, just inspect a few L1 users
            if l1_emails:
                await tester.print_summary(l1_emails[0])
            
            # Final assertions
            print(f"\n{BLUE}Running final assertions...{RESET}")
            
            parent_stats = await tester.get_referral_stats(parent_email)
            first_l1_email = l1_emails[0]
            l1_user1_stats = await tester.get_referral_stats(first_l1_email)
            
            # Assertions based on config
            expected_l1 = TOTAL_L1
            expected_l2 = TOTAL_L1 * TOTAL_L2_PER_L1
            expected_l1_user1_l1 = TOTAL_L2_PER_L1
            
            assert parent_stats['total_referrals_l1'] == expected_l1, \
                f"Parent should have {expected_l1} L1 referrals, got {parent_stats['total_referrals_l1']}"
            assert parent_stats['total_referrals_l2'] == expected_l2, \
                f"Parent should have {expected_l2} L2 referrals, got {parent_stats['total_referrals_l2']}"
            
            assert l1_user1_stats['total_referrals_l1'] == expected_l1_user1_l1, \
                f"First L1 should have {expected_l1_user1_l1} L1 referrals, got {l1_user1_stats['total_referrals_l1']}"
            
            # Commission checks (counts only; amounts depend on business logic)
            assert parent_stats['commissions_by_level']['L2'] >= buyers_count, \
                f"Parent should have at least {buyers_count} L2 commissions, got {parent_stats['commissions_by_level']['L2']}"
            
            print(f"\n{GREEN}{'='*70}{RESET}")
            print(f"{GREEN}✅ ALL LOAD TESTS PASSED!{RESET}")
            print(f"{GREEN}{'='*70}{RESET}")
            
            print(f"\n📊 Test Summary:")
            print(f"   Total Users Created: {len(tester.users)}")
            print(f"   Parent L1 Referrals: {parent_stats['total_referrals_l1']}")
            print(f"   Parent L2 Referrals: {parent_stats['total_referrals_l2']}")
            print(f"   Parent L1 Commissions: {parent_stats['commissions_by_level'].get('L1', 0)}")
            print(f"   Parent L2 Commissions: {parent_stats['commissions_by_level'].get('L2', 0)}")
            print(f"   Parent Total Earned: ₹{parent_stats['total_commission']}")
            print(f"\n   First L1 User L1 Referrals: {l1_user1_stats['total_referrals_l1']}")
            print(f"   First L1 User Total Earned: ₹{l1_user1_stats['total_commission']}")
            
        except AssertionError as e:
            print(f"\n{RED}❌ ASSERTION FAILED: {str(e)}{RESET}")
            raise
        except Exception as e:
            print(f"\n{RED}❌ ERROR: {str(e)}{RESET}")
            import traceback
            traceback.print_exc()
            raise
        finally:
            # Only use first db session from get_db()
            break


if __name__ == "__main__":
    print(f"\n{BLUE}Referral System Load Test Script{RESET}")
    print(f"{BLUE}Testing multi-level referral tracking and commissions with ~50K users{RESET}\n")
    
    try:
        asyncio.run(run_test())
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Test interrupted by user{RESET}")
    except Exception as e:
        print(f"\n{RED}Test failed: {str(e)}{RESET}")
        sys.exit(1)
