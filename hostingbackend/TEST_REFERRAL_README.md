# Referral System Test Script

## Overview
This test script validates the complete multi-level referral system including:
- User registration with referral codes
- Affiliate subscription activation (₹499 paid or free with server)
- Multi-level referral tracking (L1, L2, L3)
- Commission calculation and distribution
- Purchase tracking and conversion

## Test Scenarios

### Scenario 1: Parent User Setup
- Register parent user
- Purchase ₹499 affiliate plan
- Get unique referral code

### Scenario 2: Level 1 Referrals (4 users)
- 3 users buy servers (auto-activates free affiliate subscription)
- 1 user buys ₹499 affiliate plan
- All registered with parent's referral code

### Scenario 3: Level 2 Referrals (4 users)
- L1 User 4 refers 4 new users
- These become L2 of parent
- All buy servers

### Expected Results

#### Parent User
- **L1 Referrals**: 4 total (4 active)
- **L2 Referrals**: 4 total (4 active)
- **L1 Commissions**: 4 entries (1 per L1 purchase)
- **L2 Commissions**: 4 entries (1 per L2 purchase)

#### L1 User 4
- **L1 Referrals**: 4 total (4 active)
- **L1 Commissions**: 4 entries

## Running the Test

### Prerequisites
1. Database must be set up and running
2. All dependencies installed (`requirements.txt`)
3. Environment variables configured (`.env`)

### Execution

#### Option 1: Direct execution
```bash
cd /home/abhishek-rajput/Documents/RamaeraProjects/Hosting/hostingbackend
python test_referral_system.py
```

#### Option 2: Inside Docker container
```bash
docker compose exec backend python test_referral_system.py
```

### Expected Output
The script provides colorful, detailed output including:
- ✅ Success messages for each step
- 📊 Referral statistics summaries
- 💰 Commission breakdowns
- ⚠️ Warnings for any issues
- Final assertion results

## Database Setup

The script will automatically:
1. Create commission rules for L1, L2, L3
2. Create test users
3. Create orders and affiliate subscriptions
4. Generate referral tracking records
5. Calculate commissions

## Verification Points

### Database Tables Checked
- `users_profiles` - User accounts
- `affiliate_subscriptions` - Affiliate activations
- `referrals` - Multi-level referral chains
- `orders` - Purchase records
- `commissions` - Commission calculations
- `affiliate_stats` - Cached statistics
- `commission_rules` - Commission rate definitions

### Assertions
- ✅ Correct number of referrals at each level
- ✅ All referrals marked as active (has_purchased = true)
- ✅ Correct commission counts per level
- ✅ Commission amounts calculated properly
- ✅ Referral chain integrity (parent_referral_id links)

## Troubleshooting

### Database Connection Issues
- Ensure database is running: `docker compose ps`
- Check `.env` file for correct `DATABASE_URL`

### Import Errors
- Verify all models are imported in `app/models/__init__.py`
- Check Python path includes the app directory

### Commission Not Created
- Verify `commission_rules` table has entries
- Check order status is 'completed' and payment_status is 'paid'
- Ensure `AffiliateService.calculate_and_record_commissions()` is called

## Cleanup

To reset the test data:
```bash
# Option 1: Drop and recreate database
docker compose down -v
docker compose up -d

# Option 2: Delete test users manually
# (Use your database management tool)
```

## Notes
- This script does NOT use pytest fixtures
- It runs as a standalone script with async/await
- Safe to run multiple times (creates new users each time)
- Uses colored terminal output for better readability
