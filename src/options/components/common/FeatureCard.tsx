/**
 * Feature card component for dashboard and settings
 */

import type { ReactNode } from 'react';

interface FeatureCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
  className?: string;
}

export function FeatureCard({
  title,
  value,
  icon,
  subtitle,
  trend,
  onClick,
  className = '',
}: FeatureCardProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      type={onClick ? 'button' : undefined}
      className={`feature-card ${onClick ? 'feature-card-clickable' : ''} ${className}`}
      onClick={onClick}
    >
      {icon && <div className="feature-card-icon">{icon}</div>}
      <div className="feature-card-content">
        <span className="feature-card-title">{title}</span>
        <span className="feature-card-value">{value}</span>
        {subtitle && (
          <span
            className={`feature-card-subtitle ${trend ? `trend-${trend}` : ''}`}
          >
            {subtitle}
          </span>
        )}
      </div>
    </Component>
  );
}
