import { Link } from 'react-router-dom';
import { Server, Cpu, HardDrive, Network, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../lib/api';

interface ServerType {
  id: number;
  name: string;
  monthly_price: number;
  cpu_cores: number;
  ram_gb: number;
  storage_gb: number;
  bandwidth_gb: number;
  features: string[];
  is_featured: boolean;
  plan_type?: string;
}

export function DedicatedServers() {
  const [servers, setServers] = useState<ServerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔥 Flexible matcher to detect all "dedicated" variations
  const isDedicatedType = (type: string | undefined): boolean => {
    if (!type) return false;
    const t = type.toLowerCase();
    return (
      t.includes("dedicated") ||
      t.includes("baremetal") ||
      t.includes("bare-metal") ||
      t.includes("bare_metal") ||
      t.includes("metal")
    );
  };

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/plans/all`);

        if (!response.ok) {
          throw new Error('Failed to fetch servers');
        }

        const data = await response.json();

        // 🔥 Auto-detect dedicated plans from backend
        const dedicatedServers = data.filter((plan: ServerType) =>
          isDedicatedType(plan.plan_type)
        );

        setServers(dedicatedServers);
      } catch (err) {
        setError('Failed to load servers. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchServers();
  }, []);

  // Your existing loading UI
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-cyan-100 text-xl font-medium animate-pulse">Loading hardware config...</div>
        </div>
      </div>
    );
  }

  // Your existing error UI
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-950 px-4">
        <div className="text-center max-w-md p-6 bg-slate-900 border border-red-500/50 rounded-xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Connection Error</h3>
          <div className="text-slate-300 mb-6">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Continue with your existing component
  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">

      {/* --- HERO + FEATURES + SERVER CARDS --- */}
      {/* (Your entire UI remains unchanged below) */}

      {/* Hero Section */}
      <section className="text-white py-12 md:py-20 lg:py-24 relative overflow-hidden">
        {/* background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              Bare Metal <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">Dedicated Servers</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Maximum performance with dedicated hardware. No shared resources, complete control, and unmatched reliability.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 md:py-16 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Cpu, title: 'Latest Hardware', desc: 'Intel Xeon & AMD EPYC' },
              { icon: HardDrive, title: 'NVMe Storage', desc: 'Enterprise Gen4 SSDs' },
              { icon: Network, title: 'Premium Network', desc: 'Up to 10Gbps Uplink' },
              { icon: Shield, title: 'DDoS Protection', desc: 'Always-on Mitigation' },
            ].map((item, index) => (
              <div
                key={index}
                className="group bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-4 group-hover:bg-cyan-900/20 transition-colors">
                  <item.icon className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Title */}
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Choose Your Powerhouse
            </h2>
            <p className="text-lg text-slate-400">
              Instant provisioning with full root access & IPMI
            </p>
          </div>

          {/* If no dedicated servers returned */}
          {servers.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 relative overflow-hidden p-8 sm:p-12 rounded-2xl text-center max-w-4xl mx-auto shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none"></div>

              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6">
                Infrastructure Upgrade in Progress
              </h3>

              <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
                We’re upgrading our data centers to bring you even faster, more secure, and more reliable bare-metal servers. The next generation is arriving soon.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-left max-w-2xl mx-auto mb-10">
                {[
                  "Next-Gen Intel & AMD Processors",
                  "NVMe Gen4 Ultra-fast Storage",
                  "10Gbps / 40Gbps Network Uplinks",
                  "Advanced AI-Driven DDoS Protection",
                  "Full Root & IPMI/KVM Access"
                ].map((feature, i) => (
                  <div key={i} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-cyan-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-400 text-sm sm:text-base">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <p className="text-cyan-300 font-medium">Need something urgent?</p>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center px-8 py-3 rounded-lg font-bold 
                    bg-gradient-to-r from-cyan-600 to-teal-600 text-white 
                    hover:from-cyan-500 hover:to-teal-500 transition-all shadow-lg shadow-cyan-900/20 w-full sm:w-auto"
                >
                  Contact Sales Team
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
              {servers.map((server) => (
                <div
                  key={server.id}
                  className={`flex flex-col bg-slate-900 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                    server.is_featured
                      ? 'ring-2 ring-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative transform md:scale-105 z-10'
                      : 'border border-slate-800 hover:border-cyan-500/30 hover:shadow-xl'
                  }`}
                >
                  {server.is_featured && (
                    <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">
                      Best Value
                    </div>
                  )}

                  <div className="p-6 sm:p-8 flex-grow flex flex-col">
                    {/* Icon */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="p-3 bg-slate-800 rounded-lg">
                        <Server className="h-8 w-8 text-cyan-400" />
                      </div>
                      {server.is_featured && (
                        <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded-full font-medium">
                          Top Rated
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                      {server.name}
                    </h3>

                    {/* Price */}
                    <div className="flex items-baseline gap-1 mb-8">
                      <span className="text-3xl sm:text-4xl font-bold text-white">
                        ₹{server.monthly_price.toLocaleString()}
                      </span>
                      <span className="text-slate-500 font-medium">/mo</span>
                    </div>

                    {/* Specs */}
                    <div className="grid grid-cols-2 gap-4 mb-8 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Cores</p>
                        <p className="font-semibold text-white flex items-center gap-1">
                          <Cpu className="w-4 h-4 text-cyan-500/70" /> {server.cpu_cores}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">RAM</p>
                        <p className="font-semibold text-white flex items-center gap-1">
                          <HardDrive className="w-4 h-4 text-cyan-500/70" /> {server.ram_gb}GB
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Storage</p>
                        <p className="font-semibold text-white">
                          {server.storage_gb}GB SSD
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Transfer</p>
                        <p className="font-semibold text-white">
                          {server.bandwidth_gb}GB
                        </p>
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8 flex-grow">
                      {server.features.map((feature, i) => (
                        <li key={i} className="flex items-start text-sm">
                          <CheckCircle className="h-5 w-5 text-teal-500 mr-3 flex-shrink-0" />
                          <span className="text-slate-300 leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Button */}
                    <Link
                      to="/signup"
                      className={`block w-full text-center px-6 py-3.5 rounded-lg font-bold transition-all ${
                        server.is_featured
                          ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:from-cyan-400 hover:to-teal-400 shadow-lg shadow-cyan-500/20'
                          : 'bg-slate-800 text-white hover:bg-slate-700 hover:text-cyan-400 border border-transparent hover:border-cyan-500/30'
                      }`}
                    >
                      Deploy Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Custom Config Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6">
            Need a Custom Configuration?
          </h2>
          <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            We specialize in high-performance clusters and custom builds. Tell us your requirements and we'll engineer the perfect solution.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-8 py-4 rounded-lg font-semibold 
                border-2 border-cyan-500 text-cyan-400 
                hover:bg-cyan-500/10 hover:text-cyan-300 transition w-full sm:w-auto"
            >
              Talk to an Expert
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
