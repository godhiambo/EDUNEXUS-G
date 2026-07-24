import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CloudOff, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Code, 
  Plus, 
  X, 
  Wifi, 
  WifiOff, 
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { 
  OfflineQueueItem, 
  getOfflineQueue, 
  subscribeOfflineQueue, 
  removeFromOfflineQueue, 
  clearSyncedFromOfflineQueue, 
  clearAllOfflineQueue, 
  processOfflineQueue, 
  addToOfflineQueue 
} from '../utils/offlineQueue';

interface OfflineQueueManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OfflineQueueManager({ isOpen, onClose }: OfflineQueueManagerProps) {
  const [queue, setQueue] = useState<OfflineQueueItem[]>(() => getOfflineQueue());
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{ message: string; isError?: boolean } | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeOfflineQueue((updatedQueue) => {
      setQueue(updatedQueue);
    });

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger queue sync on reconnection if items exist
      const current = getOfflineQueue();
      if (current.some((i) => i.status === 'pending' || i.status === 'failed')) {
        handleSyncAll();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOpen) return null;

  const pendingItems = queue.filter((i) => i.status === 'pending');
  const failedItems = queue.filter((i) => i.status === 'failed');
  const syncedItems = queue.filter((i) => i.status === 'synced');

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const { successCount, failedCount } = await processOfflineQueue();
      if (failedCount === 0 && successCount > 0) {
        setSyncResult({ message: `Successfully synchronized ${successCount} update(s) to Firestore!` });
      } else if (failedCount > 0) {
        setSyncResult({ 
          message: `Synced ${successCount} update(s), but ${failedCount} failed. Check network connectivity.`, 
          isError: true 
        });
      } else {
        setSyncResult({ message: 'No pending updates needed synchronization.' });
      }
    } catch (err: any) {
      setSyncResult({ message: `Sync failed: ${err.message || 'Unknown network error'}`, isError: true });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddDemoItem = () => {
    addToOfflineQueue({
      collectionName: 'documents',
      action: 'UPDATE',
      documentId: `demo_doc_${Date.now()}`,
      title: 'Classroom Lesson Note Update (Offline Saved)',
      payload: {
        title: 'Grade 10 Biology - Cellular Respiration Notes',
        subject: 'Biology',
        classLevel: 'Grade 10',
        teacherNotes: 'Offline review: emphasize ATP molecule diagrams during lab session.',
        updatedAt: new Date().toISOString(),
      },
    });
    setSyncResult({ message: 'Added test document update to offline queue!' });
    setTimeout(() => setSyncResult(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-serif font-black tracking-wide">
                  Firestore Offline Queue Manager
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1 ${
                  isOnline 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {isOnline ? 'Online' : 'Offline Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Review and synchronize pending local changes to Firestore when online
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sync Summary Metrics Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Pending: {pendingItems.length}</span>
            </div>
            {failedItems.length > 0 && (
              <div className="flex items-center gap-1.5 font-bold text-rose-600">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Failed: {failedItems.length}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 font-bold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Synced: {syncedItems.length}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddDemoItem}
              className="px-2.5 py-1.5 bg-slate-200/80 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-[11px] flex items-center gap-1 transition cursor-pointer"
              title="Add a sample test update to verify queue UI"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Queue Test Item</span>
            </button>

            {syncedItems.length > 0 && (
              <button
                type="button"
                onClick={clearSyncedFromOfflineQueue}
                className="px-2.5 py-1.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-[11px] flex items-center gap-1 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Clear Synced</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSyncAll}
              disabled={isSyncing || (pendingItems.length === 0 && failedItems.length === 0)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-extrabold rounded-lg text-[11px] flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing to Firestore...' : 'Sync All Pending'}</span>
            </button>
          </div>
        </div>

        {/* Sync Status Banner */}
        {syncResult && (
          <div className={`px-6 py-2.5 text-xs font-bold border-b flex items-center justify-between ${
            syncResult.isError 
              ? 'bg-rose-50 text-rose-800 border-rose-200' 
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            <span className="flex items-center gap-2">
              {syncResult.isError ? <AlertTriangle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {syncResult.message}
            </span>
            <button
              type="button"
              onClick={() => setSyncResult(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Queue Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {queue.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-sm font-serif font-black text-slate-800">
                  All Local Updates Synchronized
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  There are no pending updates in your queue. Any edits or document creations made while offline will automatically be tracked here for review.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddDemoItem}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Simulate Offline Action</span>
              </button>
            </div>
          ) : (
            queue.map((item) => {
              const isExpanded = expandedItemId === item.id;
              return (
                <div 
                  key={item.id}
                  className={`rounded-xl border p-4 transition shadow-2xs ${
                    item.status === 'failed'
                      ? 'bg-rose-50/50 border-rose-200'
                      : item.status === 'synced'
                      ? 'bg-slate-50/70 border-slate-200 opacity-80'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          item.action === 'CREATE' 
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.action === 'UPDATE'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.action}
                        </span>

                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center gap-1">
                          <Layers className="w-3 h-3 text-slate-500" />
                          {item.collectionName}
                        </span>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          item.status === 'synced'
                            ? 'bg-emerald-100 text-emerald-700'
                            : item.status === 'syncing'
                            ? 'bg-indigo-100 text-indigo-700'
                            : item.status === 'failed'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.status === 'synced' && <CheckCircle2 className="w-3 h-3" />}
                          {item.status === 'syncing' && <RefreshCw className="w-3 h-3 animate-spin" />}
                          {item.status === 'failed' && <AlertTriangle className="w-3 h-3" />}
                          {item.status === 'pending' && <Clock className="w-3 h-3" />}
                          <span className="capitalize">{item.status}</span>
                        </span>

                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.timestamp}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {item.title}
                      </h4>

                      {item.documentId && (
                        <p className="text-[11px] text-slate-500 font-mono">
                          Doc ID: {item.documentId}
                        </p>
                      )}

                      {item.errorMessage && (
                        <p className="text-[11px] text-rose-600 font-medium bg-rose-100/60 px-2.5 py-1 rounded-md mt-1">
                          Error: {item.errorMessage} (Retry #{item.retryCount})
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Toggle JSON Payload View"
                      >
                        <Code className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isExpanded ? 'Hide Payload' : 'Payload'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => removeFromOfflineQueue(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Remove item from queue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded JSON payload inspection */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 animate-fadeIn space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span>Queued Firestore Document Data:</span>
                        <span>Item ID: {item.id}</span>
                      </div>
                      <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[10px] font-mono overflow-x-auto max-h-48 leading-relaxed border border-slate-800">
                        {JSON.stringify(item.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>EduNexus Offline Queue guarantees zero lesson data loss in remote schools.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Close Manager
          </button>
        </div>

      </div>
    </div>
  );
}
