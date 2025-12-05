// import { useState, useEffect, useMemo } from 'react';
// import { Link, useSearchParams, useNavigate } from 'react-router-dom';
// import {
//   CheckCircle,
//   Server,
//   Zap,
//   Database,
//   MapPin,
//   Clock,
//   Shield,
//   Award,
//   HardDrive,
//   Cpu,
//   MemoryStick,
//   Network,
// } from 'lucide-react';
// import { MobileFilters } from '../components/pricing/MobileFilters';
// import { useAuth } from '../contexts/AuthContext';
// import { useHostingPlansStore, type HostingPlan } from "../stores/PlansStore";

// type BillingCycle = 'monthly' | 'quarterly' | 'semiannually' | 'annually' | 'biennially' | 'triennially';

// interface Plan {
//   id: number;
//   name: string;
//   ram: number;
//   vcpu: number;
//   storage: number;
//   bandwidth: number;
//   prices: {
//     monthly: number;
//     quarterly: number;
//     semiannually: number;
//     annually: number;
//     biennially: number;
//     triennially: number;
//   };
//   features: string[];
//   popular?: boolean;
//   plan_type_label?: string; // friendly label
//   raw_plan_type?: string; // backend plan_type preserved
// }

// export function Pricing() {
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const typeParam = searchParams.get('type');

//   const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
//   const [selectedType, setSelectedType] = useState<string>(typeParam || '');

//   // Zustand store
//   const { fetchAllPlans, plans, loading, error } = useHostingPlansStore();

//   // Fetch plans once (on mount)
//   useEffect(() => {
//     fetchAllPlans();
//   }, [fetchAllPlans]);

//   // ========== Billing cycles (UI) ==========
//   const billingCycles = [
//     { id: 'monthly' as BillingCycle, name: 'Monthly', discount: 5 },
//     { id: 'quarterly' as BillingCycle, name: 'Quarterly', discount: 10 },
//     { id: 'semiannually' as BillingCycle, name: 'Semi-Annually', discount: 15 },
//     { id: 'annually' as BillingCycle, name: 'Annually', discount: 20 },
//     { id: 'biennially' as BillingCycle, name: 'Biennially', discount: 25 },
//     { id: 'triennially' as BillingCycle, name: 'Triennially', discount: 35 },
//   ];

//   // ========== Helpers ==========
//   const humanizePlanType = (raw: string) =>
//     raw
//       .replace(/[_\-]/g, ' ')
//       .replace(/\b([a-z])/g, (m) => m.toUpperCase());

//   // Transform HostingPlan (backend) -> Plan (UI)
//   const transformPlanToUI = (p: HostingPlan): Plan => {
//     const basePrice = parseFloat(p.base_price || "0");
//     const semiannualPrice = Math.round(basePrice * 6 * 0.85); // 15% discount for 6 months

//     const planTypeLabel = humanizePlanType(p.plan_type || '');

//     return {
//       id: p.id,
//       name: p.name,
//       ram: p.ram_gb,
//       vcpu: p.cpu_cores,
//       storage: p.storage_gb,
//       bandwidth: p.bandwidth_gb / 1000,
//       prices: {
//         monthly: parseFloat(p.monthly_price || "0"),
//         quarterly: parseFloat(p.quarterly_price || "0"),
//         semiannually: semiannualPrice,
//         annually: parseFloat(p.annual_price || "0"),
//         biennially: parseFloat(p.biennial_price || "0"),
//         triennially: parseFloat(p.triennial_price || "0"),
//       },
//       features: [
//         `${p.cpu_cores} vCPU`,
//         `${p.ram_gb}GB RAM`,
//         `${p.storage_gb}GB SSD Storage`,
//         `${p.bandwidth_gb / 1000}TB Bandwidth`,
//         // Add an informative feature based on plan type
//         p.plan_type && p.plan_type.toLowerCase().includes('cpu')
//           ? 'Dedicated CPU'
//           : p.plan_type && p.plan_type.toLowerCase().includes('memory')
//           ? 'High Memory Ratio'
//           : 'IPv4 Address',
//         'Console Access',
//         'Full Root Access'
//       ],
//       popular: ['G.8GB', 'C.8GB', 'M.16GB'].includes(p.name),
//       plan_type_label: planTypeLabel,
//       raw_plan_type: p.plan_type,
//     };
//   };

//   // ========== Categories (auto from backend) ==========
//   // uniquePlanTypes: array of raw plan_type strings in order of appearance
//   const uniquePlanTypes = useMemo(() => {
//     const seen = new Set<string>();
//     const list: string[] = [];
//     for (const p of plans) {
//       const t = p.plan_type ?? 'unknown';
//       if (!seen.has(t)) {
//         seen.add(t);
//         list.push(t);
//       }
//     }
//     return list;
//   }, [plans]);

//   // If no selectedType from query params, default to first backend category
//   useEffect(() => {
//     if (!selectedType) {
//       if (typeParam) {
//         setSelectedType(typeParam);
//       } else if (uniquePlanTypes.length > 0) {
//         setSelectedType(uniquePlanTypes[0]);
//       }
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [uniquePlanTypes, typeParam]); // intentionally not listing selectedType so it doesn't override user selection

//   // Map backend plan types to friendly tab objects
//   const planTypeTabs = useMemo(() => {
//     return uniquePlanTypes.map((raw) => ({
//       id: raw,
//       label: humanizePlanType(raw),
//       // choose icon based on keywords (fallback to Server)
//       icon:
//         raw.toLowerCase().includes('cpu') || raw.toLowerCase().includes('dedicated')
//           ? Zap
//           : raw.toLowerCase().includes('memory')
//           ? Database
//           : raw.toLowerCase().includes('vps') || raw.toLowerCase().includes('cloud')
//           ? Server
//           : Server,
//     }));
//   }, [uniquePlanTypes]);

//   // Default fallback tabs if backend returns empty list
//   const fallbackPlanTypes = [
//     { id: 'general_purpose', label: 'General Purpose VM', icon: Server },
//     { id: 'cpu_optimized', label: 'CPU Optimized VM', icon: Zap },
//     { id: 'memory_optimized', label: 'Memory Optimized VM', icon: Database },
//   ];

