import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X, AlertCircle, Info, Volume2, VolumeX } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { AppNotification, SavedDocument } from '../types';
import { 
  getStoredNotifications, 
  saveStoredNotifications, 
  requestNotificationPermission,
  showBrowserNotification 
} from '../lib/notificationService';

interface NotificationCenterProps {
  documents: SavedDocument[];
  onViewDoc: (docId: string) => void;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
}

export default function NotificationCenter({
  documents,
  onViewDoc,
  notifications,
  setNotifications,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('pedagogical_notif_sound') !== 'false';
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync browser permission state
  useEffect(() => {
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
    if (granted) {
      showBrowserNotification(
        'Notifications Active 🔔',
        'You will now receive alerts 1 day, 30 minutes, and 5 minutes before scheduled lessons.'
      );
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('pedagogical_notif_sound', String(next));
  };

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);
    saveStoredNotifications(updated);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    saveStoredNotifications(updated);
  };

  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    saveStoredNotifications(updated);
  };

  const handleClearAll = () => {
    setNotifications([]);
    saveStoredNotifications([]);
  };

  const handleNotificationClick = (notif: AppNotification) => {
    // Mark as read
    const updated = notifications.map((n) => (n.id === notif.id ? { ...n, read: true } : n));
    setNotifications(updated);
    saveStoredNotifications(updated);

    // Open document
    onViewDoc(notif.docId);
    setIsOpen(false);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition duration-200 cursor-pointer ${
          isOpen ? 'bg-[#5f6f52]/10 text-[#5f6f52]' : 'text-slate-400 hover:text-[#5f6f52] hover:bg-slate-50'
        }`}
        title="Scheduled Lesson Alerts"
        id="btn-notification-bell"
      >
        <Bell className="w-5 h-5" />
        
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2.5 w-80 md:w-96 bg-white rounded-2xl border border-[#e5e1da] shadow-2xl overflow-hidden z-50 flex flex-col max-h-[500px]"
          >
            {/* Popover Header */}
            <div className="p-4 bg-[#f4f1ea] border-b border-[#e5e1da] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#5f6f52]" />
                <h3 className="font-bold text-slate-800 text-sm">Lesson Alerts</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] bg-rose-100 text-rose-600 font-extrabold rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleToggleSound}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
                  title={soundEnabled ? 'Mute notification sounds' : 'Unmute notification sounds'}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-rose-500" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Actions Panel */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-[11px] font-bold text-slate-500">
                <button 
                  onClick={handleMarkAllRead} 
                  className="hover:text-[#5f6f52] transition flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3 h-3" /> Mark all read
                </button>
                <button 
                  onClick={handleClearAll} 
                  className="hover:text-rose-600 transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Clear history
                </button>
              </div>
            )}

            {/* Notification List Scrollable Body */}
            <div className="flex-1 overflow-y-auto min-h-[150px] max-h-[350px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Info className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                  <p className="text-xs font-semibold">No scheduled lesson alerts</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed max-w-[200px] mx-auto">
                    Lessons scheduled for active teaching will trigger alerts 1 day, 30 min, and 5 min before start.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((notif) => {
                    const relativeTime = new Date(notif.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3.5 hover:bg-slate-50 transition cursor-pointer flex gap-3 group relative ${
                          !notif.read ? 'bg-indigo-50/20' : ''
                        }`}
                      >
                        {/* Unread Indicator Bar */}
                        {!notif.read && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-md" />
                        )}

                        {/* Alert Type Icon Badge */}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          notif.type === '5min' 
                            ? 'bg-rose-50 border border-rose-100 text-rose-500'
                            : notif.type === '30min'
                            ? 'bg-amber-50 border border-amber-100 text-amber-500'
                            : 'bg-emerald-50 border border-emerald-100 text-emerald-500'
                        }`}>
                          <span className="text-[10px] font-black uppercase">
                            {notif.type === '5min' ? '5m' : notif.type === '30min' ? '30m' : '1d'}
                          </span>
                        </div>

                        {/* Text and Actions */}
                        <div className="flex-1 space-y-1">
                          <p className={`text-xs leading-relaxed text-slate-700 ${!notif.read ? 'font-semibold text-slate-900' : ''}`}>
                            {notif.message}
                          </p>
                          
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-medium hover:underline hover:text-[#5f6f52]">
                              📚 Topic: {notif.docTopic}
                            </span>
                            <span>{relativeTime}</span>
                          </div>
                        </div>

                        {/* Inline Action Buttons (Hover visible) */}
                        <div className="flex flex-col gap-1 items-end opacity-0 group-hover:opacity-100 transition duration-150 shrink-0 self-center">
                          {!notif.read && (
                            <button
                              onClick={(e) => handleMarkAsRead(notif.id, e)}
                              className="p-1 bg-white hover:bg-slate-100 text-[#5f6f52] rounded-md border border-slate-100 shadow-sm transition"
                              title="Mark as Read"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(notif.id, e)}
                            className="p-1 bg-white hover:bg-rose-50 text-rose-500 rounded-md border border-slate-100 shadow-sm transition"
                            title="Dismiss Notification"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desktop Permissions Footer Promo */}
            {browserPermission !== 'granted' && (
              <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-xs">
                <button
                  onClick={handleRequestPermission}
                  className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Enable Browser Alerts</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
