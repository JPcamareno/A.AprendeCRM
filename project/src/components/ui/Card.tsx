import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('bg-white rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md', className)}>
      {children}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string; // Nuevo: para mostrar info adicional
  icon: ReactNode;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

export function MetricCard({ title, value, subtitle, icon, color = 'blue' }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-primary-500 to-primary-600 shadow-primary-500/20',
    green: 'bg-gradient-to-br from-secondary-500 to-secondary-600 shadow-secondary-500/20',
    orange: 'bg-gradient-to-br from-accent-mint to-accent-ocean shadow-accent-mint/20',
    red: 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/20',
    purple: 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/20',
  };

  return (
    <Card className="p-6 hover:scale-105 transition-transform duration-200 overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 mb-2 truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900 truncate" title={String(value)}>{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-xl shadow-lg flex-shrink-0',
          colorClasses[color]
        )}>
          <div className="text-white">{icon}</div>
        </div>
      </div>
    </Card>
  );
}