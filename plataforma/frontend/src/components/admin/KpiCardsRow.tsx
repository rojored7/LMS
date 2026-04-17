import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, GraduationCap, Award, FileCheck, TrendingUp, TrendingDown } from 'lucide-react';
import type { PlatformStats, ComparativeStats } from '../../services/api/dashboard-analytics.service';

interface KpiCardsRowProps {
  stats: PlatformStats | null;
  comparative: ComparativeStats | null;
  isLoading: boolean;
}

interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  changePercent?: number;
  icon: React.ReactNode;
  accentColor: string;
  isLoading: boolean;
  onClick?: () => void;
  delay?: number;
}

function AnimatedNumber({ target, duration = 600 }: { target: number; duration?: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (target === 0) { setCurrent(0); return; }
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return <>{current}</>;
}

function KpiCard({ label, value, subtitle, changePercent, icon, accentColor, isLoading, onClick, delay = 0 }: KpiCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (isLoading) {
    return (
      <div className="bg-[#0F2035] rounded-xl border border-white/10 p-5 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-24 mb-3" />
        <div className="h-8 bg-white/10 rounded w-16 mb-2" />
        <div className="h-3 bg-white/10 rounded w-20" />
      </div>
    );
  }

  const isPositive = changePercent !== undefined && changePercent >= 0;
  const numericValue = typeof value === 'number' ? value : null;

  return (
    <div
      onClick={onClick}
      className={`bg-[#0F2035] rounded-xl border border-white/10 overflow-hidden cursor-pointer
        transition-all duration-300 ease-out
        hover:scale-[1.03] hover:border-opacity-50
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{
        borderColor: visible ? undefined : 'transparent',
        transitionProperty: 'transform, box-shadow, border-color, opacity',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 0 20px ${accentColor}30, 0 4px 20px rgba(0,0,0,0.3)`;
        e.currentTarget.style.borderColor = `${accentColor}50`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = '';
      }}
    >
      <div className="h-1" style={{ backgroundColor: accentColor }} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/50 text-sm font-medium">{label}</span>
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${accentColor}20` }}>
            {icon}
          </div>
        </div>
        <p className="text-3xl font-bold text-white">
          {numericValue !== null ? <AnimatedNumber target={numericValue} /> : value}
        </p>
        <div className="flex items-center gap-2 mt-2">
          {changePercent !== undefined && (
            <span className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? '+' : ''}{changePercent}%
            </span>
          )}
          {subtitle && <span className="text-white/40 text-xs">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
}

export default function KpiCardsRow({ stats, comparative, isLoading }: KpiCardsRowProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      <KpiCard
        label="Total Usuarios"
        value={stats?.totalUsers ?? 0}
        changePercent={comparative?.users.changePercent}
        subtitle="vs mes anterior"
        icon={<Users className="w-5 h-5" style={{ color: '#00A6FF' }} />}
        accentColor="#00A6FF"
        isLoading={isLoading}
        onClick={() => navigate('/admin/users')}
        delay={0}
      />
      <KpiCard
        label="Cursos Activos"
        value={stats?.totalCourses ?? 0}
        icon={<BookOpen className="w-5 h-5" style={{ color: '#FF5100' }} />}
        accentColor="#FF5100"
        isLoading={isLoading}
        onClick={() => navigate('/admin/courses')}
        delay={80}
      />
      <KpiCard
        label="Inscripciones"
        value={stats?.totalEnrollments ?? 0}
        changePercent={comparative?.enrollments.changePercent}
        subtitle="vs mes anterior"
        icon={<GraduationCap className="w-5 h-5" style={{ color: '#166EB6' }} />}
        accentColor="#166EB6"
        isLoading={isLoading}
        onClick={() => navigate('/admin/users')}
        delay={160}
      />
      <KpiCard
        label="Tasa Completado"
        value={`${stats?.completionRate ?? 0}%`}
        changePercent={comparative?.completions.changePercent}
        subtitle="vs mes anterior"
        icon={<Award className="w-5 h-5" style={{ color: '#10B981' }} />}
        accentColor="#10B981"
        isLoading={isLoading}
        onClick={() => navigate('/admin/users')}
        delay={240}
      />
      <KpiCard
        label="Certificados"
        value={stats?.totalCertificates ?? 0}
        icon={<FileCheck className="w-5 h-5" style={{ color: '#8B5CF6' }} />}
        accentColor="#8B5CF6"
        isLoading={isLoading}
        onClick={() => navigate('/admin/users')}
        delay={320}
      />
    </div>
  );
}
