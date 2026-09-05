import React from 'react';
import { ChevronDown, Layers } from 'lucide-react';
import OperatorDropdown, { OPERATORS } from './OperatorDropdown';

/**
 * TopNav - Engineering Workstation Navigation Bar
 * Features:
 * - 4-pillar brand mark
 * - Clean text navigation where only the active page is visibly emphasized
 * - Air-gap telemetry indicator (Ext: 0 · Loc: 3)
 * - Operator profile with persona switcher popover
 */
export default function TopNav({
  activePage,
  onNavigate,
  user,
  onSelectOperator
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'workspace', label: 'Workspace' },
    { id: 'kb', label: 'Knowledge Base' }
  ];

  const navRef = React.useRef(null);
  const tabRefs = React.useRef({});
  const [indicatorStyle, setIndicatorStyle] = React.useState({ left: 0, width: 0, opacity: 0 });

  React.useLayoutEffect(() => {
    const updateIndicator = () => {
      const activeEl = tabRefs.current[activePage];
      const containerEl = navRef.current;
      if (activeEl && containerEl) {
        const containerRect = containerEl.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        setIndicatorStyle({
          left: activeRect.left - containerRect.left,
          width: activeRect.width,
          opacity: 1
        });
      }
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activePage]);

  // Operator Dropdown Popover State
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownContainerRef = React.useRef(null);

  React.useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (e) => {
      if (dropdownContainerRef.current && !dropdownContainerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  return (
    <header
      className="anim-nav-enter"
      style={{
        height: '52px',
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border-medium)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 100,
        userSelect: 'none'
      }}
    >
      {/* Brand & Page Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => onNavigate('dashboard')}
          title="Return to Citadel Dashboard"
        >
          {/* Citadel Stacked Layer Logo */}
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-xs)',
            background: 'rgba(182, 216, 58, 0.08)',
            border: '1px solid rgba(182, 216, 58, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-lemongrass)',
            flexShrink: 0,
            filter: 'drop-shadow(0 0 6px rgba(182, 216, 58, 0.35))'
          }}>
            <Layers size={17} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '13.5px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: 'var(--text-main)',
              lineHeight: 1.15
            }}>
              CITADEL <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>WORKSPACE</span>
            </div>
          </div>
        </div>

        <div style={{ height: '20px', width: '1px', background: 'var(--border-subtle)' }} />

        {/* Clean Engineering Text Navigation: Traveling Yellow Line */}
        <nav
          ref={navRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            position: 'relative',
            height: '52px'
          }}
        >
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                ref={(el) => { if (el) tabRefs.current[item.id] = el; }}
                onClick={() => onNavigate(item.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '0 12px',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '12.5px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--text-main)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'color 0.15s ease',
                  borderRadius: 0,
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {item.label}
              </button>
            );
          })}

          {/* Traveling Yellow Accent Line Indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              transform: `translateX(${indicatorStyle.left}px)`,
              width: `${indicatorStyle.width}px`,
              height: '2px',
              backgroundColor: 'var(--accent-lemongrass)',
              opacity: indicatorStyle.opacity,
              transition: 'transform 0.28s cubic-bezier(0.2, 0, 0, 1), width 0.28s cubic-bezier(0.2, 0, 0, 1), opacity 0.15s ease',
              pointerEvents: 'none',
              boxShadow: '0 0 8px rgba(182, 216, 58, 0.45)'
            }}
          />
        </nav>
      </div>

      {/* Right Controls: Operator Profile Dropdown */}
      <div ref={dropdownContainerRef} style={{ position: 'relative' }}>
        <div
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="btn-modern"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: isDropdownOpen ? 'var(--bg-elevated)' : 'var(--bg-surface)',
            border: `1px solid ${isDropdownOpen ? 'var(--border-highlight)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-xs)',
            padding: '4px 10px',
            cursor: 'pointer',
            fontSize: '11.5px',
            color: 'var(--text-secondary)'
          }}
          title="Click to switch operator profile"
        >
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: 'var(--radius-xs)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-main)',
            fontSize: '9.5px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)'
          }}>
            {user?.initials || user?.name?.[0] || 'CH'}
          </div>
          <div>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{user?.name || 'Chaitanya'}</span>
            <span style={{ color: 'var(--text-dim)', marginLeft: '6px', fontSize: '10.5px' }}>
              ({user?.role || 'Agent Systems'})
            </span>
          </div>
          <ChevronDown
            size={11}
            style={{
              color: 'var(--text-dim)',
              marginLeft: '2px',
              transform: isDropdownOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s ease'
            }}
          />
        </div>

        {/* Operator Profile Dropdown Popover */}
        <OperatorDropdown
          isOpen={isDropdownOpen}
          onClose={() => setIsDropdownOpen(false)}
          currentOperator={user}
          operators={OPERATORS}
          onSelectOperator={onSelectOperator}
        />
      </div>
    </header>
  );
}