//   const effectiveTabs = planTypeTabs.length > 0 ? planTypeTabs : fallbackPlanTypes;

//   // ========== Filter & transform plans for UI based on raw backend category ==========
//   const currentPlans: Plan[] = useMemo(() => {
//     if (!selectedType) return [];
//     return plans
//       .filter((p) => (p.plan_type ?? 'unknown') === selectedType)
//       .map(transformPlanToUI);
//   }, [plans, selectedType]);

//   // friendly selectedPlanType (for headings)
//   const selectedPlanTypeLabel = useMemo(() => {
//     const tab = effectiveTabs.find((t) => t.id === selectedType);
//     return tab?.label || humanizePlanType(selectedType || '');
//   }, [effectiveTabs, selectedType]);

//   // ========== Pricing helpers ==========
//   const getDiscountPercent = () => {
//     const cycle = billingCycles.find(c => c.id === billingCycle);
//     return cycle?.discount || 0;
//   };

//   const calculateOriginalPrice = (plan: Plan) => {
//     const basePrice = plan.prices[billingCycle];
//     const months = billingCycle === 'monthly' ? 1 : billingCycle === 'quarterly' ? 3 : billingCycle === 'semiannually' ? 6 : billingCycle === 'annually' ? 12 : billingCycle === 'biennially' ? 24 : 36;
//     return Math.round(basePrice / months);
//   };

//   const calculateDisplayPrice = (plan: Plan) => {
//     const originalPrice = calculateOriginalPrice(plan);
//     const discount = getDiscountPercent();
//     return Math.round(originalPrice * (1 - discount / 100));
//   };

//   const getTotalPrice = (plan: Plan) => {
//     const basePrice = plan.prices[billingCycle];
//     const discount = getDiscountPercent();
//     return Math.round(basePrice * (1 - discount / 100));
//   };

//   const handleDeploy = (plan: Plan) => {
//     const serverConfig = {
//       planId: plan.id,
//       planName: plan.name,
//       planType: plan.raw_plan_type || selectedType,
//       vcpu: plan.vcpu,
//       ram: plan.ram,
//       storage: plan.storage,
//       bandwidth: plan.bandwidth,
//       billingCycle,
//       monthlyPrice: calculateDisplayPrice(plan),
//       totalPrice: getTotalPrice(plan),
//       discount: getDiscountPercent()
//     };

//     if (user) {
//       navigate('/checkout', { state: { serverConfig } });
//     } else {
//       navigate(`/login?redirect=${encodeURIComponent('/checkout')}`, { state: { serverConfig } });
//     }
//   };

//   // ========== Loading & Error UI ==========
//   if (loading) {
//     return (
//       <div className="bg-slate-950 min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
//           <p className="text-cyan-100">Loading pricing data...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="bg-slate-950 min-h-screen flex items-center justify-center p-6">
//         <div className="text-center max-w-xl">
//           <h2 className="text-2xl font-bold text-white mb-2">Failed to load plans</h2>
//           <p className="text-slate-300 mb-6">{error}</p>
//           <button onClick={() => fetchAllPlans()} className="px-4 py-2 rounded bg-cyan-600 text-white font-semibold">
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // ========== Render ==========
//   return (
//     <div className="bg-slate-950 min-h-screen">
//       <MobileFilters
//         billingCycle={billingCycle}
//         setBillingCycle={setBillingCycle}
//         selectedType={selectedType}
//         setSelectedType={setSelectedType}
//         planTypes={effectiveTabs.map(t => ({ id: t.id, name: t.label, icon: t.icon }))}
//         billingCycles={billingCycles}
//       />

//       {/* Header Section */}
//       <section className="text-white pt-6 pb-8 md:pt-12 md:pb-8">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center max-w-4xl mx-auto">
//             <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight">
//               Cloud Solutions Pricing
//             </h1>
//             <p className="text-lg md:text-xl mb-3 md:mb-4 text-cyan-100">
//               Enterprise-grade cloud servers powered by Intel® Xeon® Gold Processors
//             </p>
//             <p className="text-sm md:text-base text-cyan-200 mb-6">
//               Deploy in 5 minutes • Full Root Access • 1TB Bandwidth • 99.9% Uptime SLA
//             </p>
//             <div className="flex flex-wrap justify-center gap-3 text-xs md:text-sm">
//               <div className="flex items-center space-x-2 bg-white/10 px-3 md:px-4 py-2 rounded-lg backdrop-blur-sm">
//                 <MapPin className="h-3 w-3 md:h-4 md:w-4 text-cyan-300" />
//                 <span>Noida, India</span>
//               </div>
//               <div className="flex items-center space-x-2 bg-white/10 px-3 md:px-4 py-2 rounded-lg backdrop-blur-sm">
//                 <MapPin className="h-3 w-3 md:h-4 md:w-4 text-cyan-300" />
//                 <span>Milton Keynes, UK</span>
//               </div>
//               <div className="flex items-center space-x-2 bg-white/10 px-3 md:px-4 py-2 rounded-lg backdrop-blur-sm">
//                 <Clock className="h-3 w-3 md:h-4 md:w-4 text-cyan-300" />
//                 <span>24/7 Support</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Desktop: Filters + Results Side by Side */}
//       <section className="hidden md:block py-8 bg-slate-950">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="grid grid-cols-12 gap-6">
//             {/* Left Sidebar - Filters */}
//             <div className="col-span-3">
//               <div className="sticky top-4 bg-slate-900 rounded-2xl p-6 border-2 border-cyan-500 shadow-lg">
//                 <h3 className="text-xl font-bold text-white mb-6 flex items-center">
//                   <Server className="h-5 w-5 text-cyan-400 mr-2" />
//                   Configure Your Plan
//                 </h3>

