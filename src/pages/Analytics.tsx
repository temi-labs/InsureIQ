import { apiFetch } from '../utils/api';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Policy, Claim } from '../types';
import Spinner from '../components/Spinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { FileText, FileWarning, Clock, TrendingUp, ArrowUp, ArrowDown, Star, AlertTriangle, Shield, Wallet, Activity } from 'lucide-react';
import { calculateGrowth, getTopPerformingPolicyType, getMostClaimedCategory } from '../utils/analytics';

export default function Analytics() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalPolicies: 0,
    totalClaims: 0,
    pendingClaims: 0,
    totalPremium: 0,
    totalClaimAmount: 0
  });

  const [userData, setUserData] = useState<{policies: Policy[], claims: Claim[]}>({ policies: [], claims: [] });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    setIsLoading(true);

    const fetchData = async () => {
      try {
        const [policiesRes, claimsRes] = await Promise.all([
          apiFetch('/api/policies'),
          apiFetch('/api/claims')
        ]);

        let allPolicies: Policy[] = [];
        let allClaims: Claim[] = [];

        if (policiesRes.ok) allPolicies = await policiesRes.json();
        if (claimsRes.ok) allClaims = await claimsRes.json();

        const userPolicies = user?.role === 'admin' ? allPolicies : allPolicies.filter((p: Policy) => p.userId === user?.id);
        const userClaims = user?.role === 'admin' ? allClaims : allClaims.filter((c: Claim) => c.userId === user?.id);

        setUserData({ policies: userPolicies, claims: userClaims });

        const totalPremium = userPolicies.reduce((sum: number, p: Policy) => sum + (Number(p.premium) || 0), 0);
        const totalClaimAmount = userClaims.reduce((sum: number, c: Claim) => sum + (Number(c.amount) || 0), 0);

        setStats({
          totalPolicies: userPolicies.length,
          totalClaims: userClaims.length,
          pendingClaims: userClaims.filter((c: Claim) => c.status === 'pending').length,
          totalPremium,
          totalClaimAmount
        });

        // Generate mock monthly data combined with real claims
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const data = months.map(month => ({
          name: month,
          premium: Math.floor(Math.random() * 5000) + 2000,
          claims: Math.floor(Math.random() * 3000) + 500,
        }));
        
        // Inject some real claim data if available based on their month
        userClaims.forEach((claim: Claim) => {
          if (claim.date) {
            const date = new Date(claim.date);
            const monthIndex = date.getMonth();
            if (data[monthIndex]) {
              data[monthIndex].claims += Number(claim.amount);
            }
          }
        });

        setChartData(data);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

  }, [user]);

  const growthData = calculateGrowth(userData.policies, userData.claims);
  const topPolicy = getTopPerformingPolicyType(userData.policies);
  const mostClaimed = getMostClaimedCategory(userData.policies, userData.claims);
  const projectedIncome = Math.max(0, growthData.income.current + (growthData.income.current - growthData.income.previous));

  const MetricCard = ({ title, current, previous, growth, icon: Icon, isExpense = false, accent = 'gray' }: any) => {
    const isGrowth = growth > 0;
    const arrow = isGrowth ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
    
    let growthColor = isGrowth ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-rose-700 bg-rose-50 border-rose-100';
    if (isExpense) {
      growthColor = isGrowth ? 'text-rose-700 bg-rose-50 border-rose-100' : 'text-emerald-700 bg-emerald-50 border-emerald-100';
    }
    if (growth === 0) growthColor = 'text-gray-500 bg-gray-50 border-gray-100';

    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between group hover:border-gray-200 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 w-full">
            <div className={`p-2.5 rounded-xl flex items-center justify-center ${accent === 'gray' ? 'bg-gray-50/80 text-gray-600' : accent === 'orange' ? 'bg-orange-50 text-[var(--color-primary)]' : 'bg-indigo-50 text-indigo-600'}`}>
              <Icon size={18} />
            </div>
            <span className="text-sm font-medium text-gray-500">{title}</span>
          </div>
        </div>
        <div>
          <div className="truncate text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight" title={`$${current.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}>
            ${current.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="flex items-center justify-between mt-3">
             <div className="text-sm text-gray-400 font-medium">
               vs ${previous.toLocaleString()} prev.
             </div>
             {growth !== 0 && (
               <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border ${growthColor}`}>
                 {arrow} {Math.abs(growth).toFixed(1)}%
               </div>
             )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="flex flex-col gap-8 pb-12 w-full max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Analytics Overview</h2>
            <p className="text-gray-500 mt-1.5 text-sm font-medium">Financial performance and policy insights.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex xl:h-[400px] items-center justify-center">
            <Spinner size={32} />
          </div>
        ) : (
          <>
            {/* Primary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <MetricCard 
                title="Total Premium" 
                current={growthData.income.current}
                previous={growthData.income.previous}
                growth={growthData.income.growth}
                icon={Wallet}
                isExpense={false}
              />
              <MetricCard 
                title="Claims Paid" 
                current={growthData.claims.current}
                previous={growthData.claims.previous}
                growth={growthData.claims.growth}
                icon={FileWarning}
                isExpense={true}
                accent="orange"
              />
              <MetricCard 
                title="Net Profit" 
                current={growthData.profit.current}
                previous={growthData.profit.previous}
                growth={growthData.profit.growth}
                icon={TrendingUp}
                isExpense={false}
                accent="indigo"
              />
              
              <div className="bg-[#45362B] rounded-3xl p-6 shadow-sm border border-[#5a483c] flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-center gap-3 w-full mb-3">
                      <div className="p-2.5 rounded-xl bg-white/10 text-white flex items-center justify-center">
                        <Activity size={18} />
                      </div>
                      <span className="text-sm font-medium text-white/80">Projected Income</span>
                    </div>
                  </div>
                  <div>
                    <div className="truncate text-2xl lg:text-3xl font-bold text-white tracking-tight" title={`$${projectedIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}>
                      ${projectedIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-sm text-white/60 mt-3 font-medium">
                      Estimate for next period
                    </div>
                  </div>
                </div>
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/5 blur-2xl"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Chart */}
              <div className="lg:col-span-8 bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-gray-100 flex flex-col min-h-[420px]">
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Financial Performance</h3>
                    <p className="text-sm text-gray-500 font-medium">Monthly correlation of premiums and claims.</p>
                  </div>
                </div>
                <div className="flex-1 w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={6}>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 500 }} dy={12} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 500 }} tickFormatter={(value) => `$${value}`} />
                      <Tooltip 
                        cursor={{ fill: '#f9fafb' }}
                        contentStyle={{ borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 500, paddingTop: '24px' }} />
                      <Bar dataKey="premium" name="Premium" fill="#1e293b" radius={[6, 6, 0, 0]} maxBarSize={32} />
                      <Bar dataKey="claims" name="Claims" fill="var(--color-primary)" radius={[6, 6, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Insights Sidebar */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                 {/* Top Policy Insight */}
                 {topPolicy ? (
                  <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group hover:border-gray-200 transition-all">
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-500 mb-6 relative z-10">
                      <div className="p-2 border border-indigo-100 rounded-xl bg-indigo-50 text-indigo-600"><Star size={16} /></div>
                      Top Performing Policy
                    </div>
                    <div className="relative z-10">
                      <div className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                        {topPolicy.type}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-indigo-600 font-bold tracking-tight">${topPolicy.premium.toLocaleString()}</span>
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{topPolicy.percentage.toFixed(1)}% of total</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col justify-center items-center h-40">
                    <span className="text-sm font-medium text-gray-400">No policy data</span>
                  </div>
                )}

                {/* Most Claimed Insight */}
                {mostClaimed ? (
                  <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group hover:border-gray-200 transition-all">
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-500 mb-6 relative z-10">
                      <div className="p-2 border border-orange-100 rounded-xl bg-orange-50 text-[var(--color-primary)]"><AlertTriangle size={16} /></div>
                      Most Claimed Category
                    </div>
                    <div className="relative z-10">
                      <div className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                        {mostClaimed.type}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[var(--color-primary)] font-bold tracking-tight">{mostClaimed.count} Claims</span>
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{mostClaimed.percentage.toFixed(1)}% of total</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col justify-center items-center h-40">
                    <span className="text-sm font-medium text-gray-400">No claims data</span>
                  </div>
                )}

                {/* Smaller Stats Grid */}
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
                    <div className="text-gray-400 mb-2"><Shield size={20} /></div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalPolicies}</div>
                    <div className="text-xs font-medium text-gray-500 mt-1">Active Policies</div>
                  </div>
                  <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
                    <div className="text-gray-400 mb-2"><Clock size={20} /></div>
                    <div className="text-2xl font-bold text-gray-900">{stats.pendingClaims}</div>
                    <div className="text-xs font-medium text-gray-500 mt-1">Pending Claims</div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Row: Claims Trend Line Chart */}
            <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-gray-100 flex flex-col min-h-[360px]">
              <div className="mb-8">
                <h3 className="font-bold text-gray-900 text-lg">Claims Velocity</h3>
                <p className="text-sm text-gray-500 font-medium">Continuous tracking of claim volume across the year.</p>
              </div>
              <div className="flex-1 w-full min-h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorClaims" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 500 }} dy={12} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 500 }} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                    />
                    <Area type="monotone" dataKey="claims" name="Claim Vol." stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorClaims)" activeDot={{ r: 6, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </>
        )}
      </div>
    </Layout>
  );
}
