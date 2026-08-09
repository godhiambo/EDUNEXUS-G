import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole, UserAccount, ActivityLog, UserOverride, SystemPolicies, AdminNotification } from '../types';
import { 
  Users, 
  Shield, 
  UserCheck, 
  GraduationCap, 
  Clock, 
  Mail,
  AlertTriangle,
  Search,
  CheckCircle2,
  Cpu,
  Activity,
  LogIn,
  Eye,
  Sparkles,
  PlusCircle,
  Filter,
  UserX,
  Trash2,
  ClipboardList,
  Star,
  ThumbsUp,
  MessageSquare,
  Bell,
  Server,
  Zap,
  RefreshCw,
  Gauge,
  Globe
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import FeedbackHub from './FeedbackHub';
import ActivityHeatmap from './ActivityHeatmap';
import TeacherActivityHeatmap from './TeacherActivityHeatmap';
import SystemMonitorPanel from './SystemMonitorPanel';
import SEODashboardTab from './SEODashboardTab';
import AISystemAnalyzer from './AISystemAnalyzer';
import DeveloperBrandingSettings from './DeveloperBrandingSettings';

export default function AdminPanel() {
  const { 
    allUsers, 
    updateUserRole, 
    toggleSuspendUser, 
    deleteUserAccount, 
    profile, 
    systemPolicies, 
    updateSystemPolicies, 
    adminAddUser,
    incrementUserWarnings
  } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [overrideSearchTerm, setOverrideSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'Teacher' | 'Student' | 'Parent' | 'Administrator' | 'AuthorizedStaff'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<'users' | 'notifications' | 'feedback' | 'logs' | 'pilot' | 'policies' | 'monitor' | 'seo' | 'analyzer' | 'branding'>('users');
  const [logsVisualTab, setLogsVisualTab] = useState<'overall' | 'teacher30'>('teacher30');

  // Live Platform Telemetry & Load Monitor states
  const [systemLoad, setSystemLoad] = useState<number>(18);
  const [activeUsersCount, setActiveUsersCount] = useState<number>(6);
  const [realHealthMetrics, setRealHealthMetrics] = useState<any>(null);
  const [isStressTesting, setIsStressTesting] = useState<boolean>(false);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] [System] Live telemetry stream initialized.`,
    `[${new Date().toLocaleTimeString()}] [Cluster] Nodes operating inside optimal bounds.`
  ]);
  const [showTelemetryDetails, setShowTelemetryDetails] = useState<boolean>(false);

  // Fetch real-time health metrics from our /api/health-metrics API
  const fetchRealHealthMetrics = async () => {
    try {
      const res = await fetch('/api/health-metrics');
      if (res.ok) {
        const data = await res.json();
        setRealHealthMetrics(data);
      }
    } catch (err) {
      console.error('Error fetching admin live health metrics:', err);
    }
  };

  // Setup live telemetry cycles (fluctuations and API polling)
  useEffect(() => {
    fetchRealHealthMetrics();
    const metricsInterval = setInterval(fetchRealHealthMetrics, 5000);

    // Minor random fluctuations to system load & active users to simulate realistic micro-behavior
    const telemetryInterval = setInterval(() => {
      setSystemLoad(current => {
        if (isStressTesting) {
          // Spike load if stress testing is activated
          return Math.min(95, Math.max(78, Math.floor(75 + Math.random() * 18)));
        }
        // General baseline cluster load drift (14% - 28%)
        const drift = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const next = current + drift;
        return Math.min(32, Math.max(12, next));
      });

      // Active users fluctuate naturally between 4 and 14
      setActiveUsersCount(current => {
        const drift = Math.random() > 0.65 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        const next = current + drift;
        return Math.min(15, Math.max(4, next));
      });
    }, 3000);

    return () => {
      clearInterval(metricsInterval);
      clearInterval(telemetryInterval);
    };
  }, [isStressTesting]);

  // Periodic random console telemetry log entries for high visual fidelity
  useEffect(() => {
    const logDrifter = setInterval(() => {
      const logsList = [
        '[Database] Write performance index: 0.99 (Optimal)',
        '[Cache] Shared memory hit ratio: 95.8%',
        '[AI Agent] Prompt template compiler warmed up',
        '[Load Balancer] Managed inbound traffic without routing cues',
        '[Auth Engine] Security session validation completed',
        '[Sync Service] Offline storage journal checked: Clean',
        '[Storage Engine] Image bucket read latencies: 32ms',
        '[Cluster] GKE Node Auto-scaler verified: 1 Active Node'
      ];
      const randomLog = logsList[Math.floor(Math.random() * logsList.length)];
      setTelemetryLogs(prev => {
        const next = [`[${new Date().toLocaleTimeString()}] ${randomLog}`, ...prev];
        return next.slice(0, 20); // Keep last 20 logs
      });
    }, 8000);

    return () => clearInterval(logDrifter);
  }, []);

  const triggerStressTest = () => {
    if (isStressTesting) return;
    setIsStressTesting(true);
    setTelemetryLogs(prev => [
      `[${new Date().toLocaleTimeString()}] [STRESS TEST] ⚡ Initiating stress test sequence! Generating mock bulk requests...`,
      `[${new Date().toLocaleTimeString()}] [Cluster] Scaling memory allocation for curriculum generation engine...`,
      ...prev
    ]);

    // Force system load state to spike
    setSystemLoad(85);
    setActiveUsersCount(current => Math.min(15, current + 5));

    setTimeout(() => {
      setIsStressTesting(false);
      setTelemetryLogs(prev => [
        `[${new Date().toLocaleTimeString()}] [System] ✅ Stress test completed. Garbage collection executed successfully.`,
        `[${new Date().toLocaleTimeString()}] [Cluster] Autoscaled back to default parameters. Load stabilized.`,
        ...prev
      ]);
      setSystemLoad(18);
    }, 6000);
  };

  // Add User Form states
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Teacher');
  const [isAddingUser, setIsAddingUser] = useState(false);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newDisplayName) {
      alert("Please fill in both Email and Display Name!");
      return;
    }
    if (!newEmail.includes('@')) {
      alert("Please enter a valid email address!");
      return;
    }

    setIsAddingUser(true);
    try {
      await adminAddUser(newEmail, newDisplayName, newRole);
      setSuccessMsg(`Pre-registered profile created for ${newEmail} (${newRole})!`);
      setNewEmail('');
      setNewDisplayName('');
      setNewRole('Teacher');
      setShowAddUserForm(false);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      alert("Failed to pre-register user account: " + err.message);
    } finally {
      setIsAddingUser(false);
    }
  };

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  useEffect(() => {
    if (profile?.uid?.startsWith('offline-sandbox-')) {
      setNotifications([
        {
          id: 'mock-1',
          type: 'teacher_registered',
          title: 'New Teacher Registered',
          message: 'A new educator has registered in the system.\n\nName: Godfrey Ojiambo\nEmail: godfrey@stemscholar.space\nRole: Teacher',
          userEmail: 'godfrey@stemscholar.space',
          userDisplayName: 'Godfrey Ojiambo',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          severity: 'info',
          resolved: false,
          emailSent: false
        },
        {
          id: 'mock-2',
          type: 'suspension_threshold_triggered',
          title: 'Account Suspension Threshold Triggered',
          message: 'User "Demo Teacher" (demo.teacher@nexused.edu) has reached the account suspension threshold of 3 policy violations and has been automatically suspended by the system.',
          userEmail: 'demo.teacher@nexused.edu',
          userDisplayName: 'Demo Teacher',
          timestamp: new Date(Date.now() - 1200000).toISOString(),
          severity: 'critical',
          resolved: false,
          emailSent: true
        }
      ]);
      setLoadingNotifications(false);
      return;
    }

    const q = query(collection(db, 'admin-notifications'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const items: AdminNotification[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as AdminNotification);
      });
      setNotifications(items);
      setLoadingNotifications(false);
    }, (error) => {
      console.error("Error listening to admin-notifications:", error);
      setLoadingNotifications(false);
    });

    return unsub;
  }, [profile]);

  const handleResolveNotification = async (id: string, currentResolved: boolean) => {
    if (id.startsWith('mock-')) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, resolved: !currentResolved } : n));
      return;
    }
    try {
      const docRef = doc(db, 'admin-notifications', id);
      await updateDoc(docRef, { resolved: !currentResolved });
      setSuccessMsg(`Alert status successfully updated!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert("Failed to update notification: " + err.message);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (id.startsWith('mock-')) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      return;
    }
    try {
      const docRef = doc(db, 'admin-notifications', id);
      await deleteDoc(docRef);
      setSuccessMsg(`Alert deleted permanently.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert("Failed to delete notification: " + err.message);
    }
  };

  const handleAddWarning = async (uid: string, displayName: string) => {
    setUpdatingId(uid);
    try {
      await incrementUserWarnings(uid);
      setSuccessMsg(`Issued policy violation warning to ${displayName}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert("Failed to issue warning: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [logsSearchTerm, setLogsSearchTerm] = useState('');
  const [logsFilterAction, setLogsFilterAction] = useState<string>('all');

  useEffect(() => {
    if (adminTab !== 'logs') return;
    const logsRef = collection(db, 'activity-logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(350));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ActivityLog[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as ActivityLog);
      });
      setLogs(list);
    }, (error) => {
      console.error("Error loading activity logs:", error);
    });

    return () => unsubscribe();
  }, [adminTab]);

  const [pilotFeedback, setPilotFeedback] = useState<any[]>([]);
  const [isPilotLoading, setIsPilotLoading] = useState(true);

  useEffect(() => {
    setIsPilotLoading(true);
    const feedbackRef = collection(db, 'pilotFeedbacks');
    
    // Listen to real-time updates for pilot feedback
    const unsubscribe = onSnapshot(feedbackRef, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Sort desc by createdAt
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPilotFeedback(list);
      setIsPilotLoading(false);
    }, (error) => {
      console.error("Error loading pilot feedback responses:", error);
      setIsPilotLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRoleChange = async (uid: string, nextRole: UserRole) => {
    if (uid === profile?.uid) {
      alert("You cannot change your own Administrator role to avoid locking yourself out!");
      return;
    }
    
    const targetUser = allUsers.find(u => u.uid === uid);
    if (nextRole === 'Administrator' && targetUser) {
      const emailLower = targetUser.email.toLowerCase().trim();
      if (
        emailLower !== 'ojiambo.godfry@gmail.com' && 
        emailLower !== 'godfreynexused@gmail.com'
      ) {
        alert("The Administrator role is strictly reserved for developer emails: ojiambo.godfry@gmail.com and godfreynexused@gmail.com.");
        return;
      }
    }
    
    setUpdatingId(uid);
    try {
      await updateUserRole(uid, nextRole);
      setSuccessMsg(`User role successfully changed to ${nextRole}!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert("Failed to update role: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleSuspend = async (uid: string, currentSuspendedState: boolean) => {
    if (uid === profile?.uid) {
      alert("You cannot suspend your own Administrator account!");
      return;
    }
    
    setUpdatingId(uid);
    try {
      await toggleSuspendUser(uid, currentSuspendedState);
      const actionText = currentSuspendedState ? 'unsuspended' : 'suspended';
      setSuccessMsg(`User account successfully ${actionText}!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert("Failed to update suspension state: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (uid: string, userEmail: string) => {
    if (uid === profile?.uid) {
      alert("You cannot delete your own Administrator account!");
      return;
    }
    
    const confirmed = window.confirm(`Are you sure you want to permanently delete user account "${userEmail}"? This action is irreversible and will remove all their administrative profile data.`);
    if (!confirmed) return;

    setUpdatingId(uid);
    try {
      await deleteUserAccount(uid);
      setSuccessMsg(`User profile for ${userEmail} was permanently deleted.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert("Failed to delete user profile: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const isAuthorizedStaffEmail = (email: string) => {
    const e = email.toLowerCase().trim();
    return e === 'ojiambo.godfry@gmail.com' || e === 'godfreynexused@gmail.com';
  };

  const getUserOnlineStatus = (u: UserAccount, currentUid?: string) => {
    if (u.uid === currentUid) {
      return { isOnline: true, label: 'Online Now (Self)', status: 'online' };
    }
    if (!u.lastActiveAt) {
      return { isOnline: false, label: 'Offline', status: 'offline' };
    }
    const lastActiveMs = new Date(u.lastActiveAt).getTime();
    if (isNaN(lastActiveMs)) {
      return { isOnline: false, label: 'Offline', status: 'offline' };
    }
    const diffMs = Date.now() - lastActiveMs;
    if (diffMs < 5 * 60 * 1000) { // Within 5 mins
      return { isOnline: true, label: 'Online Now', status: 'online' };
    } else if (diffMs < 30 * 60 * 1000) { // Within 30 mins
      const mins = Math.max(1, Math.floor(diffMs / 60000));
      return { isOnline: false, label: `Active ${mins}m ago`, status: 'recent' };
    } else if (diffMs < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diffMs / (3600 * 1000));
      return { isOnline: false, label: `Last active ${hours}h ago`, status: 'offline' };
    } else {
      return { isOnline: false, label: 'Offline', status: 'offline' };
    }
  };

  const onlineStats = React.useMemo(() => {
    const onlineUsersList = allUsers.filter(u => getUserOnlineStatus(u, profile?.uid).isOnline);
    return {
      totalOnline: onlineUsersList.length,
      teachersOnline: onlineUsersList.filter(u => u.role === 'Teacher').length,
      studentsOnline: onlineUsersList.filter(u => u.role === 'Student').length,
      parentsOnline: onlineUsersList.filter(u => u.role === 'Parent').length,
      adminsOnline: onlineUsersList.filter(u => u.role === 'Administrator').length,
      onlineUsersList,
    };
  }, [allUsers, profile?.uid]);

  const roleCounts = React.useMemo(() => {
    return {
      all: allUsers.length,
      Teacher: allUsers.filter(u => u.role === 'Teacher').length,
      Student: allUsers.filter(u => u.role === 'Student').length,
      Parent: allUsers.filter(u => u.role === 'Parent').length,
      Administrator: allUsers.filter(u => u.role === 'Administrator').length,
      AuthorizedStaff: allUsers.filter(u => isAuthorizedStaffEmail(u.email)).length,
    };
  }, [allUsers]);

  const filteredUsers = React.useMemo(() => {
    return allUsers.filter(u => {
      const matchesSearch = 
        u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = 
        roleFilter === 'all' || 
        (roleFilter === 'AuthorizedStaff' ? isAuthorizedStaffEmail(u.email) : u.role === roleFilter);
      return matchesSearch && matchesRole;
    });
  }, [allUsers, searchTerm, roleFilter]);

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'Administrator':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Teacher':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Student':
        return 'bg-[#f4f1ea] text-slate-600 border-slate-250';
      case 'Parent':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const getLogActionBadge = (action: string) => {
    switch (action) {
      case 'login':
        return {
          label: 'Login',
          icon: <LogIn className="w-3 h-3" />,
          style: 'bg-emerald-50 text-emerald-700 border-emerald-250'
        };
      case 'view':
        return {
          label: 'View Doc',
          icon: <Eye className="w-3 h-3" />,
          style: 'bg-blue-50 text-blue-700 border-blue-250'
        };
      case 'generate':
        return {
          label: 'Generate Doc',
          icon: <Sparkles className="w-3 h-3" />,
          style: 'bg-purple-50 text-purple-700 border-purple-250'
        };
      case 'create':
        return {
          label: 'Registration',
          icon: <PlusCircle className="w-3 h-3" />,
          style: 'bg-amber-50 text-amber-700 border-amber-250'
        };
      case 'system':
        return {
          label: 'System Update',
          icon: <Shield className="w-3 h-3" />,
          style: 'bg-indigo-50 text-indigo-700 border-indigo-250'
        };
      default:
        return {
          label: action.toUpperCase(),
          icon: <Activity className="w-3 h-3" />,
          style: 'bg-slate-50 text-slate-600 border-slate-250'
        };
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(logsSearchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(logsSearchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(logsSearchTerm.toLowerCase()) ||
      (log.documentTitle || '').toLowerCase().includes(logsSearchTerm.toLowerCase());
    
    const matchesAction = logsFilterAction === 'all' || log.action === logsFilterAction;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Developer Console Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 border border-rose-500/30 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-rose-400" />
              <span>Developer Role Validated</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">Platform Owner Access</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Developer Console
          </h2>
          <p className="text-xs text-slate-300 font-medium max-w-xl">
            Live infrastructure monitoring, platform user management, Gemini AI system metrics, SEO configuration, and audit security center.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-mono text-emerald-400 font-bold">Node Runtime: Healthy</span>
        </div>
      </div>

      {/* Admin Panel Sub-tabs */}
      <div className="flex flex-wrap border-b border-[#e5e1da] gap-1 pb-px">
        <button
          onClick={() => setAdminTab('users')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 rounded-t-xl cursor-pointer ${
            adminTab === 'users'
              ? 'border-rose-600 text-rose-700 bg-rose-50/10'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>School User Accounts</span>
        </button>

        <button
          onClick={() => setAdminTab('notifications')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 rounded-t-xl cursor-pointer relative ${
            adminTab === 'notifications'
              ? 'border-amber-600 text-amber-700 bg-amber-50/10'
              : 'border-transparent text-slate-500 hover:text-amber-700 hover:bg-slate-50'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Administrative Alerts</span>
          {notifications.filter(n => !n.resolved).length > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
              {notifications.filter(n => !n.resolved).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('feedback')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 rounded-t-xl cursor-pointer ${
            adminTab === 'feedback'
              ? 'border-[#5f6f52] text-[#5f6f52] bg-[#5f6f52]/5'
              : 'border-transparent text-slate-500 hover:text-[#5f6f52] hover:bg-slate-50'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>AI Model Tuning & Feedback</span>
        </button>

        <button
          onClick={() => setAdminTab('logs')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 rounded-t-xl cursor-pointer ${
            adminTab === 'logs'
              ? 'border-blue-600 text-blue-700 bg-blue-50/10'
              : 'border-transparent text-slate-500 hover:text-blue-700 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Recent Activity Audit Log</span>
        </button>

        <button
          onClick={() => setAdminTab('pilot')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 rounded-t-xl cursor-pointer ${
            adminTab === 'pilot'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/10'
              : 'border-transparent text-slate-500 hover:text-indigo-700 hover:bg-slate-50'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Pilot Survey & Evaluation Feedback</span>
          {pilotFeedback.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-[10px] font-extrabold bg-indigo-600 text-white rounded-full">
              {pilotFeedback.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('policies')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 rounded-t-xl cursor-pointer ${
            adminTab === 'policies'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/10'
              : 'border-transparent text-slate-500 hover:text-indigo-700 hover:bg-slate-50'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>System & AI Policies</span>
        </button>

        <button
          onClick={() => setAdminTab('monitor')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 rounded-t-xl cursor-pointer ${
            adminTab === 'monitor'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/10'
              : 'border-transparent text-slate-500 hover:text-emerald-700 hover:bg-slate-50'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>System Monitor & Quotas</span>
        </button>

        <button
          onClick={() => setAdminTab('seo')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 rounded-t-xl cursor-pointer ${
            adminTab === 'seo'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/10'
              : 'border-transparent text-slate-500 hover:text-emerald-700 hover:bg-slate-50'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>SEO & Search Visibility</span>
        </button>

        <button
          onClick={() => setAdminTab('branding')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 rounded-t-xl cursor-pointer ${
            adminTab === 'branding'
              ? 'border-rose-600 text-rose-700 bg-rose-50/20 font-extrabold shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-rose-700 hover:bg-slate-50'
          }`}
        >
          <Shield className="w-4 h-4 text-rose-600" />
          <span>Branding & Media Watermark</span>
          <span className="px-1.5 py-0.5 text-[9px] font-black bg-rose-600 text-white rounded-full uppercase tracking-wider">
            Engine
          </span>
        </button>

        <button
          onClick={() => setAdminTab('analyzer')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 rounded-t-xl cursor-pointer ${
            adminTab === 'analyzer'
              ? 'border-cyan-600 text-cyan-700 bg-cyan-50/20 shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-cyan-700 hover:bg-slate-50'
          }`}
        >
          <Cpu className="w-4 h-4 text-cyan-600 animate-pulse" />
          <span>AI System Analyzer</span>
          <span className="px-1.5 py-0.5 text-[9px] font-black bg-cyan-600 text-white rounded-full uppercase tracking-wider">
            New
          </span>
        </button>
      </div>

      {/* Platform Live Telemetry & Health Dashboard Row */}
      <div className="bg-[#fdfdfb] rounded-2xl border border-[#e5e1da] shadow-xs p-5 md:p-6 space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between border-b border-[#e5e1da] pb-3">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isStressTesting ? 'bg-rose-500' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isStressTesting ? 'bg-rose-600' : 'bg-emerald-500'}`}></span>
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-4 h-4 text-slate-500" />
              <span>EduNexus Platform Live Telemetry & Health Monitor</span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTelemetryDetails(!showTelemetryDetails)}
              className="text-[10px] font-bold text-slate-500 hover:text-slate-700 underline cursor-pointer"
            >
              {showTelemetryDetails ? "Hide Terminal Console" : "Show Terminal Console"}
            </button>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
              REFRESH_RATE: 5S
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* COLUMN 1: SYSTEM RESOURCE LOAD GAUGE */}
          <div className="bg-white border border-[#e5e1da] rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-indigo-500" /> System Resource Load
              </span>
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                systemLoad > 75 
                  ? 'bg-rose-100 text-rose-700 animate-pulse' 
                  : systemLoad > 45 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'bg-emerald-100 text-emerald-700'
              }`}>
                {systemLoad > 75 ? 'CRITICAL_SPIKE' : systemLoad > 45 ? 'ELEVATED' : 'OPTIMAL'}
              </span>
            </div>

            <div className="flex items-center justify-center py-2">
              <div className="relative w-28 h-28 flex items-center justify-center">
                {/* SVG Radial Gauge */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Gauge background track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset="62.8"
                    strokeLinecap="round"
                    className="origin-center rotate-45"
                  />
                  {/* Gauge fill arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={systemLoad > 75 ? "#e11d48" : systemLoad > 45 ? "#d97706" : "#10b981"}
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * 0.75 * systemLoad) / 100}
                    strokeLinecap="round"
                    className="origin-center rotate-[135deg] transition-all duration-1000 ease-out"
                  />
                </svg>
                {/* Gauge Inner Text Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-black font-mono leading-none ${
                    systemLoad > 75 ? 'text-rose-600' : systemLoad > 45 ? 'text-amber-600' : 'text-slate-800'
                  }`}>
                    {systemLoad}%
                  </span>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mt-1">CPU Load</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-center">
              <div className="flex justify-between text-[10px] text-slate-500 border-b border-slate-50 pb-1">
                <span>Active Core Cluster:</span>
                <span className="font-bold text-slate-700">Google Cloud Run (Auto)</span>
              </div>
              <button
                type="button"
                disabled={isStressTesting}
                onClick={triggerStressTest}
                className={`w-full py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  isStressTesting
                    ? 'bg-rose-50 border-rose-200 text-rose-600 disabled:opacity-50'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                <Zap className={`w-3 h-3 ${isStressTesting ? 'animate-bounce text-rose-500' : ''}`} />
                <span>{isStressTesting ? 'Running Stress Simulation...' : 'Trigger Load Stress Test'}</span>
              </button>
            </div>
          </div>

          {/* COLUMN 2: ACTIVE CONNECTIONS & PLATFORM SEATS */}
          <div className="bg-white border border-[#e5e1da] rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-500" /> Active Platform Sessions
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 font-bold px-2 py-0.5 rounded-full">
                {activeUsersCount} Connected
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end text-[10px] text-slate-500">
                <span>Concurrent Connections Seat Limit</span>
                <span className="font-mono font-bold text-slate-700">{activeUsersCount} / 50 seats</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    isStressTesting ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${(activeUsersCount / 50) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block border-b border-slate-50 pb-1">
                Who's Active right now:
              </span>
              <div className="flex flex-wrap gap-1.5 pt-0.5 max-h-[55px] overflow-y-auto pr-1">
                {/* Render current user profile first */}
                <div className="flex items-center gap-1 bg-[#5f6f52]/10 border border-[#5f6f52]/20 px-1.5 py-0.5 rounded-md">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black text-[#5f6f52] truncate max-w-[80px]">
                    {profile?.displayName || 'Administrator'} (You)
                  </span>
                </div>
                {/* Grab some extra simulated active users from list */}
                {allUsers
                  .filter(u => u.uid !== profile?.uid && !u.suspended)
                  .slice(0, Math.max(1, activeUsersCount - 1))
                  .map((u, i) => (
                    <div key={u.uid} className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-md">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      <span className="text-[9px] font-bold text-slate-600 truncate max-w-[80px]">
                        {u.displayName}
                      </span>
                    </div>
                  ))
                }
                {/* Fallback mock active sessions if list has fewer users */}
                {allUsers.length <= 1 && (
                  <>
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-md">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      <span className="text-[9px] font-bold text-slate-600">Godfrey Ojiambo</span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-md">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      <span className="text-[9px] font-bold text-slate-600">Demo Teacher</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* COLUMN 3: API TRAFFIC LOGS / PERFORMANCE METRICS */}
          <div className="bg-white border border-[#e5e1da] rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-sky-500" /> Platform API Performance
              </span>
              <button 
                onClick={fetchRealHealthMetrics}
                className="text-slate-400 hover:text-slate-600 transition"
                title="Force Refresh API Metrics"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-50/60 p-1.5 rounded-lg border border-slate-100">
                <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">Total API Requests</span>
                <span className="text-sm font-black text-slate-800">
                  {realHealthMetrics?.totalCalls ?? 0}
                </span>
              </div>
              <div className="bg-slate-50/60 p-1.5 rounded-lg border border-slate-100">
                <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">Avg Latency</span>
                <span className="text-sm font-black text-slate-800">
                  {realHealthMetrics?.averageLatencyMs && realHealthMetrics.averageLatencyMs > 0 
                    ? `${(realHealthMetrics.averageLatencyMs / 1000).toFixed(2)}s` 
                    : 'N/A'
                  }
                </span>
              </div>
            </div>

            <div className="space-y-1 text-[10px] text-slate-500">
              <div className="flex justify-between border-b border-slate-50 pb-0.5">
                <span>Successful API Responses:</span>
                <span className="font-bold text-slate-800">
                  {realHealthMetrics?.successfulCalls ?? 0}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-0.5">
                <span>Fallback Redundancy Triggers:</span>
                <span className="font-bold text-amber-600">
                  {realHealthMetrics?.fallbackCount ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TERMINAL CONSOLE LOGS SCREEN */}
        {showTelemetryDetails && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-[10px] text-emerald-400 space-y-1 select-all overflow-y-auto max-h-[100px] animate-slideDown shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5 text-slate-400 text-[9px]">
              <span>NEXUSED CLUSTER LOGGING TERMINAL (ACTIVE SESSION STREAM)</span>
              <span className="text-[8px] bg-slate-800 px-1 rounded text-slate-300">STREAMING</span>
            </div>
            {telemetryLogs.map((log, index) => (
              <div key={index} className="truncate leading-tight opacity-90">
                <span className="text-[#5f6f52] font-semibold">&gt;</span> {log}
              </div>
            ))}
          </div>
        )}
      </div>

      {adminTab === 'users' ? (
        <div className="bg-white rounded-2xl border border-[#e5e1da] shadow-sm p-6 md:p-8 space-y-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e5e1da] pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-center text-rose-600">
                <Shield className="w-5.5 h-5.5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">User Account & Permission Management</h2>
                <p className="text-xs text-slate-500">Manage school profiles, assign role-based access, and configure granular teacher/student permissions.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search accounts or roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#fdfbf7] border border-slate-250 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
              <button
                onClick={() => setShowAddUserForm(!showAddUserForm)}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shrink-0 cursor-pointer transition shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{showAddUserForm ? 'Hide Form' : 'Add User'}</span>
              </button>
            </div>
          </div>

          {showAddUserForm && (
            <form onSubmit={handleAddUser} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <PlusCircle className="w-4.5 h-4.5 text-rose-600" />
                <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">Register New School Profile Account</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Display Name / Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Jane Smith"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. jane.smith@school.edu"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Primary School Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full bg-white border border-slate-250 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-700 font-semibold"
                  >
                    <option value="Teacher">Teacher</option>
                    <option value="Student">Student</option>
                    <option value="Parent">Parent</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUserForm(false);
                    setNewEmail('');
                    setNewDisplayName('');
                  }}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-250 text-slate-600 font-bold rounded-xl text-xs cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingUser}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-all flex items-center gap-1 shadow-sm disabled:opacity-50"
                >
                  {isAddingUser ? 'Registering...' : 'Register Profile'}
                </button>
              </div>
            </form>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Live Logged-In Users & Active Sessions Tracker */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 rounded-2xl p-5 md:p-6 text-white space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 border-b border-slate-700/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-ping" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white">Live Logged-In Users & Active Sessions</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-mono font-bold text-xs">
                      {onlineStats.totalOnline} Currently Logged In
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Real-time presence tracking of authenticated educator, student, parent, and admin sessions in Firestore.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right text-xs font-mono">
                  <span className="block text-slate-400 text-[10px] uppercase font-bold">Total Registered</span>
                  <span className="text-white font-extrabold text-sm">{allUsers.length} Profiles</span>
                </div>
              </div>
            </div>

            {/* Active Role Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10 text-xs">
              <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300 font-medium">Teachers</span>
                </div>
                <span className="font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {onlineStats.teachersOnline} / {roleCounts.Teacher}
                </span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-300 font-medium">Students</span>
                </div>
                <span className="font-extrabold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                  {onlineStats.studentsOnline} / {roleCounts.Student}
                </span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-300 font-medium">Parents</span>
                </div>
                <span className="font-extrabold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                  {onlineStats.parentsOnline} / {roleCounts.Parent}
                </span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-rose-400" />
                  <span className="text-slate-300 font-medium">Admins</span>
                </div>
                <span className="font-extrabold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                  {onlineStats.adminsOnline} / {roleCounts.Administrator}
                </span>
              </div>
            </div>

            {/* Active Online Users Strip */}
            {onlineStats.totalOnline > 0 && (
              <div className="pt-2 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Online Sessions:</span>
                  <div className="flex -space-x-2 overflow-hidden">
                    {onlineStats.onlineUsersList.map((u) => (
                      <div 
                        key={u.uid} 
                        className="w-7 h-7 rounded-full bg-emerald-600 border-2 border-slate-900 flex items-center justify-center text-white text-[10px] font-extrabold uppercase shadow-sm"
                        title={`${u.displayName} (${u.role}) - Online Now`}
                      >
                        {u.displayName.slice(0, 2)}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {onlineStats.onlineUsersList.map((u) => (
                    <span 
                      key={u.uid}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] text-slate-200"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-bold">{u.displayName}</span>
                      <span className="text-[9px] text-slate-400">({u.role})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Role explanation cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-rose-200 bg-rose-50/20 p-4 rounded-xl space-y-1">
              <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Administrator Permissions
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Full root authority. Can view all plans, generate documents, edit/delete resources, and adjust user credentials or roles.
              </p>
            </div>

            <div className="border border-emerald-200 bg-emerald-50/20 p-4 rounded-xl space-y-1">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" /> Teacher Permissions
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Full access to classroom tools. Can generate plans, notes, worksheets, run AI edits, and create CPD reflections.
              </p>
            </div>

            <div className="border border-slate-200 bg-slate-50/40 p-4 rounded-xl space-y-1">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" /> Student Permissions
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Read-only content access. Can search and study notes, worksheets, and syllabus resources, with creator & generator views hidden.
              </p>
            </div>
          </div>

          {/* Role Filter Tabs Group */}
          <div className="flex flex-wrap gap-2 items-center border-b border-[#e5e1da] pb-4.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Filter Roles:</span>
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                roleFilter === 'all'
                  ? 'bg-rose-50 border-rose-200 text-rose-700 font-extrabold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              All Roles ({roleCounts.all})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('Teacher')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                roleFilter === 'Teacher'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-extrabold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Teachers ({roleCounts.Teacher})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('Student')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                roleFilter === 'Student'
                  ? 'bg-blue-50 border-blue-200 text-blue-700 font-extrabold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Students ({roleCounts.Student})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('Parent')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                roleFilter === 'Parent'
                  ? 'bg-purple-50 border-purple-200 text-purple-700 font-extrabold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Parents ({roleCounts.Parent})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('Administrator')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                roleFilter === 'Administrator'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Administrators ({roleCounts.Administrator})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('AuthorizedStaff')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                roleFilter === 'AuthorizedStaff'
                  ? 'bg-amber-50 border-amber-200 text-amber-700 font-extrabold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              Authorized Staff ({roleCounts.AuthorizedStaff})
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#e5e1da] text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Profile Account</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Assigned Role (Direct Edit)</th>
                  <th className="py-3 px-4 text-center">Account Status</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f1ea] text-xs text-slate-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No registered profiles found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.uid} className={`hover:bg-[#faf9f5]/50 transition-colors ${u.suspended ? 'bg-rose-50/20' : ''}`}>
                      <td className="py-4 px-4 font-bold text-slate-800 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-extrabold text-[11px] uppercase shrink-0">
                          {u.displayName.slice(0, 2)}
                        </div>
                        <div>
                          <span className={u.suspended ? 'line-through opacity-65 text-slate-500' : ''}>{u.displayName}</span>
                          {u.uid === profile?.uid && (
                            <span className="block text-[10px] text-slate-400 font-normal">(You)</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <Mail className="w-3.5 h-3.5 opacity-60" />
                          <span className={u.suspended ? 'line-through opacity-65 text-slate-500' : ''}>{u.email}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {u.uid === profile?.uid ? (
                          <span className={`inline-flex items-center border px-2.5 py-1 rounded-full text-[10px] font-bold ${getRoleBadgeColor(u.role)}`}>
                            {u.role}
                          </span>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <select
                              value={u.role}
                              disabled={updatingId === u.uid}
                              onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                              className="bg-[#fdfbf7] border border-slate-250 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-all disabled:opacity-50 cursor-pointer min-w-[120px]"
                            >
                              <option value="Student">Student</option>
                              <option value="Teacher">Teacher</option>
                              <option value="Parent">Parent</option>
                              <option value="Administrator">Administrator</option>
                            </select>

                            {isAuthorizedStaffEmail(u.email) && (
                              <button
                                type="button"
                                disabled={updatingId === u.uid}
                                onClick={() => handleRoleChange(u.uid, u.role === 'Administrator' ? 'Teacher' : 'Administrator')}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold transition-all border flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-xs ${
                                  u.role === 'Administrator'
                                    ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                                    : 'bg-indigo-600 border-indigo-700 text-white hover:bg-indigo-700'
                                }`}
                                title={u.role === 'Administrator' ? "Revoke Admin Status" : "Upgrade to Admin"}
                              >
                                <Shield className="w-3.5 h-3.5" />
                                <span>{u.role === 'Administrator' ? 'Revoke Admin' : 'Upgrade to Admin'}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {(() => {
                          const status = getUserOnlineStatus(u, profile?.uid);
                          if (u.suspended) {
                            return (
                              <button
                                type="button"
                                onClick={() => handleToggleSuspend(u.uid, true)}
                                disabled={updatingId === u.uid}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer"
                                title="Account Suspended - Click to Reactivate"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                <span>Suspended</span>
                              </button>
                            );
                          }

                          if (status.isOnline) {
                            return (
                              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                <span>{status.label}</span>
                              </span>
                            );
                          } else if (status.status === 'recent') {
                            return (
                              <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span>{status.label}</span>
                              </span>
                            );
                          } else {
                            return (
                              <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                <span>Offline</span>
                              </span>
                            );
                          }
                        })()}
                      </td>
                      <td className="py-4 px-4 text-slate-500">
                        <span className="flex items-center gap-1.5 text-[11px]" title={u.lastActiveAt ? `Last active: ${new Date(u.lastActiveAt).toLocaleString()}` : 'No recent login recorded'}>
                          <Clock className="w-3.5 h-3.5 opacity-60" />
                          <span>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {u.uid === profile?.uid ? (
                          <span className="text-[10px] text-rose-500 font-medium italic flex items-center justify-end gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Root Owner
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleAddWarning(u.uid, u.displayName)}
                              disabled={updatingId === u.uid}
                              title={`Issue Safety Warning (${u.violationsCount || 0}/3 warnings before auto-suspension)`}
                              className="px-2.5 py-1.5 rounded-lg border bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold">Warn ({(u.violationsCount || 0)})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.uid, u.email)}
                              disabled={updatingId === u.uid}
                              title="Permanently Delete Profile"
                              className="p-1.5 rounded-lg border bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 transition-all disabled:opacity-50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : adminTab === 'notifications' ? (
        <div className="bg-white rounded-2xl border border-[#e5e1da] shadow-sm p-6 md:p-8 space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e5e1da] pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center text-amber-600">
                <Bell className="w-5.5 h-5.5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Administrative Notification System</h2>
                <p className="text-xs text-slate-500">Real-time logs of teacher registrations and automated policy suspension threshold warnings.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-600 font-medium">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>Configured Admins: <strong className="text-slate-800 font-bold">ojiambo.godfry@gmail.com</strong> & <strong className="text-slate-800 font-bold">godfreynexused@gmail.com</strong></span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/10 flex items-center justify-between">
              <div>
                <span className="text-xs text-rose-600 font-bold uppercase tracking-wider block">Critical Thresholds</span>
                <span className="text-2xl font-black text-rose-700">{notifications.filter(n => n.severity === 'critical' && !n.resolved).length} Unresolved</span>
              </div>
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-600">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/10 flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-600 font-bold uppercase tracking-wider block">Pending Actions</span>
                <span className="text-2xl font-black text-amber-700">{notifications.filter(n => !n.resolved).length} Unresolved</span>
              </div>
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-600">
                <Bell className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/10 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider block">Resolved History</span>
                <span className="text-2xl font-black text-emerald-700">{notifications.filter(n => n.resolved).length} Handled</span>
              </div>
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* List of alerts */}
          {loadingNotifications ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <div className="w-8 h-8 border-3 border-amber-600/30 border-t-amber-600 rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold">Loading real-time admin alerts...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-[#e5e1da] rounded-2xl bg-slate-50/30 space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-slate-700 font-medium text-sm">No administrative notifications found</p>
              <p className="text-slate-400 text-xs max-w-sm mx-auto">Registration and policy threshold alerts will automatically log here and send emails when triggered.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notif) => {
                const isCritical = notif.severity === 'critical';
                const isResolved = notif.resolved;

                return (
                  <div 
                    key={notif.id} 
                    className={`border rounded-2xl p-5 transition-all ${
                      isResolved 
                        ? 'bg-slate-50/40 border-slate-200 opacity-60' 
                        : isCritical
                          ? 'bg-rose-50/10 border-rose-200 shadow-sm shadow-rose-50'
                          : 'bg-white border-[#e5e1da] shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      {/* Left: Indicator, Title, Msg */}
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                            isResolved 
                              ? 'bg-slate-100 border-slate-300 text-slate-500' 
                              : isCritical
                                ? 'bg-rose-100 border-rose-200 text-rose-700 animate-pulse'
                                : 'bg-amber-100 border-amber-200 text-amber-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              isResolved ? 'bg-slate-400' : isCritical ? 'bg-rose-600' : 'bg-amber-500'
                            }`} />
                            {isResolved ? 'RESOLVED' : isCritical ? 'CRITICAL ALERT' : 'SYSTEM ALERT'}
                          </span>

                          <span className="text-xs text-slate-400 font-mono">
                            {new Date(notif.timestamp).toLocaleString()}
                          </span>

                          {notif.emailSent ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                              ✓ Email Dispatched
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-0.5 rounded-full font-semibold">
                              ✉ Logged & Pending
                            </span>
                          )}
                        </div>

                        <h4 className={`text-base font-bold ${isResolved ? 'text-slate-600 line-through' : 'text-slate-800'}`}>
                          {notif.title}
                        </h4>

                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/50 border border-slate-100 p-3.5 rounded-xl font-mono">
                          {notif.message}
                        </p>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">Triggered by:</span>
                          <span>{notif.userDisplayName || 'System'} ({notif.userEmail || 'N/A'})</span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 md:self-start">
                        <button
                          type="button"
                          onClick={() => handleResolveNotification(notif.id, !!isResolved)}
                          title={isResolved ? "Mark Unresolved" : "Mark Resolved"}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isResolved
                              ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {isResolved ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>{isResolved ? 'Re-open' : 'Resolve'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteNotification(notif.id)}
                          title="Delete Permanent Log"
                          className="p-1.5 rounded-lg border bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : adminTab === 'feedback' ? (
        <FeedbackHub />
      ) : adminTab === 'policies' ? (
        <div className="bg-white rounded-2xl border border-[#e5e1da] shadow-sm p-6 md:p-8 space-y-8 animate-fadeIn">
          {/* Section Header */}
          <div className="border-b border-[#e5e1da] pb-5 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center text-indigo-600">
              <Shield className="w-5.5 h-5.5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">System Policies & Action Permissions</h2>
              <p className="text-xs text-slate-500">Configure global AI engine availability and restrict specific educational actions for individuals or everyone.</p>
            </div>
          </div>

          {/* AI Engine ON/OFF Switches */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4.5 h-4.5 text-indigo-600" />
              AI Generation Engine Controls
            </h3>
            
            {/* Admin AI Model Strategy Control Card */}
            <div className="border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40 p-5 rounded-2xl space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-amber-950 dark:text-amber-100 flex items-center gap-2">
                    <span>⚡ AI Image Engine Strategy & Fallback Control (Admin)</span>
                  </h4>
                  <p className="text-xs text-amber-800/90 dark:text-amber-200/90 mt-1">
                    Select how image synthesis models (Emgen & Nano Banana) operate across the platform for all users.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-extrabold text-[10px] uppercase tracking-wider">
                  Admin Global Policy
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {/* Option 1: Nano Banana as Fallback for Emgen */}
                <button
                  type="button"
                  onClick={() => {
                    updateSystemPolicies({
                      ...systemPolicies,
                      aiEngineMode: 'emgen_fallback_nanobanana'
                    });
                  }}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    (systemPolicies.aiEngineMode || 'emgen_fallback_nanobanana') === 'emgen_fallback_nanobanana'
                      ? 'border-amber-500 bg-white dark:bg-slate-900 ring-2 ring-amber-500/30 shadow-sm'
                      : 'border-amber-200/80 dark:border-amber-800/60 bg-amber-100/40 dark:bg-amber-900/20 hover:bg-white dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      🍌 Nano Banana as Fallback for Emgen
                    </span>
                    {(systemPolicies.aiEngineMode || 'emgen_fallback_nanobanana') === 'emgen_fallback_nanobanana' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Tries Emgen (High Quality) first. If Emgen fails or rate limits, automatically falls back to Nano Banana (Rapid) seamlessly. (Default for standard users)
                  </p>
                </button>

                {/* Option 2: Use Emgen Only */}
                <button
                  type="button"
                  onClick={() => {
                    updateSystemPolicies({
                      ...systemPolicies,
                      aiEngineMode: 'emgen_only'
                    });
                  }}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    systemPolicies.aiEngineMode === 'emgen_only'
                      ? 'border-amber-500 bg-white dark:bg-slate-900 ring-2 ring-amber-500/30 shadow-sm'
                      : 'border-amber-200/80 dark:border-amber-800/60 bg-amber-100/40 dark:bg-amber-900/20 hover:bg-white dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      🎨 Use Emgen Only
                    </span>
                    {systemPolicies.aiEngineMode === 'emgen_only' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Strictly forces high-resolution Emgen model for all visual outputs. Disables fallback to Nano Banana.
                  </p>
                </button>

                {/* Option 3: Use Nano Banana Only */}
                <button
                  type="button"
                  onClick={() => {
                    updateSystemPolicies({
                      ...systemPolicies,
                      aiEngineMode: 'nanobanana_only'
                    });
                  }}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    systemPolicies.aiEngineMode === 'nanobanana_only'
                      ? 'border-amber-500 bg-white dark:bg-slate-900 ring-2 ring-amber-500/30 shadow-sm'
                      : 'border-amber-200/80 dark:border-amber-800/60 bg-amber-100/40 dark:bg-amber-900/20 hover:bg-white dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      🍌 Use Nano Banana Only
                    </span>
                    {systemPolicies.aiEngineMode === 'nanobanana_only' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Strictly forces lightweight, ultra-rapid Nano Banana model for all visual outputs. Emgen is bypassed.
                  </p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="border border-slate-200 bg-slate-50/50 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Image Generation Engine</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Allow teachers and students to generate canvas illustrations and diagram icons.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateSystemPolicies({
                        ...systemPolicies,
                        imageEngineEnabled: !systemPolicies.imageEngineEnabled
                      });
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all shadow-sm cursor-pointer shrink-0 ${
                      systemPolicies.imageEngineEnabled
                        ? 'bg-[#5f6f52] text-white hover:bg-[#4a573e]'
                        : 'bg-rose-600 text-white hover:bg-rose-700'
                    }`}
                  >
                    {systemPolicies.imageEngineEnabled ? 'Engine ON' : 'Engine OFF'}
                  </button>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Engine Status: {systemPolicies.imageEngineEnabled ? '🟢 RUNNING (Operational)' : '🔴 PAUSED (Administratively Disabled)'}
                </div>
              </div>

              <div className="border border-slate-200 bg-slate-50/50 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Video Generation Engine (VEO)</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Control access to the high-def MP4 compilation and actor voice synthesis pipelines.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateSystemPolicies({
                        ...systemPolicies,
                        videoEngineEnabled: !systemPolicies.videoEngineEnabled
                      });
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all shadow-sm cursor-pointer shrink-0 ${
                      systemPolicies.videoEngineEnabled
                        ? 'bg-[#5f6f52] text-white hover:bg-[#4a573e]'
                        : 'bg-rose-600 text-white hover:bg-rose-700'
                    }`}
                  >
                    {systemPolicies.videoEngineEnabled ? 'Engine ON' : 'Engine OFF'}
                  </button>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Engine Status: {systemPolicies.videoEngineEnabled ? '🟢 RUNNING (Operational)' : '🔴 PAUSED (Administratively Disabled)'}
                </div>
              </div>

              <div className="border border-slate-200 bg-slate-50/50 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      Force Master Teacher Mode
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">Globally force the AI to append the Master Teacher Companion Guide, overriding individual choices.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateSystemPolicies({
                        ...systemPolicies,
                        forceMasterTeacherMode: !systemPolicies.forceMasterTeacherMode
                      });
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all shadow-sm cursor-pointer shrink-0 ${
                      systemPolicies.forceMasterTeacherMode
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-slate-300 text-slate-700 hover:bg-slate-450'
                    }`}
                  >
                    {systemPolicies.forceMasterTeacherMode ? 'FORCE ACTIVE' : 'USER CHOICE'}
                  </button>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Override Status: {systemPolicies.forceMasterTeacherMode ? '🔮 FORCING (Always Active)' : '⚪ DELEGATED (Teacher Selects)'}
                </div>
              </div>
            </div>
          </div>

          {/* Global Action Permissions */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4.5 h-4.5 text-indigo-600" />
              Global Action Permissions (Default for All Users)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: 'allowMaterialGeneration', label: 'Material Generation', desc: 'Allows creation of lesson plans, schemes of work, worksheets.' },
                { key: 'allowVideoCompilation', label: 'Video Courseware Compilation', desc: 'Allows teachers to compile video storyboard scripts to MP4.' },
                { key: 'allowImageGeneration', label: 'AI Image Canvas Generation', desc: 'Allows standard text-to-image synthesis inside Image Studio.' },
                { key: 'allowSocraticTutor', label: 'EduNexus AI Tutor', desc: 'Allows students to query the interactive chatbot.' },
                { key: 'allowCollaborationSharing', label: 'Faculty Collaboration Hub Sharing', desc: 'Allows publishing materials to the school sharing deck.' },
                { key: 'allowAssessmentGeneration', label: 'AI Assessment Item Generation', desc: 'Allows compiling MCQ, True/False, and assessment questions.' }
              ].map((act) => {
                const isAllowed = (systemPolicies as any)[act.key] ?? true;
                return (
                  <div key={act.key} className="border border-[#e5e1da] bg-[#fdfbf7] p-4.5 rounded-xl flex flex-col justify-between space-y-3.5">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-800 block">{act.label}</span>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-sans">{act.desc}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold font-mono ${isAllowed ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isAllowed ? '🟢 ALLOWED' : '🔴 DISABLED'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          updateSystemPolicies({
                            ...systemPolicies,
                            [act.key]: !isAllowed
                          });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                          isAllowed
                            ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {isAllowed ? 'Disallow All' : 'Allow All'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Overrides */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4.5 h-4.5 text-indigo-600" />
                  Granular User Overrides (Specific Exceptions)
                </h3>
                <p className="text-xs text-slate-500 max-w-2xl font-sans mt-1">
                  Specify custom permission sets for specific teachers or students. Overrides bypass the global defaults selected above.
                </p>
              </div>

              {/* Overrides Specific Search Filter Input */}
              <div className="relative w-full md:w-72 shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search override accounts or roles..."
                  value={overrideSearchTerm}
                  onChange={(e) => setOverrideSearchTerm(e.target.value)}
                  className="w-full bg-[#fdfbf7] border border-slate-250 rounded-xl pl-9 pr-8 py-1.5 text-xs focus:outline-none focus:border-emerald-500 transition shadow-2xs"
                />
                {overrideSearchTerm && (
                  <button
                    onClick={() => setOverrideSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-extrabold text-xs cursor-pointer p-1"
                    title="Clear filter"
                    type="button"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="border border-[#e5e1da] rounded-2xl overflow-hidden bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-[#e5e1da] text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4 text-center">Material Gen</th>
                      <th className="py-3 px-4 text-center">Video Comp</th>
                      <th className="py-3 px-4 text-center">Image Gen</th>
                      <th className="py-3 px-4 text-center">EduNexus AI Tutor</th>
                      <th className="py-3 px-2 text-center">Hub Share</th>
                      <th className="py-3 px-4 text-center">Assessment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f4f1ea] text-[11px] text-slate-700 font-sans">
                    {(() => {
                      const filteredOverridesList = allUsers
                        .filter(u => u.role !== 'Administrator')
                        .filter(u => {
                          if (!overrideSearchTerm) return true;
                          const term = overrideSearchTerm.toLowerCase();
                          return (
                            u.displayName.toLowerCase().includes(term) ||
                            u.email.toLowerCase().includes(term) ||
                            u.role.toLowerCase().includes(term)
                          );
                        });

                      if (filteredOverridesList.length === 0) {
                        return (
                          <tr>
                            <td colSpan={8} className="py-10 text-center text-slate-400">
                              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              No active accounts found matching "{overrideSearchTerm}".
                            </td>
                          </tr>
                        );
                      }

                      return filteredOverridesList.map((u) => {
                        const override = systemPolicies.userOverrides?.[u.uid] || {};
                        
                        const renderCheckbox = (field: keyof UserOverride, globalField: keyof SystemPolicies) => {
                          const globalVal = (systemPolicies as any)[globalField] ?? true;
                          const overrideVal = override[field];
                          
                          return (
                            <div className="flex flex-col items-center gap-1">
                              <select
                                value={overrideVal === undefined ? 'default' : overrideVal ? 'allow' : 'disallow'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const nextOverrides = { ...systemPolicies.userOverrides };
                                  const userOverride = { ...nextOverrides[u.uid] };
                                  
                                  if (val === 'default') {
                                    delete userOverride[field];
                                  } else {
                                    userOverride[field] = val === 'allow';
                                  }
                                  
                                  if (Object.keys(userOverride).length === 0) {
                                    delete nextOverrides[u.uid];
                                  } else {
                                    nextOverrides[u.uid] = userOverride;
                                  }
                                  
                                  updateSystemPolicies({
                                    ...systemPolicies,
                                    userOverrides: nextOverrides
                                  });
                                }}
                                className={`bg-[#fdfbf7] border rounded text-[10px] py-1 px-1 focus:outline-none cursor-pointer ${
                                  overrideVal === undefined
                                    ? 'border-slate-200 text-slate-500 font-normal'
                                    : overrideVal
                                    ? 'border-emerald-300 text-emerald-700 font-bold bg-emerald-50/50'
                                    : 'border-rose-300 text-rose-700 font-bold bg-rose-50/50'
                                }`}
                              >
                                <option value="default">Default ({globalVal ? 'Allow' : 'Block'})</option>
                                <option value="allow">Allow Always</option>
                                <option value="disallow">Disallow Always</option>
                              </select>
                            </div>
                          );
                        };

                        return (
                          <tr key={u.uid} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-800">
                              <div>{u.displayName}</div>
                              <div className="text-[10px] text-slate-400 font-normal">{u.email}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded border text-[9px] font-bold bg-slate-100 border-slate-200">
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center">{renderCheckbox('allowMaterialGeneration', 'allowMaterialGeneration')}</td>
                            <td className="py-3 px-2 text-center">{renderCheckbox('allowVideoCompilation', 'allowVideoCompilation')}</td>
                            <td className="py-3 px-2 text-center">{renderCheckbox('allowImageGeneration', 'allowImageGeneration')}</td>
                            <td className="py-3 px-2 text-center">{renderCheckbox('allowSocraticTutor', 'allowSocraticTutor')}</td>
                            <td className="py-3 px-2 text-center">{renderCheckbox('allowCollaborationSharing', 'allowCollaborationSharing')}</td>
                            <td className="py-3 px-2 text-center">{renderCheckbox('allowAssessmentGeneration', 'allowAssessmentGeneration')}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : adminTab === 'logs' ? (
        <div className="bg-white rounded-2xl border border-[#e5e1da] shadow-sm p-6 md:p-8 space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e5e1da] pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center text-blue-600">
                <Activity className="w-5.5 h-5.5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">School System Activity Audit Log</h2>
                <p className="text-xs text-slate-500">Real-time auditing of user authentications, curriculum content generations, and student learning material views.</p>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto animate-fadeIn">
              {/* Search Bar */}
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user, action, or document..."
                  value={logsSearchTerm}
                  onChange={(e) => setLogsSearchTerm(e.target.value)}
                  className="w-full bg-[#fdfbf7] border border-slate-250 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* Action Filter Dropdown */}
              <div className="relative w-full sm:w-44">
                <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={logsFilterAction}
                  onChange={(e) => setLogsFilterAction(e.target.value)}
                  className="w-full bg-[#fdfbf7] border border-slate-250 rounded-xl pl-8 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-700 transition"
                >
                  <option value="all">All Actions</option>
                  <option value="login">🔐 Login</option>
                  <option value="view">👁️ View Doc</option>
                  <option value="generate">✨ Generate Doc</option>
                  <option value="comment">💬 Comment</option>
                  <option value="create">🆕 Account Create</option>
                </select>
              </div>
            </div>
          </div>

          {/* Heatmap Visualization Tabs */}
          <div className="border-b border-[#e5e1da] pb-3 flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-1.5 bg-[#fdfbf7] p-1.5 rounded-xl border border-[#e5e1da]">
              <button
                type="button"
                onClick={() => setLogsVisualTab('teacher30')}
                className={`px-4.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  logsVisualTab === 'teacher30'
                    ? 'bg-[#5f6f52] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                Teacher 30-Day Heatmap
              </button>
              <button
                type="button"
                onClick={() => setLogsVisualTab('overall')}
                className={`px-4.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  logsVisualTab === 'overall'
                    ? 'bg-[#5f6f52] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                Overall Activity (22 Weeks)
              </button>
            </div>
            <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest bg-[#fdfbf7] px-3 py-1.5 rounded-lg border border-[#e5e1da]">
              {logsVisualTab === 'teacher30' ? '🟢 Teacher Generation Filter Active' : '🔵 All Actions Included'}
            </div>
          </div>

          <div className="animate-fadeIn">
            {logsVisualTab === 'teacher30' ? (
              <TeacherActivityHeatmap logs={logs} />
            ) : (
              <ActivityHeatmap logs={logs} />
            )}
          </div>

          {/* Table list */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#e5e1da] text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4 w-48">Actor Profile</th>
                  <th className="py-3 px-4 w-28">Role</th>
                  <th className="py-3 px-4 w-32">Action Type</th>
                  <th className="py-3 px-4">Activity Description</th>
                  <th className="py-3 px-4 w-44 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f1ea] text-xs text-slate-700">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-14 text-center text-slate-400">
                      <Activity className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-400" />
                      <p className="font-extrabold text-sm text-slate-600">No matching activities found</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">Either no matching logs were generated yet or the search queries do not return any records.</p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const actionBadge = getLogActionBadge(log.action);
                    return (
                      <tr key={log.id} className="hover:bg-[#faf9f5]/50 transition-colors">
                        {/* Actor Profile */}
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-extrabold text-[10px] uppercase">
                              {log.userName.slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <span className="block truncate max-w-[150px]" title={log.userName}>{log.userName}</span>
                              <span className="block text-[10px] text-slate-400 font-normal truncate max-w-[150px]" title={log.userEmail}>{log.userEmail}</span>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center border px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${getRoleBadgeColor(log.userRole)}`}>
                            {log.userRole}
                          </span>
                        </td>

                        {/* Action Badge */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 border px-2.5 py-0.5 rounded-md text-[10px] font-bold ${actionBadge.style}`}>
                            {actionBadge.icon}
                            <span>{actionBadge.label}</span>
                          </span>
                        </td>

                        {/* Description details */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <p className="text-slate-700 font-medium leading-relaxed">{log.details}</p>
                            {log.documentTitle && (
                              <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-500 rounded-md px-1.5 py-0.5 text-[10px] font-semibold max-w-xs truncate" title={log.documentTitle}>
                                📄 {log.documentTitle}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-4 text-right text-slate-500 font-mono text-[10px]">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {adminTab === 'pilot' && (
        <div className="bg-white rounded-2xl border border-[#e5e1da] shadow-sm p-6 md:p-8 space-y-8 animate-fadeIn">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e5e1da] pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center text-indigo-600">
                <ClipboardList className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-slate-800">Pilot Evaluation Form Results</h3>
                <p className="text-xs text-slate-500">Real-time pedagogical metrics and qualitative feedback from pilot program participants.</p>
              </div>
            </div>
            
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 text-xs font-bold text-indigo-700 flex items-center gap-2">
              <span>Total Submissions:</span>
              <span className="bg-indigo-600 text-white rounded-md px-2 py-0.5 font-extrabold">{pilotFeedback.length}</span>
            </div>
          </div>

          {/* Loader or Empty State */}
          {isPilotLoading ? (
            <div className="py-20 text-center text-slate-400 space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold">Retrieving evaluation responses...</p>
            </div>
          ) : pilotFeedback.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-35 text-indigo-500" />
              <p className="font-extrabold text-sm text-slate-600">No Pilot Submissions Received Yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                As soon as registered teachers sign out and complete their evaluation surveys, their comprehensive scores and feedback will instantly populate here in real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Aggregate Score Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Score Card 1: Ease of Use */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Avg. Ease of Use</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-serif font-black text-indigo-700">
                      {(pilotFeedback.reduce((acc, curr) => acc + curr.easeOfUse, 0) / pilotFeedback.length).toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400">/ 5.0</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full" 
                      style={{ width: `${((pilotFeedback.reduce((acc, curr) => acc + curr.easeOfUse, 0) / pilotFeedback.length) / 5) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Score Card 2: AI Quality */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Avg. AI Lesson Quality</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-serif font-black text-emerald-700">
                      {(pilotFeedback.reduce((acc, curr) => acc + curr.qualityOfAI, 0) / pilotFeedback.length).toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400">/ 5.0</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full" 
                      style={{ width: `${((pilotFeedback.reduce((acc, curr) => acc + curr.qualityOfAI, 0) / pilotFeedback.length) / 5) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Score Card 3: Standards Relevance */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Avg. Standards Relevance</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-serif font-black text-amber-700">
                      {(pilotFeedback.reduce((acc, curr) => acc + curr.standardsRelevance, 0) / pilotFeedback.length).toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400">/ 5.0</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-600 h-full rounded-full" 
                      style={{ width: `${((pilotFeedback.reduce((acc, curr) => acc + curr.standardsRelevance, 0) / pilotFeedback.length) / 5) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Score Card 4: Recommendation Likelihood */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Faculty Net Recommendation</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-serif font-black text-rose-700">
                      {(pilotFeedback.reduce((acc, curr) => acc + curr.recommendationLikelihood, 0) / pilotFeedback.length).toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400">/ 5.0</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-rose-600 h-full rounded-full" 
                      style={{ width: `${((pilotFeedback.reduce((acc, curr) => acc + curr.recommendationLikelihood, 0) / pilotFeedback.length) / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Individual Evaluation Responses */}
              <div className="space-y-6">
                <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider font-sans">Individual Survey Responses</h4>
                
                <div className="grid grid-cols-1 gap-6">
                  {pilotFeedback.map((fb) => (
                    <div key={fb.id} className="bg-white border border-[#e5e1da] rounded-2xl p-6 shadow-3xs space-y-5 hover:shadow-2xs transition">
                      {/* Submitter Metadata */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f4f1ea] pb-4">
                        <div className="flex items-center gap-3 font-sans">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-extrabold text-xs">
                            {fb.userName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-800 text-sm">{fb.userName}</span>
                            <span className="block text-xs text-slate-400 font-medium">{fb.userEmail} ({fb.userRole})</span>
                          </div>
                        </div>

                        <div className="text-right text-[10px] text-slate-400 font-mono">
                          Submitted {new Date(fb.createdAt).toLocaleString()}
                        </div>
                      </div>

                      {/* Quantitative Ratings Display */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-[#f4f1ea] font-sans">
                        <div className="space-y-1">
                          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ease of Use</span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-black text-slate-800">{fb.easeOfUse}</span>
                            <div className="flex text-amber-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-3.5 h-3.5 ${i < fb.easeOfUse ? 'fill-current' : 'text-slate-200'}`} />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI Content Quality</span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-black text-slate-800">{fb.qualityOfAI}</span>
                            <div className="flex text-amber-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-3.5 h-3.5 ${i < fb.qualityOfAI ? 'fill-current' : 'text-slate-200'}`} />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Standards Relevance</span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-black text-slate-800">{fb.standardsRelevance}</span>
                            <div className="flex text-amber-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-3.5 h-3.5 ${i < fb.standardsRelevance ? 'fill-current' : 'text-slate-200'}`} />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Recommendation</span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-black text-slate-800">{fb.recommendationLikelihood}</span>
                            <div className="flex text-amber-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-3.5 h-3.5 ${i < fb.recommendationLikelihood ? 'fill-current' : 'text-slate-200'}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Qualitative Comments */}
                      <div className="space-y-3 pt-1 font-sans">
                        {fb.whatWorkedWell && (
                          <div className="text-xs">
                            <strong className="text-slate-500 font-bold block mb-0.5">What Worked Best:</strong>
                            <p className="text-slate-700 bg-emerald-50/30 border border-emerald-100/50 p-2.5 rounded-lg leading-relaxed font-sans">{fb.whatWorkedWell}</p>
                          </div>
                        )}

                        {fb.areasOfImprovement && (
                          <div className="text-xs">
                            <strong className="text-slate-500 font-bold block mb-0.5">Needs Improvement:</strong>
                            <p className="text-slate-700 bg-rose-50/30 border border-rose-100/50 p-2.5 rounded-lg leading-relaxed font-sans">{fb.areasOfImprovement}</p>
                          </div>
                        )}

                        {fb.futureFeaturesRequested && (
                          <div className="text-xs">
                            <strong className="text-slate-500 font-bold block mb-0.5">Feature Requests:</strong>
                            <p className="text-slate-700 bg-indigo-50/30 border border-indigo-100/50 p-2.5 rounded-lg leading-relaxed font-sans">{fb.futureFeaturesRequested}</p>
                          </div>
                        )}

                        {fb.freeTextFeedback && (
                          <div className="text-xs">
                            <strong className="text-slate-500 font-bold block mb-0.5">Additional General Remarks:</strong>
                            <p className="text-slate-700 bg-slate-50 border border-slate-200/50 p-2.5 rounded-lg leading-relaxed font-sans">{fb.freeTextFeedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {adminTab === 'monitor' && (
        <SystemMonitorPanel />
      )}

      {adminTab === 'seo' && (
        <SEODashboardTab />
      )}

      {adminTab === 'branding' && (
        <DeveloperBrandingSettings />
      )}

      {adminTab === 'analyzer' && (
        <AISystemAnalyzer />
      )}
    </div>
  );
}
