import { apiFetch } from '../utils/api';
import { useState, useEffect, FormEvent } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Claim, Policy } from '../types';
import { Plus, X, FileWarning, Trash2, Download } from 'lucide-react';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { addActivity } from '../utils/activity';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from 'react-toastify';
import { exportToCSV } from '../utils/export';

export default function Claims() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [userPolicies, setUserPolicies] = useState<Policy[]>([]);
  const [allPolicies, setAllPolicies] = useState<Policy[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [claimToDelete, setClaimToDelete] = useState<string | null>(null);

  // Form State
  const [policyId, setPolicyId] = useState('');
  const [customPolicy, setCustomPolicy] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ amount?: string; policy?: string }>({});

  useEffect(() => {
    setIsLoading(true);
    loadData().then(() => {
      setIsLoading(false);
    });
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      const [policiesRes, claimsRes] = await Promise.all([
        apiFetch('/api/policies'),
        apiFetch('/api/claims')
      ]);

      let parsedPolicies: Policy[] = [];
      if (policiesRes.ok) {
        parsedPolicies = await policiesRes.json();
      }

      let parsedClaims: Claim[] = [];
      if (claimsRes.ok) {
        parsedClaims = await claimsRes.json();
      }

      setAllPolicies(parsedPolicies);
      setUserPolicies(parsedPolicies.filter((p: Policy) => p.userId === user.id));
      // View all claims for logged-in user
      setClaims(parsedClaims.filter((c: Claim) => c.userId === user.id));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormError('');
    setFieldErrors({});

    const errors: { amount?: string; policy?: string } = {};

    if (!policyId) {
      errors.policy = 'Please select a policy';
    }

    let finalPolicyId = policyId;
    if (policyId === 'CUSTOM') {
      if (!customPolicy.trim()) {
        errors.policy = 'Please enter a custom policy name/ID';
      }
      finalPolicyId = customPolicy;
    }

    const claimAmt = Number(amount);
    if (isNaN(claimAmt) || claimAmt <= 0) {
      errors.amount = 'Claim amount must be a positive number';
    }

    if (policyId && policyId !== 'CUSTOM') {
      const selectedPolicy = userPolicies.find(p => p.id === policyId);
      if (!selectedPolicy) {
        errors.policy = 'Selected policy is invalid';
      } else if (!isNaN(claimAmt) && claimAmt > selectedPolicy.coverageAmount) {
        errors.amount = `Claim amount cannot exceed policy coverage amount ($${selectedPolicy.coverageAmount.toLocaleString()})`;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Please fix the errors below.');
      return;
    }

    const shortId = `CLM-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    const newClaim: Claim = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      displayId: shortId,
      userId: user.id,
      policyId: finalPolicyId,
      amount: claimAmt,
      description,
      status: 'pending',
      date: new Date().toISOString()
    };

    try {
      const res = await apiFetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClaim)
      });
      
      if (res.ok) {
        addActivity(user.id, `Claim submitted: ${description.substring(0, 30)}${description.length > 30 ? '...' : ''}`);

        toast.success('Claim submitted successfully');

        setIsFormOpen(false);
        setPolicyId('');
        setAmount('');
        setDescription('');

        loadData();
      } else {
        toast.error('Failed to submit claim');
      }
    } catch (err) {
      console.error('Error submitting claim:', err);
      toast.error('Error submitting claim');
    }
  };

  const getPolicyDetails = (id: string) => {
    const p = allPolicies.find(p => p.id === id);
    return p ? (
      <div className="flex flex-col">
        <span>{p.provider} ({p.type})</span>
        <span className="text-xs text-gray-500 font-normal">Coverage: ${(p.coverageAmount || 0).toLocaleString()} | Premium: ${p.premium.toLocaleString()}</span>
      </div>
    ) : (
      <div className="flex flex-col">
        <span>{id}</span>
        <span className="text-xs text-gray-400 font-normal">Custom Policy</span>
      </div>
    );
  };

  const handleOpenForm = () => {
    setFormError('');
    setFieldErrors({});
    setPolicyId('');
    setCustomPolicy('');
    setAmount('');
    setDescription('');
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (claimToDelete) {
      try {
        const response = await apiFetch(`/api/claims/${claimToDelete}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          loadData();
          setClaimToDelete(null);
          toast.success('Claim deleted successfully');
        } else {
          toast.error('Failed to delete claim');
        }
      } catch (error) {
        console.error('Failed to delete claim:', error);
        toast.error('Failed to delete claim');
      }
    }
  };

  const handleExport = () => {
    try {
      if (claims.length === 0) {
        toast.info('No claims to export');
        return;
      }
      exportToCSV(claims, 'claims_export');
      toast.success('Claims exported successfully');
    } catch (e) {
      toast.error('Failed to export claims');
    }
  };

  return (
    <Layout title="Claims">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Your Claims</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 px-2.5 py-1.5 text-xs md:text-sm rounded-md hover:bg-gray-50 focus:outline-none"
          >
            <Download size={14} />
            <span>Export</span>
          </button>
          <button
            onClick={handleOpenForm}
            className="flex items-center gap-1.5 bg-[var(--color-primary)] text-white px-2.5 py-1.5 text-xs md:text-sm rounded-md hover:bg-[var(--color-primary-dark)] focus:outline-none"
          >
            <Plus size={14} />
            <span>Submit Claim</span>
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">New Claim Form</h3>
            <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formError && (
              <div className="md:col-span-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                {formError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Policy</label>
              <select
                required
                className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white ${fieldErrors.policy ? 'border-red-500' : ''}`}
                value={policyId}
                onChange={e => {
                  setPolicyId(e.target.value);
                  setFieldErrors(prev => ({ ...prev, policy: undefined }));
                  setFormError('');
                }}
              >
                <option value="">-- Choose a Policy --</option>
                {userPolicies.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.provider} - {p.type} (Coverage: ${(p.coverageAmount || 0).toLocaleString()})
                  </option>
                ))}
                <option value="CUSTOM">-- Enter Manual Policy --</option>
              </select>
              {policyId === 'CUSTOM' && (
                <input
                  type="text"
                  required
                  placeholder="Enter policy name or ID"
                  className={`w-full border rounded-md px-3 py-2 mt-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.policy ? 'border-red-500' : ''}`}
                  value={customPolicy}
                  onChange={e => {
                    setCustomPolicy(e.target.value);
                    setFieldErrors(prev => ({ ...prev, policy: undefined }));
                    setFormError('');
                  }}
                />
              )}
              {fieldErrors.policy && <p className="text-red-500 text-xs mt-1">{fieldErrors.policy}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Claim Amount ($)</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.amount ? 'border-red-500' : ''}`}
                value={amount}
                onChange={e => {
                  setAmount(e.target.value);
                  setFieldErrors(prev => ({ ...prev, amount: undefined }));
                  setFormError('');
                }}
              />
              {fieldErrors.amount && <p className="text-red-500 text-xs mt-1">{fieldErrors.amount}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Incident Type</label>
              <select
                required
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={description}
                onChange={e => setDescription(e.target.value)}
              >
                <option value="">-- Select Incident Type --</option>
                <option value="Medical Emergency">Medical Emergency</option>
                <option value="Vehicle Collision">Vehicle Collision</option>
                <option value="Property Damage">Property Damage</option>
                <option value="Theft">Theft</option>
                <option value="Routine Checkup">Routine Checkup</option>
                <option value="Travel Cancellation">Travel Cancellation</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-md hover:bg-[var(--color-primary-dark)] text-sm font-medium"
              >
                Submit Claim
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex h-64 items-center justify-center bg-white shadow rounded-lg">
          <Spinner />
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {claims.length === 0 ? (
            <EmptyState 
              title="No Claims Found"
              description="You have no claims history on record."
              icon={<FileWarning size={48} className="text-gray-300" />}
              action={
                <button
                  onClick={handleOpenForm}
                  className="mt-2 text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium text-sm"
                >
                  + Submit a new claim
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incident Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {claims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {claim.displayId || claim.id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(claim.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getPolicyDetails(claim.policyId)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={claim.description}>
                        {claim.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${claim.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={claim.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {claim.status === 'pending' && (
                          <button
                            onClick={() => setClaimToDelete(claim.id)}
                            className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog 
        isOpen={!!claimToDelete}
        title="Delete Claim"
        message="Are you sure you want to delete this claim? This action cannot be undone."
        confirmLabel="Delete Claim"
        onConfirm={handleDelete}
        onCancel={() => setClaimToDelete(null)}
      />
    </Layout>
  );
}
