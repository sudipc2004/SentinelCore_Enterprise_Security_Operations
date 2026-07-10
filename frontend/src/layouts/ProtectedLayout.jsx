import React, { useEffect, useState, useRef } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, Users, Network, LogOut, Terminal, 
  LayoutDashboard, ShieldAlert, Globe, Server, FileText, 
  Bell, Check, X, AlertTriangle 
} from 'lucide-react';
import axios from 'axios';

export default function ProtectedLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
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
      // console.log("WebSocket connected successfully!");
      
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
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
        </div>
        <div className="flex items-center space-x-2 text-gray-400 font-mono text-sm">
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

  return (
    <div className="min-h-screen bg-dark-bg text-gray-200 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-dark-border bg-slate-900/40 backdrop-blur-md flex flex-col z-20">
        <div className="p-6 border-b border-dark-border flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-wide text-white">SENTINEL<span className="text-primary font-light">CORE</span></h2>
            <span className="text-xs text-gray-500 font-mono">SOC PLATFORM</span>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="p-4 border-b border-dark-border bg-slate-900/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-secondary/20 border border-secondary/35 flex items-center justify-center text-secondary font-bold text-lg uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <div className="flex items-center space-x-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-xs text-gray-400 font-mono truncate">{user.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Sidebar links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary/15 text-primary border-l-2 border-primary'
                    : 'text-gray-400 hover:bg-slate-800/40 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Logout */}
        <div className="p-4 border-t border-dark-border">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-150 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Real-time Alert Pop-up Notification Banner */}
        {popupAlert && (
          <div className="absolute top-4 right-4 z-50 w-80 p-4 rounded-xl border border-red-500/30 bg-red-950/70 backdrop-blur-md shadow-2xl animate-slide-in">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2 text-red-400">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
                <span className="font-bold font-mono text-xs uppercase tracking-wider">{popupAlert.severity} THREAT</span>
              </div>
              <button
                onClick={() => setPopupAlert(null)}
                className="text-gray-400 hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 text-xs font-bold text-white font-mono">{popupAlert.alertId}</div>
            <p className="mt-1 text-xs text-gray-300 font-mono leading-relaxed">{popupAlert.description}</p>
            <div className="mt-3 flex justify-end">
              <Link
                to="/alerts"
                onClick={() => setPopupAlert(null)}
                className="text-[10px] uppercase font-mono tracking-wider font-bold bg-red-500 text-black px-2.5 py-1 rounded hover:bg-red-400 transition"
              >
                Triage Alert
              </Link>
            </div>
          </div>
        )}

        {/* Top Header Navbar */}
        <header className="h-16 border-b border-dark-border bg-slate-900/20 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400 font-mono">Status:</span>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/25 font-mono">ONLINE</span>
          </div>

          <div className="flex items-center space-x-6 relative">
            <div className="text-xs text-gray-400 font-mono hidden md:block">
              Active: {user.email}
            </div>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBellDropdown(!showBellDropdown)}
                className="relative p-2 bg-slate-800/40 rounded-lg border border-dark-border text-gray-400 hover:text-white cursor-pointer transition hover:bg-slate-800/80"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-black font-extrabold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showBellDropdown && (
                <div className="absolute right-0 mt-3 w-80 glass-card border border-dark-border rounded-xl shadow-2xl p-4 overflow-hidden z-50">
                  <div className="flex justify-between items-center pb-2 border-b border-dark-border/40 mb-3">
                    <span className="text-xs font-bold text-white font-mono">Recent Alerts ({notifications.length})</span>
                    {notifications.length > 0 && (
                      <button
                        onClick={handleClearAllNotifications}
                        className="text-[9px] uppercase font-mono tracking-wider font-bold text-primary hover:text-emerald-400 cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-gray-500 font-mono text-[10px]">
                        No unread security incidents.
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 bg-slate-950/40 border border-dark-border/30 rounded-lg flex items-start justify-between hover:bg-slate-950/80 transition"
                        >
                          <div className="space-y-1 max-w-[80%]">
                            <h4 className="text-[11px] font-bold text-white font-mono truncate">{item.title}</h4>
                            <p className="text-[10px] text-gray-400 font-mono line-clamp-2 leading-relaxed">{item.message}</p>
                            <span className="text-[8px] text-gray-500 font-mono block">
                              {new Date(item.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <button
                            onClick={(e) => handleMarkAsRead(item.id, e)}
                            className="p-1 hover:bg-slate-800 text-emerald-400 rounded transition cursor-pointer"
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
          </div>
        </header>

        {/* Page Content wrapper */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
