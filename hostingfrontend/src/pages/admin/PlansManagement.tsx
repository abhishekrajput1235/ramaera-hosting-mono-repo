import { useState, useEffect } from 'react';
import { Package, Search, RefreshCw, Plus, Edit, Trash2, Eye } from 'lucide-react';
import api from '../../lib/api';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';

interface PlanData {
  id: number;
  name: string;
  slug: string;
  description: string;
  plan_type: string;  // vps, shared, dedicated, etc.
  vcpu: number;
  ram_gb: number;
  storage_gb: number;
  bandwidth_gb: number;
  base_price: number;
  monthly_price: number;
  quarterly_price: number;
  semiannual_price: number | null;
  annual_price: number;
  biennial_price: number;
  triennial_price: number;
  is_active: boolean;
  is_featured: boolean;
  features: string[];
  created_at: string;
}

export function PlansManagement() {
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    plan_type: 'vps',
    vcpu: 1,
    ram_gb: 1,
    storage_gb: 20,
    bandwidth_gb: 1000,
    base_price: 0,
    monthly_price: 0,
    quarterly_price: 0,
    semiannual_price: 0,
    annual_price: 0,
    biennial_price: 0,
    triennial_price: 0,
    is_active: true,
    is_featured: false,
    features: '',
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await api.request('/api/v1/plans', { method: 'GET' });
      setPlans(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const planData = {
        ...formData,
        features: formData.features.split('\n').filter(f => f.trim()),
      };

      if (editingPlan) {
        await api.request(`/api/v1/admin/plans/${editingPlan.id}`, {
          method: 'PUT',
          body: JSON.stringify(planData),
        });
      } else {
        await api.request('/api/v1/admin/plans', {
          method: 'POST',
          body: JSON.stringify(planData),
        });
      }
      await fetchPlans();
      setShowAddModal(false);
      setEditingPlan(null);
      resetForm();
      alert(editingPlan ? 'Plan updated successfully' : 'Plan created successfully');
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Failed to save plan');
    }
  };

  const handleDelete = async (planId: number) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      await api.request(`/api/v1/admin/plans/${planId}`, { method: 'DELETE' });
      await fetchPlans();
      alert('Plan deleted successfully');
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Failed to delete plan');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      plan_type: 'vps',
      vcpu: 1,
      ram_gb: 1,
      storage_gb: 20,
      bandwidth_gb: 1000,
      base_price: 0,
      monthly_price: 0,
      quarterly_price: 0,
      semiannual_price: 0,
      annual_price: 0,
      biennial_price: 0,
      triennial_price: 0,
      is_active: true,
      is_featured: false,
      features: '',
    });
  };

  // Helper to calculate pricing from base price (returns total price for each billing cycle)
  const calculatePricing = (base: number) => {
    // Ensure base is a valid number
    const safeBase = isNaN(base) || base < 0 ? 0 : base;
    return {
      monthly_price: Math.round(safeBase),
      quarterly_price: Math.round(safeBase * 3 * 0.95),     // 3 months with 5% off
      semiannual_price: Math.round(safeBase * 6 * 0.92),    // 6 months with 8% off
      annual_price: Math.round(safeBase * 12 * 0.90),       // 12 months with 10% off
      biennial_price: Math.round(safeBase * 24 * 0.85),     // 24 months with 15% off
      triennial_price: Math.round(safeBase * 36 * 0.80),    // 36 months with 20% off
    };
  };

  // Handle base price change with auto-calculation
  const handleBasePriceChange = (value: number) => {
    const safeValue = isNaN(value) ? 0 : value;
    const pricing = calculatePricing(safeValue);
    setFormData(prev => ({
      ...prev,
      base_price: safeValue,
      ...pricing,
    }));
  };

  const openEditModal = (plan: PlanData) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      plan_type: plan.plan_type || 'vps',
      vcpu: plan.vcpu,
      ram_gb: plan.ram_gb,
      storage_gb: plan.storage_gb,
      bandwidth_gb: plan.bandwidth_gb,
      base_price: plan.base_price,
      monthly_price: plan.monthly_price || plan.base_price,
      quarterly_price: plan.quarterly_price || plan.base_price * 3 * 0.95,
      semiannual_price: plan.semiannual_price || plan.base_price * 6 * 0.92,
      annual_price: plan.annual_price || plan.base_price * 12 * 0.90,
      biennial_price: plan.biennial_price || plan.base_price * 24 * 0.85,
      triennial_price: plan.triennial_price || plan.base_price * 36 * 0.80,
      is_active: plan.is_active,
      is_featured: plan.is_featured || false,
      features: (plan.features || []).join('\n'),
    });
    setShowAddModal(true);
  };

  const filteredPlans = plans.filter(plan =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

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
        title="Plans Management"
        description="Control every hosting package, pricing tier, and feature bundle before it reaches customers."
        actions={
          <>
            <button
              onClick={fetchPlans}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 hover:bg-slate-900/70 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => { resetForm(); setEditingPlan(null); setShowAddModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-400 hover:to-blue-400 transition shadow-lg shadow-cyan-500/30"
            >
              <Plus className="w-4 h-4" />
              Add Plan
            </button>
          </>
        }
      />

      {/* Search */}
      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-900 shadow-[0_15px_45px_rgba(2,6,23,0.7)]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search plans..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 text-white border border-slate-800 rounded-xl focus:ring-2 focus:ring-cyan-500 placeholder-slate-500"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-900">
          <p className="text-sm text-slate-400">Total Plans</p>
          <p className="text-2xl font-bold text-white">{plans.length}</p>
        </div>
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-900">
          <p className="text-sm text-slate-400">Active Plans</p>
          <p className="text-2xl font-bold text-emerald-400">{plans.filter(p => p.is_active).length}</p>
        </div>
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-900">
          <p className="text-sm text-slate-400">Avg Price</p>
          <p className="text-2xl font-bold text-cyan-300">
            {formatCurrency(plans.length ? plans.reduce((s, p) => s + p.base_price, 0) / plans.length : 0)}
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map((plan) => (
          <div key={plan.id} className="bg-slate-950/60 rounded-2xl border border-slate-900 overflow-hidden shadow-[0_12px_35px_rgba(2,6,23,0.7)]">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-sm text-slate-500">{plan.slug}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${plan.is_active ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-slate-400 text-sm">{plan.description || 'No description'}</p>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>vCPU</span>
                  <span className="font-semibold text-white">{plan.vcpu} cores</span>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>RAM</span>
                  <span className="font-semibold text-white">{plan.ram_gb} GB</span>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Storage</span>
                  <span className="font-semibold text-white">{plan.storage_gb} GB SSD</span>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Bandwidth</span>
                  <span className="font-semibold text-white">{plan.bandwidth_gb} GB</span>
                </div>
              </div>

              <div className="border-t border-slate-900 pt-4">
                <p className="text-2xl font-bold text-cyan-300">{formatCurrency(plan.base_price)}</p>
                <p className="text-xs text-slate-500">per month</p>
              </div>
            </div>

            <div className="bg-slate-900/70 px-6 py-3 flex justify-end gap-2 border-t border-slate-900">
              <button
                onClick={() => openEditModal(plan)}
                className="p-2 text-cyan-300 hover:bg-cyan-500/10 rounded"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(plan.id)}
                className="p-2 text-rose-400 hover:bg-rose-500/10 rounded"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredPlans.length === 0 && (
        <div className="text-center py-12 text-slate-400 bg-slate-950/60 rounded-2xl border border-slate-900 shadow-[0_12px_35px_rgba(2,6,23,0.7)]">
          <Package className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p>No plans found</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-950 rounded-2xl border border-slate-900 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_25px_70px_rgba(0,0,0,0.7)]">
            <div className="p-6 space-y-4">
              <h2 className="text-2xl font-bold text-white">{editingPlan ? 'Edit Plan' : 'Add New Plan'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4 text-white">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Slug</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Plan Type</label>
                  <select
                    value={formData.plan_type}
                    onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:ring-2 focus:ring-cyan-500"
                    required
                  >
                    <option value="vps">VPS - Virtual Private Server</option>
                    <option value="shared">Shared Hosting</option>
                    <option value="dedicated">Dedicated Server</option>
                    <option value="cloud">Cloud Hosting</option>
                    <option value="reseller">Reseller Hosting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:ring-2 focus:ring-cyan-500"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">vCPU</label>
                    <input
                      type="number"
                      value={formData.vcpu}
                      onChange={(e) => setFormData({ ...formData, vcpu: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:ring-2 focus:ring-cyan-500"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">RAM (GB)</label>
                    <input
                      type="number"
                      value={formData.ram_gb}
                      onChange={(e) => setFormData({ ...formData, ram_gb: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:ring-2 focus:ring-cyan-500"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Storage (GB)</label>
                    <input
                      type="number"
                      value={formData.storage_gb}
                      onChange={(e) => setFormData({ ...formData, storage_gb: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:ring-2 focus:ring-cyan-500"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Bandwidth (GB)</label>
                    <input
                      type="number"
                      value={formData.bandwidth_gb}
                      onChange={(e) => setFormData({ ...formData, bandwidth_gb: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:ring-2 focus:ring-cyan-500"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Base Price (INR/month)</label>
                  <input
                    type="number"
                    value={formData.base_price}
                    onChange={(e) => handleBasePriceChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:ring-2 focus:ring-cyan-500"
                    min="0"
                    step="1"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Changing base price auto-calculates all pricing tiers</p>
                </div>

                {/* Pricing Tiers Section */}
                <div className="border border-slate-800 rounded-lg p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-cyan-400">Pricing Tiers (Auto-calculated, override if needed)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Monthly</label>
                      <input
                        type="number"
                        value={formData.monthly_price}
                        onChange={(e) => setFormData({ ...formData, monthly_price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-sm focus:ring-2 focus:ring-cyan-500"
                        min="0"
                        step="any"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Quarterly (5% off)</label>
                      <input
                        type="number"
                        value={formData.quarterly_price}
                        onChange={(e) => setFormData({ ...formData, quarterly_price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-sm focus:ring-2 focus:ring-cyan-500"
                        min="0"
                        step="any"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Semi-Annual (8% off)</label>
                      <input
                        type="number"
                        value={formData.semiannual_price}
                        onChange={(e) => setFormData({ ...formData, semiannual_price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-sm focus:ring-2 focus:ring-cyan-500"
                        min="0"
                        step="any"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Annual (10% off)</label>
                      <input
                        type="number"
                        value={formData.annual_price}
                        onChange={(e) => setFormData({ ...formData, annual_price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-sm focus:ring-2 focus:ring-cyan-500"
                        min="0"
                        step="any"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Biennial (15% off)</label>
                      <input
                        type="number"
                        value={formData.biennial_price}
                        onChange={(e) => setFormData({ ...formData, biennial_price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-sm focus:ring-2 focus:ring-cyan-500"
                        min="0"
                        step="any"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Triennial (20% off)</label>
                      <input
                        type="number"
                        value={formData.triennial_price}
                        onChange={(e) => setFormData({ ...formData, triennial_price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-sm focus:ring-2 focus:ring-cyan-500"
                        min="0"
                        step="any"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Features (one per line)</label>
                  <textarea
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:ring-2 focus:ring-cyan-500"
                    rows={4}
                    placeholder="24/7 Support&#10;SSD Storage&#10;Free SSL"
                  />
                </div>

                <div className="flex items-center gap-6 text-slate-300">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="mr-2 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 bg-slate-900"
                    />
                    <label className="text-sm font-medium">Active</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="mr-2 rounded border-slate-600 text-amber-500 focus:ring-amber-500 bg-slate-900"
                    />
                    <label className="text-sm font-medium">Featured</label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(false); setEditingPlan(null); }}
                    className="px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-900 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-400 hover:to-blue-400"
                  >
                    {editingPlan ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
