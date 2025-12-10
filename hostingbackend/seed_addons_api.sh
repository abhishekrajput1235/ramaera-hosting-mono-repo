#!/bin/bash
# Seed critical addons via API
# This script creates missing addons by calling the backend API

API_URL="http://localhost:8000/api/v1/addons/"

echo "============================================================"
echo "Seeding Critical Addons via API"
echo "============================================================"

# Function to create addon
create_addon() {
    local data="$1"
    echo "Creating addon..."
    curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "$data" | python3 -m json.tool 2>/dev/null || echo "  ⚠️  Failed (may need authentication)"
}

# Extra Storage
echo ""
echo "📦 Extra Storage"
create_addon '{
  "name": "Extra Storage",
  "slug": "extra-storage",
  "category": "storage",
  "description": "Additional NVMe SSD storage per GB",
  "price": 2.0,
  "billing_type": "per_unit",
  "currency": "INR",
  "is_active": true,
  "is_featured": false,
  "sort_order": 1,
  "min_quantity": 0,
  "max_quantity": 1000,
  "default_quantity": 0,
  "unit_label": "GB",
  "icon": "HardDrive"
}'

# Extra Bandwidth
echo ""
echo "🌐 Extra Bandwidth"
create_addon '{
  "name": "Extra Bandwidth",
  "slug": "extra-bandwidth",
  "category": "bandwidth",
  "description": "Additional monthly bandwidth per TB",
  "price": 100.0,
  "billing_type": "per_unit",
  "currency": "INR",
  "is_active": true,
  "is_featured": false,
  "sort_order": 2,
  "min_quantity": 0,
  "max_quantity": 100,
  "default_quantity": 0,
  "unit_label": "TB",
  "icon": "Network"
}'

# Additional IPv4
echo ""
echo "🌍 Additional IPv4"
create_addon '{
  "name": "Additional IPv4 Address",
  "slug": "additional-ipv4",
  "category": "ip_address",
  "description": "Additional dedicated IPv4 address",
  "price": 200.0,
  "billing_type": "per_unit",
  "currency": "INR",
  "is_active": true,
  "is_featured": false,
  "sort_order": 10,
  "min_quantity": 0,
  "max_quantity": 10,
  "default_quantity": 0,
  "unit_label": "IP",
  "icon": "Globe"
}'

# Plesk Admin
echo ""
echo "🖥️  Plesk Admin"
create_addon '{
  "name": "Plesk Web Admin Edition",
  "slug": "plesk-admin",
  "category": "control_panel",
  "description": "Plesk Web Admin Edition (10 domains)",
  "price": 950.0,
  "billing_type": "monthly",
  "currency": "INR",
  "is_active": true,
  "is_featured": true,
  "sort_order": 30,
  "min_quantity": 1,
  "max_quantity": 1,
  "default_quantity": 1,
  "unit_label": "license",
  "icon": "Server"
}'

# Plesk Pro
echo ""
echo "🖥️  Plesk Pro"
create_addon '{
  "name": "Plesk Web Pro Edition",
  "slug": "plesk-pro",
  "category": "control_panel",
  "description": "Plesk Web Pro Edition (30 domains)",
  "price": 1750.0,
  "billing_type": "monthly",
  "currency": "INR",
  "is_active": true,
  "is_featured": true,
  "sort_order": 31,
  "min_quantity": 1,
  "max_quantity": 1,
  "default_quantity": 1,
  "unit_label": "license",
  "icon": "Server"
}'

# Plesk Host
echo ""
echo "🖥️  Plesk Host"
create_addon '{
  "name": "Plesk Web Host Edition",
  "slug": "plesk-host",
  "category": "control_panel",
  "description": "Plesk Web Host Edition (Unlimited domains)",
  "price": 2650.0,
  "billing_type": "monthly",
  "currency": "INR",
  "is_active": true,
  "is_featured": true,
  "sort_order": 32,
  "min_quantity": 1,
  "max_quantity": 1,
  "default_quantity": 1,
  "unit_label": "license",
  "icon": "Server"
}'

# Managed Basic
echo ""
echo "⚙️  Managed Basic"
create_addon '{
  "name": "Basic Managed Service",
  "slug": "managed-basic",
  "category": "management",
  "description": "Basic server management and monitoring",
  "price": 2000.0,
  "billing_type": "monthly",
  "currency": "INR",
  "is_active": true,
  "is_featured": false,
  "sort_order": 50,
  "min_quantity": 1,
  "max_quantity": 1,
  "default_quantity": 1,
  "unit_label": "service",
  "icon": "Settings"
}'

# Managed Premium
echo ""
echo "⚙️  Managed Premium"
create_addon '{
  "name": "Premium Managed Service",
  "slug": "managed-premium",
  "category": "management",
  "description": "Premium server management with 24/7 monitoring",
  "price": 5000.0,
  "billing_type": "monthly",
  "currency": "INR",
  "is_active": true,
  "is_featured": true,
  "sort_order": 51,
  "min_quantity": 1,
  "max_quantity": 1,
  "default_quantity": 1,
  "unit_label": "service",
  "icon": "Settings"
}'

# DDoS Advanced
echo ""
echo "🛡️  DDoS Advanced"
create_addon '{
  "name": "Advanced DDoS Protection",
  "slug": "ddos-advanced",
  "category": "security",
  "description": "Advanced DDoS protection up to 10 Gbps",
  "price": 1000.0,
  "billing_type": "monthly",
  "currency": "INR",
  "is_active": true,
  "is_featured": false,
  "sort_order": 60,
  "min_quantity": 1,
  "max_quantity": 1,
  "default_quantity": 1,
  "unit_label": "service",
  "icon": "Shield"
}'

# DDoS Enterprise
echo ""
echo "🛡️  DDoS Enterprise"
create_addon '{
  "name": "Enterprise DDoS Protection",
  "slug": "ddos-enterprise",
  "category": "security",
  "description": "Enterprise DDoS protection up to 100 Gbps",
  "price": 3000.0,
  "billing_type": "monthly",
  "currency": "INR",
  "is_active": true,
  "is_featured": true,
  "sort_order": 61,
  "min_quantity": 1,
  "max_quantity": 1,
  "default_quantity": 1,
  "unit_label": "service",
  "icon": "Shield"
}'

echo ""
echo "============================================================"
echo "Seeding complete!"
echo "============================================================"
