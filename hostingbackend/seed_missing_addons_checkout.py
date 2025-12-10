"""
Seed missing addons required by Checkout.tsx
Run this script after backend is running:
  cd hostingbackend && python seed_missing_addons_checkout.py
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

# Database URL - update if different
DATABASE_URL = "postgresql+asyncpg://ramaera:ramaera123@localhost:5432/hostingdb"

# Missing addons that Checkout.tsx expects
MISSING_ADDONS = [
    {
        "name": "Extra Storage",
        "slug": "extra-storage", 
        "category": "storage",
        "description": "Additional NVMe SSD storage per GB",
        "price": 2.00,
        "billing_type": "per_unit",
        "unit_label": "GB",
        "is_active": True,
        "is_featured": True,
        "min_quantity": 0,
        "max_quantity": 1000,
        "default_quantity": 0,
        "sort_order": 1
    },
    {
        "name": "Extra Bandwidth",
        "slug": "extra-bandwidth",
        "category": "bandwidth", 
        "description": "Additional monthly bandwidth per TB",
        "price": 100.00,
        "billing_type": "per_unit",
        "unit_label": "TB",
        "is_active": True,
        "is_featured": True,
        "min_quantity": 0,
        "max_quantity": 100,
        "default_quantity": 0,
        "sort_order": 2
    },
    {
        "name": "Additional IPv4",
        "slug": "additional-ipv4",
        "category": "ip_address",
        "description": "Additional dedicated IPv4 address",
        "price": 200.00,
        "billing_type": "monthly",
        "unit_label": "IP",
        "is_active": True,
        "is_featured": False,
        "min_quantity": 0,
        "max_quantity": 16,
        "default_quantity": 0,
        "sort_order": 3
    },
    {
        "name": "Managed Basic",
        "slug": "managed-basic",
        "category": "management",
        "description": "Basic server management - OS updates, monitoring, and basic support",
        "price": 2000.00,
        "billing_type": "monthly",
        "unit_label": None,
        "is_active": True,
        "is_featured": True,
        "min_quantity": 1,
        "max_quantity": 1,
        "default_quantity": 0,
        "sort_order": 10
    },
    {
        "name": "Managed Premium",
        "slug": "managed-premium",
        "category": "management",
        "description": "Premium management - 24/7 monitoring, security hardening, full administration",
        "price": 5000.00,
        "billing_type": "monthly",
        "unit_label": None,
        "is_active": True,
        "is_featured": True,
        "min_quantity": 1,
        "max_quantity": 1,
        "default_quantity": 0,
        "sort_order": 11
    },
    {
        "name": "DDoS Advanced Protection",
        "slug": "ddos-advanced",
        "category": "security",
        "description": "Advanced DDoS protection up to 10 Gbps",
        "price": 1000.00,
        "billing_type": "monthly",
        "unit_label": None,
        "is_active": True,
        "is_featured": False,
        "min_quantity": 1,
        "max_quantity": 1,
        "default_quantity": 0,
        "sort_order": 20
    },
    {
        "name": "DDoS Enterprise Protection",
        "slug": "ddos-enterprise",
        "category": "security",
        "description": "Enterprise DDoS protection up to 100 Gbps with dedicated mitigation",
        "price": 3000.00,
        "billing_type": "monthly",
        "unit_label": None,
        "is_active": True,
        "is_featured": True,
        "min_quantity": 1,
        "max_quantity": 1,
        "default_quantity": 0,
        "sort_order": 21
    },
    {
        "name": "Plesk Web Admin Edition",
        "slug": "plesk-admin",
        "category": "control_panel",
        "description": "Plesk control panel for up to 10 domains",
        "price": 950.00,
        "billing_type": "monthly",
        "unit_label": None,
        "is_active": True,
        "is_featured": False,
        "min_quantity": 1,
        "max_quantity": 1,
        "default_quantity": 0,
        "sort_order": 30
    },
    {
        "name": "Plesk Web Pro Edition",
        "slug": "plesk-pro",
        "category": "control_panel",
        "description": "Plesk control panel for up to 30 domains",
        "price": 1750.00,
        "billing_type": "monthly",
        "unit_label": None,
        "is_active": True,
        "is_featured": True,
        "min_quantity": 1,
        "max_quantity": 1,
        "default_quantity": 0,
        "sort_order": 31
    },
    {
        "name": "Plesk Web Host Edition",
        "slug": "plesk-host",
        "category": "control_panel",
        "description": "Plesk control panel for unlimited domains",
        "price": 2650.00,
        "billing_type": "monthly",
        "unit_label": None,
        "is_active": True,
        "is_featured": False,
        "min_quantity": 1,
        "max_quantity": 1,
        "default_quantity": 0,
        "sort_order": 32
    }
]

async def seed_addons():
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        for addon in MISSING_ADDONS:
            # Check if addon already exists
            result = await session.execute(
                text("SELECT id FROM addons WHERE slug = :slug"),
                {"slug": addon["slug"]}
            )
            existing = result.scalar()
            
            if existing:
                print(f"Addon '{addon['slug']}' already exists (id={existing}), skipping...")
                continue
            
            # Insert new addon
            await session.execute(
                text("""
                    INSERT INTO addons (name, slug, category, description, price, billing_type, 
                        unit_label, is_active, is_featured, min_quantity, max_quantity, 
                        default_quantity, sort_order, currency, created_at)
                    VALUES (:name, :slug, :category, :description, :price, :billing_type,
                        :unit_label, :is_active, :is_featured, :min_quantity, :max_quantity,
                        :default_quantity, :sort_order, 'INR', NOW())
                """),
                addon
            )
            print(f"Created addon: {addon['slug']} - {addon['name']} at ₹{addon['price']}")
        
        await session.commit()
        print("\n✅ Successfully seeded missing addons!")

if __name__ == "__main__":
    asyncio.run(seed_addons())
