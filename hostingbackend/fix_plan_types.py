"""
Fix plan_type values in existing hosting_plans
Updates incorrect plan types to the correct values expected by the calculator
"""
import asyncio
import asyncpg
from app.core.config import settings

async def fix_plan_types():
    database_url = settings.DATABASE_URL
    conn = await asyncpg.connect(database_url.replace("postgresql+asyncpg", "postgresql"))
    
    print("🔄 Fixing plan_type values...")
    
    # Check current plans
    current_plans = await conn.fetch("SELECT id, name, plan_type FROM hosting_plans")
    print(f"\n📋 Current plans ({len(current_plans)}):")
    for plan in current_plans:
        print(f"  - {plan['name']}: {plan['plan_type']}")
    
    # Update strategy: Delete old plans and insert new ones with correct types
    # But first, we need to handle foreign key constraints
    
    print("\n⚠️  Cannot delete plans with existing orders.")
    print("📝 Instead, marking old plans as inactive and inserting new plans...")
    
    # Mark existing plans as inactive
    await conn.execute("UPDATE hosting_plans SET is_active = false, is_featured = false WHERE plan_type NOT IN ('general_purpose', 'cpu_optimized', 'memory_optimized')")
    print("✅ Marked old plans as inactive")
    
    # Check if correct plans already exist
    correct_plans = await conn.fetch("SELECT name, plan_type FROM hosting_plans WHERE plan_type IN ('general_purpose', 'cpu_optimized', 'memory_optimized') AND is_active = true")
    
    if len(correct_plans) > 0:
        print(f"\n✅ Found {len(correct_plans)} plans with correct types already in database:")
        for plan in correct_plans[:5]:
            print(f"  - {plan['name']}: {plan['plan_type']}")
        await conn.close()
        print("\n✨ Database already has correct plan types!")
        return
    
    print("\n📝 Inserting plans with correct plan_types...")
    
    # Now insert new plans with correct types (simplified version)
    # General Purpose - starting with common options
    general_plans = [
        {'name': 'G.4GB', 'cpu': 2, 'ram': 4, 'storage': 80, 'price': 1120},
        {'name': 'G.8GB', 'cpu': 4, 'ram': 8, 'storage': 160, 'price': 2240, 'featured': True},
        {'name': 'G.16GB', 'cpu': 6, 'ram': 16, 'storage': 320, 'price': 4080},
        {'name': 'G.32GB', 'cpu': 8, 'ram': 32, 'storage': 480, 'price': 6720},
    ]
    
    # CPU Optimized
    cpu_plans = [
        {'name': 'C.4GB', 'cpu': 2, 'ram': 4, 'storage': 80, 'price': 1520},
        {'name': 'C.8GB', 'cpu': 4, 'ram': 8, 'storage': 160, 'price': 3040, 'featured': True},
        {'name': 'C.16GB', 'cpu': 6, 'ram': 16, 'storage': 320, 'price': 5280},
        {'name': 'C.32GB', 'cpu': 8, 'ram': 32, 'storage': 480, 'price': 8320},
    ]
    
    # Memory Optimized
    memory_plans = [
        {'name': 'M.8GB', 'cpu': 1, 'ram': 8, 'storage': 80, 'price': 1320},
        {'name': 'M.16GB', 'cpu': 2, 'ram': 16, 'storage': 160, 'price': 2640, 'featured': True},
        {'name': 'M.32GB', 'cpu': 4, 'ram': 32, 'storage': 320, 'price': 5280},
        {'name': 'M.64GB', 'cpu': 6, 'ram': 64, 'storage': 480, 'price': 9520},
    ]
    
    import json
    
    inserted = 0
    for plan_type, plans in [('general_purpose', general_plans), ('cpu_optimized', cpu_plans), ('memory_optimized', memory_plans)]:
        for plan in plans:
            features = [
                f"{plan['cpu']} vCPU",
                f"{plan['ram']}GB RAM",
                f"{plan['storage']}GB SSD Storage",
                "1000GB Bandwidth",
                "IPv4 Address",
                "Console Access",
                "Full Root Access"
            ]
            
            await conn.execute('''
                INSERT INTO hosting_plans (
                    name, plan_type, cpu_cores, ram_gb, storage_gb, bandwidth_gb,
                    base_price, monthly_price, quarterly_price, annual_price,
                    biennial_price, triennial_price, is_active, is_featured, features, description
                ) VALUES ($1, $2, $3, $4, $5, 1000, $6, $6, $7, $8, $9, $10, true, $11, $12::jsonb, $13)
            ''',
                plan['name'],
                plan_type,
                plan['cpu'],
                plan['ram'],
                plan['storage'],
                plan['price'],
                plan['price'] * 3,
                plan['price'] * 12,
                plan['price'] * 24,
                plan['price'] * 36,
                plan.get('featured', False),
                json.dumps(features),
                f"{plan['name']} - {plan_type.replace('_', ' ').title()}"
            )
            inserted += 1
    
    print(f"✅ Inserted {inserted} new plans with correct types")
    
    # Verify
    active_plans = await conn.fetch("""
        SELECT plan_type, COUNT(*) as count
        FROM hosting_plans
        WHERE is_active = true
        GROUP BY plan_type
    """)
    
    print("\n📊 Active plans by type:")
    for row in active_plans:
        print(f"  - {row['plan_type']}: {row['count']} plans")
    
    await conn.close()
    print("\n✅ Plan types fixed successfully!")

if __name__ == "__main__":
    asyncio.run(fix_plan_types())
