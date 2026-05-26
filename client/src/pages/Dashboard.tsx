import { apiFetch } from '../utils/api';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Policy, Claim, Activity as AppActivity } from '../types';
import { FileText, FileWarning, Clock, ArrowDown, ArrowUp, Filter, Download, Plus, ChevronDown, Check, CircleDot, Activity, X, DollarSign } from 'lucide-react';
import Spinner from '../components/Spinner';
import StatCard from '../components/StatCard';
import { exportToCSV } from '../utils/export';
import { getActivities } from '../utils/activity';
import { toast } from 'react-toastify';

export default function Dashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPolicies: 0,
    totalClaims: 0,
    pendingClaims: 0
  });

  const [financials, setFinancials] = useState({
    totalIncome: 0,
    totalPaid: 0,
    profit: 0,
    weeklyAverage: 0,
    annualAverage: 0
  });
  
  const [chartBars, setChartBars] = useState<number[]>(Array(12).fill(0));

  const [recentClaims, setRecentClaims] = useState<Claim[]>([]);
  const [recentActivities, setRecentActivities] = useState<AppActivity[]>([]);
  
  const [userData, setUserData] = useState<{policies: Policy[], claims: Claim[]}>({ policies: [], claims: [] });

  useEffect(() => {
    setIsLoading(true);

    const fetchData = async () => {
      try {
        const [policiesRes, claimsRes] = await Promise.all([
          apiFetch('/api/policies'),
          apiFetch('/api/claims')
        ]);

        let policies = [];
        let claims = [];

        if (policiesRes.ok) policies = await policiesRes.json();
        if (claimsRes.ok) claims = await claimsRes.json();

        const userPolicies = user?.role === 'admin' ? policies : policies.filter((p: Policy) => p.userId === user?.id);
        const userClaims = user?.role === 'admin' ? claims : claims.filter((c: Claim) => c.userId === user?.id);

        setUserData({ policies: userPolicies, claims: userClaims });

        setStats({
          totalPolicies: userPolicies.length,
          totalClaims: userClaims.length,
          pendingClaims: userClaims.filter((c: Claim) => c.status === 'pending').length
        });
        
        const totalIncome = userPolicies.reduce((sum: number, p: Policy) => sum + (p.premium || 0), 0);
        const totalPaid = userClaims.filter((c: Claim) => c.status === 'approved').reduce((sum: number, c: Claim) => sum + (c.amount || 0), 0);
        const profit = totalIncome - totalPaid;

        let weeklyAverage = 0;
        let calculatedBars = Array(12).fill(0);
        
        if (userPolicies.length > 0) {
          const weeklyIncomeMap: Record<string, number> = {};
          
          userPolicies.forEach((p: Policy) => {
            const d = (p as any).createdAt ? new Date((p as any).createdAt) : new Date();
            const dCpy = new Date(d);
            dCpy.setHours(0, 0, 0, 0);
            dCpy.setDate(dCpy.getDate() - dCpy.getDay()); 
            const weekKey = dCpy.toISOString();
            
            if (!weeklyIncomeMap[weekKey]) {
              weeklyIncomeMap[weekKey] = 0;
            }
            weeklyIncomeMap[weekKey] += (p.premium || 0);
          });
          
          const weekKeys = Object.keys(weeklyIncomeMap).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
          const totalWeeklyIncome = weekKeys.reduce((sum, key) => sum + weeklyIncomeMap[key], 0);
          weeklyAverage = totalWeeklyIncome / (weekKeys.length || 1);
          
          const maxIncome = Math.max(...Object.values(weeklyIncomeMap), 1); // Avoid div by 0
          const topWeeks = weekKeys.slice(-12);
          
          const barHeights = topWeeks.map(key => (weeklyIncomeMap[key] / maxIncome) * 100);
          
          // Pad to exactly 12 bars, adding zeros at the start (older weeks)
          while (barHeights.length < 12) {
              barHeights.unshift(0);
          }
          calculatedBars = barHeights;
        }
        
        setChartBars(calculatedBars);
        
        const annualAverage = weeklyAverage * 52;

        setFinancials({
          totalIncome,
          totalPaid,
          profit,
          weeklyAverage,
          annualAverage
        });

        setRecentClaims(userClaims.slice(0, 5));
        
        if (user) {
          const activities = await getActivities(user.id);
          setRecentActivities(activities.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleExport = async () => {
    try {
      const response = await apiFetch('/api/policies');
      let policies: Policy[] = response.ok ? await response.json() : [];
      const claimsRes = await apiFetch('/api/claims');
      let claims: Claim[] = claimsRes.ok ? await claimsRes.json() : [];

      if (user?.role !== 'admin') {
        policies = policies.filter(p => p.userId === user?.id);
        claims = claims.filter(c => c.userId === user?.id);
      }

      if (policies.length > 0) exportToCSV(policies, 'policies_export');
      if (claims.length > 0) exportToCSV(claims, 'claims_export');
      
      toast.success('Data exported successfully');
    } catch (e) {
      toast.error('Failed to export data');
    }
  };

  return (
    <Layout>
      {isLoading ? (
        <div className="flex xl:h-[600px] items-center justify-center">
          <Spinner size={32} />
        </div>
      ) : (
        <div className="flex flex-col gap-8 pb-10">
          
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back, {user?.name?.split(' ')[0]}!</h2>
              <p className="text-gray-500 mt-1">Control your policies, claims, and expenses.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-[2rem] text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-all focus:outline-none">
                <Filter size={14} /> Filters
              </button>
              <button 
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-[2rem] text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-all focus:outline-none"
              >
                <Download size={14} /> <span className="hidden sm:inline">Exports</span>
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-[2rem] text-xs sm:text-sm font-medium hover:bg-[var(--color-primary-dark)] shadow-md shadow-[var(--color-primary)]/20 transition-all focus:outline-none">
                <Plus size={14} /> <span className="hidden sm:inline">Add Policy</span><span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column (Summary) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100 min-h-[340px] flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Summary</h3>
                    <p className="text-sm text-gray-500">Track your performance.</p>
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                    Weekly <ChevronDown size={14} />
                  </button>
                </div>

                <div className="flex gap-4 mb-6 flex-wrap">
                  <div className="min-w-[140px] flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
                      <ArrowDown size={14} className="text-gray-400" /> Total income
                    </div>
                    <div className="truncate text-xl sm:text-2xl font-bold text-gray-900" title={`$${financials.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>${financials.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <div className="min-w-[140px] flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
                      <ArrowUp size={14} className="text-gray-400" /> Total paid
                    </div>
                    <div className="truncate text-xl sm:text-2xl font-bold text-gray-900" title={`$${financials.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>${financials.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <div className="min-w-[140px] flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
                      <DollarSign size={14} className="text-gray-400" /> Profit
                    </div>
                    <div className={`truncate text-xl sm:text-2xl font-bold ${financials.profit >= 0 ? 'text-green-600' : 'text-red-600'}`} title={`$${financials.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>${financials.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                </div>

                <div className="flex-1 flex items-end justify-between gap-1.5 mt-auto">
                  {chartBars.map((h, i) => (
                    <div 
                      key={i} 
                      className={`w-full rounded-t-lg transition-all ${i >= chartBars.length - 6 ? 'bg-[var(--color-primary)]' : 'bg-[#EFDEC7]'}`}
                      style={{ height: `${h}%` }}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Smaller stat boxes */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-4">
                    <Clock size={16} /> Weekly average
                  </div>
                  <div className="text-xs font-medium text-green-500 mb-1 flex items-center gap-1">Average per week</div>
                  <div className="truncate text-lg md:text-xl font-bold text-gray-900" title={`$${financials.weeklyAverage.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>${financials.weeklyAverage.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-4">
                    <Activity size={16} /> Annual average
                  </div>
                  <div className="text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">Projected yearly</div>
                  <div className="truncate text-lg md:text-xl font-bold text-gray-900" title={`$${financials.annualAverage.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>${financials.annualAverage.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              </div>

              {/* Recent Activity Log */}
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Recent Activity Log</h3>
                    <p className="text-sm text-gray-500">Your latest actions.</p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {recentActivities.length === 0 ? (
                    <div className="text-center text-sm text-gray-500 py-4">No recent activity</div>
                  ) : (
                    <div className="space-y-4">
                      {recentActivities.map(activity => (
                        <div key={activity.id} className="flex gap-4">
                          <div className="relative flex-shrink-0 mt-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] ring-4 ring-orange-50"></div>
                            <div className="absolute top-3 left-1.5 -ml-px h-full w-0.5 bg-gray-100"></div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {new Date(activity.date).toLocaleDateString()} at {new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column (Activity & History) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Activity</h3>
                  <p className="text-sm text-gray-500">Track your activity.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard 
                  title="Active Policies" 
                  value={stats.totalPolicies} 
                  icon={<FileText size={16} />} 
                  trend={2.5} 
                  trendDirection="up" 
                />
                <StatCard 
                  title="Total Claims" 
                  value={stats.totalClaims} 
                  icon={<FileWarning size={16} />} 
                  trend={4.5} 
                  trendDirection="up" 
                  chartPath="M0 15 Q10 5 20 10 T40 25 T60 15 T80 20 T100 5"
                />
                <StatCard 
                  title="Pending Claims" 
                  value={stats.pendingClaims} 
                  icon={<Clock size={16} />} 
                  trend={1.5} 
                  trendDirection="down" 
                  chartPath="M0 5 Q10 15 20 5 T40 20 T60 10 T80 25 T100 15"
                  dark={true}
                />
              </div>

              {/* Transactions History */}
              <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100 flex-1 flex flex-col mt-2">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Transactions history</h3>
                    <p className="text-sm text-gray-500">Track your history.</p>
                  </div>
                  <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                    <Filter size={16} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-3 text-xs font-medium text-gray-400 font-sans tracking-wide">Name</th>
                        <th className="pb-3 text-xs font-medium text-gray-400 font-sans tracking-wide">ID</th>
                        <th className="pb-3 text-xs font-medium text-gray-400 font-sans tracking-wide">Status</th>
                        <th className="pb-3 text-xs font-medium text-gray-400 font-sans tracking-wide">Date</th>
                        <th className="pb-3 text-xs font-medium text-gray-400 font-sans tracking-wide text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentClaims.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-sm text-gray-500 font-medium">No recent activity</td>
                        </tr>
                      ) : (
                        recentClaims.map((claim) => (
                          <tr key={claim.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-orange-100 text-[var(--color-primary)] flex items-center justify-center font-bold text-xs uppercase">
                                  {claim.description.charAt(0)}
                                </div>
                                <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">{claim.description}</span>
                              </div>
                            </td>
                            <td className="py-4 text-sm font-semibold text-gray-900">{claim.displayId || claim.id.substring(0, 8)}</td>
                            <td className="py-4">
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                claim.status === 'approved' ? 'text-green-700 bg-green-50' : 
                                claim.status === 'rejected' ? 'text-red-700 bg-red-50' : 
                                'text-yellow-700 bg-yellow-50'
                              }`}>
                                {claim.status === 'approved' && <Check size={12} />}
                                {claim.status === 'pending' && <CircleDot size={12} />}
                                {claim.status === 'rejected' && <X size={12} />}
                                <span className="capitalize">{claim.status}</span>
                              </div>
                            </td>
                            <td className="py-4 text-sm text-gray-900 font-medium whitespace-nowrap">
                              {new Date(claim.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}
                            </td>
                            <td className="py-4 text-sm font-semibold text-right whitespace-nowrap">
                              <span className={claim.status === 'approved' ? "text-green-600" : "text-[var(--color-primary)]"}>
                                {claim.status === 'approved' ? '+' : '-'}${claim.amount.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
