"""
Public Pricing API Endpoints
Provides read-only access to plans and billing cycles for the calculator
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from app.core.database import get_db
from app.models.plan import HostingPlan as HostingPlanModel
from app.schemas.plan import HostingPlan

router = APIRouter(prefix="/pricing", tags=["Pricing"])


@router.get("/plans", response_model=List[HostingPlan])
async def get_public_plans(
    plan_type: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all active plans (public endpoint for calculator)"""
    query = select(HostingPlanModel).where(HostingPlanModel.is_active == True)
    
    if plan_type:
        query = query.where(HostingPlanModel.plan_type == plan_type)
    
    query = query.order_by(HostingPlanModel.plan_type, HostingPlanModel.ram_gb)
    
    result = await db.execute(query)
    plans = result.scalars().all()
    
    return [HostingPlan.model_validate(plan) for plan in plans]


@router.get("/plans/{plan_id}", response_model=HostingPlan)
async def get_public_plan_by_id(
    plan_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific plan by ID (public endpoint)"""
    result = await db.execute(
        select(HostingPlanModel).where(
            and_(
                HostingPlanModel.id == plan_id,
                HostingPlanModel.is_active == True
            )
        )
    )
    plan = result.scalar_one_or_none()
    
    if not plan:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Plan not found")
    
    return HostingPlan.model_validate(plan)


@router.get("/billing-cycles")
async def get_billing_cycles():
    """Get all billing cycles (public endpoint for calculator)"""
    # Hardcoded billing cycles
    return [
        {"id": "monthly", "name": "Monthly", "months": 1, "discount": 5},
        {"id": "quarterly", "name": "Quarterly", "months": 3, "discount": 10},
        {"id": "semiannually", "name": "Semi-Annually", "months": 6, "discount": 15},
        {"id": "annually", "name": "Annually", "months": 12, "discount": 20},
        {"id": "biennially", "name": "Biennially", "months": 24, "discount": 25},
        {"id": "triennially", "name": "Triennially", "months": 36, "discount": 35}
    ]


@router.get("/plan-types")
async def get_plan_types():
    """Get all plan types (public endpoint)"""
    return [
        {
            "id": "general_purpose",
            "name": "General Purpose VM",
            "icon": "Server",
            "color": "cyan",
            "description": "Balanced resources for web apps"
        },
        {
            "id": "cpu_optimized",
            "name": "CPU Optimized VM",
            "icon": "Zap",
            "color": "orange",
            "description": "Dedicated CPU for compute tasks"
        },
        {
            "id": "memory_optimized",
            "name": "Memory Optimized VM",
            "icon": "Database",
            "color": "green",
            "description": "High RAM for databases"
        }
    ]


@router.get("/filters")
async def get_pricing_filters():
    """Get all pricing filters (plan types + billing cycles)"""
    billing_cycles = await get_billing_cycles()
    plan_types = await get_plan_types()
    
    return {
        "plan_types": plan_types,
        "billing_cycles": billing_cycles
    }
