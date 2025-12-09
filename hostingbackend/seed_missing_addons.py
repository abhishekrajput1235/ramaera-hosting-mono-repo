"""
Script to add missing addons for Checkout.tsx
Adds backup storage, SSL certificates, and support packages
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.models.addon import Addon, AddonCategory

async def seed_missing_addons():
    async with AsyncSessionLocal() as db:
        try:
            # Backup Storage Addons
            backup_addons = [
                {
                    "name": "Backup Storage 100GB",
                    "slug": "backup-storage-100gb",
                    "category": AddonCategory.STORAGE,
                    "description": "100GB automated backup storage",
                    "price": 750.00,
                    "billing_type": "monthly",
                    "currency": "INR",
                    "is_active": True,
                    "is_featured": False,
                    "sort_order": 20,
                    "min_quantity": 1,
                    "max_quantity": 1,
                    "default_quantity": 1,
                    "unit_label": "100GB",
                    "icon": "Database"
                },
                {
                    "name": "Backup Storage 200GB",
                    "slug": "backup-storage-200gb",
                    "category": AddonCategory.STORAGE,
                    "description": "200GB automated backup storage",
                    "price": 1500.00,
                    "billing_type": "monthly",
                    "currency": "INR",
                    "is_active": True,
                    "is_featured": False,
                    "sort_order": 21,
                    "min_quantity": 1,
                    "max_quantity": 1,
                    "default_quantity": 1,
                    "unit_label": "200GB",
                    "icon": "Database"
                },
                {
                    "name": "Backup Storage 300GB",
                    "slug": "backup-storage-300gb",
                    "category": AddonCategory.STORAGE,
                    "description": "300GB automated backup storage",
                    "price": 2250.00,
                    "billing_type": "monthly",
                    "currency": "INR",
                    "is_active": True,
                    "is_featured": False,
                    "sort_order": 22,
                    "min_quantity": 1,
                    "max_quantity": 1,
                    "default_quantity": 1,
                    "unit_label": "300GB",
                    "icon": "Database"
                },
                {
                    "name": "Backup Storage 500GB",
                    "slug": "backup-storage-500gb",
                    "category": AddonCategory.STORAGE,
                    "description": "500GB automated backup storage",
                    "price": 3750.00,
                    "billing_type": "monthly",
                    "currency": "INR",
                    "is_active": True,
                    "is_featured": False,
                    "sort_order": 23,
                    "min_quantity": 1,
                    "max_quantity": 1,
                    "default_quantity": 1,
                    "unit_label": "500GB",
                    "icon": "Database"
                },
                {
                    "name": "Backup Storage 1TB",
                    "slug": "backup-storage-1000gb",
                    "category": AddonCategory.STORAGE,
                    "description": "1TB automated backup storage",
                    "price": 7500.00,
                    "billing_type": "monthly",
                    "currency": "INR",
                    "is_active": True,
                    "is_featured": False,
                    "sort_order": 24,
                    "min_quantity": 1,
                    "max_quantity": 1,
                    "default_quantity": 1,
                    "unit_label": "1TB",
                    "icon": "Database"
                }
            ]

            # SSL Certificate Addons (monthly prices)
            ssl_addons = [
                {
                    "name": "SSL Essential",
                    "slug": "ssl-essential",
                    "category": AddonCategory.SECURITY,
                    "description": "Essential SSL certificate for single domain",
                    "price": 225.00,  # ₹2700/year ÷ 12
                    "billing_type": "monthly",
                    "currency": "INR",
                    "is_active": True,
                    "is_featured": False,
                    "sort_order": 30,
                    "min_quantity": 1,
                    "max_quantity": 10,
                    "default_quantity": 1,
                    "unit_label": "certificate",
                    "icon": "Lock"
                },
                {
                    "name": "SSL Essential Wildcard",
                    "slug": "ssl-essential-wildcard",
                    "category": AddonCategory.SECURITY,
                    "description": "Essential wildcard SSL certificate",
                    "price": 1162.00,  # ₹13945.61/year ÷ 12
                    "billing_type": "monthly",
                    "currency": "INR",
                    "is_active": True,
                    "is_featured": False,
                    "sort_order": 31,
                    "min_quantity": 1,
                    "max_quantity": 10,
                    "default_quantity": 1,
                    "unit_label": "certificate",
                    "icon": "Lock"
                },
                {
                    "name": "SSL Comodo",
                    "slug": "ssl-comodo",
                    "category": AddonCategory.SECURITY,
                    "description": "Comodo SSL certificate for single domain",
                    "price": 208.00,  # ₹2500/year ÷ 12
                    "billing_type": "monthly",
                    "currency": "INR",
                    "is_active": True,
                    "is_featured": True,
                    "sort_order": 32,
                    "min_quantity": 1,
                    "max_quantity": 10,
                    "default_quantity": 1,
                    "unit_label": "certificate",
                    "icon": "Lock"
                },
                {
                    "name": "SSL Comodo Wildcard",
                    "slug": "ssl-comodo-wildcard",
                    "category": AddonCategory.SECURITY,
                    "description": "Comodo wildcard SSL certificate",
                    "price": 1084.00,  # ₹13005.86/year ÷ 12
                    "billing_type": "monthly",
                    "currency": "INR",
                    "is_active": True,
                    "is_featured": False,
                    "sort_order": 33,
                    "min_quantity": 1,
                    "max_quantity": 10,
                    "default_quantity": 1,
                    "unit_label": "certificate",
                    "icon": "Lock"
                },
                {
                    "name": "SSL RapidSSL",
                    "slug": "ssl-rapid",
                    "category": AddonCategory.SECURITY,
                    "description": "RapidSSL certificate for single domain",
                    "price": 250.00,  # ₹3000/year ÷ 12
                    "billing_type": "monthly",
                    "currency": "INR",
                    "is_active": True,
                    "is_featured": False,
                    "sort_order": 34,
                    "min_quantity": 1,
                    "max_quantity": 10,
                    "default_quantity": 1,
                    "unit_label": "certificate",
                    "icon": "Lock"
                },
                {
                    "name": "SSL RapidSSL Wildcard",
                    "slug": "ssl-rapid-wildcard",
                    "category": AddonCategory.SECURITY,
                    "description": "RapidSSL wildcard certificate",
                    "price": 1371.00,  # ₹16452.72/year ÷ 12
                    "billing_type": "monthly",
                    "currency": "INR",
                    "is_active": True,
                    "is_featured": False,
                    "sort_order": 35,
                    "min_quantity": 1,
                    "max_quantity": 10,
                    "default_quantity": 1,
                    "unit_label": "certificate",
                    "icon": "Lock"
                }
            ]

            # Support Package Addons
            support_addons = [
                {
                    "name": "Priority Support Basic",
                    "slug": "support-basic",
                    "category": AddonCategory.SUPPORT,
                    "description": "Basic priority support with faster response times",
                    "price": 2500.00,
                    "billing_type": "monthly",
                    "currency": "INR",
                    "is_active": True,
                    "is_featured": False,
                    "sort_order": 40,
                    "min_quantity": 1,
                    "max_quantity": 1,
                    "default_quantity": 1,
                    "unit_label": "service",
                    "icon": "Headphones"
                },
                {
                    "name": "Priority Support Premium",
                    "slug": "support-premium",
                    "category": AddonCategory.SUPPORT,
                    "description": "Premium priority support with 24/7 assistance",
                    "price": 7500.00,
                    "billing_type": "monthly",
                    "currency": "INR",
                    "is_active": True,
                    "is_featured": True,
                    "sort_order": 41,
                    "min_quantity": 1,
                    "max_quantity": 1,
                    "default_quantity": 1,
                    "unit_label": "service",
                    "icon": "Headphones"
                }
            ]

            # Legacy backup service
            legacy_addon = {
                "name": "Automated Backup Service",
                "slug": "backup-service-basic",
                "category": AddonCategory.STORAGE,
                "description": "Basic automated backup service (legacy)",
                "price": 500.00,
                "billing_type": "monthly",
                "currency": "INR",
                "is_active": True,
                "is_featured": False,
                "sort_order": 19,
                "min_quantity": 1,
                "max_quantity": 1,
                "default_quantity": 1,
                "unit_label": "service",
                "icon": "Database"
            }

            # Combine all addons
            all_addons = backup_addons + ssl_addons + support_addons + [legacy_addon]

            # Insert addons
            added_count = 0
            skipped_count = 0
            
            for addon_data in all_addons:
                # Check if addon already exists
                from sqlalchemy import select
                existing = await db.execute(
                    select(Addon).where(Addon.slug == addon_data["slug"])
                )
                if existing.scalar_one_or_none():
                    print(f"⏭️  Skipped: {addon_data['name']} (already exists)")
                    skipped_count += 1
                    continue

                # Create new addon
                addon = Addon(**addon_data)
                db.add(addon)
                print(f"✅ Added: {addon_data['name']} - ₹{addon_data['price']}/month")
                added_count += 1

            await db.commit()
            
            print("\n" + "=" * 60)
            print(f"✅ Successfully added {added_count} new addons")
            print(f"⏭️  Skipped {skipped_count} existing addons")
            print(f"📊 Total processed: {len(all_addons)} addons")
            print("=" * 60)

        except Exception as e:
            await db.rollback()
            print(f"❌ Error: {str(e)}")
            raise

if __name__ == "__main__":
    print("🚀 Starting missing addons seeding...\n")
    asyncio.run(seed_missing_addons())
    print("\n✅ Seeding complete!")