//                 {/* Dynamic Server Type Filter (tabs) */}
//                 <div className="mb-6">
//                   <label className="block text-sm font-semibold text-white mb-3">
//                     Server Type
//                   </label>
//                   <div className="space-y-2">
//                     {effectiveTabs.map((type) => {
//                       const Icon = type.icon;
//                       return (
//                         <button
//                           key={type.id}
//                           onClick={() => setSelectedType(type.id)}
//                           className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all ${
//                             selectedType === type.id
//                               ? 'bg-cyan-600 text-white shadow-md'
//                               : 'bg-slate-800 text-slate-300 border border-cyan-500/30 hover:bg-slate-700'
//                           }`}
//                         >
//                           <Icon className="h-5 w-5" />
//                           <span className="text-sm">{type.label}</span>
//                         </button>
//                       );
//                     })}
//                   </div>
//                 </div>

//                 {/* Billing Cycle Filter */}
//                 <div className="mb-6">
//                   <label className="block text-sm font-semibold text-white mb-3">
//                     Billing Cycle
//                   </label>
//                   <div className="space-y-2">
//                     {billingCycles.map((cycle) => (
//                       <button
//                         key={cycle.id}
//                         onClick={() => setBillingCycle(cycle.id)}
//                         className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all ${
//                           billingCycle === cycle.id
//                             ? 'bg-cyan-600 text-white shadow-md'
//                             : 'bg-slate-800 text-slate-300 border border-cyan-500/30 hover:bg-slate-700'
//                         }`}
//                       >
//                         <span className="text-sm">{cycle.name}</span>
//                         {cycle.discount > 0 && (
//                           <span className={`text-xs px-2 py-1 rounded-full ${
//                             billingCycle === cycle.id ? 'bg-white/20' : 'bg-green-500/20 text-green-400'
//                           }`}>
//                             {cycle.discount}% off
//                           </span>
//                         )}
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Info Box */}
//                 <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
//                   <p className="text-xs text-cyan-100">
//                     <strong>Save up to {getDiscountPercent()}%</strong> on {billingCycle} billing
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Right Side - Scrollable Results */}
//             <div className="col-span-9">
//               <div className="bg-slate-900 rounded-2xl p-6 border-2 border-cyan-500">
//                 <div className="mb-6">
//                   <h2 className="text-2xl font-bold text-white mb-2">
//                     {selectedPlanTypeLabel} Plans
//                   </h2>
//                   <p className="text-slate-400">
//                     Showing {currentPlans.length} plans • Pricing per month
//                   </p>
//                 </div>

//                 {/* Scrollable Plans Container */}
//                 <div className="h-[800px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-cyan-500 scrollbar-track-slate-800">
//                   <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
//                     {currentPlans.map((plan, index) => (
//                       <div
//                         key={index}
//                         className={`bg-slate-950 rounded-xl shadow-lg overflow-hidden transition-all transform hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20 ${
//                           plan.popular ? 'ring-2 ring-cyan-500' : 'border border-cyan-500/30'
//                         }`}
//                       >
//                         {plan.popular && (
//                           <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-center py-2 text-xs font-bold">
//                             ⭐ MOST POPULAR
//                           </div>
//                         )}
//                         <div className="p-5">
//                           <div className="flex justify-between items-start mb-3">
//                             <h3 className="text-xl font-bold text-white">{plan.name}</h3>
//                             {getDiscountPercent() > 0 && (
//                               <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
//                                 {getDiscountPercent()}% OFF
//                               </div>
//                             )}
//                           </div>

//                           <div className="mb-4">
//                             {getDiscountPercent() > 0 && (
//                               <div className="text-xs text-slate-500 line-through mb-1">
//                                 ₹{calculateOriginalPrice(plan).toLocaleString()}/mo
//                               </div>
//                             )}
//                             <div className="flex items-baseline">
//                               <span className="text-3xl font-bold text-white">
//                                 ₹{calculateDisplayPrice(plan).toLocaleString()}
//                               </span>
//                               <span className="text-slate-400 ml-2 text-sm">/month</span>
//                             </div>
//                             {billingCycle !== 'monthly' && (
//                               <p className="text-xs text-green-600 mt-1 font-medium">
//                                 Total: ₹{getTotalPrice(plan).toLocaleString()}
//                               </p>
//                             )}
//                           </div>

//                           <div className="space-y-2 mb-4 border-t border-b border-cyan-500/30 py-3">
//                             <div className="flex items-center text-xs">
//                               <Cpu className="h-3 w-3 text-cyan-400 mr-2" />
//                               <span className="text-white">{plan.vcpu} vCPU</span>
//                             </div>
//                             <div className="flex items-center text-xs">
//                               <MemoryStick className="h-3 w-3 text-green-600 mr-2" />
//                               <span className="text-white">{plan.ram}GB RAM</span>
//                             </div>
//                             <div className="flex items-center text-xs">
//                               <HardDrive className="h-3 w-3 text-orange-600 mr-2" />
//                               <span className="text-white">{plan.storage}GB SSD</span>
//                             </div>
//                             <div className="flex items-center text-xs">
//                               <Network className="h-3 w-3 text-purple-600 mr-2" />
//                               <span className="text-white">{plan.bandwidth}TB Bandwidth</span>
//                             </div>
//                           </div>

//                           <ul className="space-y-1 mb-4">
//                             {plan.features.slice(4, 7).map((feature, i) => (
//                               <li key={i} className="flex items-start text-xs">
//                                 <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
//                                 <span className="text-slate-300">{feature}</span>
//                               </li>
//                             ))}
//                           </ul>

//                           <button
//                             onClick={() => handleDeploy(plan)}
//                             className={`block w-full text-center px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
//                               plan.popular
//                                 ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-500 hover:to-teal-500 shadow-md'
//                                 : 'bg-slate-800 text-cyan-400 hover:bg-slate-700 border border-cyan-500'
//                             }`}
//                           >
//                             Deploy Now
//                           </button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Mobile: Full Page Layout */}
//       <section className="md:hidden py-8 bg-slate-950">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-8">
//             <h2 className="text-2xl font-bold text-white mb-2">
//               {selectedPlanTypeLabel} Plans
//             </h2>
//             <p className="text-sm text-slate-400">
//               Save up to {getDiscountPercent()}% on {billingCycle} billing
//             </p>
//           </div>

