# from pydantic import BaseModel, validator
# from typing import Optional, Dict, Any
# from datetime import datetime
# from decimal import Decimal

# class OrderBase(BaseModel):
#     plan_id: int
#     billing_cycle: str
#     total_amount: Decimal

# class OrderCreate(OrderBase):
#     server_details: Optional[Dict[str, Any]] = None

#     @validator('billing_cycle')
#     def validate_billing_cycle(cls, v):
#         valid_cycles = ['monthly', 'quarterly', 'semi_annual', 'annual', 'biennial', 'triennial']
#         if v not in valid_cycles:
#             raise ValueError(f'Billing cycle must be one of: {", ".join(valid_cycles)}')
#         return v

# class OrderUpdate(BaseModel):
#     order_status: Optional[str] = None
#     payment_status: Optional[str] = None
#     payment_method: Optional[str] = None
#     payment_reference: Optional[str] = None

# class Order(OrderBase):
#     id: int
#     user_id: int
#     order_number: str
#     order_status: str = "pending"
#     payment_status: str = "pending"
#     server_details: Optional[Dict[str, Any]] = None
#     payment_method: Optional[str] = None
#     payment_reference: Optional[str] = None
#     payment_date: Optional[datetime] = None
#     created_at: datetime
#     updated_at: Optional[datetime] = None

#     class Config:
#         from_attributes = True

# class OrderSummary(BaseModel):
#     total_orders: int
#     pending_orders: int
#     completed_orders: int
#     cancelled_orders: int
#     total_revenue: Decimal
#     monthly_revenue: Decimal

# class OrderWithPlan(Order):
#     plan_name: str
#     plan_type: str
#     user_email: str









    
# class PlanResponse(BaseModel):
#     id: int
#     name: str
#     price: float

#     class Config:
#         from_attributes = True

# class OrderResponse(BaseModel):
#     id: int
#     user_id: int
#     plan_id: int
#     status: str
#     payment_status: str
#     created_at: str
#     plan: Optional[PlanResponse]

#     class Config:
#         from_attributes = True


        




# from pydantic import BaseModel, validator
# from typing import Optional, Dict, Any
# from datetime import datetime
# from decimal import Decimal


# # -------------------- ORDER SCHEMAS --------------------

# class OrderBase(BaseModel):
#     plan_id: int
#     billing_cycle: str
#     total_amount: Decimal


# class OrderCreate(OrderBase):
#     server_details: Optional[Dict[str, Any]] = None

#     @validator('billing_cycle')
#     def validate_billing_cycle(cls, v):
#         valid_cycles = [
#             'monthly', 'quarterly', 'semi_annual',
#             'annual', 'biennial', 'triennial'
#         ]
#         if v not in valid_cycles:
#             raise ValueError(f'Billing cycle must be one of: {", ".join(valid_cycles)}')
#         return v


# class OrderUpdate(BaseModel):
#     order_status: Optional[str] = None
#     payment_status: Optional[str] = None
#     payment_method: Optional[str] = None
#     payment_reference: Optional[str] = None


# class Order(BaseModel):
#     id: int
#     user_id: int
#     plan_id: int
#     order_number: str
#     order_status: str = "pending"
#     payment_status: str = "pending"
#     billing_cycle: str
#     total_amount: Decimal
#     server_details: Optional[Dict[str, Any]] = None
#     payment_method: Optional[str] = None
#     payment_reference: Optional[str] = None
#     payment_date: Optional[datetime] = None
#     created_at: datetime
#     updated_at: Optional[datetime] = None

#     class Config:
#         from_attributes = True


# class OrderSummary(BaseModel):
#     total_orders: int
#     pending_orders: int
#     completed_orders: int
#     cancelled_orders: int
#     total_revenue: Decimal
#     monthly_revenue: Decimal


# class OrderWithPlan(Order):
#     plan_name: str
#     plan_type: str
#     user_email: str


# # -------------------- PLAN SCHEMA --------------------

# class PlanResponse(BaseModel):
#     id: int
#     name: str
#     price: Decimal

#     class Config:
#         from_attributes = True


# # -------------------- INVOICE SCHEMA --------------------

# class InvoiceResponse(BaseModel):
#     id: int
#     invoice_number: str
#     order_id: int
#     user_id: int
#     amount: Decimal
#     status: str
#     issued_date: datetime
#     due_date: Optional[datetime] = None
#     paid_date: Optional[datetime] = None
#     payment_method: Optional[str] = None
#     created_at: datetime
#     updated_at: Optional[datetime] = None

#     class Config:
#         from_attributes = True


# # -------------------- COMBINED RESPONSE --------------------

# class OrderWithInvoiceResponse(BaseModel):
#     order: Order
#     invoice: InvoiceResponse

#     class Config:
#         from_attributes = True








# from pydantic import BaseModel, validator, Field
# from typing import Optional, Dict, Any
# from datetime import datetime
# from decimal import Decimal

# # -------------------- ORDER SCHEMAS --------------------

# class OrderBase(BaseModel):
#     plan_id: int
#     billing_cycle: str
#     total_amount: Decimal


# class OrderCreate(OrderBase):
#     server_details: Optional[Dict[str, Any]] = None

#     @validator('billing_cycle')
#     def validate_billing_cycle(cls, v):
#         v = v.lower().replace("-", "_")
#         valid_cycles = [
#             'monthly', 'quarterly', 'semi_annual',
#             'annual', 'biennial', 'triennial'
#         ]
#         if v not in valid_cycles:
#             raise ValueError(f'Billing cycle must be one of: {", ".join(valid_cycles)}')
#         return v


