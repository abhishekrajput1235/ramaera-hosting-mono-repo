import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, RefreshCw, DollarSign, CreditCard } from 'lucide-react';
import api from '../../lib/api';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Pagination } from '../../components/common/Pagination';

interface AffiliateData {
  id: number;
  user_id: number;
  referral_code: string;
  status: string;
  is_active: boolean;
  total_referrals: number;
  total_commission: number;
  available_balance: number;
  created_at: string;
  user?: {
    email: string;
    full_name: string;
  };
}

interface PayoutData {
  id: number;
  affiliate_user_id: number;
  payout_type?: string;
  earning_id?: number;
  amount: number;
  gross_amount?: number;
  tds_amount?: number;
  net_amount?: number;
  financial_year?: string;
  status: string;
  payment_method: string;
  payment_details?: string;
  notes?: string;
  admin_notes?: string;
  rejection_reason?: string;
  transaction_id?: string;
  requested_at: string;
  processed_at: string | null;
  user?: {
    email: string;
    full_name: string;
  };
}

interface EarningData {
  id: number;
  affiliate_user_id: number;
  affiliate_email: string;
  affiliate_name: string;
  referred_user_id: number;
  referred_email: string;
  referred_name: string;
  order_id: number;
  level: number;
  order_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  earned_at: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export function ReferralManagement() {
  // Data State
  const [affiliates, setAffiliates] = useState<AffiliateData[]>([]);
  const [payouts, setPayouts] = useState<PayoutData[]>([]);
  const [historyPayouts, setHistoryPayouts] = useState<PayoutData[]>([]);
  const [pendingEarnings, setPendingEarnings] = useState<EarningData[]>([]);

  // Pagination State
  const [affiliatesPage, setAffiliatesPage] = useState(1);
  const [affiliatesTotal, setAffiliatesTotal] = useState(0);
  const [earningsPage, setEarningsPage] = useState(1);
  const [earningsTotal, setEarningsTotal] = useState(0);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [payoutsTotal, setPayoutsTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  const ITEMS_PER_PAGE = 10;

  const [selectedEarnings, setSelectedEarnings] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'affiliates' | 'commissions' | 'payouts' | 'history'>('affiliates');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Fetch functions
  const fetchAffiliates = useCallback(async (page: number) => {
    try {
      const skip = (page - 1) * ITEMS_PER_PAGE;
      const res = await api.get<PaginatedResponse<AffiliateData>>(`/api/v1/affiliate/admin/affiliates?skip=${skip}&limit=${ITEMS_PER_PAGE}`);
      // Handle both old (array) and new (paginated) response formats temporarily if needed, 
      // but we expect new format now.
      if (res.items) {
        setAffiliates(res.items);
        setAffiliatesTotal(res.total);
      } else if (Array.isArray(res)) {
        // Fallback for safety
        setAffiliates(res);
        setAffiliatesTotal(res.length);
      }
    } catch (err) {
      console.error('Error fetching affiliates:', err);
    }
  }, []);

  const fetchEarnings = useCallback(async (page: number) => {
    try {
      const skip = (page - 1) * ITEMS_PER_PAGE;
      console.log('Fetching pending earnings:', { skip, limit: ITEMS_PER_PAGE });
      const res = await api.get<PaginatedResponse<EarningData>>(`/api/v1/affiliate/admin/earnings/pending?skip=${skip}&limit=${ITEMS_PER_PAGE}`);
      console.log('Pending earnings response:', res);
      if (res.items) {
        setPendingEarnings(res.items);
        setEarningsTotal(res.total);
      } else if (Array.isArray(res)) {
        setPendingEarnings(res);
        setEarningsTotal(res.length);
      }
    } catch (err) {
      console.error('!!! ERROR fetching pending earnings !!!', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
      alert('Failed to fetch pending commissions. Check console for details.');
    }
  }, []);

  const fetchPayouts = useCallback(async (page: number) => {
    try {
      const skip = (page - 1) * ITEMS_PER_PAGE;
      const res = await api.get<PaginatedResponse<PayoutData>>(`/api/v1/affiliate/admin/payouts/pending?skip=${skip}&limit=${ITEMS_PER_PAGE}`);
      if (res.items) {
        setPayouts(res.items);
        setPayoutsTotal(res.total);
      } else if (Array.isArray(res)) {
        setPayouts(res);
        setPayoutsTotal(res.length);
      }
    } catch (err) {
      console.error('Error fetching payouts:', err);
    }
  }, []);

  const fetchHistory = useCallback(async (page: number) => {
    try {
      const skip = (page - 1) * ITEMS_PER_PAGE;
      const res = await api.get<PaginatedResponse<PayoutData>>(`/api/v1/affiliate/admin/payouts/history?skip=${skip}&limit=${ITEMS_PER_PAGE}`);
      if (res.items) {
        setHistoryPayouts(res.items);
        setHistoryTotal(res.total);
      } else if (Array.isArray(res)) {
        setHistoryPayouts(res);
        setHistoryTotal(res.length);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchAffiliates(affiliatesPage),
      fetchEarnings(earningsPage),
      fetchPayouts(payoutsPage),
      fetchHistory(historyPage)
    ]);
    setLoading(false);
  }, [affiliatesPage, earningsPage, payoutsPage, historyPage, fetchAffiliates, fetchEarnings, fetchPayouts, fetchHistory]);

  useEffect(() => {
    fetchAllData();
  }, []); // Initial load

  // Effect to refetch when tab changes or page changes for that tab
  useEffect(() => {
    if (activeTab === 'affiliates') fetchAffiliates(affiliatesPage);
    if (activeTab === 'commissions') fetchEarnings(earningsPage);
    if (activeTab === 'payouts') fetchPayouts(payoutsPage);
    if (activeTab === 'history') fetchHistory(historyPage);
  }, [activeTab, affiliatesPage, earningsPage, payoutsPage, historyPage, fetchAffiliates, fetchEarnings, fetchPayouts, fetchHistory]);


  const handlePayoutAction = async (payoutId: number, action: 'approve' | 'reject' | 'complete') => {
    try {
      const payload = {
        action,
        admin_notes: `${action}d by admin`
      };
      await api.post(`/api/v1/affiliate/admin/payouts/${payoutId}/process`, payload);
      await fetchPayouts(payoutsPage);
      alert(`Payout ${action}d successfully`);
    } catch (error) {
      console.error('Error processing payout:', error);
      alert(`Failed to ${action} payout`);
    }
  };

  const handleApproveEarning = async (earningId: number) => {
    try {
      await api.post(`/api/v1/affiliate/admin/earnings/${earningId}/approve`);
      alert('Commission approved successfully!');
      await fetchEarnings(earningsPage);
    } catch (error) {
      console.error('Error approving earning:', error);
      alert('Failed to approve commission');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedEarnings.length === 0) {
      alert('Please select commissions to approve');
      return;
    }

    try {
      await api.post('/api/v1/affiliate/admin/earnings/bulk-approve', selectedEarnings);
      alert(`Successfully approved ${selectedEarnings.length} commission(s)!`);
      setSelectedEarnings([]);
      await fetchEarnings(earningsPage);
    } catch (error) {
      console.error('Error bulk approving:', error);
      alert('Failed to bulk approve commissions');
    }
  };

  const toggleEarningSelection = (earningId: number) => {
    setSelectedEarnings(prev =>
      prev.includes(earningId)
        ? prev.filter(id => id !== earningId)
        : [...prev, earningId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedEarnings.length === pendingEarnings.length) {
      setSelectedEarnings([]);
    } else {
      setSelectedEarnings(pendingEarnings.map(e => e.id));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const parseBankDetails = (payment_details?: string) => {
    try {
      if (!payment_details) return null;
      return JSON.parse(payment_details);
    } catch {
      return null;
    }
  };

  const filteredAffiliates = affiliates.filter(aff =>
    aff.referral_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (aff.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (aff.user?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );


  // Toggle expanded row state
  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  if (loading && affiliates.length === 0 && payouts.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Referral Management"
        description="Track affiliate performance, approve payouts, and keep partners engaged."
        actions={
          <button
            onClick={fetchAllData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-950/60 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        }
      />


      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-950/60 p-4 rounded-lg shadow-md border border-slate-900">
          <p className="text-sm text-slate-400">Total Affiliates</p>
          <p className="text-2xl font-bold text-white">{affiliatesTotal}</p>
        </div>
        <div className="bg-slate-950/60 p-4 rounded-lg shadow-md border border-slate-900">
          <p className="text-sm text-slate-400">Pending Commissions</p>
          <p className="text-2xl font-bold text-blue-600">{earningsTotal}</p>
        </div>
        <div className="bg-slate-950/60 p-4 rounded-lg shadow-md border border-slate-900">
          <p className="text-sm text-slate-400">Pending Payouts</p>
          <p className="text-2xl font-bold text-orange-600">{payoutsTotal}</p>
        </div>
        <div className="bg-slate-950/60 p-4 rounded-lg shadow-md border border-slate-900">
          <p className="text-sm text-slate-400">Payout History</p>
          <p className="text-2xl font-bold text-green-600">{historyTotal}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-950/60 rounded-lg shadow-md border border-slate-900">
        <div className="border-b border-slate-900">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('affiliates')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'affiliates'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              Affiliates ({affiliatesTotal})
            </button>
            <button
              onClick={() => setActiveTab('commissions')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'commissions'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              Pending Commissions ({earningsTotal})
            </button>
            <button
              onClick={() => setActiveTab('payouts')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'payouts'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              Pending Payouts ({payoutsTotal})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'history'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              History ({historyTotal})
            </button>
          </div>
        </div>

        <div className="p-4">
          {activeTab === 'affiliates' && (
            <>
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search affiliates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-800 rounded-lg bg-slate-950/60"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-slate-950/70">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Affiliate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Referrals</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Commission</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-950/60 divide-y divide-gray-200">
                    {filteredAffiliates.map((affiliate) => (
                      <tr key={affiliate.id} className="hover:bg-slate-950/70">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{affiliate.user?.full_name || 'User'}</div>
                          <div className="text-sm text-slate-500">{affiliate.user?.email || 'example@gmail.com'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-mono text-sm">
                            {affiliate.referral_code}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{affiliate.total_referrals || 0}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(affiliate.total_commission)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-blue-600">
                            {formatCurrency(affiliate.available_balance)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${affiliate.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {affiliate.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {formatDate(affiliate.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredAffiliates.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No affiliates found</p>
                </div>
              )}

              <Pagination
                currentPage={affiliatesPage}
                totalPages={Math.ceil(affiliatesTotal / ITEMS_PER_PAGE)}
                onPageChange={setAffiliatesPage}
                totalItems={affiliatesTotal}
                itemsPerPage={ITEMS_PER_PAGE}
                className="mt-4"
              />
            </>
          )}

          {activeTab === 'commissions' && (
            <div>
              {selectedEarnings.length > 0 && (
                <div className="mb-4 flex justify-between items-center bg-blue-950/30 border border-blue-500/30 rounded-lg p-4">
                  <span className="text-white font-medium">
                    {selectedEarnings.length} commission(s) selected
                  </span>
                  <button
                    onClick={handleBulkApprove}
                    className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
                  >
                    Approve Selected ({selectedEarnings.length})
                  </button>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-slate-950/70">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedEarnings.length === pendingEarnings.length && pendingEarnings.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Affiliate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Referred User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Order</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Order Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Commission</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Earned</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-950/60 divide-y divide-gray-200">
                    {pendingEarnings.map((earning) => (
                      <tr key={earning.id} className="hover:bg-slate-950/70">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedEarnings.includes(earning.id)}
                            onChange={() => toggleEarningSelection(earning.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{earning.affiliate_name || 'N/A'}</div>
                          <div className="text-sm text-slate-500">{earning.affiliate_email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{earning.referred_name || 'N/A'}</div>
                          <div className="text-sm text-slate-500">{earning.referred_email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          #{earning.order_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${earning.level === 1 ? 'bg-green-100 text-green-800' :
                            earning.level === 2 ? 'bg-blue-100 text-blue-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                            L{earning.level}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {formatCurrency(earning.order_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(earning.commission_amount)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {earning.commission_rate}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {formatDate(earning.earned_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleApproveEarning(earning.id)}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition"
                          >
                            Approve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {pendingEarnings.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No pending commissions to approve</p>
                  </div>
                )}
              </div>

              <Pagination
                currentPage={earningsPage}
                totalPages={Math.ceil(earningsTotal / ITEMS_PER_PAGE)}
                onPageChange={setEarningsPage}
                totalItems={earningsTotal}
                itemsPerPage={ITEMS_PER_PAGE}
                className="mt-4"
              />
            </div>
          )}

          {activeTab === 'payouts' && (
            <div className="space-y-4">
              {payouts.map((payout) => {
                const bankDetails = parseBankDetails(payout.payment_details);
                return (
                  <div key={payout.id} className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 hover:bg-slate-900/70 transition">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* User Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-cyan-400" />
                          <h3 className="text-sm font-semibold text-slate-400">User Details</h3>
                        </div>
                        <div className="text-base font-medium text-white">{payout.user?.full_name || 'N/A'}</div>
                        <div className="text-sm text-slate-500">{payout.user?.email || 'N/A'}</div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${(payout.status === 'PENDING' || payout.status === 'pending') ? 'bg-yellow-100 text-yellow-800' :
                            (payout.status === 'PROCESSING' || payout.status === 'processing') ? 'bg-blue-100 text-blue-800' :
                              (payout.status === 'COMPLETED' || payout.status === 'completed') ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                            {payout.status}
                          </span>
                          {payout.payout_type && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {payout.payout_type === 'individual' ? 'Individual Earning' : 'Total Balance'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amount & Payment Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-4 h-4 text-green-400" />
                          <h3 className="text-sm font-semibold text-slate-400">Payout Information</h3>
                        </div>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(payout.amount)}</div>
                        <div className="text-sm text-slate-500 mt-1">Method: {payout.payment_method}</div>
                        <div className="text-xs text-slate-600 mt-1">Requested: {formatDate(payout.requested_at)}</div>
                        {payout.notes && (
                          <div className="text-xs text-slate-500 mt-2 italic">"{payout.notes}"</div>
                        )}
                      </div>

                      {/* Bank Details */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="w-4 h-4 text-blue-400" />
                          <h3 className="text-sm font-semibold text-slate-400">Bank Account Details</h3>
                        </div>
                        {bankDetails ? (
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Account Holder:</span>
                              <span className="text-white font-medium">{bankDetails.account_holder || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Account Number:</span>
                              <span className="text-white font-mono">{bankDetails.account_number || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">IFSC Code:</span>
                              <span className="text-white font-mono">{bankDetails.ifsc_code || bankDetails.ifsc || 'N/A'}</span>
                            </div>
                            {bankDetails.upi_id && (
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500">UPI ID:</span>
                                <span className="text-white font-mono">{bankDetails.upi_id}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500">No bank details provided</div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-4 border-t border-slate-800 flex gap-2 justify-end">
                      {(payout.status === 'PENDING' || payout.status === 'pending') && (
                        <>
                          <button
                            onClick={() => handlePayoutAction(payout.id, 'reject')}
                            className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handlePayoutAction(payout.id, 'approve')}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
                          >
                            Approve & Process
                          </button>
                        </>
                      )}

                      {(payout.status === 'PROCESSING' || payout.status === 'processing') && (
                        <>
                          <button
                            onClick={() => handlePayoutAction(payout.id, 'reject')}
                            className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handlePayoutAction(payout.id, 'complete')}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition"
                          >
                            Mark as Paid
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {payouts.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No pending payouts</p>
                </div>
              )}

              <Pagination
                currentPage={payoutsPage}
                totalPages={Math.ceil(payoutsTotal / ITEMS_PER_PAGE)}
                onPageChange={setPayoutsPage}
                totalItems={payoutsTotal}
                itemsPerPage={ITEMS_PER_PAGE}
                className="mt-4"
              />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-slate-950/70">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Gross / TDS / Net</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-950/60 divide-y divide-gray-200">
                  {historyPayouts.map((payout) => {
                    const paymentDetails = payout.payment_details ? JSON.parse(payout.payment_details) : null;
                    const isExpanded = expandedRows.has(payout.id);

                    return (
                      <React.Fragment key={payout.id}>
                        <tr className="hover:bg-slate-950/70">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">{payout.user?.full_name || 'N/A'}</div>
                            <div className="text-sm text-slate-500">{payout.user?.email || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {payout.payout_type === 'individual' ? 'Individual' : 'Total'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs space-y-1">
                              <div className="text-slate-400">
                                Gross: <span className="text-white font-semibold">{formatCurrency(payout.gross_amount || payout.amount)}</span>
                              </div>
                              <div className="text-orange-400">
                                TDS: <span className="font-semibold">-{formatCurrency(payout.tds_amount || 0)}</span>
                              </div>
                              <div className="text-emerald-400 font-bold">
                                Net: {formatCurrency(payout.net_amount || payout.amount)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${(payout.status === 'COMPLETED' || payout.status === 'completed') ? 'bg-green-100 text-green-800' :
                              (payout.status === 'FAILED' || payout.status === 'failed') ? 'bg-red-100 text-red-800' :
                                (payout.status === 'CANCELLED' || payout.status === 'cancelled') ? 'bg-gray-100 text-gray-800' :
                                  'bg-slate-100 text-slate-800'
                              }`}>
                              {payout.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs">
                            <div className="space-y-1">
                              <div className="text-slate-400">
                                Req: <span className="text-white">{formatDate(payout.requested_at)}</span>
                              </div>
                              <div className="text-slate-400">
                                Proc: <span className="text-white">{payout.processed_at ? formatDate(payout.processed_at) : 'N/A'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => toggleRow(payout.id)}
                              className="text-cyan-400 hover:text-cyan-300 font-medium"
                            >
                              {isExpanded ? '▼ Hide' : '▶ Show'}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-slate-900">
                            <td colSpan={6} className="px-6 py-4">
                              <div className="grid grid-cols-2 gap-6">
                                {/* Payment Details */}
                                <div>
                                  <h4 className="text-sm font-semibold text-cyan-400 mb-3">Payment Details</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Payment Method:</span>
                                      <span className="text-white capitalize">{payout.payment_method?.replace('_', ' ')}</span>
                                    </div>
                                    {paymentDetails && (
                                      <>
                                        <div className="flex justify-between">
                                          <span className="text-slate-400">Account Holder:</span>
                                          <span className="text-white font-medium">{paymentDetails.account_holder || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-400">Account Number:</span>
                                          <span className="text-white font-mono">{paymentDetails.account_number || 'N/A'}</span>
                                        </div>
                                        {paymentDetails.ifsc_code && (
                                          <div className="flex justify-between">
                                            <span className="text-slate-400">IFSC Code:</span>
                                            <span className="text-white font-mono">{paymentDetails.ifsc_code}</span>
                                          </div>
                                        )}
                                      </>
                                    )}
                                    {payout.transaction_id && (
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">Transaction ID:</span>
                                        <span className="text-green-400 font-mono text-xs">{payout.transaction_id}</span>
                                      </div>
                                    )}
                                    {payout.financial_year && (
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">Financial Year:</span>
                                        <span className="text-white">{payout.financial_year}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Notes & Admin Info */}
                                <div>
                                  <h4 className="text-sm font-semibold text-cyan-400 mb-3">Notes & Info</h4>
                                  <div className="space-y-2 text-sm">
                                    {payout.notes && (
                                      <div>
                                        <span className="text-slate-400 block mb-1">User Notes:</span>
                                        <span className="text-white text-xs">{payout.notes}</span>
                                      </div>
                                    )}
                                    {payout.admin_notes && (
                                      <div>
                                        <span className="text-slate-400 block mb-1">Admin Notes:</span>
                                        <span className="text-white text-xs">{payout.admin_notes}</span>
                                      </div>
                                    )}
                                    {payout.rejection_reason && (
                                      <div>
                                        <span className="text-red-400 block mb-1">Rejection Reason:</span>
                                        <span className="text-red-300 text-xs">{payout.rejection_reason}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>

              {historyPayouts.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No payout history</p>
                </div>
              )}

              <Pagination
                currentPage={historyPage}
                totalPages={Math.ceil(historyTotal / ITEMS_PER_PAGE)}
                onPageChange={setHistoryPage}
                totalItems={historyTotal}
                itemsPerPage={ITEMS_PER_PAGE}
                className="mt-4"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
