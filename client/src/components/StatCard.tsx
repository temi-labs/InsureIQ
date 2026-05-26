import { ReactNode } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: number;
  trendDirection?: 'up' | 'down';
  trendSuffix?: string;
  chartPath?: string;
  dark?: boolean;
}

export default function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendDirection = 'up',
  trendSuffix = '%',
  chartPath = "M0 25 Q10 20 20 25 T40 15 T60 20 T80 5 T100 10",
  dark = false
}: StatCardProps) {
  const isUp = trendDirection === 'up';

  if (dark) {
    return (
      <div className="bg-[#45362B] rounded-3xl p-6 shadow-md border border-[#5a483c] flex flex-col relative overflow-hidden">
        <div className="flex items-center gap-2 text-sm font-medium text-white/90 mb-4 z-10">
          <div className="p-1.5 bg-white/10 rounded-full">{icon}</div>
          {title}
        </div>
        {trend !== undefined && (
          <div className="text-xs font-medium text-white/50 mb-1 flex items-center gap-1 z-10">
            {isUp ? <ArrowUp size={12}/> : <ArrowDown size={12}/>} {isUp ? '+' : '-'}{trend}{trendSuffix}
          </div>
        )}
        <div className="text-2xl font-bold text-white mb-4 z-10">{value}</div>
        <svg className="w-full h-12 stroke-[var(--color-primary)] z-10" viewBox="0 0 100 30" fill="none">
          <path d={chartPath} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-4">
        <div className="p-1.5 bg-gray-100 rounded-full">{icon}</div>
        {title}
      </div>
      {trend !== undefined && (
        <div className={`text-xs font-medium ${isUp ? 'text-[var(--color-primary)]' : 'text-orange-500'} mb-1 flex items-center gap-1`}>
          {isUp ? <ArrowUp size={12}/> : <ArrowDown size={12}/>} {isUp ? '+' : '-'}{trend}{trendSuffix}
        </div>
      )}
      <div className="text-2xl font-bold text-gray-900 mb-4">{value}</div>
      <svg className="w-full h-12 stroke-[var(--color-primary)]" viewBox="0 0 100 30" fill="none">
        <path d={chartPath} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}
