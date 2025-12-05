"""
Comprehensive Referral System Test Script
Tests multi-level referral tracking (L1, L2, L3) with commission calculations

Test Flow:
1. Parent user registers and buys ₹499 affiliate plan
2. Parent refers 4 L1 users (3 buy servers, 1 buys affiliate plan)
3. One L1 user refers 4 L2 users (who become L2 of parent)
4. L2 users make purchases
5. Verify commission distribution at all levels
"""

import asyncio
import sys
from decimal import Decimal
from typing import Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
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
    """Manages the end-to-end referral system test"""
    
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
    
    async def register_user(self, email: str, full_name: str, password: str = "Test@1234", 
                           referral_code: Optional[str] = None) -> UserProfile:
        """Register a new user"""
        print(f"\n{BLUE}Registering user: {email}{RESET}")
        
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
    
    async def get_referral_stats(self, email: str) -> Dict:
        """Get referral statistics for a user"""
        user = self.users[email]
        
        # Get affiliate stats
        stats_result = await self.db.execute(
            select(AffiliateStats).where(AffiliateStats.affiliate_user_id == user.id)
        )
        stats = stats_result.scalar_one_or_none()
        
        # Get commission counts by level
        commissions = {}
        for level in [1, 2, 3]:
            count_result = await self.db.execute(
                select(func.count(Commission.id)).where(
                    Commission.affiliate_user_id == user.id,
                    Commission.level == level
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
    
    async def verify_referral_chain(self, parent_email: str, l1_emails: list, l2_emails: list = None):
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
        if l2_emails:
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
    """Main test execution function"""
    print(f"\n{BLUE}{'='*70}{RESET}")
    print(f"{BLUE}Starting Referral System Test{RESET}")
    print(f"{BLUE}{'='*70}{RESET}")
    
    # Generate unique timestamp for this test run
    import time
    test_id = int(time.time() * 1000)  # milliseconds since epoch
    print(f"\n{YELLOW}Test ID: {test_id}{RESET}\n")
    
    # Set up database connection
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
            
            parent = await tester.register_user(f"parent{test_id}@test.com", "Parent User")
            parent_subscription = await tester.purchase_affiliate_plan(f"parent{test_id}@test.com")
            parent_code = parent_subscription.referral_code
            
            # Step 3: Register 4 L1 users
            print(f"\n{YELLOW}{'='*70}{RESET}")
            print(f"{YELLOW}SCENARIO 2: Level 1 Referrals Registration{RESET}")
            print(f"{YELLOW}{'='*70}{RESET}")
            
            l1_users = []
            for i in range(1, 5):
                user = await tester.register_user(
                    f"l1_user{i}_{test_id}@test.com",
                    f"L1 User {i}",
                    referral_code=parent_code
                )
                l1_users.append(f"l1_user{i}_{test_id}@test.com")
            
            # Verify L1 referrals
            await tester.verify_referral_chain(f"parent{test_id}@test.com", l1_users)
            
            # Step 4: L1 users make purchases
            print(f"\n{YELLOW}{'='*70}{RESET}")
            print(f"{YELLOW}SCENARIO 3: Level 1 Users Purchase Referral Plans{RESET}")
            print(f"{YELLOW}{'='*70}{RESET}")
            
            # ALL L1 Users: Buy ₹499 referral plan to become referrers
            for i in range(1, 5):
                await tester.purchase_affiliate_plan(f"l1_user{i}_{test_id}@test.com")
            
            # Print parent summary after L1 purchases
            await tester.print_summary(f"parent{test_id}@test.com")
            
            # Step 5: ALL L1 users refer new users (creating L2 for parent)
            print(f"\n{YELLOW}{'='*70}{RESET}")
            print(f"{YELLOW}SCENARIO 4: Level 1 Users Refer New Users (Level 2 for Parent){RESET}")
            print(f"{YELLOW}{'='*70}{RESET}")
            
            all_l2_users = []
            
            # Each L1 user refers 4 new users
            for l1_idx in range(1, 5):
                l1_user_email = f"l1_user{l1_idx}_{test_id}@test.com"
                l1_user_code = tester.referral_codes[l1_user_email]
                
                print(f"\n{BLUE}L1 User {l1_idx} referring 4 users...{RESET}")
                
                for l2_idx in range(1, 5):
                    l2_email = f"l2_from_l1user{l1_idx}_user{l2_idx}_{test_id}@test.com"
                    user = await tester.register_user(
                        l2_email,
                        f"L2 User (from L1-{l1_idx}, #{l2_idx})",
                        referral_code=l1_user_code
                    )
                    all_l2_users.append(l2_email)
            
            print(f"\n{GREEN}✅ Total L2 users created: {len(all_l2_users)}{RESET}")
            
            # Verify referral chains - parent should have all 16 L2 referrals
            await tester.verify_referral_chain(f"parent{test_id}@test.com", l1_users, all_l2_users)
            
            # Step 6: L2 users make purchases
            print(f"\n{YELLOW}{'='*70}{RESET}")
            print(f"{YELLOW}SCENARIO 5: Level 2 Users Make Purchases{RESET}")
            print(f"{YELLOW}{'='*70}{RESET}")
            
            # Have some L2 users buy servers (not all, to be realistic)
            for i in range(1, 9):  # 8 out of 16 L2 users buy servers
                if i <= len(all_l2_users):
                    await tester.purchase_server(all_l2_users[i-1])
            
            
            # Final summaries
            print(f"\n{YELLOW}{'='*70}{RESET}")
            print(f"{YELLOW}FINAL RESULTS{RESET}")
            print(f"{YELLOW}{'='*70}{RESET}")
            
            await tester.print_summary(f"parent{test_id}@test.com")
            await tester.print_summary(f"l1_user1_{test_id}@test.com")
            await tester.print_summary(f"l1_user2_{test_id}@test.com")
            
            # Final assertions
            print(f"\n{BLUE}Running final assertions...{RESET}")
            
            parent_stats = await tester.get_referral_stats(f"parent{test_id}@test.com")
            l1_user1_stats = await tester.get_referral_stats(f"l1_user1_{test_id}@test.com")
            
            assert parent_stats['total_referrals_l1'] == 4, f"Parent should have 4 L1 referrals, got {parent_stats['total_referrals_l1']}"
            assert parent_stats['total_referrals_l2'] == 16, f"Parent should have 16 L2 referrals (4 L1 users × 4 each), got {parent_stats['total_referrals_l2']}"
            
            assert l1_user1_stats['total_referrals_l1'] == 4, f"L1 User 1 should have 4 L1 referrals, got {l1_user1_stats['total_referrals_l1']}"
            
            # Check commission counts
            assert parent_stats['commissions_by_level']['L1'] >= 4, f"Parent should have at least 4 L1 commissions, got {parent_stats['commissions_by_level']['L1']}"
            assert parent_stats['commissions_by_level']['L2'] >= 8, f"Parent should have at least 8 L2 commissions, got {parent_stats['commissions_by_level']['L2']}"
            
            print(f"\n{GREEN}{'='*70}{RESET}")
            print(f"{GREEN}✅ ALL TESTS PASSED!{RESET}")
            print(f"{GREEN}{'='*70}{RESET}")
            
            print(f"\n📊 Test Summary:")
            print(f"   Total Users Created: {len(tester.users)}")
            print(f"   Parent L1 Referrals: {parent_stats['total_referrals_l1']}")
            print(f"   Parent L2 Referrals: {parent_stats['total_referrals_l2']}")
            print(f"   Parent L1 Commissions: {parent_stats['commissions_by_level']['L1']}")
            print(f"   Parent L2 Commissions: {parent_stats['commissions_by_level']['L2']}")
            print(f"   Parent Total Earned: ₹{parent_stats['total_commission']}")
            print(f"\n   L1 User 1 L1 Referrals: {l1_user1_stats['total_referrals_l1']}")
            print(f"   L1 User 1 Total Earned: ₹{l1_user1_stats['total_commission']}")
            
        except AssertionError as e:
            print(f"\n{RED}❌ ASSERTION FAILED: {str(e)}{RESET}")
            raise
        except Exception as e:
            print(f"\n{RED}❌ ERROR: {str(e)}{RESET}")
            import traceback
            traceback.print_exc()
            raise
        finally:
            break


if __name__ == "__main__":
    print(f"\n{BLUE}Referral System Test Script{RESET}")
    print(f"{BLUE}Testing multi-level referral tracking and commissions{RESET}\n")
    
    try:
        asyncio.run(run_test())
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Test interrupted by user{RESET}")
    except Exception as e:
        print(f"\n{RED}Test failed: {str(e)}{RESET}")
        sys.exit(1)
