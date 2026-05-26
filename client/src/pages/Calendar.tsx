import { apiFetch } from '../utils/api';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Policy, Claim } from '../types';
import Spinner from '../components/Spinner';
import { Calendar as CalendarIcon, FileWarning, FileText } from 'lucide-react';

interface CalendarEvent {
  id: string;
  displayId?: string;
  type: 'policy' | 'claim';
  title: string;
  date: string;
  amount?: number;
  status: string;
}

export default function Calendar() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Record<string, CalendarEvent[]>>({});
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
        if (policiesRes.ok) allPolicies = await policiesRes.json();
        
        let allClaims: Claim[] = [];
        if (claimsRes.ok) allClaims = await claimsRes.json();

        if (user?.role !== 'admin') {
          allPolicies = allPolicies.filter((p: Policy) => p.userId === user?.id);
          allClaims = allClaims.filter((c: Claim) => c.userId === user?.id);
        }

        const groupedEvents: Record<string, CalendarEvent[]> = {};

        // Add policy expiries
        allPolicies.forEach((policy: Policy) => {
          if (policy.expiryDate) {
            const dateStr = policy.expiryDate.split('T')[0];
            if (!groupedEvents[dateStr]) groupedEvents[dateStr] = [];
            groupedEvents[dateStr].push({
              id: policy.id,
              displayId: policy.displayId,
              type: 'policy',
              title: `Policy Expiry: ${policy.provider} - ${policy.type}`,
              date: dateStr,
              amount: policy.premium,
              status: policy.status
            });
          }
        });

        // Add claim submissions
        allClaims.forEach((claim: Claim) => {
          if (claim.date) {
            const dateStr = claim.date.split('T')[0];
            if (!groupedEvents[dateStr]) groupedEvents[dateStr] = [];
            groupedEvents[dateStr].push({
              id: claim.id,
              displayId: claim.displayId,
              type: 'claim',
              title: `Claim Submitted: ${claim.description}`,
              date: dateStr,
              amount: claim.amount,
              status: claim.status
            });
          }
        });

        // Sort events within each day
        Object.keys(groupedEvents).forEach(dateStr => {
          groupedEvents[dateStr].sort((a, b) => a.title.localeCompare(b.title));
        });

        setEvents(groupedEvents);
      } catch (error) {
        console.error('Error loading calendar:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const sortedDates = Object.keys(events).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return (
    <Layout>
      <div className="flex flex-col gap-8 pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Calendar</h2>
            <p className="text-gray-500 mt-1">Track upcoming policy expirations and claim submission history.</p>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex xl:h-[400px] items-center justify-center">
            <Spinner size={32} />
          </div>
        ) : sortedDates.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-12 shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
            <div className="p-4 bg-gray-50 rounded-full mb-4">
              <CalendarIcon size={48} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Events Found</h3>
            <p className="text-gray-500">You don't have any policy expirations or claim dates yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100">
            <div className="space-y-10">
              {sortedDates.map(dateStr => {
                const dateObj = new Date(dateStr);
                // In order to fix time zone issues easily for display:
                const formattedDate = dateObj.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  timeZone: 'UTC' // Prevent offset shifts if only date exists
                });

                return (
                  <div key={dateStr} className="relative">
                    {/* Date Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex flex-col items-center justify-center shadow-sm border border-gray-100 font-semibold">
                        <span className="text-xs text-[var(--color-primary)] uppercase leading-none mb-1">{dateObj.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}</span>
                        <span className="text-lg leading-none text-gray-900">{dateObj.getUTCDate()}</span>
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">{formattedDate}</h4>
                    </div>

                    {/* Events List */}
                    <div className="pl-6 border-l-2 border-gray-100 ml-6 space-y-4">
                      {events[dateStr].map(event => (
                        <div key={`${event.type}-${event.id}`} className="bg-white border text-sm border-gray-100 shadow-sm rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-full ${event.type === 'policy' ? 'bg-[#EFDEC7]/30 text-[#45362B]' : 'bg-orange-50 text-[var(--color-primary)]'}`}>
                              {event.type === 'policy' ? <FileText size={18} /> : <FileWarning size={18} />}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{event.title}</div>
                              <div className="text-xs font-medium text-gray-500 mt-0.5 capitalize">
                                Status: {event.status} | ID: {event.displayId || event.id.substring(0, 8)}
                              </div>
                            </div>
                          </div>
                          
                          {event.amount !== undefined && (
                            <div className="sm:text-right font-bold text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 inline-block self-start sm:self-auto">
                              ${event.amount.toLocaleString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
