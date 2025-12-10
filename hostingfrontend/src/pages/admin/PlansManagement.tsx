import { useState, useEffect } from 'react';
import { Server, Package, Plus, Edit, Trash2, Search, RefreshCw } from 'lucide-react';
import api from '../../lib/api';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';

// ========== INTERFACES ==========
interface PlanData {
  id: number;
  name: string;
  slug: string;
  description: string;
  plan_type: string;
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

interface AddonData {
  id: number;
  name: string;
  slug: string;
  category: string;
  description?: string;
  price: number;
  billing_type: string;
  unit_label?: string;
  is_active: boolean;
  is_featured: boolean;
  min_quantity: number;
  max_quantity?: number;
  default_quantity: number;
  sort_order: number;
  icon?: string;
  created_at?: string;
  updated_at?: string;
}

export function PlansManagement() {
  // ========== STATE ==========
  const [activeTab, setActiveTab] = useState<'plans' | 'addons'>('plans');

  // Plans state
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [planSearchTerm, setPlanSearchTerm] = useState('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanData | null>(null);

  // Addons state
  const [addons, setAddons] = useState<AddonData[]>([]);
  const [addonsLoading, setAddonsLoading] = useState(true);
  const [addonSearchTerm, setAddonSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [editingAddon, setEditingAddon] = useState<AddonData | null>(null);

  // Pagination state - Plans
  const [plansCurrentPage, setPlansCurrentPage] = useState(1);
  const [plansRowsPerPage, setPlansRowsPerPage] = useState(5);

  // Pagination state - Addons
  const [addonsCurrentPage, setAddonsCurrentPage] = useState(1);
  const [addonsRowsPerPage, setAddonsRowsPerPage] = useState(5);

  // Plan form data
  const [planFormData, setPlanFormData] = useState({
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

  // Addon form data
  const [addonFormData, setAddonFormData] = useState({
    name: '',
    slug: '',
    category: 'storage',
    description: '',
    price: 0,
    billing_type: 'monthly',
    unit_label: '',
    is_active: true,
    is_featured: false,
    min_quantity: 0,
    max_quantity: null as number | null,
    default_quantity: 0,
    sort_order: 0,
    icon: '',
  });

  // ========== EFFECTS ==========
  useEffect(() => {
    if (activeTab === 'plans') {
      fetchPlans();
    } else {
      fetchAddons();
    }
  }, [activeTab]);

  // ========== API CALLS - PLANS ==========
  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      const response = await api.get('/api/v1/admin/plans');
      setPlans(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setPlans([]);
    } finally {
      setPlansLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const featuresArray = planFormData.features.split('\\n').filter(f => f.trim());
      await api.post('/api/v1/admin/plans', {
        ...planFormData,
        features: featuresArray,
      });
      await fetchPlans();
      setShowPlanModal(false);
      resetPlanForm();
      alert('Plan created successfully');
    } catch (error) {
      console.error('Error creating plan:', error);
      alert('Failed to create plan');
    }
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    try {
      const featuresArray = planFormData.features.split('\\n').filter(f => f.trim());
      await api.put(`/api/v1/admin/plans/${editingPlan.id}`, {
        ...planFormData,
        features: featuresArray,
      });
      await fetchPlans();
      setShowPlanModal(false);
      setEditingPlan(null);
      resetPlanForm();
      alert('Plan updated successfully');
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('Failed to update plan');
    }
  };

  const handleDeletePlan = async (id: number) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      await api.delete(`/api/v1/admin/plans/${id}`);
      await fetchPlans();
      alert('Plan deleted successfully');
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Failed to delete plan');
    }
  };

  const openPlanModal = (plan?: PlanData) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanFormData({
        name: plan.name,
        slug: plan.slug,
        description: plan.description || '',
        plan_type: plan.plan_type,
        vcpu: plan.vcpu,
        ram_gb: plan.ram_gb,
        storage_gb: plan.storage_gb,
        bandwidth_gb: plan.bandwidth_gb,
        base_price: plan.base_price,
        monthly_price: plan.monthly_price,
        quarterly_price: plan.quarterly_price,
        semiannual_price: plan.semiannual_price || 0,
        annual_price: plan.annual_price,
        biennial_price: plan.biennial_price,
        triennial_price: plan.triennial_price,
        is_active: plan.is_active,
        is_featured: plan.is_featured,
        features: (plan.features || []).join('\\n'),
      });
    }
    setShowPlanModal(true);
  };