//           <div className="grid grid-cols-1 gap-6">
//             {currentPlans.map((plan, index) => (
//               <div
//                 key={index}
//                 className={`bg-slate-900 rounded-2xl shadow-lg overflow-hidden transition-all ${
//                   plan.popular ? 'ring-2 ring-cyan-500 border-2 border-cyan-500' : 'border-2 border-cyan-500'
//                 }`}
//               >
//                 {plan.popular && (
//                   <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-center py-2.5 text-sm font-bold">
//                     ⭐ MOST POPULAR
//                   </div>
//                 )}
//                 <div className="p-6">
//                   <div className="flex justify-between items-start mb-4">
//                     <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
//                     {getDiscountPercent() > 0 && (
//                       <div className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold">
//                         SAVE {getDiscountPercent()}%
//                       </div>
//                     )}
//                   </div>

//                   <div className="mb-6">
//                     {getDiscountPercent() > 0 && (
//                       <div className="text-sm text-slate-500 line-through mb-1">
//                         ₹{calculateOriginalPrice(plan).toLocaleString()}/month
//                       </div>
//                     )}
//                     <div className="flex items-baseline">
//                       <span className="text-4xl font-bold text-white">
//                         ₹{calculateDisplayPrice(plan).toLocaleString()}
//                       </span>
//                       <span className="text-slate-400 ml-2">/month</span>
//                     </div>
//                     {billingCycle !== 'monthly' && (
//                       <p className="text-sm text-green-600 mt-2 font-medium">
//                         Total: ₹{getTotalPrice(plan).toLocaleString()} for {billingCycle}
//                       </p>
//                     )}
//                   </div>

//                   <div className="space-y-3 mb-6 border-t border-b border-cyan-500/30 py-4">
//                     <div className="flex items-center text-sm">
//                       <Cpu className="h-4 w-4 text-cyan-400 mr-2 flex-shrink-0" />
//                       <span className="font-semibold text-white">{plan.vcpu} vCPU</span>
//                     </div>
//                     <div className="flex items-center text-sm">
//                       <MemoryStick className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
//                       <span className="font-semibold text-white">{plan.ram}GB RAM</span>
//                     </div>
//                     <div className="flex items-center text-sm">
//                       <HardDrive className="h-4 w-4 text-orange-600 mr-2 flex-shrink-0" />
//                       <span className="font-semibold text-white">{plan.storage}GB SSD</span>
//                     </div>
//                     <div className="flex items-center text-sm">
//                       <Network className="h-4 w-4 text-purple-600 mr-2 flex-shrink-0" />
//                       <span className="font-semibold text-white">{plan.bandwidth}TB Bandwidth</span>
//                     </div>
//                   </div>

//                   <ul className="space-y-2 mb-6">
//                     {plan.features.slice(4).map((feature, i) => (
//                       <li key={i} className="flex items-start text-sm">
//                         <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
//                         <span className="text-slate-300">{feature}</span>
//                       </li>
//                     ))}
//                   </ul>

//                   <button
//                     onClick={() => handleDeploy(plan)}
//                     className={`block w-full text-center px-6 py-3.5 rounded-lg font-bold transition-all ${
//                       plan.popular
//                         ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-500 hover:to-teal-500 shadow-md'
//                         : 'bg-slate-800 text-cyan-400 hover:bg-slate-700 border-2 border-cyan-500'
//                     }`}
//                   >
//                     Deploy Now
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* All Plans Include */}
//       <section className="py-16 bg-slate-900">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-12">
//             <h2 className="text-3xl font-bold text-white mb-4">
//               All Plans Include
//             </h2>
//             <p className="text-lg text-slate-400">Enterprise features included at no extra cost</p>
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//             {[
//               { icon: Shield, title: 'DDoS Protection', desc: 'Advanced threat mitigation' },
//               { icon: Clock, title: '99.9% Uptime SLA', desc: 'Guaranteed availability' },
//               { icon: Server, title: 'SSD Storage', desc: 'High-performance NVMe' },
//               { icon: Network, title: 'IPv4 & IPv6', desc: 'Dual-stack networking' },
//               { icon: Zap, title: '5-Minute Deployment', desc: 'Rapid provisioning' },
//               { icon: Award, title: 'Intel Xeon Gold', desc: 'Enterprise processors' },
//               { icon: CheckCircle, title: 'Free Upgrades', desc: 'Flexible scaling options' },
//               { icon: Database, title: 'Automated Backups', desc: 'Daily snapshots included' },
//             ].map((feature, index) => (
//               <div key={index} className="bg-slate-950 p-6 rounded-xl shadow-sm hover:shadow-lg hover:shadow-cyan-500/30 transition border-2 border-cyan-500">
//                 <feature.icon className="h-10 w-10 text-cyan-400 mb-3" />
//                 <h3 className="font-bold text-white mb-1">{feature.title}</h3>
//                 <p className="text-sm text-slate-400">{feature.desc}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Choose the Right Plan */}
//       <section className="py-16 bg-slate-950">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-12">
//             <h2 className="text-3xl font-bold text-white mb-4">
//               Choose the Right Plan for Your Needs
//             </h2>
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             <div className="bg-slate-900 p-8 rounded-2xl border-2 border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/30 transition">
//               <Server className="h-12 w-12 text-cyan-400 mb-4" />
//               <h3 className="text-xl font-bold text-white mb-3">General Purpose VM</h3>
//               <p className="text-slate-300 mb-4">
//                 Balanced CPU and memory resources perfect for web applications, development environments, and small to medium databases.
//               </p>
//               <ul className="space-y-2 text-sm text-slate-400">
//                 <li>• Web hosting and CMS platforms</li>
//                 <li>• Application development</li>
//                 <li>• Small business workloads</li>
//                 <li>• Testing and staging environments</li>
//               </ul>
//             </div>

