import { apiFetch } from '../utils/api';
import { Activity } from '../types';

export const addActivity = async (userId: string, message: string): Promise<void> => {
  const newActivity: Activity = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    userId,
    message,
    date: new Date().toISOString()
  };

  try {
    await apiFetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newActivity)
    });
  } catch (error) {
    console.error('Error adding activity:', error);
  }
};

export const getActivities = async (userId: string): Promise<Activity[]> => {
  try {
    const res = await apiFetch('/api/activities');
    if (!res.ok) return [];
    const activities: Activity[] = await res.json();
    return activities.filter(a => a.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error getting activities:', error);
    return [];
  }
};

export const getAllActivities = async (): Promise<Activity[]> => {
  try {
    const res = await apiFetch('/api/activities');
    if (!res.ok) return [];
    const activities: Activity[] = await res.json();
    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error getting all activities:', error);
    return [];
  }
};