# class OrderUpdate(BaseModel):
#     order_status: Optional[str] = None
#     payment_status: Optional[str] = None
#     payment_method: Optional[str] = None
#     payment_reference: Optional[str] = None


# class Order(BaseModel):
#     id: int
#     user_id: int
#     plan_id: int
#     order_number: str
#     order_status: str = "pending"
#     payment_status: str = "pending"
#     billing_cycle: str
#     total_amount: Decimal
#     server_details: Optional[Dict[str, Any]] = None
#     payment_method: Optional[str] = None
#     payment_reference: Optional[str] = None
#     payment_date: Optional[datetime] = None
#     created_at: datetime
#     updated_at: Optional[datetime] = None

#     class Config:
#         from_attributes = True


# class OrderSummary(BaseModel):
#     total_orders: int
#     pending_orders: int
#     completed_orders: int
#     cancelled_orders: int
#     total_revenue: Decimal
#     monthly_revenue: Decimal


# class OrderWithPlan(Order):
#     plan_name: str
#     plan_type: str
#     user_email: str


# # -------------------- PLAN SCHEMA --------------------

# class PlanResponse(BaseModel):
#     id: int
#     name: str
#     price: Decimal

#     class Config:
#         from_attributes = True


# # -------------------- INVOICE SCHEMA --------------------

# class InvoiceResponse(BaseModel):
#     id: int
#     invoice_number: str
#     order_id: int
#     user_id: int
#     amount: Decimal = Field(alias='total_amount')
#     status: str
#     issued_date: datetime = Field(alias='invoice_date')
#     due_date: Optional[datetime] = None
#     paid_date: Optional[datetime] = None
#     payment_method: Optional[str] = None
#     created_at: datetime
#     updated_at: Optional[datetime] = None

#     class Config:
#         from_attributes = True
#         populate_by_name = True


# # -------------------- COMBINED RESPONSE --------------------

# class OrderWithInvoiceResponse(BaseModel):
#     order: Order
#     invoice: InvoiceResponse

#     class Config:
#         from_attributes = True




from pydantic import BaseModel, validator, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from decimal import Decimal

# -------------------- ORDER SCHEMAS --------------------

class OrderBase(BaseModel):
    plan_id: Optional[int] = None  # Optional for ₹499 premium subscription
    billing_cycle: str
    total_amount: Decimal


class OrderCreate(OrderBase):
    addon_ids: Optional[List[int]] = []  # List of addon IDs to attach to order
    service_ids: Optional[List[int]] = []  # List of service IDs to attach to order
    server_details: Optional[Dict[str, Any]] = None  # Kept for backward compatibility
    # Service period dates (optional - will be auto-calculated if not provided)
    service_start_date: Optional[datetime] = None
    service_end_date: Optional[datetime] = None
    
    # Discount details
    discount_amount: Optional[Decimal] = Decimal("0.00")
    promo_code: Optional[str] = None

    # Payment details
    payment_status: Optional[str] = "pending"
    payment_method: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    paid_at: Optional[datetime] = None

    @validator('billing_cycle')
    def validate_billing_cycle(cls, v):
        v = v.lower().replace("-", "_")
        valid_cycles = [
            'monthly', 'quarterly', 'semi_annual',
            'annual', 'biennial', 'triennial', 'one_time'
        ]
        if v not in valid_cycles:
            raise ValueError(f'Billing cycle must be one of: {", ".join(valid_cycles)}')
        return v


class OrderUpdate(BaseModel):
    order_status: Optional[str] = None
    payment_status: Optional[str] = None
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None


class Order(BaseModel):
    id: int
    user_id: int
    plan_id: Optional[int] = None
    order_number: str
    order_status: str = "pending"
    payment_status: str = "pending"
    billing_cycle: str
    
    # Financial fields
    total_amount: Decimal
    discount_amount: Optional[Decimal] = Decimal("0.00")
    tax_amount: Optional[Decimal] = Decimal("0.00")
    grand_total: Optional[Decimal] = Decimal("0.00")
    currency: Optional[str] = "INR"
    promo_code: Optional[str] = None
    
    # Server configuration
    server_details: Optional[Dict[str, Any]] = None
    
    # Payment info
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    payment_date: Optional[datetime] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    paid_at: Optional[datetime] = None
    
    # Service dates
    service_start_date: Optional[datetime] = None
    service_end_date: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Additional
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class OrderSummary(BaseModel):
    total_orders: int
    pending_orders: int
    completed_orders: int
    cancelled_orders: int
    total_revenue: Decimal
    monthly_revenue: Decimal


class OrderWithPlan(Order):
    plan_name: str
    plan_type: str
    user_email: str
    user: Optional[Dict[str, Any]] = None
    payment_metadata: Optional[Dict[str, Any]] = None  # From PaymentTransaction table


# -------------------- PLAN SCHEMA --------------------

class PlanResponse(BaseModel):
    id: int
    name: str
    price: Decimal

    class Config:
        from_attributes = True


# -------------------- INVOICE SCHEMA --------------------

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    order_id: int
    user_id: int
    amount: Decimal = Field(alias='total_amount')
    status: str
    issued_date: datetime = Field(alias='invoice_date')
    due_date: Optional[datetime] = None
    paid_date: Optional[datetime] = None
    payment_method: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        populate_by_name = True


# -------------------- COMBINED RESPONSE --------------------

class OrderWithInvoiceResponse(BaseModel):
    order: Order
    invoice: InvoiceResponse

    class Config:
        from_attributes = True


# -------------------- ✅ ORDER COMPLETE RESPONSE --------------------

class OrderCompleteResponse(BaseModel):
    order_id: int
    status: str
    message: str

    class Config:
        from_attributes = True