//             <div className="bg-slate-900 p-8 rounded-2xl border-2 border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/30 transition">
//               <Zap className="h-12 w-12 text-cyan-400 mb-4" />
//               <h3 className="text-xl font-bold text-white mb-3">CPU Optimized VM</h3>
//               <p className="text-slate-300 mb-4">
//                 Dedicated CPU cores with high-performance Intel Xeon processors for compute-intensive applications and workloads.
//               </p>
//               <ul className="space-y-2 text-sm text-slate-400">
//                 <li>• Video encoding and rendering</li>
//                 <li>• Scientific computing</li>
//                 <li>• High-traffic web servers</li>
//                 <li>• Batch processing workloads</li>
//               </ul>
//             </div>

//             <div className="bg-slate-900 p-8 rounded-2xl border-2 border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/30 transition">
//               <Database className="h-12 w-12 text-cyan-400 mb-4" />
//               <h3 className="text-xl font-bold text-white mb-3">Memory Optimized VM</h3>
//               <p className="text-slate-300 mb-4">
//                 High memory-to-CPU ratio designed for memory-intensive applications, large databases, and in-memory processing.
//               </p>
//               <ul className="space-y-2 text-sm text-slate-400">
//                 <li>• Large database systems</li>
//                 <li>• In-memory caching (Redis, Memcached)</li>
//                 <li>• Big data analytics</li>
//                 <li>• SAP HANA and enterprise apps</li>
//               </ul>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Contact / Custom */}
//       <section className="py-16  text-white">
//         <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
//           <h2 className="text-3xl md:text-4xl font-bold mb-4">
//             Need a Custom Solution?
//           </h2>
//           <p className="text-xl mb-3 text-cyan-100">
//             Contact our sales team for enterprise pricing, custom configurations, and dedicated support
//           </p>
//           <p className="text-lg mb-8 text-cyan-200">
//             📞 +91 120 416 8464 • Mon-Sat 9:00-18:00
//           </p>
//           <Link
//             to="/contact"
//             className="inline-block px-8 py-4  text-cyan-600 rounded-lg font-bold  transition transform hover:scale-105 shadow-lg border-2 border-cyan-400"
//           >
//             Contact Sales Team
//           </Link>
//         </div>
//       </section>
//     </div>
//   );
// }



import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Server,
  Zap,
  Database,
  MapPin,
  Clock,
  Shield,
  Award,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
} from 'lucide-react';
import { MobileFilters } from '../components/pricing/MobileFilters';
import { useAuth } from '../contexts/AuthContext';
import { useHostingPlansStore, type HostingPlan } from "../stores/PlansStore";

type BillingCycle = 'monthly' | 'quarterly' | 'semiannually' | 'annually' | 'biennially' | 'triennially';

interface Plan {
  id: number;
  name: string;
  ram: number;
  vcpu: number;
  storage: number;
  bandwidth: number;
  prices: {
    monthly: number;
    quarterly: number;
    semiannually: number;
    annually: number;
    biennially: number;
    triennially: number;
  };
  features: string[];
  popular?: boolean;
  plan_type_label?: string; // friendly label
  raw_plan_type?: string; // backend plan_type preserved
}

/* ---------------------------
   Pricing helpers (paise math)
   --------------------------- */

// convert rupees (number) -> paise (integer)
const toPaise = (rupees: number) => Math.round(rupees * 100);

// convert paise -> rupees (float)
const fromPaise = (paise: number) => paise / 100;

// months in cycle
const monthsForCycle = (cycle: BillingCycle) => {
  switch (cycle) {
    case 'monthly': return 1;
    case 'quarterly': return 3;
    case 'semiannually': return 6;
    case 'annually': return 12;
    case 'biennially': return 24;
    case 'triennially': return 36;
    default: return 1;
  }
};

// format rupee amount (rounded rupee, no paise)
const formatRupeeRounded = (r: number) => Math.round(r).toLocaleString();

/* ---------------------------
   Component
   --------------------------- */
