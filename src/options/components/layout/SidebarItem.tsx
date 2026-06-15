/**
 * Sidebar navigation item component
 */

import { useState, useEffect, type ReactNode } from 'react';

interface SubItem {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

interface SidebarItemProps {
  icon?: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  hasSubmenu?: boolean;
  subItems?: SubItem[];
  expanded?: boolean;
  nested?: boolean;
}

export function SidebarItem({
  icon,
  label,
  active,
  onClick,
  hasSubmenu = false,
  subItems = [],
  expanded = false,
  nested = false,
}: SidebarItemProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirror controlled prop into local state
    setIsExpanded(expanded);
  }, [expanded]);

  const handleClick = () => {
    if (hasSubmenu) {
      setIsExpanded(!isExpanded);
    }
    onClick();
  };

  return (
    <div
      className={`sidebar-item-container ${nested ? 'sidebar-item-nested' : ''}`}
    >
      <button
        type="button"
        className={`sidebar-item ${active ? 'sidebar-item-active' : ''} ${nested ? 'sidebar-item-nested-btn' : ''}`}
        onClick={handleClick}
      >
        {icon && <span className="sidebar-item-icon">{icon}</span>}
        <span className="sidebar-item-label">{label}</span>
        {hasSubmenu && (
          <span
            className={`sidebar-item-chevron ${isExpanded ? 'expanded' : ''}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </span>
        )}
      </button>

      {hasSubmenu && isExpanded && subItems.length > 0 && (
        <div className="sidebar-submenu">
          {subItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar-subitem ${item.active ? 'sidebar-subitem-active' : ''}`}
              onClick={item.onClick}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
