import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Gem,
  LayoutDashboard,
  PlusCircle,
  FileText,
  BookOpen,
  Boxes,
  Users,
  BellRing,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  CreditCard,
  Hammer,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';

export const AppShell: React.FC = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isOwner = role === 'OWNER';

  // Navigation Items
  const staffNav = [
    { to: '/', label: 'Quick Entry', icon: <PlusCircle className="h-5 w-5" />, end: true },
    { to: '/staff/entries', label: 'My Entries', icon: <FileText className="h-5 w-5" /> },
    { to: '/sales/new', label: 'New Sale', icon: <ShoppingBag className="h-5 w-5" /> },
    { to: '/vouchers/new', label: 'Voucher', icon: <CreditCard className="h-5 w-5" /> },
  ];

  const ownerNav = [
    { to: '/owner/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { to: '/owner/entries', label: 'All Entries', icon: <FileText className="h-5 w-5" /> },
    { to: '/owner/ledger', label: 'Party Ledger', icon: <BookOpen className="h-5 w-5" /> },
    { to: '/owner/stock', label: 'Stock Register', icon: <Boxes className="h-5 w-5" /> },
    { to: '/owner/books', label: 'Cash & Bank', icon: <CreditCard className="h-5 w-5" /> },
    { to: '/owner/staff', label: 'Staff Accounts', icon: <Users className="h-5 w-5" /> },
    { to: '/owner/reminders', label: 'Reminders & WhatsApp', icon: <BellRing className="h-5 w-5" /> },
    { to: '/owner/audit', label: 'Audit Logs', icon: <ShieldAlert className="h-5 w-5" /> },
  ];

  const currentNav = isOwner ? ownerNav : staffNav;

  return (
    <div className="min-h-screen bg-[#FBF7F2] flex flex-col md:flex-row text-[#2B2B2B]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#E8DFD5] shrink-0 sticky top-0 h-screen justify-between z-20">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-[#F5EFE6] flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#9B1C31] flex items-center justify-center shadow-soft text-amber-300">
              <Gem className="h-5 w-5 text-[#FAF6EF]" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold tracking-tight text-[#9B1C31]">
                Kumkum Payal
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#FAF6EF] text-[#B8893B] border border-[#EBD7BA]">
                  {role || 'USER'}
                </span>
                <span className="text-xs text-[#8C857E] font-medium truncate max-w-[90px]">
                  {user?.name || user?.username}
                </span>
              </div>
            </div>
          </div>

          {/* Nav List */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#AFA190]">
              {isOwner ? 'Management Console' : 'Staff Operations'}
            </div>
            {currentNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-[#9B1C31] text-white shadow-soft font-semibold'
                      : 'text-[#66615C] hover:bg-[#F5EFE6] hover:text-[#2B2B2B]'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}

            {/* Quick Link for Owner to Staff View */}
            {isOwner && (
              <div className="pt-4 border-t border-[#F5EFE6] mt-4">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#AFA190]">
                  Rapid Entries
                </div>
                <NavLink
                  to="/"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#B8893B] hover:bg-[#FAF6EF] transition"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Entry Dashboard</span>
                </NavLink>
              </div>
            )}
          </nav>
        </div>

        {/* User Footer with Logout */}
        <div className="p-4 border-t border-[#F5EFE6] bg-[#FAF6EF]/50">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <div className="text-xs font-bold text-[#2B2B2B] truncate">{user?.name}</div>
              <div className="text-[11px] text-[#8C857E] truncate">@{user?.username}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-xl text-[#8C857E] hover:text-rose-600 hover:bg-rose-50 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E8DFD5] px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[#9B1C31] flex items-center justify-center text-amber-300">
            <Gem className="h-4 w-4 text-[#FAF6EF]" />
          </div>
          <span className="font-serif font-bold text-base text-[#9B1C31]">
            Kumkum Payal
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FAF6EF] text-[#B8893B] border border-[#EBD7BA]">
            {role}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isOwner && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#66615C] hover:bg-[#F5EFE6]"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-[#8C857E] hover:text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown (for Owner extra links) */}
      {mobileMenuOpen && isOwner && (
        <div className="md:hidden fixed inset-x-0 top-14 bg-white border-b border-[#E8DFD5] shadow-lg z-40 p-4 space-y-1 animate-in slide-in-from-top-2">
          {ownerNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                  isActive ? 'bg-[#9B1C31] text-white font-semibold' : 'text-[#66615C]'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
          <div className="pt-2 border-t border-[#F5EFE6]">
            <NavLink
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3.5 py-2 text-xs font-bold text-[#B8893B]"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Staff Rapid Entry Mode</span>
            </NavLink>
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-20 md:pb-6">
        <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (48px+ touch targets) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#E8DFD5] z-30 flex items-center justify-around h-16 px-2 shadow-lg">
        {isOwner ? (
          <>
            <NavLink
              to="/owner/dashboard"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition ${
                  isActive ? 'text-[#9B1C31] font-bold' : 'text-[#8C857E]'
                }`
              }
            >
              <LayoutDashboard className="h-5 w-5 mb-0.5" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink
              to="/owner/entries"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition ${
                  isActive ? 'text-[#9B1C31] font-bold' : 'text-[#8C857E]'
                }`
              }
            >
              <FileText className="h-5 w-5 mb-0.5" />
              <span>Entries</span>
            </NavLink>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition ${
                  isActive ? 'text-[#9B1C31] font-bold' : 'text-[#B8893B]'
                }`
              }
            >
              <PlusCircle className="h-5 w-5 mb-0.5" />
              <span>+ New</span>
            </NavLink>
            <NavLink
              to="/owner/ledger"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition ${
                  isActive ? 'text-[#9B1C31] font-bold' : 'text-[#8C857E]'
                }`
              }
            >
              <BookOpen className="h-5 w-5 mb-0.5" />
              <span>Ledger</span>
            </NavLink>
            <NavLink
              to="/owner/stock"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition ${
                  isActive ? 'text-[#9B1C31] font-bold' : 'text-[#8C857E]'
                }`
              }
            >
              <Boxes className="h-5 w-5 mb-0.5" />
              <span>Stock</span>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition ${
                  isActive ? 'text-[#9B1C31] font-bold' : 'text-[#8C857E]'
                }`
              }
            >
              <PlusCircle className="h-5 w-5 mb-0.5" />
              <span>Home</span>
            </NavLink>
            <NavLink
              to="/sales/new"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition ${
                  isActive ? 'text-[#9B1C31] font-bold' : 'text-[#8C857E]'
                }`
              }
            >
              <ShoppingBag className="h-5 w-5 mb-0.5" />
              <span>Sale</span>
            </NavLink>
            <NavLink
              to="/vouchers/new"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition ${
                  isActive ? 'text-[#9B1C31] font-bold' : 'text-[#8C857E]'
                }`
              }
            >
              <CreditCard className="h-5 w-5 mb-0.5" />
              <span>Receipt</span>
            </NavLink>
            <NavLink
              to="/staff/entries"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition ${
                  isActive ? 'text-[#9B1C31] font-bold' : 'text-[#8C857E]'
                }`
              }
            >
              <FileText className="h-5 w-5 mb-0.5" />
              <span>My Entries</span>
            </NavLink>
          </>
        )}
      </nav>
    </div>
  );
};