export function Pricing() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const typeParam = searchParams.get('type');

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [selectedType, setSelectedType] = useState<string>(typeParam || '');

  // Zustand store
  const { fetchAllPlans, plans, loading, error } = useHostingPlansStore();

  // Fetch plans once (on mount)
  useEffect(() => {
    fetchAllPlans();
  }, [fetchAllPlans]);

  // ========== Billing cycles (UI) ==========
  const billingCycles = [
    { id: 'monthly' as BillingCycle, name: 'Monthly', discount: 5 },
    { id: 'quarterly' as BillingCycle, name: 'Quarterly', discount: 10 },
    { id: 'semiannually' as BillingCycle, name: 'Semi-Annually', discount: 15 },
    { id: 'annually' as BillingCycle, name: 'Annually', discount: 20 },
    { id: 'biennially' as BillingCycle, name: 'Biennially', discount: 25 },
    { id: 'triennially' as BillingCycle, name: 'Triennially', discount: 35 },
  ];

  // ========== Helpers ==========
  const humanizePlanType = (raw: string) =>
    raw
      .replace(/[_\-]/g, ' ')
      .replace(/\b([a-z])/g, (m) => m.toUpperCase());

  // Defensive: read discount percent for the currently selected cycle
  const getDiscountPercent = () => {
    const cycle = billingCycles.find(c => c.id === billingCycle);
    return cycle?.discount || 0;
  };

  // compute pricing for a plan (assumes plan.prices.monthly is per-month rupees)
  const computePricing = (plan: Plan) => {
    // figure monthly rupees (defensive parsing)
    const monthlyRupees = Number(plan.prices?.monthly ?? 0) || 0;
    const months = monthsForCycle(billingCycle);
    const discountPercent = getDiscountPercent();

    // convert to paise
    const monthlyPaise = toPaise(monthlyRupees);

    // cycle total before discount (paise)
    const cycleTotalBeforePaise = Math.round(monthlyPaise * months);

    // cycle total after discount (apply integer math)
    const cycleTotalAfterPaise = Math.round(cycleTotalBeforePaise * (100 - discountPercent) / 100);

    // per-month after discount (paise) - divide then round to nearest paise
    const perMonthAfterPaise = Math.round(cycleTotalAfterPaise / months);

    return {
      monthlyUnitRupees: monthlyRupees,
      perMonthAfterDiscountRupees: fromPaise(perMonthAfterPaise),
      cycleTotalAfterDiscountRupees: fromPaise(cycleTotalAfterPaise),
      // original (per-month) for showing strike-through
      originalPerMonthRupees: monthlyRupees,
    };
  };

  // Transform HostingPlan (backend) -> Plan (UI)
  const transformPlanToUI = (p: HostingPlan): Plan => {
    // canonical: treat p.monthly_price as per-month rupees (fallbacks included)
    const monthly = parseFloat(String(p.monthly_price ?? p.base_price ?? 0)) || 0;

    const monthsMap: Record<string, number> = {
      monthly: 1,
      quarterly: 3,
      semiannually: 6,
      annually: 12,
      biennially: 24,
      triennially: 36,
    };

    const prices: Plan['prices'] = {
      monthly: monthly,
      quarterly: Math.round(monthly * monthsMap.quarterly),
      semiannually: Math.round(monthly * monthsMap.semiannually),
      annually: Math.round(monthly * monthsMap.annually),
      biennially: Math.round(monthly * monthsMap.biennially),
      triennially: Math.round(monthly * monthsMap.triennially),
    };

    const planTypeLabel = humanizePlanType(p.plan_type || '');

    return {
      id: p.id,
      name: p.name,
      ram: p.ram_gb,
      vcpu: p.cpu_cores,
      storage: p.storage_gb,
      bandwidth: p.bandwidth_gb / 1000,
      prices,
      features: [
        `${p.cpu_cores} vCPU`,
        `${p.ram_gb}GB RAM`,
        `${p.storage_gb}GB SSD Storage`,
        `${p.bandwidth_gb / 1000}TB Bandwidth`,
        p.plan_type && p.plan_type.toLowerCase().includes('cpu') ? 'Dedicated CPU'
          : p.plan_type && p.plan_type.toLowerCase().includes('memory') ? 'High Memory Ratio'
            : 'IPv4 Address',
        'Console Access',
        'Full Root Access'
      ],
      popular: ['G.8GB', 'C.8GB', 'M.16GB'].includes(p.name),
      plan_type_label: planTypeLabel,
      raw_plan_type: p.plan_type,
    };
  };

  // ========== Categories (auto from backend) ==========
  const uniquePlanTypes = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const p of plans) {
      const t = p.plan_type ?? 'unknown';
      if (!seen.has(t)) {
        seen.add(t);
        list.push(t);
      }
    }
    return list;
  }, [plans]);

  useEffect(() => {
    if (!selectedType) {
      if (typeParam) {
        setSelectedType(typeParam);
      } else if (uniquePlanTypes.length > 0) {
        setSelectedType(uniquePlanTypes[0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniquePlanTypes, typeParam]);

  const planTypeTabs = useMemo(() => {
    return uniquePlanTypes.map((raw) => ({
      id: raw,
      label: humanizePlanType(raw),
      icon:
        raw.toLowerCase().includes('cpu') || raw.toLowerCase().includes('dedicated')
          ? Zap
          : raw.toLowerCase().includes('memory')
            ? Database
            : raw.toLowerCase().includes('vps') || raw.toLowerCase().includes('cloud')
              ? Server
              : Server,
    }));
  }, [uniquePlanTypes]);

  const fallbackPlanTypes = [
    { id: 'general_purpose', label: 'General Purpose VM', icon: Server },
    { id: 'cpu_optimized', label: 'CPU Optimized VM', icon: Zap },
    { id: 'memory_optimized', label: 'Memory Optimized VM', icon: Database },
  ];

  const effectiveTabs = planTypeTabs.length > 0 ? planTypeTabs : fallbackPlanTypes;

  // ========== Filter & transform plans for UI based on raw backend category ==========
  const currentPlans: Plan[] = useMemo(() => {
    if (!selectedType) return [];
    return plans
      .filter((p) => (p.plan_type ?? 'unknown') === selectedType)
      .map(transformPlanToUI);
  }, [plans, selectedType]);

  // friendly selectedPlanType (for headings)
  const selectedPlanTypeLabel = useMemo(() => {
    const tab = effectiveTabs.find((t) => t.id === selectedType);
    return tab?.label || humanizePlanType(selectedType || '');
  }, [effectiveTabs, selectedType]);

  // ========== Deploy handler (uses computePricing) ==========
  const handleDeploy = (plan: Plan) => {
    const pricing = computePricing(plan);
    const serverConfig = {
      planId: plan.id,
      planName: plan.name,
      planType: plan.raw_plan_type || selectedType,
      vcpu: plan.vcpu,
      ram: plan.ram,
      storage: plan.storage,
      bandwidth: plan.bandwidth,
      billingCycle,
      // round per your display decision — here we store precise rupees (float)
      monthlyPrice: Math.round(pricing.perMonthAfterDiscountRupees), // rupees rounded
      totalPrice: Math.round(pricing.cycleTotalAfterDiscountRupees), // rupees rounded
      discount: getDiscountPercent()
    };

    if (user) {
      navigate('/checkout', { state: { serverConfig } });
    } else {
      navigate(`/login?redirect=${encodeURIComponent('/checkout')}`, { state: { serverConfig } });
    }
  };

  // ========== Loading & Error UI ==========
  if (loading) {
    return (
      <div className="bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-cyan-100">Loading pricing data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-950 min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-xl">
          <h2 className="text-2xl font-bold text-white mb-2">Failed to load plans</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <button onClick={() => fetchAllPlans()} className="px-4 py-2 rounded bg-cyan-600 text-white font-semibold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ========== Render ==========
  return (
    <div className="bg-slate-950 min-h-screen">
      <MobileFilters
        billingCycle={billingCycle}
        setBillingCycle={setBillingCycle}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        planTypes={effectiveTabs.map(t => ({ id: t.id, name: t.label, icon: t.icon }))}
        billingCycles={billingCycles}
      />

      {/* Header Section */}
      <section className="text-white pt-6 pb-8 md:pt-12 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight">
              Cloud Solutions Pricing
            </h1>
            <p className="text-lg md:text-xl mb-3 md:mb-4 text-cyan-100">
              Enterprise-grade cloud servers powered by Intel® Xeon® Gold Processors
            </p>
            <p className="text-sm md:text-base text-cyan-200 mb-6">
              Deploy in 5 minutes • Full Root Access • 1TB Bandwidth • 99.9% Uptime SLA
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-xs md:text-sm">
              <div className="flex items-center space-x-2 bg-white/10 px-3 md:px-4 py-2 rounded-lg backdrop-blur-sm">
                <MapPin className="h-3 w-3 md:h-4 md:w-4 text-cyan-300" />
                <span>Noida, India</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 px-3 md:px-4 py-2 rounded-lg backdrop-blur-sm">
                <MapPin className="h-3 w-3 md:h-4 md:w-4 text-cyan-300" />
                <span>Milton Keynes, UK</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 px-3 md:px-4 py-2 rounded-lg backdrop-blur-sm">
                <Clock className="h-3 w-3 md:h-4 md:w-4 text-cyan-300" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Desktop: Filters + Results Side by Side */}
      <section className="hidden md:block py-8 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar - Filters */}
            <div className="col-span-3">
              <div className="sticky top-4 bg-slate-900 rounded-2xl p-6 border-2 border-cyan-500 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <Server className="h-5 w-5 text-cyan-400 mr-2" />
                  Configure Your Plan
                </h3>

                {/* Dynamic Server Type Filter (tabs) */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-white mb-3">
                    Server Type
                  </label>
                  <div className="space-y-2">
                    {effectiveTabs.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.id}
                          onClick={() => setSelectedType(type.id)}
                          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all ${selectedType === type.id
                            ? 'bg-cyan-600 text-white shadow-md'
                            : 'bg-slate-800 text-slate-300 border border-cyan-500/30 hover:bg-slate-700'
                            }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-sm">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Billing Cycle Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-white mb-3">
                    Billing Cycle
                  </label>
                  <div className="space-y-2">
                    {billingCycles.map((cycle) => (
                      <button
                        key={cycle.id}
                        onClick={() => setBillingCycle(cycle.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all ${billingCycle === cycle.id
                          ? 'bg-cyan-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-300 border border-cyan-500/30 hover:bg-slate-700'
                          }`}
                      >
                        <span className="text-sm">{cycle.name}</span>
                        {cycle.discount > 0 && (
                          <span className={`text-xs px-2 py-1 rounded-full ${billingCycle === cycle.id ? 'bg-white/20' : 'bg-green-500/20 text-green-400'
                            }`}>
                            {cycle.discount}% off
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                  <p className="text-xs text-cyan-100">
                    <strong>Save up to {getDiscountPercent()}%</strong> on {billingCycle} billing
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side - Scrollable Results */}
            <div className="col-span-9">
              <div className="bg-slate-900 rounded-2xl p-6 border-2 border-cyan-500">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {selectedPlanTypeLabel} Plans
                  </h2>
                  <p className="text-slate-400">
                    Showing {currentPlans.length} plans • Pricing per month
                  </p>
                </div>

                {/* Scrollable Plans Container */}
                <div className="h-[800px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-cyan-500 scrollbar-track-slate-800">
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {currentPlans.map((plan, index) => {
                      const pricing = computePricing(plan);
                      return (
                        <div
                          key={index}
                          className={`bg-slate-950 rounded-xl shadow-lg overflow-hidden transition-all transform hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20 ${plan.popular ? 'ring-2 ring-cyan-500' : 'border border-cyan-500/30'
                            }`}
                        >
                          {plan.popular && (
                            <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-center py-2 text-xs font-bold">
                              ⭐ MOST POPULAR
                            </div>
                          )}
                          <div className="p-5">
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                              {getDiscountPercent() > 0 && (
                                <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                                  {getDiscountPercent()}% OFF
                                </div>
                              )}
                            </div>

                            <div className="mb-4">
                              {getDiscountPercent() > 0 && (
                                <div className="text-xs text-slate-500 line-through mb-1">
                                  ₹{formatRupeeRounded(pricing.originalPerMonthRupees)}/mo
                                </div>
                              )}
                              <div className="flex items-baseline">
                                <span className="text-3xl font-bold text-white">
                                  ₹{formatRupeeRounded(pricing.perMonthAfterDiscountRupees)}
                                </span>
                                <span className="text-slate-400 ml-2 text-sm">/month</span>
                              </div>
                              {billingCycle !== 'monthly' && (
                                <p className="text-xs text-green-600 mt-1 font-medium">
                                  Total: ₹{formatRupeeRounded(pricing.cycleTotalAfterDiscountRupees)}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2 mb-4 border-t border-b border-cyan-500/30 py-3">
                              <div className="flex items-center text-xs">
                                <Cpu className="h-3 w-3 text-cyan-400 mr-2" />
                                <span className="text-white">{plan.vcpu} vCPU</span>
                              </div>
                              <div className="flex items-center text-xs">
                                <MemoryStick className="h-3 w-3 text-green-600 mr-2" />
                                <span className="text-white">{plan.ram}GB RAM</span>
                              </div>
                              <div className="flex items-center text-xs">
                                <HardDrive className="h-3 w-3 text-orange-600 mr-2" />
                                <span className="text-white">{plan.storage}GB SSD</span>
                              </div>
                              <div className="flex items-center text-xs">
                                <Network className="h-3 w-3 text-purple-600 mr-2" />
                                <span className="text-white">{plan.bandwidth}TB Bandwidth</span>
                              </div>
                            </div>

                            <ul className="space-y-1 mb-4">
                              {plan.features.slice(4, 7).map((feature, i) => (
                                <li key={i} className="flex items-start text-xs">
                                  <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                  <span className="text-slate-300">{feature}</span>
                                </li>
                              ))}
                            </ul>

                            <button
                              onClick={() => handleDeploy(plan)}
                              className={`block w-full text-center px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${plan.popular
                                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-500 hover:to-teal-500 shadow-md'
                                : 'bg-slate-800 text-cyan-400 hover:bg-slate-700 border border-cyan-500'
                                }`}
                            >
                              Deploy Now
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile: Full Page Layout */}
      <section className="md:hidden py-8 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {selectedPlanTypeLabel} Plans
            </h2>
            <p className="text-sm text-slate-400">
              Save up to {getDiscountPercent()}% on {billingCycle} billing
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {currentPlans.map((plan, index) => {
              const pricing = computePricing(plan);
              return (
                <div
                  key={index}
                  className={`bg-slate-900 rounded-2xl shadow-lg overflow-hidden transition-all ${plan.popular ? 'ring-2 ring-cyan-500 border-2 border-cyan-500' : 'border-2 border-cyan-500'
                    }`}
                >
                  {plan.popular && (
                    <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-center py-2.5 text-sm font-bold">
                      ⭐ MOST POPULAR
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                      {getDiscountPercent() > 0 && (
                        <div className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold">
                          SAVE {getDiscountPercent()}%
                        </div>
                      )}
                    </div>

                    <div className="mb-6">
                      {getDiscountPercent() > 0 && (
                        <div className="text-sm text-slate-500 line-through mb-1">
                          ₹{formatRupeeRounded(pricing.originalPerMonthRupees)}/month
                        </div>
                      )}
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-white">
                          ₹{formatRupeeRounded(pricing.perMonthAfterDiscountRupees)}
                        </span>
                        <span className="text-slate-400 ml-2">/month</span>
                      </div>
                      {billingCycle !== 'monthly' && (
                        <p className="text-sm text-green-600 mt-2 font-medium">
                          Total: ₹{formatRupeeRounded(pricing.cycleTotalAfterDiscountRupees)} for {billingCycle}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 mb-6 border-t border-b border-cyan-500/30 py-4">
                      <div className="flex items-center text-sm">
                        <Cpu className="h-4 w-4 text-cyan-400 mr-2 flex-shrink-0" />
                        <span className="font-semibold text-white">{plan.vcpu} vCPU</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <MemoryStick className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                        <span className="font-semibold text-white">{plan.ram}GB RAM</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <HardDrive className="h-4 w-4 text-orange-600 mr-2 flex-shrink-0" />
                        <span className="font-semibold text-white">{plan.storage}GB SSD</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Network className="h-4 w-4 text-purple-600 mr-2 flex-shrink-0" />
                        <span className="font-semibold text-white">{plan.bandwidth}TB Bandwidth</span>
                      </div>
                    </div>

                    <ul className="space-y-2 mb-6">
                      {plan.features.slice(4).map((feature, i) => (
                        <li key={i} className="flex items-start text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleDeploy(plan)}
                      className={`block w-full text-center px-6 py-3.5 rounded-lg font-bold transition-all ${plan.popular
                        ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-500 hover:to-teal-500 shadow-md'
                        : 'bg-slate-800 text-cyan-400 hover:bg-slate-700 border-2 border-cyan-500'
                        }`}
                    >
                      Deploy Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* All Plans Include */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              All Plans Include
            </h2>
            <p className="text-lg text-slate-400">Enterprise features included at no extra cost</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'DDoS Protection', desc: 'Advanced threat mitigation' },
              { icon: Clock, title: '99.9% Uptime SLA', desc: 'Guaranteed availability' },
              { icon: Server, title: 'SSD Storage', desc: 'High-performance NVMe' },
              { icon: Network, title: 'IPv4 & IPv6', desc: 'Dual-stack networking' },
              { icon: Zap, title: '5-Minute Deployment', desc: 'Rapid provisioning' },
              { icon: Award, title: 'Intel Xeon Gold', desc: 'Enterprise processors' },
              { icon: CheckCircle, title: 'Free Upgrades', desc: 'Flexible scaling options' },
              { icon: Database, title: 'Automated Backups', desc: 'Daily snapshots included' },
            ].map((feature, index) => (
              <div key={index} className="bg-slate-950 p-6 rounded-xl shadow-sm hover:shadow-lg hover:shadow-cyan-500/30 transition border-2 border-cyan-500">
                <feature.icon className="h-10 w-10 text-cyan-400 mb-3" />
                <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Choose the Right Plan */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Choose the Right Plan for Your Needs
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900 p-8 rounded-2xl border-2 border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/30 transition">
              <Server className="h-12 w-12 text-cyan-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">General Purpose VM</h3>
              <p className="text-slate-300 mb-4">
                Balanced CPU and memory resources perfect for web applications, development environments, and small to medium databases.
              </p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>• Web hosting and CMS platforms</li>
                <li>• Application development</li>
                <li>• Small business workloads</li>
                <li>• Testing and staging environments</li>
              </ul>
            </div>

            <div className="bg-slate-900 p-8 rounded-2xl border-2 border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/30 transition">
              <Zap className="h-12 w-12 text-cyan-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">CPU Optimized VM</h3>
              <p className="text-slate-300 mb-4">
                Dedicated CPU cores with high-performance Intel Xeon processors for compute-intensive applications and workloads.
              </p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>• Video encoding and rendering</li>
                <li>• Scientific computing</li>
                <li>• High-traffic web servers</li>
                <li>• Batch processing workloads</li>
              </ul>
            </div>

            <div className="bg-slate-900 p-8 rounded-2xl border-2 border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/30 transition">
              <Database className="h-12 w-12 text-cyan-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Memory Optimized VM</h3>
              <p className="text-slate-300 mb-4">
                High memory-to-CPU ratio designed for memory-intensive applications, large databases, and in-memory processing.
              </p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>• Large database systems</li>
                <li>• In-memory caching (Redis, Memcached)</li>
                <li>• Big data analytics</li>
                <li>• SAP HANA and enterprise apps</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact / Custom */}
      <section className="py-16  text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Need a Custom Solution?
          </h2>
          <p className="text-xl mb-3 text-cyan-100">
            Contact our sales team for enterprise pricing, custom configurations, and dedicated support
          </p>
          <p className="text-lg mb-8 text-cyan-200">
            📞 +91 120 416 8464 • Mon-Sat 9:00-18:00
          </p>
          <Link
            to="/contact"
            className="inline-block px-8 py-4  text-cyan-600 rounded-lg font-bold  transition transform hover:scale-105 shadow-lg border-2 border-cyan-400"
          >
            Contact Sales Team
          </Link>
        </div>
      </section>
    </div>
  );
}
