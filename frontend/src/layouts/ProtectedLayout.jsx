import React, { useEffect, useState, useRef } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Users,
  Network,
  LogOut,
  Terminal,
  Search,
  Bell,
  Menu,
  LayoutDashboard,
  ChevronRight,
  Maximize2,
  Command,
  CircleUserRound,
  BadgeCheck,
  ShieldAlert,
  Globe,
  Server,
  FileText,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';
import axios from 'axios';

export default function ProtectedLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const stompClientRef = useRef(null);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const [popupAlert, setPopupAlert] = useState(null);

  // Fetch unread notifications from DB at startup
  const syncNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications');
      setNotifications(response.data);
    } catch (err) {
      console.error("Could not sync notifications:", err);
    }
  };

  const playAlertSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const audioCtx = new AudioContext();
      
      // Play a short synth dual-beep
      const playBeep = (freq, startTime, duration) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      playBeep(880, audioCtx.currentTime, 0.15); // A5 note
      playBeep(1109, audioCtx.currentTime + 0.18, 0.25); // C#6 note
    } catch (e) {
      console.warn("Audio Context autoplay restriction", e);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    // Sync initial notifications from H2 DB
    syncNotifications();

    // Configure SockJS + STOMP client
    const socket = new SockJS('http://localhost:8080/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (msg) => {
        // console.log("[STOMP Debug] " + msg);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    client.onConnect = () => {
      // Subscribe to real-time alerts channel
      client.subscribe('/topic/alerts', (message) => {
        try {
          const alert = JSON.parse(message.body);
          // Play notification audio alert
          playAlertSound();
          
          // Setup pop-up notification banner
          setPopupAlert(alert);
          // Clear banner after 6 seconds
          setTimeout(() => {
            setPopupAlert((prev) => (prev && prev.id === alert.id ? null : prev));
          }, 6000);

          // Force sync lists
          syncNotifications();
        } catch (err) {
          console.error("Error parsing WebSocket alert message:", err);
        }
      });

      // Subscribe to general notification broadcasts
      client.subscribe('/topic/notifications', () => {
        syncNotifications();
      });
    };

    client.onStompError = (frame) => {
      console.error("STOMP protocol error:", frame.headers['message']);
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [user]);

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

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.post(`/api/notifications/read/${id}`);
      syncNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await axios.post('/api/notifications/read-all');
      setNotifications([]);
      setShowBellDropdown(false);
    } catch (err) {
      console.error(err);
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Log Ingestion', path: '/logs', icon: Terminal },
    { name: 'Alert Center', path: '/alerts', icon: ShieldAlert },
    { name: 'Incident Room', path: '/incidents', icon: ShieldAlert },
    { name: 'Threat Intel', path: '/threat-intel', icon: Globe },
    { name: 'Asset Registry', path: '/assets', icon: Server },
    { name: 'Compliance Reports', path: '/reports', icon: FileText },
    { name: 'User Management', path: '/users', icon: Users },
    { name: 'Team Directory', path: '/teams', icon: Network },
  ];

  const currentRoute = menuItems.find((item) => location.pathname === item.path) || { name: 'Command Center' };
  const userInitial = (user?.name || user?.email || 'S').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen sc-shell text-slate-100 lg:flex lg:gap-6 lg:p-6 relative">
      {/* Real-time Alert Pop-up Notification Banner */}
      {popupAlert && (
        <div className="fixed top-6 right-6 z-50 w-80 p-5 rounded-2xl border border-red-500/30 bg-[#0c0d16]/95 backdrop-blur-md shadow-2xl animate-slide-in">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertTriangle className="w-5 h-5 animate-bounce text-red-500" />
              <span className="font-bold font-mono text-[10px] uppercase tracking-wider">{popupAlert.severity} THREAT</span>
            </div>
            <button
              onClick={() => setPopupAlert(null)}
              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 text-xs font-bold text-white font-mono">{popupAlert.alertId}</div>
          <p className="mt-1 text-xs text-slate-300 font-mono leading-relaxed">{popupAlert.description}</p>
          <div className="mt-3 flex justify-end">
            <Link
              to="/alerts"
              onClick={() => setPopupAlert(null)}
              className="text-[9px] uppercase font-mono tracking-wider font-bold bg-red-500 text-black px-3 py-1.5 rounded-lg hover:bg-red-400 transition"
            >
              Triage Alert
            </Link>
          </div>
        </div>
      )}

      <aside className={`sc-sidebar fixed inset-y-0 left-0 z-30 flex w-80 flex-col overflow-hidden border-r border-white/8 p-5 transition-transform duration-200 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:translate-x-0 ${isCollapsed ? '-translate-x-full lg:w-24' : 'translate-x-0'}`}>
        <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-5">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-sky-400 shadow-[0_12px_28px_rgba(37,99,235,0.35)]">
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
        </div>

        <div className="mt-5 rounded-2xl border border-white/8 bg-[#0b1220]/70 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/20">
              {userInitial}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="sc-badge border-emerald-500/20 bg-emerald-500/10 text-emerald-300">{user.role}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Online
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="mt-5 flex-1 space-y-2 overflow-y-auto pr-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition duration-200 ${isActive ? 'bg-blue-500/10 text-white ring-1 ring-blue-400/25' : 'text-slate-400 hover:bg-white/5 hover:text-white'} ${isCollapsed ? 'justify-center' : ''}`}
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${isActive ? 'border-blue-400/30 bg-blue-400/10 text-sky-300' : 'border-white/8 bg-[#0f172a] text-slate-400 group-hover:border-white/10 group-hover:text-sky-300'}`}>
                  <Icon className="h-5 w-5" />
                </span>
                {!isCollapsed && <span className="flex-1 text-left">{item.name}</span>}
                {!isCollapsed && isActive && <ChevronRight className="h-4 w-4 text-sky-300" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 space-y-3 border-t border-white/8 pt-4">
          {!isCollapsed && (
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-300">
                  <CircleUserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">{user.email}</p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                    <BadgeCheck className="h-3.5 w-3.5 text-emerald-300" />
                    RBAC Tier 1 Secure
                  </div>
                </div>
              </div>
            </div>
          )}
          <button onClick={logout} className={`sc-button-danger w-full px-4 py-3 text-sm font-semibold ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-6 lg:ml-0">
        <header className="sc-topbar sticky top-0 z-20 mx-4 mt-4 flex flex-col gap-4 px-4 py-4 sm:px-6 lg:mx-0 lg:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setIsCollapsed((value) => !value)}
                className="inline-flex rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:border-sky-400/30 hover:text-white lg:hidden"
                aria-label="Toggle navigation"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-slate-400">
                  <span>Command center</span>
                  <ChevronRight className="h-3 w-3" />
                  <span>{currentRoute.name}</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{currentRoute.name}</h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
                  <span>Home</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  <span>{currentRoute.name}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(240px,1fr)_auto] xl:min-w-[42rem] xl:grid-cols-[minmax(280px,1fr)_auto_auto] relative">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search incidents, users, teams"
                  className="glass-input w-full border-white/10 bg-[#0b1220]/90 py-3 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-500 animate-none focus:outline-none"
                />
              </div>

              {/* Real-time Alerts Notification Bell Button */}
              <div className="relative inline-block">
                <button
                  onClick={() => setShowBellDropdown(!showBellDropdown)}
                  className="sc-button-secondary w-full px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <div className="relative">
                    <Bell className="h-4 w-4 text-sky-300" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-black font-extrabold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                        {notifications.length}
                      </span>
                    )}
                  </div>
                  <span>Alerts</span>
                </button>

                {showBellDropdown && (
                  <div className="absolute right-0 mt-3 w-80 glass-card border border-white/8 bg-[#0b1220]/95 backdrop-blur-md rounded-2xl shadow-2xl p-4 overflow-hidden z-50">
                    <div className="flex justify-between items-center pb-2 border-b border-white/8 mb-3">
                      <span className="text-xs font-bold text-white font-mono">Recent Alerts ({notifications.length})</span>
                      {notifications.length > 0 && (
                        <button
                          onClick={handleClearAllNotifications}
                          className="text-[9px] uppercase font-mono tracking-wider font-bold text-sky-400 hover:text-sky-300 cursor-pointer bg-transparent border-none"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 font-mono text-[10px]">
                          No unread security incidents.
                        </div>
                      ) : (
                        notifications.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-start justify-between hover:bg-white/10 transition"
                          >
                            <div className="space-y-1 max-w-[80%]">
                              <h4 className="text-[11px] font-bold text-white font-mono truncate">{item.title}</h4>
                              <p className="text-[10px] text-slate-400 font-mono line-clamp-2 leading-relaxed">{item.message}</p>
                              <span className="text-[8px] text-slate-500 font-mono block">
                                {new Date(item.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                            <button
                              onClick={(e) => handleMarkAsRead(item.id, e)}
                              className="p-1 hover:bg-white/15 text-emerald-400 rounded transition cursor-pointer bg-transparent border-none"
                              title="Dismiss"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button className="sc-button-primary px-4 py-3 text-sm font-semibold">
                <Command className="h-4 w-4" />
                Quick Actions
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4 text-xs text-slate-400">
            <div className="flex flex-wrap items-center gap-2">
              <span className="sc-badge border-emerald-500/20 bg-emerald-500/10 text-emerald-300">ONLINE</span>
              <span className="sc-badge border-sky-500/20 bg-sky-500/10 text-sky-300">JWT-SECURE</span>
              <span className="sc-badge border-white/10 bg-white/5 text-slate-300">{user.role}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5">
                <Maximize2 className="h-3.5 w-3.5 text-sky-300" />
                <span>{user.email}</span>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-sky-400 text-sm font-semibold text-white ring-1 ring-white/10">
                {userInitial}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-4 mb-4 flex-1 overflow-y-auto rounded-[1.75rem] border border-white/8 bg-[#0b1220]/45 p-4 sm:p-6 lg:mx-0 lg:p-8">
          <div className="mx-auto w-full max-w-[1700px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
