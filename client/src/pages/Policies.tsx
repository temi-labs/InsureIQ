import { apiFetch } from '../utils/api';
import { useState, useEffect, FormEvent } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Policy } from '../types';
import { Plus, Edit, Trash2, X, FileText, Download } from 'lucide-react';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { toast } from 'react-toastify';
import { exportToCSV } from '../utils/export';

import ConfirmDialog from '../components/ConfirmDialog';
import { addActivity } from '../utils/activity';

export default function Policies() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Delete Confirmation State
  const [policyToDelete, setPolicyToDelete] = useState<string | null>(null);

  // Form State
  const [type, setType] = useState('');
  const [provider, setProvider] = useState('');
  const [premium, setPremium] = useState('');
  const [coverageAmount, setCoverageAmount] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [status, setStatus] = useState<'active' | 'expired' | 'cancelled'>('active');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ type?: string; premium?: string; coverageAmount?: string }>({});

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      loadPolicies();
      setIsLoading(false);
    }, 400);
  }, [user]);

  const loadPolicies = async () => {
    try {
      const response = await apiFetch('/api/policies');
      if (response.ok) {
        let allPolicies: Policy[] = await response.json();
        // Admin sees all, user sees own
        if (user?.role !== 'admin') {
          allPolicies = allPolicies.filter((p: Policy) => p.userId === user?.id);
        }
        setPolicies(allPolicies);
      }
    } catch (error) {
      console.error('Failed to load policies:', error);
      toast.error('Failed to load policies');
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setType('');
    setProvider('');
    setPremium('');
    setCoverageAmount('');
    setExpiryDate('');
    setStatus('active');
    setFormError('');
    setFieldErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (policy: Policy) => {
    setEditingId(policy.id);
    setType(policy.type);
    setProvider(policy.provider);
    setPremium(policy.premium.toString());
    setCoverageAmount((policy.coverageAmount || 0).toString());
    setExpiryDate(policy.expiryDate || '');
    setStatus(policy.status);
    setFormError('');
    setFieldErrors({});
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (policyToDelete) {
      try {
        const response = await apiFetch(`/api/policies/${policyToDelete}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          loadPolicies();
          setPolicyToDelete(null);
          toast.success('Policy deleted successfully');
        } else {
          toast.error('Failed to delete policy');
        }
      } catch (error) {
        console.error('Failed to delete policy:', error);
        toast.error('Failed to delete policy');
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormError('');
    setFieldErrors({});
    
    const errors: { type?: string; premium?: string; coverageAmount?: string } = {};

    if (!type) {
      errors.type = 'Policy Type is required';
    }

    if (isNaN(Number(premium)) || Number(premium) <= 0) {
      errors.premium = 'Premium amount must be a positive number';
    }

    if (isNaN(Number(coverageAmount)) || Number(coverageAmount) <= 0) {
      errors.coverageAmount = 'Coverage amount must be a positive number';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Please fix the errors below.');
      return;
    }

    setIsLoading(true);

    try {
      if (editingId) {
        // Edit existing
        const response = await apiFetch(`/api/policies/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type, 
            provider, 
            premium: Number(premium), 
            coverageAmount: Number(coverageAmount),
            status, 
            expiryDate 
          })
        });

        if (response.ok) {
          toast.success('Policy updated successfully');
        } else {
          throw new Error('Failed to update policy');
        }
      } else {
        // Add new
        const shortId = `POL-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        
        const newPolicy: Policy = {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
          displayId: shortId,
          userId: user.id,
          type,
          provider,
          premium: Number(premium),
          coverageAmount: Number(coverageAmount),
          status,
          expiryDate,
          createdAt: new Date().toISOString()
        };

        const response = await apiFetch('/api/policies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPolicy)
        });

        if (response.ok) {
          addNotification({
            title: 'Policy Created',
            message: `Your ${provider} ${type} policy has been successfully created.`,
            type: 'policy',
            userId: user.id
          });
          
          toast.success('Policy created successfully');
          
          addActivity(user.id, `Policy created: ${provider} (${type})`);
        } else {
          throw new Error('Failed to create policy');
        }
      }

      setIsFormOpen(false);
      await loadPolicies();
    } catch (error) {
      console.error('Error saving policy:', error);
      toast.error('Failed to save policy');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    try {
      if (policies.length === 0) {
        toast.info('No policies to export');
        return;
      }
      exportToCSV(policies, 'policies_export');
      toast.success('Policies exported successfully');
    } catch (e) {
      toast.error('Failed to export policies');
    }
  };

  return (
    <Layout title="Policies">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Your Policies</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 px-3 py-1.5 text-sm rounded-md hover:bg-gray-50 focus:outline-none"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-[var(--color-primary)] text-white px-3 py-1.5 text-sm rounded-md hover:bg-[var(--color-primary-dark)] focus:outline-none"
          >
            <Plus size={16} />
            <span>Add Policy</span>
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">{editingId ? 'Edit Policy' : 'New Policy'}</h3>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Policy Type</label>
              <input
                list="policyTypesList"
                required
                placeholder="Select or type policy type..."
                className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white ${fieldErrors.type ? 'border-red-500' : ''}`}
                value={type}
                onChange={e => {
                  setType(e.target.value);
                  setFieldErrors(prev => ({ ...prev, type: undefined }));
                }}
              />
              <datalist id="policyTypesList">
                <option value="Health" />
                <option value="Auto" />
                <option value="Home" />
                <option value="Life" />
                <option value="Travel" />
              </datalist>
              {fieldErrors.type && <p className="text-red-500 text-xs mt-1">{fieldErrors.type}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
              <input
                required
                type="text"
                placeholder="e.g. Aetna, State Farm"
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                value={provider}
                onChange={e => setProvider(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Premium Amount ($)</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.premium ? 'border-red-500' : ''}`}
                value={premium}
                onChange={e => {
                  setPremium(e.target.value);
                  setFieldErrors(prev => ({ ...prev, premium: undefined }));
                }}
              />
              {fieldErrors.premium && <p className="text-red-500 text-xs mt-1">{fieldErrors.premium}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coverage Amount ($)</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.coverageAmount ? 'border-red-500' : ''}`}
                value={coverageAmount}
                onChange={e => {
                  setCoverageAmount(e.target.value);
                  setFieldErrors(prev => ({ ...prev, coverageAmount: undefined }));
                }}
              />
              {fieldErrors.coverageAmount && <p className="text-red-500 text-xs mt-1">{fieldErrors.coverageAmount}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                required
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={status}
                onChange={e => setStatus(e.target.value as any)}
              >
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
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
                {editingId ? 'Save Changes' : 'Create Policy'}
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
          {policies.length === 0 ? (
            <EmptyState 
              title="No Policies Found"
              description="You have not created any insurance policies yet."
              icon={<FileText size={48} className="text-gray-300" />}
              action={
                <button
                  onClick={handleOpenAdd}
                  className="mt-2 text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium text-sm"
                >
                  + Add your first policy
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Premium</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {policies.map((policy) => (
                    <tr key={policy.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {policy.displayId || policy.id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {policy.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {policy.provider}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${policy.premium.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {policy.expiryDate ? new Date(policy.expiryDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={policy.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleOpenEdit(policy)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4 inline-flex items-center gap-1"
                        >
                          <Edit size={16} /> Edit
                        </button>
                        <button
                          onClick={() => setPolicyToDelete(policy.id)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
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
        isOpen={!!policyToDelete}
        title="Delete Policy"
        message="Are you sure you want to delete this policy? This action cannot be undone and you will lose all data associated with it."
        confirmLabel="Delete Policy"
        onConfirm={handleDelete}
        onCancel={() => setPolicyToDelete(null)}
      />
    </Layout>
  );
}
