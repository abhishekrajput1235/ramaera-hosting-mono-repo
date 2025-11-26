// import { useState, useEffect } from 'react';
// import { Server, Search, Filter, RefreshCw, Power, Eye } from 'lucide-react';
// import api from '../../lib/api';
// import { AdminPageHeader } from '../../components/admin/AdminPageHeader';

// interface ServerData {
//   id: number;
//   user_id: number;
//   server_name: string;
//   hostname: string;
//   ip_address: string | null;
//   server_status: string;
//   server_type: string;
//   plan_name: string;
//   monthly_cost: number;
//   vcpu: number;
//   ram_gb: number;
//   storage_gb: number;
//   bandwidth_gb: number;
//   operating_system: string;
//   created_at: string;
//   expiry_date: string;
//   user?: {
//     email: string;
//     full_name: string;
//   };
// }

// export function ServerManagement() {
//   const [servers, setServers] = useState<ServerData[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [selectedServer, setSelectedServer] = useState<ServerData | null>(null);
//   const [showDetails, setShowDetails] = useState(false);
//   const [actionLoading, setActionLoading] = useState<number | null>(null);

//   useEffect(() => {
//     fetchServers();
//   }, []);

//   const fetchServers = async () => {
//     try {
//       setLoading(true);
//       const response = await api.request('/api/v1/admin/servers?limit=1000', { method: 'GET' });
//       setServers(Array.isArray(response) ? response : []);
//     } catch (error) {
//       console.error('Error fetching servers:', error);
//       setServers([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleServerAction = async (serverId: number, action: string) => {
//     try {
//       setActionLoading(serverId);
//       await api.request(`/api/v1/servers/${serverId}/action`, {
//         method: 'POST',
//         body: JSON.stringify({ action }),
//       });
//       await fetchServers();
//       alert(`Server ${action} successful`);
//     } catch (error) {
//       console.error(`Error performing ${action}:`, error);
//       alert(`Failed to ${action} server`);
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   const getStatusBadge = (status: string) => {
//     const styles: Record<string, string> = {
//       active: 'bg-green-100 text-green-800',
//       running: 'bg-green-100 text-green-800',
//       stopped: 'bg-red-100 text-red-800',
//       provisioning: 'bg-yellow-100 text-yellow-800',
//       suspended: 'bg-orange-100 text-orange-800',
//       terminated: 'bg-slate-900 text-slate-200',
//     };
//     return styles[status] || 'bg-slate-900 text-slate-200';
//   };

//   const filteredServers = servers.filter(server => {
//     const matchesSearch =
//       server.server_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       server.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       (server.ip_address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
//       (server.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase());

//     const matchesStatus = statusFilter === 'all' || server.server_status === statusFilter;

//     return matchesSearch && matchesStatus;
//   });

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-IN', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//     });
//   };

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//     }).format(amount);
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <AdminPageHeader
//         title="Server Management"
//         description="Oversee provisioning, lifecycle events, and uptime for every deployed instance."
//         actions={
//           <button
//             onClick={fetchServers}
//             className="flex items-center gap-2 px-4 py-2 bg-slate-950/60 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition"
//           >
//             <RefreshCw className="w-4 h-4" />
//             Refresh
//           </button>
//         }
//       />

//       {/* Filters */}
//       <div className="bg-slate-950/60 p-4 rounded-lg shadow-md border border-slate-900">
//         <div className="flex flex-col md:flex-row gap-4">
//           <div className="flex-1 relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
//             <input
//               type="text"
//               placeholder="Search by name, hostname, IP, or user email..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pl-10 pr-4 py-2 border border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>
//           <div className="flex items-center gap-2">
//             <Filter className="text-slate-500 w-5 h-5" />
//             <select
//               value={statusFilter}
//               onChange={(e) => setStatusFilter(e.target.value)}
//               className="px-4 py-2 border border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             >
//               <option value="all">All Status</option>
//               <option value="active">Active</option>
//               <option value="running">Running</option>
//               <option value="stopped">Stopped</option>
//               <option value="provisioning">Provisioning</option>
//               <option value="suspended">Suspended</option>
//               <option value="terminated">Terminated</option>
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* Stats Summary */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <div className="bg-slate-950/60 p-4 rounded-lg shadow-md border border-slate-900">
//           <p className="text-sm text-slate-400">Total Servers</p>
//           <p className="text-2xl font-bold text-white">{servers.length}</p>
//         </div>
//         <div className="bg-slate-950/60 p-4 rounded-lg shadow-md border border-slate-900">
//           <p className="text-sm text-slate-400">Active</p>
//           <p className="text-2xl font-bold text-green-600">
//             {servers.filter(s => s.server_status === 'active' || s.server_status === 'running').length}
//           </p>
//         </div>
//         <div className="bg-slate-950/60 p-4 rounded-lg shadow-md border border-slate-900">
//           <p className="text-sm text-slate-400">Provisioning</p>
//           <p className="text-2xl font-bold text-yellow-600">
//             {servers.filter(s => s.server_status === 'provisioning').length}
//           </p>
//         </div>
//         <div className="bg-slate-950/60 p-4 rounded-lg shadow-md border border-slate-900">
//           <p className="text-sm text-slate-400">Monthly Revenue</p>
//           <p className="text-2xl font-bold text-blue-600">
//             {formatCurrency(servers.reduce((sum, s) => sum + (s.monthly_cost || 0), 0))}
//           </p>
//         </div>
//       </div>

//       {/* Servers Table */}
//       <div className="bg-slate-950/60 rounded-lg shadow-md border border-slate-900 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-slate-950/70">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
//                   Server
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
//                   User
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
//                   Specs
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
//                   Status
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
//                   Cost
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
//                   Created
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
//                   Actions
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-slate-950/60 divide-y divide-gray-200">
//               {filteredServers.map((server) => (
//                 <tr key={server.id} className="hover:bg-slate-950/70">
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="flex items-center">
//                       <Server className="w-5 h-5 text-slate-500 mr-3" />
//                       <div>
//                         <div className="text-sm font-medium text-white">{server.server_name}</div>
//                         <div className="text-sm text-slate-500">{server.hostname}</div>
//                         <div className="text-xs text-slate-500">{server.ip_address || 'No IP'}</div>
//                       </div>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="text-sm text-white">{server.user?.full_name || 'N/A'}</div>
//                     <div className="text-sm text-slate-500">{server.user?.email || 'N/A'}</div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="text-sm text-white">{server.plan_name}</div>
//                     <div className="text-xs text-slate-500">
//                       {server.vcpu} vCPU | {server.ram_gb}GB RAM | {server.storage_gb}GB SSD
//                     </div>
//                     <div className="text-xs text-slate-500">{server.operating_system}</div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(server.server_status)}`}>
//                       {server.server_status}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="text-sm font-medium text-white">
//                       {formatCurrency(server.monthly_cost)}
//                     </div>
//                     <div className="text-xs text-slate-500">per month</div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="text-sm text-white">{formatDate(server.created_at)}</div>
//                     <div className="text-xs text-slate-500">Expires: {formatDate(server.expiry_date)}</div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
//                     <div className="flex items-center gap-2">
//                       <button
//                         onClick={() => {
//                           setSelectedServer(server);
//                           setShowDetails(true);
//                         }}
//                         className="p-1 text-blue-600 hover:bg-blue-50 rounded"
//                         title="View Details"
//                       >
//                         <Eye className="w-4 h-4" />
//                       </button>
//                       {server.server_status === 'active' && (
//                         <button
//                           onClick={() => handleServerAction(server.id, 'stop')}
//                           disabled={actionLoading === server.id}
//                           className="p-1 text-orange-600 hover:bg-orange-50 rounded"
//                           title="Stop Server"
//                         >
//                           <Power className="w-4 h-4" />
//                         </button>
//                       )}
//                       {server.server_status === 'stopped' && (
//                         <button
//                           onClick={() => handleServerAction(server.id, 'start')}
//                           disabled={actionLoading === server.id}
//                           className="p-1 text-green-600 hover:bg-green-50 rounded"
//                           title="Start Server"
//                         >
//                           <Power className="w-4 h-4" />
//                         </button>
//                       )}
//                       <button
//                         onClick={() => handleServerAction(server.id, 'restart')}
//                         disabled={actionLoading === server.id}
//                         className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
//                         title="Restart Server"
//                       >
//                         <RefreshCw className="w-4 h-4" />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//         {filteredServers.length === 0 && (
//           <div className="text-center py-12 text-slate-500">
//             <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
//             <p>No servers found</p>
//           </div>
//         )}
//       </div>

//       {/* Server Details Modal */}
//       {showDetails && selectedServer && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-slate-950/60 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
//             <div className="p-6">
//               <div className="flex justify-between items-center mb-6">
//                 <h2 className="text-2xl font-bold text-white">Server Details</h2>
//                 <button
//                   onClick={() => setShowDetails(false)}
//                   className="text-slate-500 hover:text-slate-400"
//                 >
//                   &times;
//                 </button>
//               </div>

//               <div className="space-y-4">
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <p className="text-sm text-slate-400">Server Name</p>
//                     <p className="font-medium">{selectedServer.server_name}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-slate-400">Status</p>
//                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedServer.server_status)}`}>
//                       {selectedServer.server_status}
//                     </span>
//                   </div>
//                   <div>
//                     <p className="text-sm text-slate-400">Hostname</p>
//                     <p className="font-medium">{selectedServer.hostname}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-slate-400">IP Address</p>
//                     <p className="font-medium">{selectedServer.ip_address || 'Not Assigned'}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-slate-400">Plan</p>
//                     <p className="font-medium">{selectedServer.plan_name}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-slate-400">Monthly Cost</p>
//                     <p className="font-medium">{formatCurrency(selectedServer.monthly_cost)}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-slate-400">vCPU</p>
//                     <p className="font-medium">{selectedServer.vcpu} cores</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-slate-400">RAM</p>
//                     <p className="font-medium">{selectedServer.ram_gb} GB</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-slate-400">Storage</p>
//                     <p className="font-medium">{selectedServer.storage_gb} GB SSD</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-slate-400">Bandwidth</p>
//                     <p className="font-medium">{selectedServer.bandwidth_gb} GB</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-slate-400">Operating System</p>
//                     <p className="font-medium">{selectedServer.operating_system}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-slate-400">Server Type</p>
//                     <p className="font-medium">{selectedServer.server_type}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-slate-400">Created</p>
//                     <p className="font-medium">{formatDate(selectedServer.created_at)}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-slate-400">Expires</p>
//                     <p className="font-medium">{formatDate(selectedServer.expiry_date)}</p>
//                   </div>
//                 </div>

//                 <div className="border-t pt-4 mt-4">
//                   <p className="text-sm text-slate-400 mb-2">User Information</p>
//                   <p className="font-medium">{selectedServer.user?.full_name || 'N/A'}</p>
//                   <p className="text-sm text-slate-500">{selectedServer.user?.email || 'N/A'}</p>
//                 </div>
//               </div>

//               <div className="flex justify-end gap-2 mt-6">
//                 <button
//                   onClick={() => setShowDetails(false)}
//                   className="px-4 py-2 border border-slate-800 rounded-lg hover:bg-slate-950/70"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


import { useState, useEffect } from 'react';
import { Server, Search, Filter, RefreshCw, Power, Eye } from 'lucide-react';
import api from '../../lib/api';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';

interface ServerData {
  id: number;
  user_id: number;
  server_name: string;
  hostname: string;
  ip_address: string | null;
  server_status: string;
  server_type: string;
  plan_name: string;
  monthly_cost: number;
  vcpu: number;
  ram_gb: number;
  storage_gb: number;
  bandwidth_gb: number;
  operating_system: string;
  created_at: string;
  expiry_date: string;
  user?: {
    email: string;
    full_name: string;
  };
}

export function ServerManagement() {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedServer, setSelectedServer] = useState<ServerData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      setLoading(true);
      const response = await api.request('/api/v1/admin/servers?limit=1000', { method: 'GET' });
      setServers(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching servers:', error);
      setServers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleServerAction = async (serverId: number, action: string) => {
    try {
      setActionLoading(serverId);
      await api.request(`/api/v1/servers/${serverId}/action`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      await fetchServers();
      alert(`Server ${action} successful`);
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      alert(`Failed to ${action} server`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-500/10 text-green-400 border border-green-500/20',
      running: 'bg-green-500/10 text-green-400 border border-green-500/20',
      stopped: 'bg-red-500/10 text-red-400 border border-red-500/20',
      provisioning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      suspended: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
      terminated: 'bg-slate-800 text-slate-400 border border-slate-700',
    };
    return styles[status] || 'bg-slate-800 text-slate-200';
  };

  const filteredServers = servers.filter(server => {
    const matchesSearch =
      server.server_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (server.ip_address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (server.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || server.server_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    /* MAIN CONTAINER:
       1. h-[calc(100vh-2rem)] forces the container to fit the screen (adjust 2rem based on your layout padding).
       2. flex-col & overflow-hidden ensures the container itself doesn't scroll, forcing children to handle it.
    */
    <div className="flex flex-col h-[calc(100vh-6rem)] w-full overflow-hidden space-y-4">
      
      {/* HEADER SECTION: shrink-0 prevents this from getting squashed */}
      <div className="shrink-0 space-y-4">
        <AdminPageHeader
          title="Server Management"
          description="Oversee provisioning and lifecycle events."
          actions={
            <button
              onClick={fetchServers}
              className="flex items-center gap-2 px-4 py-2 bg-slate-950/60 border border-slate-800 text-slate-400 rounded-xl hover:bg-slate-900 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          }
        />

        {/* Filters */}
        <div className="bg-slate-950/60 p-4 rounded-xl shadow-md border border-slate-900">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-950 text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-slate-500 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-slate-800 rounded-lg bg-slate-950 text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="running">Running</option>
                <option value="stopped">Stopped</option>
                <option value="provisioning">Provisioning</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Summary - Hidden on very small screens if needed, or scrollable */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-950/60 p-3 md:p-4 rounded-xl border border-slate-900">
            <p className="text-xs text-slate-400">Total</p>
            <p className="text-xl md:text-2xl font-bold text-white">{servers.length}</p>
          </div>
          <div className="bg-slate-950/60 p-3 md:p-4 rounded-xl border border-slate-900">
            <p className="text-xs text-slate-400">Active</p>
            <p className="text-xl md:text-2xl font-bold text-green-500">
              {servers.filter(s => s.server_status === 'active').length}
            </p>
          </div>
          <div className="bg-slate-950/60 p-3 md:p-4 rounded-xl border border-slate-900">
             <p className="text-xs text-slate-400">Setup</p>
             <p className="text-xl md:text-2xl font-bold text-yellow-500">
              {servers.filter(s => s.server_status === 'provisioning').length}
             </p>
          </div>
          <div className="bg-slate-950/60 p-3 md:p-4 rounded-xl border border-slate-900">
             <p className="text-xs text-slate-400">Revenue</p>
             <p className="text-xl md:text-2xl font-bold text-blue-500">
               {formatCurrency(servers.reduce((sum, s) => sum + (s.monthly_cost || 0), 0))}
             </p>
          </div>
        </div>
      </div>

      {/* TABLE AREA:
         1. flex-1: Fills all remaining vertical space.
         2. min-h-0: CRITICAL. Allows this flex child to shrink below its content size (enabling scroll).
         3. overflow-auto: Turns on scrollbars inside this specific div.
      */}
      <div className="flex-1 min-h-0 bg-slate-950/60 rounded-xl border border-slate-900 overflow-hidden relative">
        <div className="absolute inset-0 overflow-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-900/90 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Server</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Specs</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Cost</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Created</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredServers.map((server) => (
                <tr key={server.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Server className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-white">{server.server_name}</div>
                        <div className="text-sm text-slate-500">{server.hostname}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{server.user?.full_name || 'N/A'}</div>
                    <div className="text-sm text-slate-500">{server.user?.email || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{server.plan_name}</div>
                    <div className="text-xs text-slate-500">{server.vcpu} vCPU | {server.ram_gb}GB</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(server.server_status)}`}>
                      {server.server_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {formatCurrency(server.monthly_cost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {formatDate(server.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setSelectedServer(server); setShowDetails(true); }} className="p-1.5 text-slate-400 hover:text-blue-400 rounded transition"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleServerAction(server.id, 'restart')} disabled={actionLoading === server.id} className="p-1.5 text-slate-400 hover:text-yellow-400 rounded transition"><RefreshCw className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredServers.length === 0 && (
             <div className="text-center py-12 text-slate-500">
               <p>No servers found</p>
             </div>
          )}
        </div>
      </div>

      {/* Modal remains unchanged, just ensures it's on top */}
      {showDetails && selectedServer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-950 rounded-xl border border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Details: {selectedServer.server_name}</h2>
                <button onClick={() => setShowDetails(false)} className="text-slate-500 hover:text-white">&times;</button>
             </div>
             {/* Content */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">IP:</span> <span className="text-white">{selectedServer.ip_address || 'N/A'}</span></div>
                <div><span className="text-slate-500">Status:</span> <span className="text-white">{selectedServer.server_status}</span></div>
                <div><span className="text-slate-500">OS:</span> <span className="text-white">{selectedServer.operating_system}</span></div>
                <div><span className="text-slate-500">Cost:</span> <span className="text-white">{formatCurrency(selectedServer.monthly_cost)}</span></div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}