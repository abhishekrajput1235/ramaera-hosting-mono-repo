"""
Seed missing critical addons for Checkout.tsx
Run this script to add missing addons to the database
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_session_maker
from app.models.addon import Addon, AddonCategory, BillingType


async def seed_missing_addons():
    """Seed missing critical addons"""
    
    addons_to_create = [
        # Storage & Bandwidth
        {
            "name": "Extra Storage",
            "slug": "extra-storage",
            "category": AddonCategory.STORAGE,
            "description": "Additional NVMe SSD storage per GB",
            "price": 2.0,
            "billing_type": BillingType.PER_UNIT,
            "currency": "INR",
            "is_active": True,
            "is_featured": False,
            "sort_order": 1,
            "min_quantity": 0,
            "max_quantity": 1000,
            "default_quantity": 0,
            "unit_label": "GB",
            "icon": "HardDrive"
        },
        {
            "name": "Extra Bandwidth",
            "slug": "extra-bandwidth",
            "category": AddonCategory.BANDWIDTH,
            "description": "Additional monthly bandwidth per TB",
            "price": 100.0,
            "billing_type": BillingType.PER_UNIT,
            "currency": "INR",
            "is_active": True,
            "is_featured": False,
            "sort_order": 2,
            "min_quantity": 0,
            "max_quantity": 100,
            "default_quantity": 0,
            "unit_label": "TB",
            "icon": "Network"
        },
        
        # IP Addresses
        {
            "name": "Additional IPv4 Address",
            "slug": "additional-ipv4",
            "category": AddonCategory.IP_ADDRESS,
            "description": "Additional dedicated IPv4 address",
            "price": 200.0,
            "billing_type": BillingType.PER_UNIT,
            "currency": "INR",
            "is_active": True,
            "is_featured": False,
            "sort_order": 10,
            "min_quantity": 0,
            "max_quantity": 10,
            "default_quantity": 0,
            "unit_label": "IP",
            "icon": "Globe"
        },
        
        # Plesk Control Panel
        {
            "name": "Plesk Web Admin Edition",
            "slug": "plesk-admin",
            "category": AddonCategory.CONTROL_PANEL,
            "description": "Plesk Web Admin Edition (10 domains)",
            "price": 950.0,
            "billing_type": BillingType.MONTHLY,
            "currency": "INR",
            "is_active": True,
            "is_featured": True,
            "sort_order": 30,
            "min_quantity": 1,
            "max_quantity": 1,
            "default_quantity": 1,
            "unit_label": "license",
            "icon": "Server"
        },
        {
            "name": "Plesk Web Pro Edition",
            "slug": "plesk-pro",
            "category": AddonCategory.CONTROL_PANEL,
            "description": "Plesk Web Pro Edition (30 domains)",
            "price": 1750.0,
            "billing_type": BillingType.MONTHLY,
            "currency": "INR",
            "is_active": True,
            "is_featured": True,
            "sort_order": 31,
            "min_quantity": 1,
            "max_quantity": 1,
            "default_quantity": 1,
            "unit_label": "license",
            "icon": "Server"
        },
        {
            "name": "Plesk Web Host Edition",
            "slug": "plesk-host",
            "category": AddonCategory.CONTROL_PANEL,
            "description": "Plesk Web Host Edition (Unlimited domains)",
            "price": 2650.0,
            "billing_type": BillingType.MONTHLY,
            "currency": "INR",
            "is_active": True,
            "is_featured": True,
            "sort_order": 32,
            "min_quantity": 1,
            "max_quantity": 1,
            "default_quantity": 1,
            "unit_label": "license",
            "icon": "Server"
        },
        
        # Managed Services
        {
            "name": "Basic Managed Service",
            "slug": "managed-basic",
            "category": AddonCategory.MANAGEMENT,
            "description": "Basic server management and monitoring",
            "price": 2000.0,
            "billing_type": BillingType.MONTHLY,
            "currency": "INR",
            "is_active": True,
            "is_featured": False,
            "sort_order": 50,
            "min_quantity": 1,
            "max_quantity": 1,
            "default_quantity": 1,
            "unit_label": "service",
            "icon": "Settings"
        },
        {
            "name": "Premium Managed Service",
            "slug": "managed-premium",
            "category": AddonCategory.MANAGEMENT,
            "description": "Premium server management with 24/7 monitoring",
            "price": 5000.0,
            "billing_type": BillingType.MONTHLY,
            "currency": "INR",
            "is_active": True,
            "is_featured": True,
            "sort_order": 51,
            "min_quantity": 1,
            "max_quantity": 1,
            "default_quantity": 1,
            "unit_label": "service",
            "icon": "Settings"
        },
        
        # DDoS Protection
        {
            "name": "Advanced DDoS Protection",
            "slug": "ddos-advanced",
            "category": AddonCategory.SECURITY,
            "description": "Advanced DDoS protection up to 10 Gbps",
            "price": 1000.0,
            "billing_type": BillingType.MONTHLY,
            "currency": "INR",
            "is_active": True,
            "is_featured": False,
            "sort_order": 60,
            "min_quantity": 1,
            "max_quantity": 1,
            "default_quantity": 1,
            "unit_label": "service",
            "icon": "Shield"
        },
        {
            "name": "Enterprise DDoS Protection",
            "slug": "ddos-enterprise",
            "category": AddonCategory.SECURITY,
            "description": "Enterprise DDoS protection up to 100 Gbps",
            "price": 3000.0,
            "billing_type": BillingType.MONTHLY,
            "currency": "INR",
            "is_active": True,
            "is_featured": True,
            "sort_order": 61,
            "min_quantity": 1,
            "max_quantity": 1,
            "default_quantity": 1,
            "unit_label": "service",
            "icon": "Shield"
        },
    ]
    
    async with async_session_maker() as session:
        print("🌱 Seeding missing addons...")
        
        for addon_data in addons_to_create:
            # Check if addon already exists
            from sqlalchemy import select
            result = await session.execute(
                select(Addon).where(Addon.slug == addon_data["slug"])
            )
            existing_addon = result.scalars().first()
            
            if existing_addon:
                print(f"  ⏭️  Skipping '{addon_data['name']}' - already exists")
                continue
            
            # Create new addon
            addon = Addon(**addon_data)
            session.add(addon)
            print(f"  ✅ Created '{addon_data['name']}' ({addon_data['slug']}) - ₹{addon_data['price']}")
        
        await session.commit()
        print("\n✨ Seeding complete!")


if __name__ == "__main__":
    print("=" * 60)
    print("Seeding Critical Addons for Checkout")
    print("=" * 60)
    asyncio.run(seed_missing_addons())
