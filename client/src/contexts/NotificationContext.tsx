import { apiFetch } from '../utils/api';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AppNotification } from '../types';
import { useAuth } from './AuthContext';

interface NotificationContextData {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, 'id' | 'date' | 'read'> & { userId?: string }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  loadNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextData | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const loadNotifications = useCallback(async () => {
    if (user) {
      try {
        const res = await apiFetch('/api/notifications');
        if (res.ok) {
          const all: AppNotification[] = await res.json();
          setNotifications(all.filter((n: AppNotification) => n.userId === user.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
      } catch (err) {
        console.error('Error loading notifications:', err);
      }
    } else {
      setNotifications([]);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
    
    // Check for upcoming policy expirations when auth state changes or on mount
    const checkExpirations = async () => {
      if (!user) return;
      try {
        const [policiesRes, notifRes] = await Promise.all([
          apiFetch('/api/policies'),
          apiFetch('/api/notifications')
        ]);
        if (!policiesRes.ok || !notifRes.ok) return;
        
        const allPolicies = await policiesRes.json();
        const allNotifications: AppNotification[] = await notifRes.json();
        const now = new Date();
        // 7 days from now
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        let updated = false;

        for (const policy of allPolicies) {
          if (!policy.expiryDate || policy.status === 'expired' || policy.status === 'cancelled') continue;
          
          const expiryDate = new Date(policy.expiryDate);
          if (expiryDate >= now && expiryDate <= nextWeek) {
            const notificationTitle = `Policy Expiring: ${policy.provider}`;
            
            // Prevent duplicate notifications
            const alreadyNotified = allNotifications.some(n => 
              n.userId === policy.userId && 
              n.type === 'system' && 
              n.title === notificationTitle &&
              n.message.includes(`Policy ${policy.id}`)
            );
            
            if (!alreadyNotified) {
              const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
              const newNotif = {
                id: newId,
                userId: policy.userId,
                title: notificationTitle,
                message: `Reminder: Policy ${policy.id} (${policy.type}) is expiring on ${expiryDate.toLocaleDateString()}.`,
                type: 'system',
                date: new Date().toISOString(),
                read: false
              };
              await apiFetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newNotif)
              });
              updated = true;
            }
          }
        }

        if (updated && user) {
          loadNotifications();
        }
      } catch (err) {
        console.error('Error checking expirations:', err);
      }
    };

    checkExpirations();
  }, [user, loadNotifications]);

  const addNotification = useCallback(async (data: Omit<AppNotification, 'id' | 'date' | 'read'> & { userId?: string }) => {
    const targetUserId = data.userId || user?.id;
    if (!targetUserId) return;
    
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);

    const newNotification: AppNotification = {
      title: data.title,
      message: data.message,
      type: data.type as 'policy' | 'claim' | 'system',
      id: newId,
      userId: targetUserId,
      read: false,
      date: new Date().toISOString()
    };

    try {
      await apiFetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotification)
      });
      
      // Only update local state if it's for current user
      if (targetUserId === user?.id) {
         loadNotifications();
      }
    } catch (err) {
      console.error('Error adding notification:', err);
    }
  }, [user, loadNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true })
      });
      loadNotifications();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }, [loadNotifications]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    try {
      await apiFetch(`/api/notifications/read-all/${user.id}`, {
        method: 'PUT'
      });
      loadNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, [user, loadNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, loadNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
