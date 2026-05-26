import { apiFetch } from '../utils/api';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Activity, User } from '../types';
import { getActivities, getAllActivities } from '../utils/activity';
import { Clock, Activity as ActivityIcon, Download, Filter, X, FileText } from 'lucide-react';
import { exportToCSV } from '../utils/export';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function ActivityLog() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<(Activity & { userName?: string })[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    
    // Load users to map names
    const loadData = async () => {
      try {
        const usersRes = await apiFetch('/api/users');
        const allUsers: User[] = usersRes.ok ? await usersRes.json() : [];
        const _usersMap: Record<string, string> = {};
        allUsers.forEach(u => {
          _usersMap[u.id] = u.name;
        });
        setUsersMap(_usersMap);

        // Load activities
        let loadedActivities: Activity[] = [];
        if (user.role === 'admin') {
          loadedActivities = await getAllActivities();
        } else {
          loadedActivities = await getActivities(user.id);
        }
        
        setActivities(loadedActivities.map(a => ({
          ...a,
          userName: _usersMap[a.userId] || 'Unknown User'
        })));
      } catch (err) {
        console.error('Error loading activity logs:', err);
      }
    };
    
    loadData();
  }, [user]);

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const actDate = new Date(activity.date);
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (actDate < start) return false;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (actDate > end) return false;
      }
      
      return true;
    });
  }, [activities, startDate, endDate]);

  const chartData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    
    // Reverse to show chronologically from left to right in chart
    const chronologicalActivities = [...filteredActivities].reverse();
    
    chronologicalActivities.forEach(act => {
      const d = new Date(act.date).toLocaleDateString();
      if (!dataMap[d]) dataMap[d] = 0;
      dataMap[d]++;
    });
    
    return Object.keys(dataMap).map(date => ({
      date,
      count: dataMap[date]
    }));
  }, [filteredActivities]);

  const handleExportCSV = () => {
    try {
      if (filteredActivities.length === 0) {
        toast.info('No activities to export in this date range');
        return;
      }
      exportToCSV(filteredActivities, 'activity_log_export');
      toast.success('Activity log CSV exported successfully');
    } catch (e) {
      toast.error('Failed to export activity log to CSV');
    }
  };

  const handleExportPDF = async () => {
    if (filteredActivities.length === 0) {
      toast.info('No activities to export');
      return;
    }
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      pdf.setFontSize(18);
      pdf.text('Activity Log Report', 14, 22);
      pdf.setFontSize(11);
      pdf.setTextColor(100);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      
      let yOffset = 40;
      
      // If we have chart, let's add it to PDF first
      if (chartRef.current && chartData.length > 0) {
        const canvas = await html2canvas(chartRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        
        // Calculate dimensions maintaining aspect ratio
        const imgWidth = pageWidth - 28;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.text('Activity Chart:', 14, yOffset);
        yOffset += 5;
        pdf.addImage(imgData, 'PNG', 14, yOffset, imgWidth, imgHeight);
        yOffset += imgHeight + 10;
      }
      
      pdf.text('Activity Details:', 14, yOffset);
      yOffset += 8;
      
      pdf.setFontSize(10);
      pdf.setTextColor(0);
      
      filteredActivities.forEach((activity, index) => {
        // Add new page if getting too far down
        if (yOffset > 280) {
          pdf.addPage();
          yOffset = 20;
        }
        
        const dateStr = new Date(activity.date).toLocaleString();
        const userStr = user?.role === 'admin' ? `[User: ${activity.userName}] ` : '';
        const txt = `${dateStr} - ${userStr}${activity.message}`;
        
        // Split text to fit width
        const lines = pdf.splitTextToSize(txt, pageWidth - 28);
        pdf.text(lines, 14, yOffset);
        yOffset += (lines.length * 5) + 3;
      });
      
      pdf.save('activity_log_export.pdf');
      toast.success('Activity log PDF exported successfully');
    } catch (e) {
      console.error(e);
      toast.error('Failed to export PDF with chart');
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <Layout title="Activity Log">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <ActivityIcon size={24} className="text-blue-500" />
          Event History
        </h2>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-gray-300 shadow-sm w-full sm:w-auto">
            <Filter size={16} className="text-gray-400" />
            <input 
              type="date" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-2 py-1 text-sm border-none focus:ring-0 outline-none w-full sm:w-32 bg-transparent text-gray-600"
              title="Start Date"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-2 py-1 text-sm border-none focus:ring-0 outline-none w-full sm:w-32 bg-transparent text-gray-600"
              title="End Date"
            />
            {(startDate || endDate) && (
              <button 
                onClick={clearFilters}
                className="ml-1 text-gray-400 hover:text-red-500"
                title="Clear Filters"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportCSV}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 focus:outline-none whitespace-nowrap"
            >
              <FileText size={16} />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white border border-[var(--color-primary)] px-4 py-2 rounded-md hover:bg-[var(--color-primary-dark)] focus:outline-none whitespace-nowrap"
            >
              <Download size={16} />
              <span>PDF with Chart</span>
            </button>
          </div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Activity Frequency</h3>
          <div ref={chartRef} className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#F3F4F6'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredActivities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Clock size={48} className="mx-auto mb-4 opacity-30" />
            <p>No recorded activities found{(startDate || endDate) ? ' for the selected date range' : ''}.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredActivities.map((activity) => (
              <li key={activity.id} className="p-4 sm:p-5 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    {user?.role === 'admin' && (
                      <span className="text-xs text-[var(--color-primary)] font-medium">User: {activity.userName}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0 mt-1">
                    <Clock size={12} />
                    <time dateTime={activity.date}>{new Date(activity.date).toLocaleString()}</time>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}
