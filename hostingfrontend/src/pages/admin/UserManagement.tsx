import { useState, useEffect } from 'react';
import { Search, UserPlus, Mail, Shield, Ban, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../lib/api';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  account_status: string;
  created_at: string;
  referral_code?: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.request('/api/v1/admin/users?limit=1000');
      setUsers(response.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.account_status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole, filterStatus]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'support':
        return 'bg-sky-50 text-sky-600 border-sky-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'suspended':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'banned':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  const activeUsers = users.filter(user => user.account_status === 'active').length;
  const adminUsers = users.filter(user => user.role === 'admin' || user.role === 'super_admin').length;
  const supportUsers = users.filter(user => user.role === 'support').length;
  const referralUsers = users.filter(user => Boolean(user.referral_code)).length;
  const flaggedUsers = users.filter(user => ['suspended', 'banned'].includes(user.account_status)).length;

  const summaryCards = [
    { label: 'Total Users', value: users.length, helper: `${activeUsers} active` },
    { label: 'Admin & Support', value: adminUsers + supportUsers, helper: `${adminUsers} admin • ${supportUsers} support` },
    { label: 'Referral Accounts', value: referralUsers, helper: 'With referral code' },
    { label: 'Needs Attention', value: flaggedUsers, helper: 'Suspended or banned' },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="User Management"
        description="Search, filter, and moderate every customer or administrator tied to your hosting platform."
        actions={
          <button className="px-4 py-2 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-slate-950/60 border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="text-3xl font-semibold text-white mt-1">{card.value}</p>
            <p className="text-sm text-slate-500 mt-2">{card.helper}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-950/60 border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, username, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-slate-950/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-slate-950/60"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customer</option>
              <option value="support">Support</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2 ">Account Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-slate-950/60"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-950/60 border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 bg-slate-950/60">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-slate-950/60">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap ">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.full_name?.charAt(0) || 'U'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{user.full_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-white">
                      <Mail className="w-4 h-4 text-slate-400 " />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeClass(user.role)}`}>
                      {user.role?.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadgeClass(user.account_status)}`}>
                      {user.account_status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-white">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button className="text-cyan-600 hover:text-cyan-700 transition">
                        <Shield className="w-5 h-5" />
                      </button>
                      <button className="text-rose-500 hover:text-rose-600 transition">
                        <Ban className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 bg-slate-950/60">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left side - Info */}
            <div className="text-sm text-slate-500">
              Showing <span className="font-semibold text-white">{startIndex + 1}</span> to{' '}
              <span className="font-semibold text-white">{Math.min(endIndex, filteredUsers.length)}</span> of{' '}
              <span className="font-semibold text-white">{filteredUsers.length}</span> users
              {filteredUsers.length !== users.length && (
                <span className="text-slate-400 ml-2">(filtered from {users.length} total)</span>
              )}
            </div>

            {/* Center - Page numbers */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>

              <div className="flex items-center gap-1">
                {totalPages <= 7 ? (
                  // Show all pages if 7 or fewer
                  Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition ${currentPage === page
                          ? 'bg-cyan-600 text-white'
                          : 'text-slate-400 hover:bg-slate-100'
                        }`}
                    >
                      {page}
                    </button>
                  ))
                ) : (
                  // Show abbreviated pagination for many pages
                  <>
                    <button
                      onClick={() => goToPage(1)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition ${currentPage === 1
                          ? 'bg-cyan-600 text-white'
                          : 'text-slate-400 hover:bg-slate-100'
                        }`}
                    >
                      1
                    </button>
                    {currentPage > 3 && <span className="text-slate-400 px-2">...</span>}
                    {Array.from({ length: 3 }, (_, i) => currentPage - 1 + i)
                      .filter((page) => page > 1 && page < totalPages)
                      .map((page) => (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${currentPage === page
                              ? 'bg-cyan-600 text-white'
                              : 'text-slate-400 hover:bg-slate-100'
                            }`}
                        >
                          {page}
                        </button>
                      ))}
                    {currentPage < totalPages - 2 && <span className="text-slate-400 px-2">...</span>}
                    <button
                      onClick={() => goToPage(totalPages)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition ${currentPage === totalPages
                          ? 'bg-cyan-600 text-white'
                          : 'text-slate-400 hover:bg-slate-100'
                        }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Right side - Rows per page */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-slate-950/60 text-white"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
