import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { RecentActivity } from '../../services/api/dashboard-analytics.service';

interface RecentActivityFeedProps {
  data: RecentActivity[];
  isLoading: boolean;
}

export default function RecentActivityFeed({ data, isLoading }: RecentActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="bg-[#0F2035] rounded-xl border border-white/10 p-6 animate-pulse">
        <div className="h-5 bg-white/10 rounded w-40 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-2 h-2 bg-white/10 rounded-full mt-2" />
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0F2035] rounded-xl border border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Actividad Reciente</h3>
      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-white/40">
          Sin actividad reciente
        </div>
      ) : (
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {data.map((item, i) => {
            const isCompletion = item.type === 'completion';
            const dotColor = isCompletion ? 'bg-emerald-400' : 'bg-[#00A6FF]';
            const actionText = isCompletion ? 'completo' : 'se inscribio en';
            const timeAgo = item.timestamp
              ? formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, locale: es })
              : '';

            return (
              <div key={`${item.timestamp}-${item.userEmail}-${item.courseTitle}`} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${dotColor}`} />
                  {i < data.length - 1 && <div className="w-px flex-1 bg-white/10 mt-1" />}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-white text-sm">
                    <span className="font-medium">{item.userName}</span>{' '}
                    <span className="text-white/50">{actionText}</span>{' '}
                    <span className="text-[#00A6FF]">{item.courseTitle}</span>
                  </p>
                  <p className="text-white/30 text-xs mt-0.5">{timeAgo}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
