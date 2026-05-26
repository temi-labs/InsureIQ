import { apiFetch } from '../utils/api';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Policy } from '../types';
import { toast } from 'react-toastify';
import { useNotifications } from '../contexts/NotificationContext';

export function useAutoRenewalReminder() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  
  useEffect(() => {
    if (!user) return;
    
    const checkPolicies = async () => {
      try {
        const res = await apiFetch('/api/policies');
        if (!res.ok) return;
        let policies: Policy[] = await res.json();
        let updated = false;

        // Identify user's policies
        const userPolicies = policies.filter(p => p.userId === user.id);
        
        const today = new Date();
        const notificationThreshold = new Date();
        notificationThreshold.setDate(today.getDate() + 30);
        
        for (const policy of userPolicies) {
          if (policy.expiryDate && !policy.renewalEmailSent && policy.status === 'active') {
            const expDate = new Date(policy.expiryDate);
            
            if (expDate > today && expDate <= notificationThreshold) {
              const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
              
              // Simulate background email job
              toast.info(
                `[Automated Email Sent to ${user.email}] Reminder: Your ${policy.provider} ${policy.type} policy expires in ${daysLeft} days. Please renew.`,
                { autoClose: 6000 }
              );
              
              // Also add an in-app notification
              addNotification({
                userId: user.id,
                title: 'Policy Renewal Reminder',
                message: `Your ${policy.provider} ${policy.type} policy expires in ${daysLeft} days. Please renew.`,
                type: 'policy'
              });
              
              // Mark as sent via API
              const updateRes = await apiFetch(`/api/policies/${policy.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ renewalEmailSent: true })
              });
              if (updateRes.ok) {
                 updated = true;
              }
            }
          }
        }
      } catch (err) {
        console.error('Error checking renewals:', err);
      }
    };
    
    // Check shortly after component mounts
    const timeoutMsg = setTimeout(checkPolicies, 2000);
    return () => clearTimeout(timeoutMsg);
  }, [user, addNotification]);
}
