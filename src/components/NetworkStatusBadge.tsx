import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, ShieldCheck, Database, Info, HardDrive, ListOrdered } from 'lucide-react';
import { getOfflineCacheStats, requestServiceWorkerCacheSync } from '../utils/offlineCache';
import { subscribeOfflineQueue, getOfflineQueue } from '../utils/offlineQueue';
import OfflineQueueManager from './OfflineQueueManager';

export default function NetworkStatusBadge() {
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [swActive, setSwActive] = useState<boolean>(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [isQueueManagerOpen, setIsQueueManagerOpen] = useState<boolean>(false);
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(() => {
    return getOfflineQueue().filter((i) => i.status === 'pending' || i.status === 'failed').length;
  });
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const unsubQueue = subscribeOfflineQueue((q) => {
      setPendingQueueCount(q.filter((i) => i.status === 'pending' || i.status === 'failed').length);
    });

    // Check initial service worker status
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      setSwActive(true);
    }

    const handleOnline = () => {
      setIsOnline(true);
      setIsSyncing(true);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      setTimeout(() => {
        setIsSyncing(false);
      }, 2500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsSyncing(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setSwActive(true);
      });
    }

    return () => {
      unsubQueue();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSyncCheck = async () => {
    setIsSyncing(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch('/manifest.json', { cache: 'no-store', signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        setIsOnline(true);
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch {
      setIsOnline(false);
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
      }, 1200);
    }
  };

  return (
    <div className="relative inline-block text-left">
      {/* Header Status Badge Button */}
      <button
        type="button"
        onClick={() => setIsPopoverOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition duration-200 cursor-pointer shadow-2xs select-none ${
          !isOnline
            ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
            : isSyncing
            ? 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/80'
        }`}
        title="Click to view network connection & Service Worker offline cache status"
      >
        {!isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span className="hidden sm:inline">Offline Mode</span>
            <span className="sm:hidden">Offline</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
            <span>Syncing...</span>
          </>
        ) : (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Online</span>
            {swActive && (
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-200/60 px-1.5 py-0.2 rounded">
                PWA
              </span>
            )}
          </>
        )}

        {pendingQueueCount > 0 && (
          <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-black animate-bounce shadow-2xs">
            {pendingQueueCount}
          </span>
        )}
      </button>

      {/* Popover Card */}
      {isPopoverOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsPopoverOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 space-y-3 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  !isOnline ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {!isOnline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-xs font-serif font-black text-slate-900 uppercase tracking-wider">
                    Network & PWA Status
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Service Worker cache & sync engine
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Connectivity</span>
                <span className={`font-extrabold flex items-center gap-1 ${
                  isOnline ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {isOnline ? <CheckCircle2 className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                  {isOnline ? 'Online (Connected)' : 'Offline (Disconnected)'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Service Worker</span>
                <span className="font-extrabold text-indigo-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  {swActive ? 'Active & Caching' : 'Registered'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Curriculum Cache</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                  {getOfflineCacheStats().cachedDocCount} Lessons Offline
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Firestore Mode</span>
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-slate-500" />
                  IndexedDB Persistent
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1">
                <span>Last sync check:</span>
                <span className="font-mono font-bold text-slate-600">{lastSyncTime}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                EduNexus uses Service Worker (`sw.js`) & Firestore IndexedDB persistence to cache curriculum documents. Teachers can view and present lesson plans smoothly even in offline classrooms.
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsPopoverOpen(false);
                setIsQueueManagerOpen(true);
              }}
              className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
            >
              <ListOrdered className="w-3.5 h-3.5 text-indigo-600" />
              <span>Offline Queue Manager ({pendingQueueCount} Pending)</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                await requestServiceWorkerCacheSync();
                handleManualSyncCheck();
              }}
              disabled={isSyncing}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing Offline Caches...' : 'Sync & Re-check Connection'}</span>
            </button>
          </div>
        </>
      )}

      {/* Offline Queue Manager Modal */}
      <OfflineQueueManager
        isOpen={isQueueManagerOpen}
        onClose={() => setIsQueueManagerOpen(false)}
      />
    </div>
  );
}
