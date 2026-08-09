import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, deleteDoc, disableNetwork, enableNetwork } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, cleanUndefined } from '../firebase';
import { logActivity } from '../lib/activityLogger';
import { triggerAdminNotification } from '../lib/adminNotifications';
import { UserAccount, UserRole, AllowedAction, SystemPolicies, UserOverride, CurriculumType } from '../types';

export function extractNameFromEmail(email?: string | null): string {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return 'Educator';
  }
  const localPart = email.split('@')[0].trim();
  if (!localPart) return 'Educator';

  const parts = localPart.split(/[\._\+\-]/).filter(Boolean);
  if (parts.length === 0) return 'Educator';

  const formatted = parts
    .map((part) => {
      if (/^\d+$/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(' ');

  if (!formatted || formatted.toLowerCase() === 'user' || formatted.toLowerCase() === 'google user') {
    return 'Educator';
  }
  return formatted;
}

export function resolveDisplayName(
  providedName?: string | null,
  email?: string | null,
  firebaseDisplayName?: string | null
): string {
  const isGenericName = (name?: string | null): boolean => {
    if (!name || !name.trim()) return true;
    const lower = name.trim().toLowerCase();
    return (
      lower === 'google user' ||
      lower === 'user' ||
      lower === 'googleuser' ||
      lower.startsWith('google user')
    );
  };

  if (providedName && !isGenericName(providedName)) {
    return providedName.trim();
  }
  if (firebaseDisplayName && !isGenericName(firebaseDisplayName)) {
    return firebaseDisplayName.trim();
  }
  if (email && email.trim()) {
    return extractNameFromEmail(email);
  }
  return 'Educator';
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserAccount | null;
  loading: boolean;
  hasDeveloperClaim: boolean;
  isDeveloper: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, role: UserRole) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  registerWithGoogle: (name: string, role: UserRole) => Promise<void>;
  loginWithProvider: (providerId: 'google') => Promise<void>;
  registerWithProvider: (providerId: 'google', name: string, role: UserRole) => Promise<void>;
  loginOffline: (role: UserRole, customName?: string) => Promise<void>;
  logout: () => Promise<void>;
  allUsers: UserAccount[];
  updateUserRole: (uid: string, nextRole: UserRole) => Promise<void>;
  toggleSuspendUser: (uid: string, currentSuspendedState: boolean) => Promise<void>;
  deleteUserAccount: (uid: string) => Promise<void>;
  systemPolicies: SystemPolicies;
  updateSystemPolicies: (policies: SystemPolicies) => Promise<void>;
  isActionAllowed: (action: AllowedAction, targetUid?: string) => boolean;
  adminAddUser: (email: string, displayName: string, role: UserRole) => Promise<void>;
  incrementUserWarnings: (uid: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserAccount>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasDeveloperClaim, setHasDeveloperClaim] = useState<boolean>(false);
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);

  const ALLOWED_DEVELOPER_EMAILS = [
    'ojiambo.godfrey@gmail.com',
    'ojiambo.godfry@gmail.com',
    'godfreynexused@gmail.com'
  ];
  const userEmailLower = (user?.email || profile?.email || '').toLowerCase().trim();
  const isDeveloper = hasDeveloperClaim || profile?.role === 'developer' || ALLOWED_DEVELOPER_EMAILS.includes(userEmailLower);

  // Listen to Auth changes
  useEffect(() => {
    const localUserJson = localStorage.getItem('nexus_offline_user');
    const localProfileJson = localStorage.getItem('nexus_offline_profile');
    if (localUserJson && localProfileJson) {
      try {
        const parsedUser = JSON.parse(localUserJson);
        const parsedProfile = JSON.parse(localProfileJson);
        
        disableNetwork(db).then(() => {
          console.log("Firestore network disabled for offline sandbox session on boot.");
        }).catch(err => {
          console.warn("Could not disable network on boot:", err);
        });

        setUser(parsedUser);
        setProfile(parsedProfile);
        setLoading(false);
        return;
      } catch (err) {
        console.error("Error loading offline session from localStorage:", err);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const tokenResult = await firebaseUser.getIdTokenResult();
          setHasDeveloperClaim(tokenResult?.claims?.developer === true);
        } catch (err) {
          console.warn("Could not retrieve custom claims from Firebase ID token:", err);
          setHasDeveloperClaim(false);
        }

        const userRef = doc(db, 'users', firebaseUser.uid);
        
        try {
          const pendingRole = sessionStorage.getItem('pending_demo_role') as UserRole | null;
          if (pendingRole) {
            sessionStorage.removeItem('pending_demo_role');
          }

          const emailLower = (firebaseUser.email || '').toLowerCase().trim();
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const existingData = userSnap.data() as UserAccount;
            const isDeveloper = emailLower === 'ojiambo.godfrey@gmail.com' || emailLower === 'ojiambo.godfry@gmail.com' || emailLower === 'godfreynexused@gmail.com';
            
            let updatedRole = existingData.role;
            if (isDeveloper) {
              updatedRole = 'developer';
            } else if ((existingData.role === 'Administrator' || existingData.role === 'developer') && !isDeveloper) {
              // Strictly demote if not a developer email
              updatedRole = 'Teacher';
            }

            const resolvedName = resolveDisplayName(existingData.displayName, firebaseUser.email, firebaseUser.displayName);
            const nameNeedsUpdate = existingData.displayName !== resolvedName;

            if (
              (pendingRole === 'Administrator' || pendingRole === 'developer') &&
              !isDeveloper &&
              existingData.role !== 'developer'
            ) {
              sessionStorage.setItem('auth_error_msg', 'Access denied: The Developer Console is restricted to authorized platform owners.');
            }

            if (updatedRole !== existingData.role || nameNeedsUpdate) {
              const updatedProfile = {
                ...existingData,
                role: updatedRole,
                displayName: resolvedName
              };
              await setDoc(userRef, cleanUndefined(updatedProfile), { merge: true });
              setProfile(updatedProfile);
            } else {
              setProfile(existingData);
            }
          } else {
            const preCreatedRef = doc(db, 'users', emailLower);
            const preCreatedSnap = await getDoc(preCreatedRef);

            if (preCreatedSnap.exists()) {
              const preCreatedData = preCreatedSnap.data() as UserAccount;
              const resolvedName = resolveDisplayName(preCreatedData.displayName, firebaseUser.email, firebaseUser.displayName);
              const migratedProfile: UserAccount = {
                ...preCreatedData,
                uid: firebaseUser.uid,
                displayName: resolvedName,
                createdAt: preCreatedData.createdAt || new Date().toISOString()
              };
              await setDoc(userRef, cleanUndefined(migratedProfile));
              try {
                await deleteDoc(preCreatedRef);
              } catch (err) {
                console.warn("Could not delete email-keyed doc:", err);
              }
              setProfile(migratedProfile);
            } else {
            // User profile does not exist in Firestore. Check if this is an explicit signup or whitelisted/demo account.
            const emailLower = (firebaseUser.email || '').toLowerCase().trim();
            const googleRegName = sessionStorage.getItem('pending_google_reg_name');
            const googleRegRole = sessionStorage.getItem('pending_google_reg_role') as UserRole | null;
            const emailRegName = sessionStorage.getItem('pending_email_reg_name');
            const emailRegRole = sessionStorage.getItem('pending_email_reg_role') as UserRole | null;
            const isDeveloper = emailLower === 'ojiambo.godfrey@gmail.com' || emailLower === 'ojiambo.godfry@gmail.com' || emailLower === 'godfreynexused@gmail.com';
            const isDemoStudent = emailLower === 'student.demo@edunexus.test';
            const hasPasswordProvider = firebaseUser.providerData?.some((provider) => provider.providerId === 'password');
            const hasGoogleProvider = firebaseUser.providerData?.some((provider) => provider.providerId === 'google.com');

            if (pendingRole || googleRegRole || emailRegRole || hasPasswordProvider || hasGoogleProvider || isDeveloper || isDemoStudent) {
              let defaultRole: UserRole = pendingRole || googleRegRole || emailRegRole || 'Teacher';
              if (isDeveloper) {
                defaultRole = 'developer';
              } else if (defaultRole === 'Administrator' || defaultRole === 'developer') {
                // Prevent non-developer emails from registering as developer or Administrator!
                defaultRole = 'Teacher';
                sessionStorage.setItem('auth_error_msg', 'Access denied: The Developer Console is restricted to authorized platform owners. Configured with Teacher role instead.');
              } else if (isDemoStudent) {
                defaultRole = 'Student';
              }
              
              const resolvedName = resolveDisplayName(
                googleRegName || emailRegName,
                firebaseUser.email,
                firebaseUser.displayName
              );

              const newProfile: UserAccount = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: resolvedName,
                role: defaultRole,
                createdAt: new Date().toISOString()
              };
              
              await setDoc(userRef, cleanUndefined(newProfile));
              setProfile(newProfile);
              sessionStorage.removeItem('pending_email_reg_name');
              sessionStorage.removeItem('pending_email_reg_role');

              if (defaultRole === 'Teacher') {
                triggerAdminNotification(
                  'teacher_registered',
                  'New Teacher Registered',
                  `A new educator has registered in the system.\n\nName: ${newProfile.displayName}\nEmail: ${newProfile.email}\nRole: Teacher`,
                  newProfile.email,
                  newProfile.displayName,
                  'info'
                ).catch(err => console.error('Error triggering admin notification on auth listener registration:', err));
              }

              // Clean up registration session storage
              sessionStorage.removeItem('pending_google_reg_name');
              sessionStorage.removeItem('pending_google_reg_role');
              sessionStorage.removeItem('pending_email_reg_name');
              sessionStorage.removeItem('pending_email_reg_role');
            } else {
              // Not a registration flow, and not a bootstrapped user. Restrict login!
              console.warn('Sign-in attempted for account with no profile:', emailLower);
              sessionStorage.setItem('auth_error_msg', 'No profile found for this account. Please register/sign up first.');
              await signOut(auth);
              setProfile(null);
              setUser(null);
            }
          }
        }
        } catch (err) {
          console.error('Error fetching user profile from Firestore (network request failed or transient issue):', err);
          const resolvedName = resolveDisplayName(null, firebaseUser.email, firebaseUser.displayName);
          setProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: resolvedName,
            role: 'Teacher',
            createdAt: new Date().toISOString()
          });
        }
      } else {
        setHasDeveloperClaim(false);
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Listen to user profile real-time update once authenticated
  useEffect(() => {
    if (!user) return;
    if (user.uid.startsWith('offline-sandbox-')) {
      return;
    }
    const userRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        const prof = docSnap.data() as UserAccount;
        const resolvedName = resolveDisplayName(prof.displayName, user.email, user.displayName);
        const effectiveCurriculum = prof.primaryCurriculum || prof.curriculum || prof.whatsappSettings?.curriculum || (localStorage.getItem('edunexus_primary_curriculum') as CurriculumType) || 'cbc';
        
        let finalProf = {
          ...prof,
          curriculum: effectiveCurriculum,
          primaryCurriculum: effectiveCurriculum,
          whatsappSettings: {
            ...(prof.whatsappSettings || {}),
            curriculum: effectiveCurriculum
          }
        };

        if (prof.displayName !== resolvedName) {
          finalProf.displayName = resolvedName;
          try {
            await setDoc(userRef, { displayName: resolvedName }, { merge: true });
          } catch (err) {
            console.warn("Could not auto-sync updated displayName to Firestore:", err);
          }
        }

        localStorage.setItem('edunexus_primary_curriculum', effectiveCurriculum);
        localStorage.setItem('edunexus_whatsapp_curriculum_pref', effectiveCurriculum);

        setProfile(finalProf);
        
        // Log login once per browser session
        const sessionKey = `logged_session_${user.uid}`;
        if (!sessionStorage.getItem(sessionKey)) {
          logActivity('login', `User signed in successfully (${finalProf.role})`, finalProf);
          sessionStorage.setItem(sessionKey, 'true');
        }
      } else {
        // Clear profile if the document has been deleted in Firestore (e.g. by admin)
        setProfile(null);
      }
    }, (err) => {
      console.error('Error listening to user profile changes:', err);
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    });
    return unsub;
  }, [user]);

  // Maintain active user presence heartbeat in Firestore
  useEffect(() => {
    if (!user || user.uid.startsWith('offline-sandbox-')) return;

    const touchHeartbeat = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { 
          lastActiveAt: new Date().toISOString(),
          isOnline: true 
        }, { merge: true });
      } catch (err) {
        // Silently catch transient network heartbeat errors
      }
    };

    // Touch on mount
    touchHeartbeat();

    // Heartbeat every 2 minutes
    const interval = setInterval(touchHeartbeat, 120000);

    return () => clearInterval(interval);
  }, [user]);

  // If user is Developer or Administrator, listen to ALL users in the system to enable user management
  useEffect(() => {
    if (!profile || (profile.role !== 'developer' && profile.role !== 'Administrator')) {
      setAllUsers([]);
      return;
    }

    if (profile.uid.startsWith('offline-sandbox-')) {
      setAllUsers([
        profile,
        { uid: 'offline-sandbox-teacher-uid', email: 'sandbox.teacher@nexused.edu', displayName: 'Sandbox Teacher', role: 'Teacher', createdAt: new Date().toISOString() },
        { uid: 'offline-sandbox-student-uid', email: 'sandbox.student@nexused.edu', displayName: 'Sandbox Student', role: 'Student', createdAt: new Date().toISOString() },
        { uid: 'offline-sandbox-parent-uid', email: 'sandbox.parent@nexused.edu', displayName: 'Sandbox Parent', role: 'Parent', createdAt: new Date().toISOString() }
      ]);
      return;
    }

    const usersCol = collection(db, 'users');
    const unsub = onSnapshot(usersCol, (snap) => {
      const usersList: UserAccount[] = [];
      snap.forEach((docSnap) => {
        usersList.push(docSnap.data() as UserAccount);
      });
      setAllUsers(usersList);
    }, (err) => {
      console.error('Error listing users for Administrator:', err);
      handleFirestoreError(err, OperationType.LIST, 'users');
    });

    return unsub;
  }, [profile?.uid, profile?.role]);

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      throw err;
    }
  };

  const sendPasswordReset = async (email: string) => {
    if (!email || !email.trim()) {
      throw new Error('Please enter your email address to receive a password reset link.');
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      throw err;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string, role: UserRole) => {
    try {
      sessionStorage.setItem('pending_email_reg_name', name);
      sessionStorage.setItem('pending_email_reg_role', role);
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const emailLower = email.toLowerCase().trim();
      const isBootstrappedAdmin = emailLower === 'ojiambo.godfry@gmail.com' || emailLower === 'godfreynexused@gmail.com';
      const actualRole: UserRole = isBootstrappedAdmin ? 'Administrator' : role;

      const userRef = doc(db, 'users', cred.user.uid);
      const newProfile: UserAccount = {
        uid: cred.user.uid,
        email: email,
        displayName: name,
        role: actualRole,
        createdAt: new Date().toISOString()
      };

      await setDoc(userRef, cleanUndefined(newProfile));
      setProfile(newProfile);
      sessionStorage.removeItem('pending_email_reg_name');
      sessionStorage.removeItem('pending_email_reg_role');

      if (actualRole === 'Teacher') {
        triggerAdminNotification(
          'teacher_registered',
          'New Teacher Registered',
          `A new educator has registered in the system.\n\nName: ${name}\nEmail: ${email}\nRole: Teacher`,
          email,
          name,
          'info'
        ).catch(err => console.error('Error triggering admin notification on registration:', err));
      }
    } catch (err) {
      sessionStorage.removeItem('pending_email_reg_name');
      sessionStorage.removeItem('pending_email_reg_role');
      throw err;
    }
  };

  const loginWithProvider = async (providerId: 'google') => {
    try {
      let provider: any;
      if (providerId === 'google') {
        const googleProvider = new GoogleAuthProvider();
        googleProvider.setCustomParameters({
          prompt: 'select_account'
        });
        provider = googleProvider;
      }
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        console.log('Google Sign-In popup closed by user');
        return;
      }
      throw err;
    }
  };

  const registerWithProvider = async (providerId: 'google', name: string, role: UserRole) => {
    try {
      sessionStorage.setItem('pending_google_reg_name', name);
      sessionStorage.setItem('pending_google_reg_role', role);
      let provider: any;
      if (providerId === 'google') {
        const googleProvider = new GoogleAuthProvider();
        googleProvider.setCustomParameters({
          prompt: 'select_account'
        });
        provider = googleProvider;
      }
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      sessionStorage.removeItem('pending_google_reg_name');
      sessionStorage.removeItem('pending_google_reg_role');
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        console.log('Google Registration popup closed by user');
        return;
      }
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    await loginWithProvider('google');
  };

  const registerWithGoogle = async (name: string, role: UserRole) => {
    await registerWithProvider('google', name, role);
  };

  const loginOffline = async (role: UserRole, customName?: string) => {
    setLoading(true);
    try {
      const defaultNames = {
        Teacher: 'Sandbox Teacher',
        Student: 'Sandbox Student',
        Parent: 'Sandbox Parent',
        Administrator: 'Sandbox Administrator'
      };

      const mockUid = `offline-sandbox-${role.toLowerCase()}-uid`;
      const mockEmail = `sandbox.${role.toLowerCase()}@nexused.edu`;
      const mockDisplayName = customName || defaultNames[role] || 'Sandbox User';

      const mockUser = {
        uid: mockUid,
        email: mockEmail,
        displayName: mockDisplayName,
        emailVerified: true
      } as any;

      const mockProfile: UserAccount = {
        uid: mockUid,
        email: mockEmail,
        displayName: mockDisplayName,
        role: role,
        createdAt: new Date().toISOString()
      };

      localStorage.setItem('nexus_offline_user', JSON.stringify(mockUser));
      localStorage.setItem('nexus_offline_profile', JSON.stringify(mockProfile));

      try {
        await disableNetwork(db);
        console.log("Firestore network disabled successfully for offline sandbox mode.");
      } catch (e) {
        console.warn("Could not disable Firestore network:", e);
      }

      setUser(mockUser);
      setProfile(mockProfile);
      
      logActivity('login', `User signed in via Sandbox Offline Mode (${role})`, mockProfile);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('nexus_offline_user');
    localStorage.removeItem('nexus_offline_profile');
    try {
      await enableNetwork(db);
      console.log("Firestore network enabled successfully on logout.");
    } catch (e) {
      console.warn("Could not enable Firestore network on logout:", e);
    }
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const updateUserRole = async (uid: string, nextRole: UserRole) => {
    if (uid.startsWith('offline-sandbox-')) {
      setProfile(prev => prev && prev.uid === uid ? { ...prev, role: nextRole } : prev);
      setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: nextRole } : u));
      return;
    }
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, cleanUndefined({ role: nextRole }), { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const toggleSuspendUser = async (uid: string, currentSuspendedState: boolean) => {
    if (uid.startsWith('offline-sandbox-')) {
      setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, suspended: !currentSuspendedState } : u));
      return;
    }
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { suspended: !currentSuspendedState }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const deleteUserAccount = async (uid: string) => {
    if (uid.startsWith('offline-sandbox-')) {
      setAllUsers(prev => prev.filter(u => u.uid !== uid));
      return;
    }
    try {
      const userRef = doc(db, 'users', uid);
      await deleteDoc(userRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
    }
  };

  const [systemPolicies, setSystemPolicies] = useState<SystemPolicies>(() => {
    const local = localStorage.getItem('nexus_system_policies');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error("Error reading system policies from localStorage:", e);
      }
    }
    return {
      imageEngineEnabled: true,
      videoEngineEnabled: true,
      aiEngineMode: 'emgen_fallback_nanobanana',
      allowMaterialGeneration: true,
      allowVideoCompilation: true,
      allowImageGeneration: true,
      allowSocraticTutor: true,
      allowCollaborationSharing: true,
      allowAssessmentGeneration: true,
      userOverrides: {},
      forceMasterTeacherMode: false
    };
  });

  // Listen to global policies in real-time
  useEffect(() => {
    const localUserJson = localStorage.getItem('nexus_offline_user');
    if (localUserJson) {
      return;
    }

    const docRef = doc(db, 'system-config', 'policies');
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const policies = snap.data() as SystemPolicies;
        setSystemPolicies(policies);
        localStorage.setItem('nexus_system_policies', JSON.stringify(policies));
      }
    }, (err) => {
      console.warn("Error listening to system policies in Firestore (might not be created yet):", err);
    });

    return unsub;
  }, []);

  const updateSystemPolicies = async (policies: SystemPolicies) => {
    setSystemPolicies(policies);
    localStorage.setItem('nexus_system_policies', JSON.stringify(policies));

    const localUserJson = localStorage.getItem('nexus_offline_user');
    if (localUserJson) {
      return;
    }

    try {
      const docRef = doc(db, 'system-config', 'policies');
      await setDoc(docRef, cleanUndefined(policies));
      logActivity('system', `Admin updated system policies & AI engine statuses`, profile);
    } catch (err) {
      console.error("Error writing system policies to Firestore:", err);
    }
  };

  const isActionAllowed = (action: AllowedAction, targetUid?: string): boolean => {
    const checkUid = targetUid || profile?.uid;
    if (!checkUid) return true;

    // Administrators are ALWAYS allowed all actions!
    const targetUser = allUsers.find(u => u.uid === checkUid) || (profile?.uid === checkUid ? profile : null);
    if (targetUser?.role === 'Administrator') return true;

    // If there's an override for this specific user
    const override = systemPolicies.userOverrides?.[checkUid];
    if (override) {
      if (action === 'material-generation' && override.allowMaterialGeneration !== undefined) return override.allowMaterialGeneration;
      if (action === 'video-compilation' && override.allowVideoCompilation !== undefined) return override.allowVideoCompilation;
      if (action === 'image-generation' && override.allowImageGeneration !== undefined) return override.allowImageGeneration;
      if (action === 'socratic-tutor' && override.allowSocraticTutor !== undefined) return override.allowSocraticTutor;
      if (action === 'collaboration-sharing' && override.allowCollaborationSharing !== undefined) return override.allowCollaborationSharing;
      if (action === 'assessment-generation' && override.allowAssessmentGeneration !== undefined) return override.allowAssessmentGeneration;
    }

    // Fallback to global engine check first for image and video
    if (action === 'image-generation' && !systemPolicies.imageEngineEnabled) return false;
    if (action === 'video-compilation' && !systemPolicies.videoEngineEnabled) return false;

    // Fallback to global action settings
    if (action === 'material-generation') return systemPolicies.allowMaterialGeneration;
    if (action === 'video-compilation') return systemPolicies.allowVideoCompilation;
    if (action === 'image-generation') return systemPolicies.allowImageGeneration;
    if (action === 'socratic-tutor') return systemPolicies.allowSocraticTutor;
    if (action === 'collaboration-sharing') return systemPolicies.allowCollaborationSharing;
    if (action === 'assessment-generation') return systemPolicies.allowAssessmentGeneration;

    return true;
  };

  const adminAddUser = async (email: string, displayName: string, role: UserRole) => {
    const emailLower = email.toLowerCase().trim();
    const mockUid = `pre-created-${Date.now()}`;
    const newProfile: UserAccount = {
      uid: mockUid,
      email: emailLower,
      displayName: displayName,
      role: role,
      createdAt: new Date().toISOString(),
      suspended: false
    };

    if (profile?.uid.startsWith('offline-sandbox-')) {
      setAllUsers(prev => [...prev, newProfile]);
      logActivity('system', `Admin created new offline user: ${displayName} (${role})`, profile);
      return;
    }

    try {
      const userRef = doc(db, 'users', emailLower);
      await setDoc(userRef, cleanUndefined(newProfile));
      logActivity('system', `Admin created new system user registry: ${displayName} (${role})`, profile);
    } catch (error) {
      console.error("Error creating user registry document:", error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${emailLower}`);
    }
  };

  const incrementUserWarnings = async (uid: string) => {
    const foundUser = allUsers.find(u => u.uid === uid);
    if (!foundUser) return;

    const nextWarnings = (foundUser.violationsCount || 0) + 1;
    const shouldSuspend = nextWarnings >= 3;

    if (uid.startsWith('offline-sandbox-')) {
      setAllUsers(prev => prev.map(u => {
        if (u.uid === uid) {
          return {
            ...u,
            violationsCount: nextWarnings,
            suspended: shouldSuspend ? true : u.suspended
          };
        }
        return u;
      }));
      
      if (shouldSuspend) {
        triggerAdminNotification(
          'suspension_threshold_triggered',
          'Account Suspension Threshold Triggered',
          `User "${foundUser.displayName}" (${foundUser.email}) has reached the account suspension threshold of 3 policy violations and has been automatically suspended by the system.`,
          foundUser.email,
          foundUser.displayName,
          'critical'
        ).catch(err => console.error(err));
      } else {
        triggerAdminNotification(
          'manual_warning',
          'Policy Warning Issued',
          `A safety and policy violation warning has been issued to "${foundUser.displayName}". Total warnings: ${nextWarnings}/3.`,
          foundUser.email,
          foundUser.displayName,
          'warning'
        ).catch(err => console.error(err));
      }
      return;
    }

    try {
      const userRef = doc(db, 'users', uid);
      const updates: any = { violationsCount: nextWarnings };
      if (shouldSuspend) {
        updates.suspended = true;
      }
      await setDoc(userRef, updates, { merge: true });

      if (shouldSuspend) {
        await triggerAdminNotification(
          'suspension_threshold_triggered',
          'Account Suspension Threshold Triggered',
          `User "${foundUser.displayName}" (${foundUser.email}) has reached the account suspension threshold of 3 policy violations and has been automatically suspended by the system.`,
          foundUser.email,
          foundUser.displayName,
          'critical'
        );
      } else {
        await triggerAdminNotification(
          'manual_warning',
          'Policy Warning Issued',
          `A safety and policy violation warning has been issued to "${foundUser.displayName}". Total warnings: ${nextWarnings}/3.`,
          foundUser.email,
          foundUser.displayName,
          'warning'
        );
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const updateUserProfile = async (updates: Partial<UserAccount>) => {
    const activeUid = user?.uid || profile?.uid;
    if (!activeUid && !profile) return;

    const curr = updates.primaryCurriculum || updates.curriculum;

    const mergedUpdates: Partial<UserAccount> = {
      ...updates,
      ...(curr ? {
        primaryCurriculum: curr,
        curriculum: curr,
        whatsappSettings: {
          ...(profile?.whatsappSettings || {}),
          curriculum: curr,
          updatedAt: new Date().toISOString()
        }
      } : {})
    };

    if (curr) {
      localStorage.setItem('edunexus_primary_curriculum', curr);
      localStorage.setItem('edunexus_whatsapp_curriculum_pref', curr);
    }

    setProfile((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ...mergedUpdates,
        whatsappSettings: {
          ...(prev.whatsappSettings || {}),
          ...(mergedUpdates.whatsappSettings || {})
        }
      };
    });

    if (activeUid?.startsWith('offline-sandbox-') || localStorage.getItem('nexus_offline_profile')) {
      if (profile) {
        const updatedLocal = { ...profile, ...mergedUpdates };
        localStorage.setItem('nexus_offline_profile', JSON.stringify(updatedLocal));
      }
    }

    if (activeUid && !activeUid.startsWith('offline-sandbox-')) {
      try {
        const userRef = doc(db, 'users', activeUid);
        await setDoc(userRef, cleanUndefined(mergedUpdates), { merge: true });
      } catch (err) {
        console.error('Error updating user profile in Firestore:', err);
        handleFirestoreError(err, OperationType.UPDATE, `users/${activeUid}`);
      }
    }

    if (curr) {
      try {
        await fetch('/api/whatsapp/preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: activeUid,
            curriculum: curr
          })
        });
      } catch (apiErr) {
        console.warn('Backend curriculum preference sync failed:', apiErr);
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      hasDeveloperClaim,
      isDeveloper,
      loginWithEmail,
      registerWithEmail,
      loginWithGoogle,
      registerWithGoogle,
      loginWithProvider,
      registerWithProvider,
      loginOffline,
      logout,
      allUsers,
      updateUserRole,
      toggleSuspendUser,
      deleteUserAccount,
      systemPolicies,
      updateSystemPolicies,
      isActionAllowed,
      adminAddUser,
      incrementUserWarnings,
      sendPasswordReset,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
