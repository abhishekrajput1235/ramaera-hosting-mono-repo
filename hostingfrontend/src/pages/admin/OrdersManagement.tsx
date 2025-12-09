import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Filter, RefreshCw, Eye } from 'lucide-react';
import api from '../../lib/api';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';

interface OrderData {
  id: number;
  user_id: number;
  plan_id: number;
  order_number: string;
  order_status: string;
  payment_status: string;
  billing_cycle: string;

  // Financial
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  grand_total: number;
  currency: string;
  promo_code?: string;

  // Plan details (from OrderWithPlan)
  plan_name: string;
  plan_type: string;

  // Server configuration
  server_details?: {
    cpu?: string;
    ram?: string;
    storage?: string;
    bandwidth?: string;
    os?: string;
    [key: string]: any; // Allow additional properties
  };

  // Dates
  created_at: string;
  paid_at: string | null;
  service_start_date?: string;
  service_end_date?: string;
  completed_at?: string;
  updated_at?: string;

  // Payment
  payment_method: string | null;
  payment_reference?: string;
  payment_date?: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;

  // Additional
  notes?: string;
  user_email: string;
  user?: {
    email: string;
    full_name: string;
  };
}

export function OrdersManagement() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/orders/admin?limit=1000');
      setOrders(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-500/15 text-amber-200 border border-amber-500/40',
      active: 'bg-blue-500/15 text-blue-200 border border-blue-500/40',
      completed: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/40',
      cancelled: 'bg-rose-500/15 text-rose-200 border border-rose-500/40',
      expired: 'bg-slate-600/20 text-slate-200 border border-slate-600/40',
    };
    return styles[status] || 'bg-slate-600/20 text-slate-200 border border-slate-600/40';
  };

  const getPaymentBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-500/15 text-amber-200 border border-amber-500/40',
      paid: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/40',
      failed: 'bg-rose-500/15 text-rose-200 border border-rose-500/40',
      refunded: 'bg-purple-500/15 text-purple-200 border border-purple-500/40',
    };
    return styles[status] || 'bg-slate-600/20 text-slate-200 border border-slate-600/40';
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.user?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const totalRevenue = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + (o.grand_total || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Orders Management"
        description="Track every subscription, invoice, and payment confirmation in real time."
        actions={
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 hover:bg-slate-900/70 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        }
      />

      {/* Filters */}
      <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-900 shadow-[0_15px_45px_rgba(2,6,23,0.7)]">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by order number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 text-white border border-slate-800 rounded-xl focus:ring-2 focus:ring-cyan-500 placeholder-slate-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-slate-500 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-slate-900 text-white border border-slate-800 rounded-xl focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-4 py-2 bg-slate-900 text-white border border-slate-800 rounded-xl focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-900">
          <p className="text-sm text-slate-400">Total Orders</p>
          <p className="text-2xl font-bold text-white">{orders.length}</p>
        </div>
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-900">
          <p className="text-sm text-slate-400">Completed</p>
          <p className="text-2xl font-bold text-emerald-400">
            {orders.filter(o => o.order_status === 'completed').length}
          </p>
        </div>
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-900">
          <p className="text-sm text-slate-400">Pending</p>
          <p className="text-2xl font-bold text-amber-400">
            {orders.filter(o => o.order_status === 'pending').length}
          </p>
        </div>
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-900">
          <p className="text-sm text-slate-400">Total Revenue</p>
          <p className="text-2xl font-bold text-cyan-300">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-950/60 rounded-2xl border border-slate-900 overflow-hidden shadow-[0_15px_45px_rgba(2,6,23,0.7)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-900 text-slate-200">
            <thead className="bg-slate-950/70">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Service Period</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-900/60 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <ShoppingCart className="w-5 h-5 text-slate-500 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-white">{order.order_number}</div>
                        <div className="text-xs text-slate-400">{order.billing_cycle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{order.user?.full_name || order.user_email || 'N/A'}</div>
                    <div className="text-sm text-slate-400">{order.user?.email || order.user_email || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{order.plan_name}</div>
                    <div className="text-xs text-slate-400 capitalize">{order.plan_type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.service_start_date && order.service_end_date ? (
                      <div className="text-xs text-slate-400">
                        <div>{new Date(order.service_start_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        <div className="text-slate-500">to</div>
                        <div>{new Date(order.service_end_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Not set</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-cyan-200">{formatCurrency(order.grand_total)}</div>
                    {order.discount_amount > 0 && (
                      <div className="text-xs text-emerald-400">-{formatCurrency(order.discount_amount)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.order_status)}`}>
                      {order.order_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPaymentBadge(order.payment_status)}`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowDetails(true);
                      }}
                      className="p-1 text-cyan-300 hover:bg-cyan-500/10 rounded"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No orders found</p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-950 rounded-2xl border border-slate-900 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-[0_30px_80px_rgba(0,0,0,0.75)]">
            <div className="p-6 text-white space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Order Details</h2>
                <button onClick={() => setShowDetails(false)} className="text-slate-500 hover:text-white text-2xl">&times;</button>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs uppercase text-slate-500">Order Number</p>
                  <p className="font-semibold">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">Status</p>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(selectedOrder.order_status)}`}>
                    {selectedOrder.order_status}
                  </span>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">Payment Status</p>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentBadge(selectedOrder.payment_status)}`}>
                    {selectedOrder.payment_status}
                  </span>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">Payment Method</p>
                  <p className="font-semibold capitalize">{selectedOrder.payment_method || 'N/A'}</p>
                </div>
              </div>

              {/* Plan Details */}
              <div className="border-t border-slate-900 pt-4">
                <h3 className="font-semibold mb-3 text-cyan-400">Plan Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Plan Name</p>
                    <p className="font-medium">{selectedOrder.plan_name}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Plan Type</p>
                    <p className="font-medium capitalize">{selectedOrder.plan_type}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Billing Cycle</p>
                    <p className="font-medium capitalize">{selectedOrder.billing_cycle}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Currency</p>
                    <p className="font-medium">{selectedOrder.currency}</p>
                  </div>
                </div>

                {selectedOrder.service_start_date && selectedOrder.service_end_date && (
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div>
                      <p className="text-slate-500">Service Start</p>
                      <p className="font-medium">{formatDate(selectedOrder.service_start_date)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Service End</p>
                      <p className="font-medium">{formatDate(selectedOrder.service_end_date)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Server Configuration */}
              {selectedOrder.server_details && Object.keys(selectedOrder.server_details).length > 0 && (
                <div className="border-t border-slate-900 pt-4">
                  <h3 className="font-semibold mb-3 text-cyan-400">Server Configuration</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {selectedOrder.server_details.cpu && (
                      <div>
                        <p className="text-slate-500">CPU</p>
                        <p className="font-medium">{selectedOrder.server_details.cpu}</p>
                      </div>
                    )}
                    {selectedOrder.server_details.ram && (
                      <div>
                        <p className="text-slate-500">RAM</p>
                        <p className="font-medium">{selectedOrder.server_details.ram}</p>
                      </div>
                    )}
                    {selectedOrder.server_details.storage && (
                      <div>
                        <p className="text-slate-500">Storage</p>
                        <p className="font-medium">{selectedOrder.server_details.storage}</p>
                      </div>
                    )}
                    {selectedOrder.server_details.bandwidth && (
                      <div>
                        <p className="text-slate-500">Bandwidth</p>
                        <p className="font-medium">{selectedOrder.server_details.bandwidth}</p>
                      </div>
                    )}
                    {selectedOrder.server_details.os && (
                      <div>
                        <p className="text-slate-500">Operating System</p>
                        <p className="font-medium">{selectedOrder.server_details.os}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Amount Breakdown */}
              <div className="border-t border-slate-900 pt-4">
                <h3 className="font-semibold mb-3 text-cyan-400">Financial Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedOrder.total_amount)}</span>
                  </div>
                  {selectedOrder.promo_code && (
                    <div className="flex justify-between text-purple-400">
                      <span>Promo Code ({selectedOrder.promo_code})</span>
                      <span>Applied</span>
                    </div>
                  )}
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedOrder.discount_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{formatCurrency(selectedOrder.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-slate-900 pt-2 text-lg">
                    <span>Grand Total</span>
                    <span className="text-cyan-300">{formatCurrency(selectedOrder.grand_total)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="border-t border-slate-900 pt-4">
                <h3 className="font-semibold mb-3 text-cyan-400">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {selectedOrder.razorpay_order_id && (
                    <div>
                      <p className="text-slate-500">Razorpay Order ID</p>
                      <p className="font-medium text-xs break-all">{selectedOrder.razorpay_order_id}</p>
                    </div>
                  )}
                  {selectedOrder.razorpay_payment_id && (
                    <div>
                      <p className="text-slate-500">Razorpay Payment ID</p>
                      <p className="font-medium text-xs break-all">{selectedOrder.razorpay_payment_id}</p>
                    </div>
                  )}
                  {selectedOrder.payment_reference && (
                    <div>
                      <p className="text-slate-500">Payment Reference</p>
                      <p className="font-medium text-xs break-all">{selectedOrder.payment_reference}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="border-t border-slate-900 pt-4">
                <h3 className="font-semibold mb-3 text-cyan-400">Timeline</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Order Created</span>
                    <span className="font-medium">{formatDate(selectedOrder.created_at)}</span>
                  </div>
                  {selectedOrder.paid_at && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Payment Completed</span>
                      <span className="font-medium text-emerald-400">{formatDate(selectedOrder.paid_at)}</span>
                    </div>
                  )}
                  {selectedOrder.completed_at && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Order Completed</span>
                      <span className="font-medium text-green-400">{formatDate(selectedOrder.completed_at)}</span>
                    </div>
                  )}
                  {selectedOrder.updated_at && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Last Updated</span>
                      <span className="font-medium">{formatDate(selectedOrder.updated_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Info */}
              <div className="border-t border-slate-900 pt-4">
                <h3 className="font-semibold mb-3 text-cyan-400">Customer</h3>
                <p className="font-medium">{selectedOrder.user?.full_name || selectedOrder.user_email || 'N/A'}</p>
                <p className="text-sm text-slate-400">{selectedOrder.user?.email || selectedOrder.user_email || 'N/A'}</p>
              </div>

              {/* Admin Notes */}
              {selectedOrder.notes && (
                <div className="border-t border-slate-900 pt-4">
                  <h3 className="font-semibold mb-3 text-cyan-400">Admin Notes</h3>
                  <p className="text-sm text-slate-300">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end pt-4 border-t border-slate-900">
                <button onClick={() => setShowDetails(false)} className="px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-900 text-slate-300">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
