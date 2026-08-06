import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useToast } from '../components/Toast';
import ChatBot from '../components/ChatBot';
import {
  Shield,
  Users,
  Network,
  LogOut,
  Terminal,
  Menu,
  LayoutDashboard,
  ScrollText,
  ChevronRight,
  BadgeCheck,
  Radar,
  BellRing,
  Bug,
  Siren,
  X,
  Bell,
  Server,
  FileText,
  BookMarked,
  FileBarChart,
  ShieldCheck,
  BellDotIcon,
  BookOpen,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';

export default function ProtectedLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const { showToast } = useToast();
  const initialFetchRef = useRef(true);
  const knownNotificationIdsRef = useRef(new Set());
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });
  const [isScrolled, setIsScrolled] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Real-time WebSocket connection to /topic/notifications
  const { events: wsEvents } = useWebSocket('http://localhost:8080/ws', '/topic/notifications');

  const fetchNotifications = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const response = await axios.get('/api/notifications');
      const fetchedList = Array.isArray(response.data) ? response.data : [];
      setNotifications(fetchedList);

      if (initialFetchRef.current) {
        // Record all existing notification IDs on first load
        knownNotificationIdsRef.current = new Set(fetchedList.map((item) => item.id));
        initialFetchRef.current = false;
      } else {
        // Trigger Toast popup for newly arrived notifications
        fetchedList.forEach((item) => {
          if (item.id && !knownNotificationIdsRef.current.has(item.id)) {
            knownNotificationIdsRef.current.add(item.id);

            const toastType = item.severity === 'CRITICAL' || item.severity === 'HIGH' ? 'error'
              : item.severity === 'MEDIUM' ? 'warning'
              : 'info';

            showToast({
              title: item.title || 'Security Notification',
              message: item.message || 'New security event received.',
              type: toastType,
              duration: 6000,
            });
          }
        });
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [showToast]);

  const handleMarkAsRead = async (id) => {
    try {
      await axios.post(`/api/notifications/read/${id}`);
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.post('/api/notifications/read-all');
      setNotifications([]);
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  };

  // Trigger notification refresh when WebSocket notification updates arrive
  useEffect(() => {
    if (user && wsEvents && wsEvents.length > 0) {
      fetchNotifications();
    }
  }, [wsEvents, user, fetchNotifications]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let prevWidth = window.innerWidth;
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      if (prevWidth >= 1024 && currentWidth < 1024) {
        setIsCollapsed(true);
      } else if (prevWidth < 1024 && currentWidth >= 1024) {
        setIsCollapsed(false);
      }
      prevWidth = currentWidth;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    fetchNotifications();
    // Fast polling every 3 seconds for immediate UI sync fallback
    const intervalId = window.setInterval(fetchNotifications, 3000);
    return () => window.clearInterval(intervalId);
  }, [user, fetchNotifications]);

  if (loading) {
    return (
      <div className="min-h-screen sc-shell flex flex-col items-center justify-center px-4">
        <div className="relative mb-4 h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
        </div>
        <div className="flex items-center space-x-2 font-mono text-sm text-slate-400">
          <Terminal className="w-4 h-4 text-primary animate-pulse" />
          <span>Loading your session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Users', path: '/users', icon: Users },
    { name: 'Teams', path: '/teams', icon: Network },
    { name: 'Assets', path: '/assets', icon: Server },
    { name: 'Threat Intel', path: '/threat-intel', icon: Radar },
    { name: 'Incidents', path: '/incidents', icon: Siren },
    ...(user?.role === 'ADMIN' || user?.role === 'ANALYST'
      ? [{ name: 'Audit Trails', path: '/audit-logs', icon: ScrollText }]
      : []),

    { name: 'Log Explorer', path: '/logs', icon: FileText },
    { name: 'Alerts Management', path: '/alerts', icon: BellRing },
    { name: 'Vulnerabilities', path: '/vulnerabilities', icon: Bug },
    { name: 'Compliance', path: '/compliance', icon: ShieldCheck },
    { name: 'Playbooks', path: '/playbooks', icon: BookOpen },
    { name: 'Reports', path: '/reports', icon: FileBarChart },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Knowledge Base', path: '/knowledge-base', icon: BookMarked },
  ];
  const currentRoute = menuItems.find((item) => location.pathname === item.path) || { name: 'Command Center' };
  const userInitial = (user?.name || user?.email || 'S').charAt(0).toUpperCase();
  const criticalNotificationCount = notifications.filter((item) => item.severity === 'CRITICAL').length;
  const severityClasses = {
    CRITICAL: 'border-red-500/25 bg-red-500/10 text-red-300',
    HIGH: 'border-orange-500/25 bg-orange-500/10 text-orange-300',
    MEDIUM: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
    LOW: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
  };

  return (
    <div className="min-h-screen sc-shell text-slate-100 lg:flex lg:gap-6 lg:p-6">
      {/* Mobile Sidebar Overlay Backdrop */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 z-20 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      <aside className={`sc-sidebar fixed inset-y-0 left-0 z-30 flex w-80 flex-col overflow-hidden border-r border-white/8 p-5 transition-transform duration-200 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:translate-x-0 ${isCollapsed ? '-translate-x-full lg:w-24' : 'translate-x-0'}`}>
        <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-5">
          <Link
            to="/dashboard"
            className="flex items-center gap-3"
            onClick={() => { if (window.innerWidth < 1024) setIsCollapsed(true); }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-800 to-sky-200 shadow-[0_12px_28px_rgba(37,99,235,0.35)]">
              <Shield className="h-6 w-6 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <div className="text-base font-bold tracking-[0.2em] text-white">SENTINEL<span className="text-sky-300">CORE</span></div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Enterprise Security</p>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setIsCollapsed((value) => !value)}
            className="hidden rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:border-sky-400/30 hover:text-white lg:inline-flex"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
          {/* Mobile Close Button */}
          {!isCollapsed && (
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:border-sky-400/30 hover:text-white lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="mt-5 flex-1 space-y-2 overflow-y-auto pr-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => { if (window.innerWidth < 1024) setIsCollapsed(true); }}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition duration-200 ${isActive ? 'bg-blue-500/10 text-white ring-1 ring-blue-400/25' : 'text-slate-400 hover:bg-white/5 hover:text-white'} ${isCollapsed ? 'justify-center' : ''}`}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${isActive ? 'border-blue-400/30 bg-blue-400/10 text-sky-300' : 'border-white/8 bg-[#0f172a] text-slate-400 group-hover:border-white/10 group-hover:text-sky-300'}`}>
                  <Icon className="h-5 w-5" />
                </span>
                {!isCollapsed && <span className="flex-1">{item.name}</span>}
                {!isCollapsed && isActive && <ChevronRight className="h-4 w-4 text-sky-300" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 space-y-3 border-t border-white/8 pt-4">
          {!isCollapsed && (
            <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-500/10 text-sm font-bold text-sky-300">
                  {userInitial}
                </div>
                <div className="min-w-0 flex-1">

                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">{user.name || 'SentinelCore User'}</p>
                    <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                  </div>
                  <p className="mt-2 text-[11px] text-green-500">Sentinel Core Version V3.0</p>
                </div>
              </div>
            </div>

          )}

          <button onClick={logout} className={`cursor-pointer sc-button-danger w-full px-4 py-3 text-sm font-semibold ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-6 lg:ml-0">
        <header className={`sc-topbar sticky top-0 z-20 transition-all duration-200 px-4 py-2.5 sm:px-5 lg:px-6 ${isScrolled
          ? 'mx-0 mt-0 rounded-none border-x-0 border-t-0 bg-[#080b14]/95 backdrop-blur-md shadow-lg shadow-black/30'
          : 'mx-4 mt-3 rounded-2xl border lg:mx-0 lg:mt-3'
          }`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setIsCollapsed((value) => !value)}
                className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1.5 text-slate-300 transition hover:border-sky-400/30 hover:text-white lg:hidden"
                aria-label="Toggle navigation"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400">Command Center</span>
                  <ChevronRight className="h-3 w-3 text-slate-600" />
                  <h1 className="text-base font-extrabold tracking-tight text-white truncate">{currentRoute.name}</h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Notifications bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications((val) => {
                      const next = !val;
                      if (next) fetchNotifications();
                      return next;
                    });
                  }}
                  className="relative rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:border-red-400/30 hover:text-white"
                  aria-label="Show notifications"
                >
                  <BellDotIcon className="h-4 w-4 text-red-300" />
                  {notifications.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-full z-40 mt-2 w-[min(92vw,24rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-2xl shadow-black/40">
                    <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Notifications</p>
                        <p className="mt-0.5 text-xs text-slate-300">{criticalNotificationCount} critical / {notifications.length} total</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={fetchNotifications}
                          disabled={isRefreshing}
                          className="rounded p-1 text-slate-400 hover:text-white transition"
                          title="Refresh notifications"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
                        </button>
                        {notifications.length > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllAsRead}
                            className="text-[10px] font-mono text-sky-400 hover:text-sky-300 hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-96 space-y-2 overflow-y-auto p-2">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-xs text-slate-500">No active notifications for your preferences.</div>
                      ) : (
                        notifications.map((item) => (
                          <div key={item.id} className="group relative rounded-xl border border-white/6 bg-white/3 p-3 transition hover:border-white/12">
                            <div className="flex items-start justify-between gap-3">
                              <p className="pr-4 text-sm font-semibold text-white">{item.title}</p>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${severityClasses[item.severity] ?? severityClasses.MEDIUM}`}>
                                  {item.severity ?? 'MEDIUM'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleMarkAsRead(item.id)}
                                  className="rounded p-1 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                                  title="Dismiss notification"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs text-slate-400">{item.message}</p>
                            <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-mono text-slate-600">
                              <span>{item.source ?? 'SYSTEM'}</span>
                              <span>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <Link
                      to="/notifications"
                      onClick={() => setShowNotifications(false)}
                      className="block border-t border-white/8 px-4 py-3 text-center text-xs font-semibold text-sky-300 transition hover:bg-white/5"
                    >
                      Configure notification rules
                    </Link>
                  </div>

                )}

              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu((value) => !value)}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-2 text-slate-300 transition hover:border-sky-400/30 hover:text-white"
                  aria-label="Show user menu"
                  aria-expanded={showUserMenu}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-sky-400 text-xs font-bold text-white ring-1 ring-white/10">
                    {userInitial}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 transition ${showUserMenu ? 'rotate-180 text-sky-300' : ''}`} />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full z-40 mt-2 w-[min(92vw,19rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-2xl shadow-black/40">
                    <div className="border-b border-white/8 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-sky-400 text-sm font-bold text-white ring-1 ring-white/10">
                          {userInitial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-white">{user.name || 'SentinelCore User'}</p>
                            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 p-3 text-xs">
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/6 bg-white/3 px-3 py-2">
                        <span className="text-slate-500">Role</span>
                        <span className="font-semibold text-emerald-300">{user.role}</span>
                      </div>
                      {user.department && (
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/6 bg-white/3 px-3 py-2">
                          <span className="text-slate-500">Department</span>
                          <span className="truncate font-semibold text-slate-200">{user.department}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/6 bg-white/3 px-3 py-2">
                        <span className="text-slate-500">Email</span>
                        <span className="mt-1 truncate text-xs text-slate-400">{user.email}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/6 bg-white/3 px-3 py-2">
                        <span className="text-slate-500">Status</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Online
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-4 mb-4 flex-1 overflow-y-auto rounded-[1.75rem] border border-white/8 bg-[#0b1220]/45 p-4 sm:p-6 lg:mx-0 lg:p-8">
          <div className="mx-auto w-full max-w-[1700px]">{children}</div>
        </main>
      </div>

      <ChatBot />
    </div>
  );
}