  const resetPlanForm = () => {
    setPlanFormData({
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

  // ========== API CALLS - ADDONS ==========
  const fetchAddons = async () => {
    try {
      setAddonsLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      const response = await api.get(`/api/v1/addons/?${params}`);
      setAddons(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching addons:', error);
      setAddons([]);
    } finally {
      setAddonsLoading(false);
    }
  };

  const handleCreateAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/addons/', {
        ...addonFormData,
        max_quantity: addonFormData.max_quantity || null,
      });
      await fetchAddons();
      setShowAddonModal(false);
      resetAddonForm();
      alert('Addon created successfully');
    } catch (error) {
      console.error('Error creating addon:', error);
      alert('Failed to create addon');
    }
  };

  const handleUpdateAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddon) return;
    try {
      await api.put(`/api/v1/addons/${editingAddon.id}`, {
        ...addonFormData,
        max_quantity: addonFormData.max_quantity || null,
      });
      await fetchAddons();
      setShowAddonModal(false);
      setEditingAddon(null);
      resetAddonForm();
      alert('Addon updated successfully');
    } catch (error) {
      console.error('Error updating addon:', error);
      alert('Failed to update addon');
    }
  };

  const handleDeleteAddon = async (id: number) => {
    if (!confirm('Are you sure you want to delete this addon?')) return;
    try {
      await api.delete(`/api/v1/addons/${id}`);
      await fetchAddons();
      alert('Addon deleted successfully');
    } catch (error) {
      console.error('Error deleting addon:', error);
      alert('Failed to delete addon');
    }
  };

  const openAddonModal = (addon?: AddonData) => {
    if (addon) {
      setEditingAddon(addon);
      setAddonFormData({
        name: addon.name,
        slug: addon.slug,
        category: addon.category,
        description: addon.description || '',
        price: addon.price,
        billing_type: addon.billing_type,
        unit_label: addon.unit_label || '',
        is_active: addon.is_active,
        is_featured: addon.is_featured,
        min_quantity: addon.min_quantity,
        max_quantity: addon.max_quantity || null,
        default_quantity: addon.default_quantity,
        sort_order: addon.sort_order,
        icon: addon.icon || '',
      });
    }
    setShowAddonModal(true);
  };

  const resetAddonForm = () => {
    setAddonFormData({
      name: '',
      slug: '',
      category: 'storage',
      description: '',
      price: 0,
      billing_type: 'monthly',
      unit_label: '',
      is_active: true,
      is_featured: false,
      min_quantity: 0,
      max_quantity: null,
      default_quantity: 0,
      sort_order: 0,
      icon: '',
    });
  };

  useEffect(() => {
    if (categoryFilter !== 'all') {
      fetchAddons();
    }
  }, [categoryFilter]);

  // Reset pagination when search/filter changes
  useEffect(() => {
    setPlansCurrentPage(1);
  }, [planSearchTerm]);

  useEffect(() => {
    setAddonsCurrentPage(1);
  }, [addonSearchTerm, categoryFilter]);

  // ========== FILTERED DATA ==========
  const filteredPlans = plans.filter(plan =>
    plan.name.toLowerCase().includes(planSearchTerm.toLowerCase()) ||
    plan.slug.toLowerCase().includes(planSearchTerm.toLowerCase())
  );

  const filteredAddons = addons.filter(addon =>
    addon.name.toLowerCase().includes(addonSearchTerm.toLowerCase()) ||
    addon.slug.toLowerCase().includes(addonSearchTerm.toLowerCase())
  );

  // ========== HELPER FUNCTIONS ==========
  const getCategoryBadge = (category: string) => {
    const badges: Record<string, string> = {
      storage: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      bandwidth: 'bg-green-500/10 text-green-400 border-green-500/20',
      ip_address: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      control_panel: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      backup: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      ssl: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      support: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      management: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      security: 'bg-red-500/10 text-red-400 border-red-500/20',
      cpu: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    };
    return badges[category.toLowerCase()] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  // ========== RENDER ==========
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Plans & Addons Management"
        description="Manage server hosting plans and add-on services"
        actions={
          <button
            onClick={() => activeTab === 'plans' ? fetchPlans() : fetchAddons()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-950/60 border border-slate-800 text-slate-400 rounded-xl hover:bg-slate-900 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        }
      />

      {/* Tab Buttons */}
      <div className="bg-slate-950/60 rounded-xl border border-slate-900 overflow-hidden">
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition ${activeTab === 'plans'
              ? 'border-b-2 border-cyan-500 text-cyan-400 bg-slate-900/50'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-900/30'
              }`}
          >
            <Server className="w-5 h-5" />
            Server Plans
          </button>
          <button
            onClick={() => setActiveTab('addons')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition ${activeTab === 'addons'
              ? 'border-b-2 border-cyan-500 text-cyan-400 bg-slate-900/50'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-900/30'
              }`}
          >
            <Package className="w-5 h-5" />
            Addons Management
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'plans' && (
            <PlansContent
              plans={filteredPlans}
              loading={plansLoading}
              searchTerm={planSearchTerm}
              setSearchTerm={setPlanSearchTerm}
              onAdd={() => openPlanModal()}
              onEdit={openPlanModal}
              onDelete={handleDeletePlan}
              formatCurrency={formatCurrency}
              currentPage={plansCurrentPage}
              setCurrentPage={setPlansCurrentPage}
              rowsPerPage={plansRowsPerPage}
              setRowsPerPage={setPlansRowsPerPage}
            />
          )}

          {activeTab === 'addons' && (
            <AddonsContent
              addons={filteredAddons}
              loading={addonsLoading}
              searchTerm={addonSearchTerm}
              setSearchTerm={setAddonSearchTerm}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              onAdd={() => openAddonModal()}
              onEdit={openAddonModal}
              onDelete={handleDeleteAddon}
              formatCurrency={formatCurrency}
              getCategoryBadge={getCategoryBadge}
              currentPage={addonsCurrentPage}
              setCurrentPage={setAddonsCurrentPage}
              rowsPerPage={addonsRowsPerPage}
              setRowsPerPage={setAddonsRowsPerPage}
            />
          )}
        </div>
      </div>

      {/* Plan Modal */}
      {showPlanModal && (
        <PlanModal
          isEditing={!!editingPlan}
          formData={planFormData}
          setFormData={setPlanFormData}
          onSubmit={editingPlan ? handleUpdatePlan : handleCreatePlan}
          onClose={() => {
            setShowPlanModal(false);
            setEditingPlan(null);
            resetPlanForm();
          }}
        />
      )}

      {/* Addon Modal */}
      {showAddonModal && (
        <AddonModal
          isEditing={!!editingAddon}
          formData={addonFormData}
          setFormData={setAddonFormData}
          onSubmit={editingAddon ? handleUpdateAddon : handleCreateAddon}
          onClose={() => {
            setShowAddonModal(false);
            setEditingAddon(null);
            resetAddonForm();
          }}
        />
      )}
    </div>
  );
}
// ========== PLANS CONTENT COMPONENT ==========
interface PlansContentProps {
  plans: PlanData[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onAdd: () => void;
  onEdit: (plan: PlanData) => void;
  onDelete: (id: number) => void;
  formatCurrency: (amount: number) => string;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  rowsPerPage: number;
  setRowsPerPage: React.Dispatch<React.SetStateAction<number>>;
}

function PlansContent({ plans, loading, searchTerm, setSearchTerm, onAdd, onEdit, onDelete, formatCurrency, currentPage, setCurrentPage, rowsPerPage, setRowsPerPage }: PlansContentProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Add */}
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search plans..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Plan
        </button>
      </div>

