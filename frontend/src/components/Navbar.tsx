import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/seller', label: 'Seller', icon: '🌱' },
  { to: '/auditor', label: 'Auditor', icon: '🔍' },
  { to: '/buyer', label: 'Buyer', icon: '🛒' },
  { to: '/explorer', label: 'Explorer', icon: '🔗' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🍃</span>
            <span className="text-xl font-bold bg-gradient-to-r from-brand-400 to-teal-400 bg-clip-text text-transparent
                             group-hover:from-brand-300 group-hover:to-teal-300 transition-all">
              ClimateTrust
            </span>
          </NavLink>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Mobile toggle */}
          <button
            className="sm:hidden text-gray-400 hover:text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-gray-700/50 px-4 py-3 space-y-1 animate-slide-up">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}
