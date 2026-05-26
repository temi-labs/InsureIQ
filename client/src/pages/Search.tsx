import { apiFetch } from '../utils/api';
import { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Policy, Claim } from '../types';
import Spinner from '../components/Spinner';
import { Search as SearchIcon, FileText, FileWarning, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Search() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

        if (user?.role !== 'admin') {
          allPolicies = allPolicies.filter((p: Policy) => p.userId === user?.id);
          allClaims = allClaims.filter((c: Claim) => c.userId === user?.id);
        }

        setPolicies(allPolicies);
        setClaims(allClaims);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const uniqueProviders = useMemo(() => {
    const providers = new Set(policies.map(p => p.provider));
    return Array.from(providers);
  }, [policies]);

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim() && selectedProvider === 'all') {
      return { policies: [], claims: [] };
    }

    const query = searchQuery.toLowerCase();

    let filteredPolicies = policies;
    if (selectedProvider !== 'all') {
      filteredPolicies = filteredPolicies.filter(p => p.provider === selectedProvider);
    }
    if (query) {
      filteredPolicies = filteredPolicies.filter(p => 
        p.type.toLowerCase().includes(query) ||
        p.provider.toLowerCase().includes(query) ||
        p.status.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query)
      );
    }

    let filteredClaims = claims;
    if (selectedProvider !== 'all') {
      const validPolicyIds = new Set(policies.filter(p => p.provider === selectedProvider).map(p => p.id));
      filteredClaims = filteredClaims.filter(c => validPolicyIds.has(c.policyId));
    }
    if (query) {
      filteredClaims = filteredClaims.filter(c => 
        c.description.toLowerCase().includes(query) ||
        c.status.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query)
      );
    }

    return {
      policies: filteredPolicies,
      claims: filteredClaims
    };
  }, [searchQuery, selectedProvider, policies, claims]);

  const hasResults = filteredResults.policies.length > 0 || filteredResults.claims.length > 0;

  return (
    <Layout>
      <div className="flex flex-col gap-8 pb-10">
        {/* Header */}
        <div className="flex flex-col gap-4 pt-4">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Global Search</h2>
          <p className="text-gray-500">Search through your policies and claims.</p>
          
          <div className="relative mt-4 flex gap-4 flex-col sm:flex-row">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <SearchIcon size={20} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full bg-white border border-gray-200 rounded-[2rem] pl-12 pr-4 py-4 text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent shadow-sm transition-all"
                placeholder="Search by ID, provider, type, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="sm:w-64">
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-[2rem] px-4 py-4 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent shadow-sm transition-all appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
              >
                <option value="all">All Providers</option>
                {uniqueProviders.map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex xl:h-[400px] items-center justify-center">
            <Spinner size={32} />
          </div>
        ) : !searchQuery.trim() && selectedProvider === 'all' ? (
          <div className="bg-white rounded-[2rem] p-12 shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
            <div className="p-4 bg-gray-50 rounded-full mb-4">
              <SearchIcon size={48} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Start Searching</h3>
            <p className="text-gray-500 text-center max-w-md">Enter keywords above to find policies and claims instantly across your account.</p>
          </div>
        ) : !hasResults ? (
          <div className="bg-white rounded-[2rem] p-12 shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
            <div className="p-4 bg-gray-50 rounded-full mb-4">
              <SearchIcon size={48} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No results found</h3>
            <p className="text-gray-500 text-center max-w-md">We couldn't find anything matching "{searchQuery}". Try different keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Policies Results */}
            {filteredResults.policies.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <FileText size={20} className="text-[var(--color-primary)]" /> 
                    Policies
                  </h3>
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full">
                    {filteredResults.policies.length}
                  </span>
                </div>
                
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
                  {filteredResults.policies.map(policy => (
                    <Link to="/policies" key={policy.id} className="group p-4 bg-gray-50 hover:bg-orange-50 border border-gray-100 rounded-2xl transition-all cursor-pointer flex justify-between items-center">
                      <div>
                        <div className="font-bold text-gray-900 mb-1">{policy.provider} - {policy.type}</div>
                        <div className="text-xs text-gray-500 capitalize flex gap-2">
                          <span>ID: {policy.displayId || policy.id.substring(0, 8)}</span>
                          •
                          <span className={`${policy.status === 'active' ? 'text-green-600' : policy.status === 'expired' ? 'text-red-600' : 'text-gray-500'}`}>
                            {policy.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-gray-900">${policy.premium.toLocaleString()}</div>
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-200 group-hover:border-[var(--color-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                          <ArrowRight size={16} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Claims Results */}
            {filteredResults.claims.length > 0 && (
              <div className="flex flex-col gap-4">
                 <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <FileWarning size={20} className="text-[var(--color-primary)]" /> 
                    Claims
                  </h3>
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full">
                    {filteredResults.claims.length}
                  </span>
                </div>
                
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
                  {filteredResults.claims.map(claim => (
                    <Link to="/claims" key={claim.id} className="group p-4 bg-gray-50 hover:bg-orange-50 border border-gray-100 rounded-2xl transition-all cursor-pointer flex justify-between items-center">
                      <div>
                        <div className="font-bold text-gray-900 mb-1">{claim.description}</div>
                        <div className="text-xs text-gray-500 capitalize flex gap-2">
                          <span>ID: {claim.displayId || claim.id.substring(0, 8)}</span>
                          •
                          <span className={`capitalize ${claim.status === 'approved' ? 'text-green-600' : claim.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'}`}>
                            {claim.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="font-semibold text-gray-900">${claim.amount.toLocaleString()}</div>
                         <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-200 group-hover:border-[var(--color-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                          <ArrowRight size={16} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