      {/* Plans Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Plan Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Specs</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Monthly Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {plans
              .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
              .map((plan) => (
                <tr key={plan.id} className="hover:bg-slate-900/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{plan.name}</div>
                    <div className="text-sm text-slate-500">{plan.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {plan.plan_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {plan.vcpu} vCPU | {plan.ram_gb}GB RAM | {plan.storage_gb}GB
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {formatCurrency(plan.monthly_price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${plan.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(plan)}
                        className="p-1 text-blue-400 hover:text-blue-300 transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(plan.id)}
                        className="p-1 text-red-400 hover:text-red-300 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {plans.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No plans found</p>
          </div>
        )}

        {/* Pagination Controls */}
        {plans.length > 0 && (
          <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">
                Showing {Math.min((currentPage - 1) * rowsPerPage + 1, plans.length)} to{' '}
                {Math.min(currentPage * rowsPerPage, plans.length)} of {plans.length} plans
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Rows:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-slate-900 text-white border border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="First page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Previous page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex items-center gap-1">
                {(() => {
                  const totalPages = Math.ceil(plans.length / rowsPerPage);
                  const pages = [];
                  const maxVisiblePages = 5;
                  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                  if (endPage - startPage + 1 < maxVisiblePages) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                  }

                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition ${i === currentPage
                          ? 'bg-cyan-500 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                      >
                        {i}
                      </button>
                    );
                  }
                  return pages;
                })()}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(plans.length / rowsPerPage)))}
                disabled={currentPage >= Math.ceil(plans.length / rowsPerPage)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Next page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentPage(Math.ceil(plans.length / rowsPerPage))}
                disabled={currentPage >= Math.ceil(plans.length / rowsPerPage)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Last page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== ADDONS CONTENT COMPONENT ==========
interface AddonsContentProps {
  addons: AddonData[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  onAdd: () => void;
  onEdit: (addon: AddonData) => void;
  onDelete: (id: number) => void;
  formatCurrency: (amount: number) => string;
  getCategoryBadge: (category: string) => string;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  rowsPerPage: number;
  setRowsPerPage: React.Dispatch<React.SetStateAction<number>>;
}

function AddonsContent({ addons, loading, searchTerm, setSearchTerm, categoryFilter, setCategoryFilter, onAdd, onEdit, onDelete, formatCurrency, getCategoryBadge, currentPage, setCurrentPage, rowsPerPage, setRowsPerPage }: AddonsContentProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'storage', label: 'Storage' },
    { value: 'bandwidth', label: 'Bandwidth' },
    { value: 'ip_address', label: 'IP Address' },
    { value: 'control_panel', label: 'Control Panel' },
    { value: 'backup', label: 'Backup' },
    { value: 'ssl', label: 'SSL' },
    { value: 'support', label: 'Support' },
    { value: 'management', label: 'Management' },
    { value: 'security', label: 'Security' },
    { value: 'cpu', label: 'CPU' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search addons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:ring-2 focus:ring-cyan-500"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition">
            <Plus className="w-4 h-4" />
            Add Addon
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Addon Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Billing</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {addons
              .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
              .map((addon) => (
                <tr key={addon.id} className="hover:bg-slate-900/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{addon.name}</div>
                    <div className="text-sm text-slate-500">{addon.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getCategoryBadge(addon.category)}`}>
                      {addon.category.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{formatCurrency(addon.price)}</div>
                    {addon.unit_label && <div className="text-xs text-slate-500">per {addon.unit_label}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {addon.billing_type.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${addon.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {addon.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => onEdit(addon)} className="p-1 text-blue-400 hover:text-blue-300 transition"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => onDelete(addon.id)} className="p-1 text-red-400 hover:text-red-300 transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {addons.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No addons found</p>
          </div>
        )}

        {/* Pagination Controls */}
        {addons.length > 0 && (
          <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">
                Showing {Math.min((currentPage - 1) * rowsPerPage + 1, addons.length)} to{' '}
                {Math.min(currentPage * rowsPerPage, addons.length)} of {addons.length} addons
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Rows:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-slate-900 text-white border border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="First page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Previous page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex items-center gap-1">
                {(() => {
                  const totalPages = Math.ceil(addons.length / rowsPerPage);
                  const pages = [];
                  const maxVisiblePages = 5;
                  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                  if (endPage - startPage + 1 < maxVisiblePages) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                  }

                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition ${i === currentPage
                          ? 'bg-cyan-500 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                      >
                        {i}
                      </button>
                    );
                  }
                  return pages;
                })()}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(addons.length / rowsPerPage)))}
                disabled={currentPage >= Math.ceil(addons.length / rowsPerPage)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Next page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentPage(Math.ceil(addons.length / rowsPerPage))}
                disabled={currentPage >= Math.ceil(addons.length / rowsPerPage)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Last page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== PLAN MODAL COMPONENT ==========
interface PlanModalProps {
  isEditing: boolean;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

function PlanModal({ isEditing, formData, setFormData, onSubmit, onClose }: PlanModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-950 rounded-xl border border-slate-800 max-w-4xl w-full my-8">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">{isEditing ? 'Edit Plan' : 'Add New Plan'}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
          </div>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Plan Name</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Slug</label>
                <input type="text" required value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:ring-2 focus:ring-cyan-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
              <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Plan Type</label>
                <select value={formData.plan_type} onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })} className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:ring-2 focus:ring-cyan-500">
                  <option value="vps">VPS</option>
                  <option value="shared">Shared</option>
                  <option value="dedicated">Dedicated</option>
                  <option value="cloud">Cloud</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">vCPU</label>
                <input type="number" min="1" required value={formData.vcpu} onChange={(e) => setFormData({ ...formData, vcpu: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">RAM (GB)</label>
                <input type="number" min="1" required value={formData.ram_gb} onChange={(e) => setFormData({ ...formData, ram_gb: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Storage (GB)</label>
                <input type="number" min="1" required value={formData.storage_gb} onChange={(e) => setFormData({ ...formData, storage_gb: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:ring-2 focus:ring-cyan-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><label className="block text-xs text-slate-400 mb-1">Base Price (₹)</label><input type="number" step="any" required value={formData.base_price} onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:ring-2 focus:ring-cyan-500" /></div>
              <div><label className="block text-xs text-slate-400 mb-1">Monthly (₹)</label><input type="number" step="any" required value={formData.monthly_price} onChange={(e) => setFormData({ ...formData, monthly_price: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:ring-2 focus:ring-cyan-500" /></div>
              <div><label className="block text-xs text-slate-400 mb-1">Annual (₹)</label><input type="number" step="any" required value={formData.annual_price} onChange={(e) => setFormData({ ...formData, annual_price: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:ring-2 focus:ring-cyan-500" /></div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500" />Active</label>
              <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={formData.is_featured} onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })} className="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500" />Featured</label>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-800 rounded-lg text-slate-300 hover:bg-slate-900 transition">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition">{isEditing ? 'Update Plan' : 'Create Plan'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ========== ADDON MODAL COMPONENT ==========
interface AddonModalProps {
  isEditing: boolean;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

function AddonModal({ isEditing, formData, setFormData, onSubmit, onClose }: AddonModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-950 rounded-xl border border-slate-800 max-w-3xl w-full my-8">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">{isEditing ? 'Edit Addon' : 'Add New Addon'}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
          </div>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-300 mb-1">Addon Name *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:ring-2 focus:ring-cyan-500" placeholder="e.g., Extra Storage" /></div>
              <div><label className="block text-sm font-medium text-slate-300 mb-1">Slug *</label><input type="text" required value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:ring-2 focus:ring-cyan-500" placeholder="e.g., extra-storage-50gb" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Category *</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:ring-2 focus:ring-cyan-500">
                  <option value="storage">Storage</option>
                  <option value="bandwidth">Bandwidth</option>
                  <option value="ip_address">IP Address</option>
                  <option value="control_panel">Control Panel</option>
                  <option value="backup">Backup</option>
                  <option value="ssl">SSL</option>
                  <option value="support">Support</option>
                  <option value="management">Management</option>
                  <option value="security">Security</option>
                  <option value="cpu">CPU</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium text-slate-300 mb-1">Description</label><textarea rows={1} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:ring-2 focus:ring-cyan-500" placeholder="Brief description" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-slate-300 mb-1">Price (₹) *</label><input type="number" step="0.01" min="0" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:ring-2 focus:ring-cyan-500" /></div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Billing Type *</label>
                <select value={formData.billing_type} onChange={(e) => setFormData({ ...formData, billing_type: e.target.value })} className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:ring-2 focus:ring-cyan-500">
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                  <option value="one_time">One Time</option>
                  <option value="per_unit">Per Unit</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium text-slate-300 mb-1">Unit Label</label><input type="text" value={formData.unit_label} onChange={(e) => setFormData({ ...formData, unit_label: e.target.value })} className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:ring-2 focus:ring-cyan-500" placeholder="e.g., GB, IP, TB" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-slate-300 mb-1">Min Quantity</label><input type="number" min="0" value={formData.min_quantity} onChange={(e) => setFormData({ ...formData, min_quantity: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:ring-2 focus:ring-cyan-500" /></div>
              <div><label className="block text-sm font-medium text-slate-300 mb-1">Max Quantity</label><input type="number" min="0" value={formData.max_quantity || ''} onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value ? parseInt(e.target.value) : null })} className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:ring-2 focus:ring-cyan-500" placeholder="Unlimited" /></div>
              <div><label className="block text-sm font-medium text-slate-300 mb-1">Default Quantity</label><input type="number" min="0" value={formData.default_quantity} onChange={(e) => setFormData({ ...formData, default_quantity: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:ring-2 focus:ring-cyan-500" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-300 mb-1">Sort Order</label><input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:ring-2 focus:ring-cyan-500" /></div>
              <div><label className="block text-sm font-medium text-slate-300 mb-1">Icon Name</label><input type="text" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white focus:ring-2 focus:ring-cyan-500" placeholder="e.g., database, server" /></div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500" />Active</label>
              <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={formData.is_featured} onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })} className="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500" />Featured</label>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-800 rounded-lg text-slate-300 hover:bg-slate-900 transition">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition">{isEditing ? 'Update Addon' : 'Create Addon'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

