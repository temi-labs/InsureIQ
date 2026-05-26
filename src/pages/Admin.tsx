import { apiFetch } from '../utils/api';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Claim, Policy, User } from '../types';
import { Check, X, FileQuestion, Download } from 'lucide-react';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import { exportToCSV } from '../utils/export';
import { addActivity } from '../utils/activity';
import { toast } from 'react-toastify';

export default function Admin() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionConfirm, setActionConfirm] = useState<{ id: string, status: 'approved' | 'rejected' } | null>(null);
  const [roleChangeConfirm, setRoleChangeConfirm] = useState<{ userId: string, newRole: 'user' | 'admin', name: string } | null>(null);

  useEffect(() => {
    setIsLoading(true);
    loadData().then(() => {
      setIsLoading(false);
    });
  }, []);

  const loadData = async () => {
    try {
      const [policiesRes, claimsRes, usersRes] = await Promise.all([
        apiFetch('/api/policies'),
        apiFetch('/api/claims'),
        apiFetch('/api/users')
      ]);

      if (policiesRes.ok) {
        setPolicies(await policiesRes.json());
      } else {
        setPolicies([]);
      }

      if (claimsRes.ok) {
        setClaims(await claimsRes.json());
      } else {
        setClaims([]);
      }

      if (usersRes.ok) {
        setUsers(await usersRes.json());
      } else {
        setUsers([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getUserName = (id: string) => {
    const u = users.find((u) => u.id === id);
    return u ? u.name : 'Unknown User';
  };

  const getPolicyDetails = (id: string) => {
    const p = policies.find((p) => p.id === id);
    return p ? (
      <div className="flex flex-col">
        <span>{p.provider} ({p.type})</span>
        <span className="text-xs text-gray-500 font-normal">Premium: ${p.premium.toLocaleString()}</span>
      </div>
    ) : 'Unknown Policy';
  };

  const handleUpdateStatus = async () => {
    if (actionConfirm) {
      const { id: claimId, status: newStatus } = actionConfirm;
      const claimToUpdate = claims.find(c => c.id === claimId);

      try {
        const response = await apiFetch(`/api/claims/${claimId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
          loadData();
          
          if (claimToUpdate) {
            addNotification({
              title: `Claim ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
              message: `Your claim "${claimToUpdate.description}" has been ${newStatus}.`,
              type: 'claim',
              userId: claimToUpdate.userId
            });
            
            addActivity(claimToUpdate.userId, `Claim ${newStatus}: ${claimToUpdate.description.substring(0, 30)}${claimToUpdate.description.length > 30 ? '...' : ''}`);
          }
          toast.success(`Claim ${newStatus} successfully`);
        } else {
          toast.error('Failed to update claim');
        }
      } catch (error) {
        console.error('Failed to update claim:', error);
        toast.error('Failed to update claim');
      } finally {
        setActionConfirm(null);
      }
    }
  };

  const handleRoleChange = async () => {
    if (roleChangeConfirm) {
      const { userId, newRole } = roleChangeConfirm;
      
      const userToUpdate = users.find(u => u.id === userId);
      
      try {
        const response = await apiFetch(`/api/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole })
        });
        
        if (response.ok) {
          loadData();

          if (userToUpdate) {
            addNotification({
              title: 'Role Updated',
              message: `Your account role has been changed to ${newRole}.`,
              type: 'system',
              userId: userId
            });
            
            addActivity(userId, `Role changed to ${newRole} by admin`);
          }
          toast.success(`User role updated to ${newRole}`);
        } else {
          toast.error('Failed to update user role');
        }
      } catch (error) {
        console.error('Failed to update user role:', error);
        toast.error('Failed to update user role');
      } finally {
        setRoleChangeConfirm(null);
      }
    }
  };

  const stats = {
    totalUsers: users.length,
    totalPolicies: policies.length,
    totalClaims: claims.length,
    pendingClaims: claims.filter(c => c.status === 'pending').length
  };

  const handleExportAll = () => {
    try {
      if (users.length > 0) exportToCSV(users, 'users_export');
      if (policies.length > 0) exportToCSV(policies, 'policies_export');
      if (claims.length > 0) exportToCSV(claims, 'claims_export');
      toast.success('All data exported successfully');
    } catch (e) {
      toast.error('Failed to export data');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Layout title="Access Denied">
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-red-500">You do not have permission to view this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Panel">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Overview</h2>
          <button 
            onClick={handleExportAll}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs md:text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-all focus:outline-none"
          >
            <Download size={14} /> Export All Data
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Users</h3>
            <div className="text-3xl font-bold text-gray-900">{stats.totalUsers}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Policies</h3>
            <div className="text-3xl font-bold text-gray-900">{stats.totalPolicies}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Claims</h3>
            <div className="text-3xl font-bold text-gray-900">{stats.totalClaims}</div>
          </div>
          <div className="bg-[#45362B] rounded-2xl p-6 shadow-md border border-[#5a483c] flex flex-col">
            <h3 className="text-sm font-medium text-white/80 mb-2">Pending Claims</h3>
            <div className="text-3xl font-bold text-white">{stats.pendingClaims}</div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Claims Management</h2>
          </div>
        
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner />
          </div>
        ) : claims.length === 0 ? (
          <div className="p-6">
            <EmptyState 
              title="No Claims to Review"
              description="There are currently no claims submitted by users."
              icon={<FileQuestion size={48} className="text-gray-300" />}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy</th>
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
                      {getUserName(claim.userId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getPolicyDetails(claim.policyId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${claim.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={claim.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {claim.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setActionConfirm({ id: claim.id, status: 'approved' })}
                            className="bg-green-100 text-green-700 p-2 rounded-full hover:bg-green-200 transition-colors"
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => setActionConfirm({ id: claim.id, status: 'rejected' })}
                            className="bg-red-100 text-red-700 p-2 rounded-full hover:bg-red-200 transition-colors"
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden mt-6">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
        </div>
        
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner />
          </div>
        ) : users.length === 0 ? (
          <div className="p-6">
            <EmptyState 
              title="No Users to Manage"
              description="There are currently no users registered in the system."
              icon={<FileQuestion size={48} className="text-gray-300" />}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {u.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <select
                        value={u.role}
                        onChange={(e) => setRoleChangeConfirm({ userId: u.id, newRole: e.target.value as 'user' | 'admin', name: u.name })}
                        disabled={u.id === user?.id}
                        className="ml-4 border-gray-300 rounded-md text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>

      <ConfirmDialog 
        isOpen={!!actionConfirm}
        title={actionConfirm?.status === 'approved' ? 'Approve Claim' : 'Reject Claim'}
        message={`Are you sure you want to ${actionConfirm?.status} this claim? The user will be notified of your decision.`}
        confirmLabel={actionConfirm?.status === 'approved' ? 'Approve Claim' : 'Reject Claim'}
        isDestructive={actionConfirm?.status === 'rejected'}
        onConfirm={handleUpdateStatus}
        onCancel={() => setActionConfirm(null)}
      />

      <ConfirmDialog 
        isOpen={!!roleChangeConfirm}
        title="Change User Role"
        message={`Are you sure you want to change the role of ${roleChangeConfirm?.name} to '${roleChangeConfirm?.newRole}'?`}
        confirmLabel="Change Role"
        isDestructive={true}
        onConfirm={handleRoleChange}
        onCancel={() => setRoleChangeConfirm(null)}
      />
    </Layout>
  );
}
