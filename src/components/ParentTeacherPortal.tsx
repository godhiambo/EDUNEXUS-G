import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc,
  doc, 
  where 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, cleanUndefined } from '../firebase';
import { ParentTeacherMessage, UserAccount, SavedDocument } from '../types';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../lib/activityLogger';
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  Clock, 
  User, 
  Users, 
  Check, 
  CheckCircle, 
  FileText, 
  Search, 
  MessageCircle, 
  Inbox, 
  Sparkles, 
  AlertCircle, 
  Mail, 
  BookOpen, 
  Calendar,
  ArrowRight,
  Sparkle,
  Copy,
  CheckSquare,
  Square,
  HelpCircle,
  ExternalLink,
  Activity,
  Mic,
  MicOff,
  Play,
  Pause,
  Volume2,
  Radio,
  FileAudio,
  RotateCcw
} from 'lucide-react';

export default function ParentTeacherPortal() {
  const { user, profile, allUsers } = useAuth();
  const [messages, setMessages] = useState<ParentTeacherMessage[]>([]);
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection and chat state
  const [selectedPartner, setSelectedPartner] = useState<UserAccount | null>(null);
  const [newMessageText, setNewMessageText] = useState('');
  const [selectedDocRef, setSelectedDocRef] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter state
  const [filterByDocId, setFilterByDocId] = useState<string>('All');

  // Offline Parenting Brief & portal tab state
  const [portalTab, setPortalTab] = useState<'messaging' | 'briefs'>('messaging');

  // Voice-to-Text (Speech Recognition) state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Record Voice Audio state
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioDuration, setRecordedAudioDuration] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Active playing audio message in chat thread
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const chatAudioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
    }
  }, []);

  // Voice-to-Text Speech Recognition Handler
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition (Voice-to-Text) is not supported by your browser.');
      return;
    }
    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => setIsListening(true);
      rec.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setNewMessageText((prev) => (prev ? prev + ' ' + transcript : transcript));
        }
      };
      rec.onerror = (event: any) => {
        console.error('Voice-to-text error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert('Microphone access was denied. Please allow microphone permissions in your browser settings.');
        }
      };
      rec.onend = () => setIsListening(false);
      rec.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    setIsListening(false);
  };

  // Record Voice Audio Handlers
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setRecordedAudioUrl(base64data);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
      setRecordingDuration(0);
      setRecordedAudioUrl(null);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start voice recording:', err);
      alert('Could not access microphone for voice recording. Please check your browser permissions.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordedAudioDuration(recordingDuration);
    }
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordedAudioUrl(null);
    setRecordingDuration(0);
    setRecordedAudioDuration(0);
  };

  const formatAudioTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  const [completedDocs, setCompletedDocs] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('parent_completed_docs');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [generatedBriefs, setGeneratedBriefs] = useState<Record<string, { title: string; summary: string; parentPrompt: string; discussionQuestions: string[] }>>(() => {
    try {
      const saved = localStorage.getItem('parent_generated_briefs');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [loadingBriefId, setLoadingBriefId] = useState<string | null>(null);
  const [selectedBriefDoc, setSelectedBriefDoc] = useState<SavedDocument | null>(null);
  const [copiedBriefId, setCopiedBriefId] = useState<string | null>(null);

  const toggleDocCompleted = (docId: string) => {
    setCompletedDocs(prev => {
      const updated = { ...prev, [docId]: !prev[docId] };
      localStorage.setItem('parent_completed_docs', JSON.stringify(updated));
      return updated;
    });
  };

  const handleGenerateParentBrief = async (docObj: SavedDocument) => {
    if (generatedBriefs[docObj.id]) return; // already generated
    setLoadingBriefId(docObj.id);
    try {
      const response = await fetch('/api/generate-parent-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: docObj.topic || docObj.title,
          content: docObj.content || '',
          ageGroup: docObj.classLevel,
          subject: docObj.subject
        })
      });
      if (!response.ok) throw new Error('Failed to generate brief');
      const data = await response.json();
      setGeneratedBriefs(prev => {
        const updated = { ...prev, [docObj.id]: data };
        localStorage.setItem('parent_generated_briefs', JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Error generating parent brief:', error);
      // Clean fallback if Gemini fails
      const fallbackTopic = docObj.topic || docObj.title || 'the lesson plan';
      const fallback = {
        title: fallbackTopic,
        summary: `Your child recently studied ${fallbackTopic} focusing on key concepts, vocabulary, and core definitions in ${docObj.subject || 'their classes'}.`,
        parentPrompt: `Ask your child about how they used the Socratic AI today to understand ${fallbackTopic}.`,
        discussionQuestions: [
          `What was the most surprising or interesting thing you discovered about ${fallbackTopic} today?`,
          `How does what you learned today connect to something we see in our everyday life?`
        ]
      };
      setGeneratedBriefs(prev => {
        const updated = { ...prev, [docObj.id]: fallback };
        localStorage.setItem('parent_generated_briefs', JSON.stringify(updated));
        return updated;
      });
    } finally {
      setLoadingBriefId(null);
    }
  };

  const chatEndRef = useRef<HTMLDivElement>(null);

  const isParent = profile?.role === 'Parent';
  const isTeacher = profile?.role === 'Teacher' || profile?.role === 'Administrator';
  const isStudent = profile?.role === 'Student';

  // 1. Fetch Shared Collaborative Documents
  useEffect(() => {
    if (!profile) return;
    const docsCol = collection(db, 'documents');
    
    const unsubscribe = onSnapshot(docsCol, (snapshot) => {
      const list: SavedDocument[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as SavedDocument;
        // Parents can see shared documents
        list.push({ ...d, id: docSnap.id });
      });
      setDocuments(list);
    }, (err) => {
      console.error("Error loading documents in ParentTeacherPortal:", err);
    });

    return unsubscribe;
  }, [profile]);

  // 1b. Auto-complete first document for initial parent view so they instantly see Socratic briefs
  useEffect(() => {
    if (documents.length > 0) {
      const keys = Object.keys(completedDocs);
      if (keys.length === 0) {
        // Find a document or use the first one
        const targetDoc = documents.find(d => d.title.toLowerCase().includes('water cycle') || d.topic.toLowerCase().includes('water cycle')) || documents[0];
        if (targetDoc) {
          const initCompleted = { [targetDoc.id]: true };
          setCompletedDocs(initCompleted);
          localStorage.setItem('parent_completed_docs', JSON.stringify(initCompleted));
          setSelectedBriefDoc(targetDoc);
          handleGenerateParentBrief(targetDoc);
        }
      } else if (!selectedBriefDoc) {
        // Default select the first completed document
        const completedList = documents.filter(d => completedDocs[d.id]);
        if (completedList.length > 0) {
          setSelectedBriefDoc(completedList[0]);
          handleGenerateParentBrief(completedList[0]);
        } else {
          setSelectedBriefDoc(documents[0]);
        }
      }
    }
  }, [documents, completedDocs, selectedBriefDoc]);

  // 2. Fetch direct messages in real-time
  useEffect(() => {
    if (!profile) return;

    const msgCol = collection(db, 'parent_teacher_messages');
    const q = query(msgCol, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ParentTeacherMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as ParentTeacherMessage;
        // Filter in client to ensure privacy: only show messages involving current user
        if (data.senderUid === profile.uid || data.recipientUid === profile.uid || profile.role === 'Administrator') {
          list.push({ ...data, id: docSnap.id });
        }
      });
      setMessages(list);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to parent-teacher messages:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [profile]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedPartner]);

  // Mark unread messages as read when opening a chat
  useEffect(() => {
    if (!profile || !selectedPartner) return;

    const unreadMsgs = messages.filter(
      (m) => m.senderUid === selectedPartner.uid && m.recipientUid === profile.uid && !m.read
    );

    unreadMsgs.forEach(async (msg) => {
      try {
        const msgRef = doc(db, 'parent_teacher_messages', msg.id);
        await updateDoc(msgRef, { read: true });
      } catch (err) {
        console.error("Error updating message read status:", err);
      }
    });
  }, [messages, selectedPartner, profile]);

  // Send a new message (text or voice note)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!newMessageText.trim() && !recordedAudioUrl) || !profile || !selectedPartner) return;

    const linkedDoc = documents.find(d => d.id === selectedDocRef);

    const messageData: Partial<ParentTeacherMessage> = {
      senderUid: profile.uid,
      senderName: profile.displayName,
      senderRole: profile.role,
      recipientUid: selectedPartner.uid,
      recipientName: selectedPartner.displayName,
      recipientRole: selectedPartner.role,
      docId: selectedDocRef || undefined,
      docTitle: linkedDoc?.title || undefined,
      text: newMessageText.trim() ? newMessageText.trim() : (recordedAudioUrl ? '🎙️ Voice Note' : ''),
      createdAt: new Date().toISOString(),
      read: false
    };

    if (recordedAudioUrl) {
      messageData.audioUrl = recordedAudioUrl;
      messageData.audioDuration = recordedAudioDuration || recordingDuration;
    }

    try {
      const msgCol = collection(db, 'parent_teacher_messages');
      await addDoc(msgCol, cleanUndefined(messageData));

      setNewMessageText('');
      setSelectedDocRef('');
      setRecordedAudioUrl(null);
      setRecordingDuration(0);
      setRecordedAudioDuration(0);

      // Log activity
      logActivity(
        'feedback',
        `Sent ${recordedAudioUrl ? 'voice message' : 'message'} to ${selectedPartner.displayName} (${selectedPartner.role}) regarding: ${linkedDoc?.title || 'General consultation'}`,
        profile,
        selectedDocRef || null,
        linkedDoc?.title || null
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'parent_teacher_messages');
    }
  };

  // Get active participants list
  // If user is Parent: show Teachers & Admins
  // If user is Teacher/Admin: show Parents
  const partners = allUsers.filter((u) => {
    if (u.uid === profile?.uid) return false;
    
    // Search filter
    if (searchQuery) {
      const matchName = u.displayName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchEmail = u.email.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchName && !matchEmail) return false;
    }

    if (isParent) {
      return u.role === 'Teacher' || u.role === 'Administrator';
    }
    if (isTeacher) {
      return u.role === 'Parent';
    }
    return false;
  });

  // Calculate unread count per partner
  const getUnreadCount = (partnerUid: string) => {
    return messages.filter(
      (m) => m.senderUid === partnerUid && m.recipientUid === profile?.uid && !m.read
    ).length;
  };

  // Filter conversations/messages by Document reference
  const filteredMessages = messages.filter((m) => {
    // General check: must belong to the selected conversation thread
    if (!selectedPartner) return false;
    const isThread = 
      (m.senderUid === profile?.uid && m.recipientUid === selectedPartner.uid) ||
      (m.senderUid === selectedPartner.uid && m.recipientUid === profile?.uid);
    
    if (!isThread) return false;

    // Optional document filter
    if (filterByDocId !== 'All') {
      return m.docId === filterByDocId;
    }

    return true;
  });

  if (isStudent) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600 border border-amber-100">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-extrabold text-slate-800">Parent-Teacher Communication Channel</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          The Direct Messaging & Feedback Portal is exclusively reserved for parents and educators to coordinate student development, homework planning, and curriculum feedback.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col" id="parent-teacher-portal">
      {/* Tab switches */}
      <div className="flex border-b border-[#e5e1da] pb-0.5 gap-6">
        <button
          onClick={() => setPortalTab('messaging')}
          className={`pb-3 text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer border-b-2 relative ${
            portalTab === 'messaging'
              ? 'border-[#5f6f52] text-[#5f6f52]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Consultations & Messages</span>
          {messages.filter(m => m.recipientUid === profile?.uid && !m.read).length > 0 && (
            <span className="w-2 h-2 rounded-full bg-purple-600 absolute top-1 right-0 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setPortalTab('briefs')}
          className={`pb-3 text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer border-b-2 relative ${
            portalTab === 'briefs'
              ? 'border-[#5f6f52] text-[#5f6f52]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>Offline Parenting Briefs</span>
          <span className="bg-[#5f6f52]/10 text-[#5f6f52] text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
            {Object.values(completedDocs).filter(Boolean).length} Active
          </span>
        </button>
      </div>

      {portalTab === 'messaging' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[65vh]">
          {/* LEFT COLUMN: CONTACT LISTS */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-[#e5e1da] shadow-sm flex flex-col h-[70vh] lg:h-[75vh] overflow-hidden">
            {/* Search header */}
            <div className="p-4 border-b border-[#f4f1ea] bg-[#faf8f5] space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {isParent ? "Your Child's Educators" : "Connected Parents"}
                  </h3>
                  <p className="text-[10px] text-slate-400">Select a contact to collaborate in real-time</p>
                </div>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#5f6f52] bg-white transition-all"
                />
              </div>
            </div>

            {/* List of active partners */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#f4f1ea] p-2 space-y-1">
              {partners.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2">
                  <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-400 italic">No direct contacts found.</p>
                </div>
              ) : (
                partners.map((partner) => {
                  const unread = getUnreadCount(partner.uid);
                  const isActive = selectedPartner?.uid === partner.uid;
                  
                  // Get last message in thread
                  const threadMsgs = messages.filter(
                    (m) => (m.senderUid === profile?.uid && m.recipientUid === partner.uid) ||
                           (m.senderUid === partner.uid && m.recipientUid === profile?.uid)
                  );
                  const lastMsg = threadMsgs[threadMsgs.length - 1];

                  return (
                    <button
                      key={partner.uid}
                      onClick={() => {
                        setSelectedPartner(partner);
                        setFilterByDocId('All');
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between gap-3 ${
                        isActive 
                          ? 'bg-[#5f6f52]/10 border border-[#5f6f52]/20' 
                          : 'hover:bg-[#fdfbf7] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          partner.role === 'Teacher' 
                            ? 'bg-[#d4a373] text-white' 
                            : partner.role === 'Administrator' 
                            ? 'bg-rose-500 text-white' 
                            : 'bg-purple-500 text-white'
                        }`}>
                          {partner.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-extrabold text-slate-800 truncate leading-snug">{partner.displayName}</p>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                              partner.role === 'Teacher' 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                : partner.role === 'Administrator'
                                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                : 'bg-purple-50 text-purple-600 border border-purple-100'
                            }`}>
                              {partner.role}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {lastMsg ? lastMsg.text : partner.email}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {lastMsg && (
                          <span className="text-[8px] text-slate-400">
                            {new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {unread > 0 && (
                          <span className="bg-purple-600 text-white font-extrabold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                            {unread}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: ACTIVE CONVERSATION THREAD */}
          <div className="lg:col-span-8 flex flex-col h-[70vh] lg:h-[75vh] bg-white rounded-2xl border border-[#e5e1da] shadow-sm overflow-hidden">
            {selectedPartner ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b border-[#f4f1ea] bg-[#faf8f5] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold ${
                      selectedPartner.role === 'Teacher' 
                        ? 'bg-[#d4a373] text-white' 
                        : selectedPartner.role === 'Administrator' 
                        ? 'bg-rose-500 text-white' 
                        : 'bg-purple-500 text-white'
                    }`}>
                      {selectedPartner.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{selectedPartner.displayName}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-mono text-slate-400">{selectedPartner.email}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-[9px] font-bold text-slate-500">{selectedPartner.role}</span>
                      </div>
                    </div>
                  </div>

                  {/* Document Reference Filter */}
                  <div className="flex items-center gap-1.5">
                    <FilterByDocument 
                      documents={documents} 
                      value={filterByDocId} 
                      onChange={setFilterByDocId} 
                    />
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#faf9f6]/40">
                  {filteredMessages.length === 0 ? (
                    <div className="text-center py-16 space-y-3">
                      <MessageCircle className="w-10 h-10 text-slate-300 mx-auto" />
                      <div>
                        <p className="text-xs text-slate-500 font-bold">This conversation is pristine.</p>
                        <p className="text-[10px] text-slate-400 max-w-sm mx-auto mt-1">
                          Type your message below. You can also reference any Shared Curriculum Document to provide specific academic feedback!
                        </p>
                      </div>
                    </div>
                  ) : (
                    filteredMessages.map((msg) => {
                      const isOwn = msg.senderUid === profile?.uid;
                      return (
                        <div 
                          key={msg.id} 
                          className={`flex flex-col max-w-[85%] sm:max-w-[70%] space-y-1 ${
                            isOwn ? 'ml-auto items-end' : 'mr-auto items-start'
                          }`}
                        >
                          {/* Document Attachment Tag if present */}
                          {msg.docId && (
                            <div className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-t-lg font-mono tracking-tight font-extrabold shadow-2xs border ${
                              isOwn 
                                ? 'bg-[#5f6f52]/5 text-[#5f6f52] border-[#5f6f52]/10' 
                                : 'bg-purple-50 text-purple-600 border-purple-100'
                            }`}>
                              <FileText className="w-3 h-3 shrink-0" />
                              <span>Doc Ref: {msg.docTitle || 'Pedagogical Resource'}</span>
                            </div>
                          )}

                          {/* Voice Note Audio Player if present */}
                          {msg.audioUrl && (
                            <div className={`p-3 rounded-2xl border shadow-xs mb-1 min-w-[220px] max-w-full ${
                              isOwn 
                                ? 'bg-[#4d5a42] text-white border-[#5f6f52]' 
                                : 'bg-white text-slate-800 border-slate-200'
                            }`}>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const audio = chatAudioRefs.current[msg.id];
                                    if (!audio) return;
                                    if (playingMessageId === msg.id) {
                                      audio.pause();
                                      setPlayingMessageId(null);
                                    } else {
                                      if (playingMessageId && chatAudioRefs.current[playingMessageId]) {
                                        chatAudioRefs.current[playingMessageId]?.pause();
                                      }
                                      audio.play();
                                      setPlayingMessageId(msg.id);
                                    }
                                  }}
                                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-xs transition-transform transform active:scale-95 cursor-pointer ${
                                    isOwn 
                                      ? 'bg-white text-[#5f6f52] hover:bg-slate-100' 
                                      : 'bg-[#5f6f52] text-white hover:bg-[#4d5a42]'
                                  }`}
                                  title={playingMessageId === msg.id ? "Pause Voice Note" : "Play Voice Note"}
                                >
                                  {playingMessageId === msg.id ? (
                                    <Pause className="w-4 h-4 fill-current" />
                                  ) : (
                                    <Play className="w-4 h-4 fill-current ml-0.5" />
                                  )}
                                </button>

                                <div className="flex-1 space-y-1 min-w-0">
                                  <div className="flex items-center justify-between text-[10px] font-bold">
                                    <span className="flex items-center gap-1">
                                      <Radio className={`w-3 h-3 ${playingMessageId === msg.id ? 'animate-pulse text-rose-400' : ''}`} />
                                      Voice Note
                                    </span>
                                    <span className="font-mono text-[9px] opacity-80">
                                      {msg.audioDuration ? formatAudioTime(msg.audioDuration) : '0:15'}
                                    </span>
                                  </div>

                                  {/* Waveform graphic */}
                                  <div className="flex items-center gap-0.5 h-3">
                                    {[35, 75, 40, 95, 60, 100, 50, 85, 45, 80, 30, 70, 90, 45, 85, 60].map((h, idx) => (
                                      <div
                                        key={idx}
                                        className={`flex-1 rounded-full transition-all duration-300 ${
                                          isOwn ? 'bg-white/80' : 'bg-[#5f6f52]/80'
                                        } ${playingMessageId === msg.id ? 'animate-pulse' : 'opacity-40'}`}
                                        style={{
                                          height: playingMessageId === msg.id ? `${Math.max(25, (h * (idx % 3 + 1)) % 100)}%` : `${h * 0.35}%`
                                        }}
                                      />
                                    ))}
                                  </div>
                                </div>

                                <audio
                                  ref={(el) => { chatAudioRefs.current[msg.id] = el; }}
                                  src={msg.audioUrl}
                                  onEnded={() => setPlayingMessageId(null)}
                                  className="hidden"
                                />
                              </div>
                            </div>
                          )}

                          {/* Chat text box */}
                          {msg.text && (
                            <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                              isOwn 
                                ? 'bg-[#5f6f52] text-white rounded-tr-xs shadow-xs' 
                                : 'bg-[#f4f1ea] text-slate-800 rounded-tl-xs shadow-xs border border-[#e5e1da]'
                            }`}>
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                          )}

                          {/* Message meta */}
                          <div className="flex items-center gap-1.5 px-1.5">
                            <span className="text-[8px] text-slate-400">
                              {new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOwn && (
                              <span className="text-slate-400" title={msg.read ? "Read" : "Sent"}>
                                {msg.read ? (
                                  <CheckCircle className="w-3 h-3 text-[#5f6f52]" />
                                ) : (
                                  <Check className="w-3 h-3 text-slate-300" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Footer Form */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-[#f4f1ea] bg-white space-y-3">
                  {/* Reference Document Dropdown (Parents can tag a curriculum sheet they are viewing or want to comment on) */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
                        <FileText className="w-3 h-3" />
                        Reference Document:
                      </span>
                      <select
                        value={selectedDocRef}
                        onChange={(e) => setSelectedDocRef(e.target.value)}
                        className="text-[10px] p-1.5 rounded-lg border border-slate-200 bg-[#fdfbf7] focus:outline-none focus:ring-1 focus:ring-[#5f6f52] max-w-full sm:max-w-xs"
                      >
                        <option value="">-- No reference (General Consultation) --</option>
                        {documents.map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            [{doc.docType.replace('-', ' ').toUpperCase()}] {doc.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Pill for Listening */}
                    {isListening && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                        Listening... Speak clearly into microphone
                      </span>
                    )}
                  </div>

                  {/* ACTIVE VOICE RECORDING PANEL */}
                  {isRecordingAudio && (
                    <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center animate-pulse ring-4 ring-rose-200 shrink-0">
                          <Mic className="w-4 h-4 animate-bounce" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-rose-700">Recording Voice Note...</span>
                            <span className="text-xs font-mono font-bold text-rose-600 bg-white px-2 py-0.5 rounded-md border border-rose-200 shadow-2xs">
                              {formatAudioTime(recordingDuration)}
                            </span>
                          </div>
                          <p className="text-[10px] text-rose-500">Speak your question or advice clearly</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={stopVoiceRecording}
                          className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          Done
                        </button>
                        <button
                          type="button"
                          onClick={cancelVoiceRecording}
                          className="bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* RECORDED VOICE NOTE PREVIEW BAR */}
                  {recordedAudioUrl && !isRecordingAudio && (
                    <div className="p-3 bg-[#5f6f52]/10 border border-[#5f6f52]/30 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (previewAudioRef.current) {
                              if (isPlayingPreview) {
                                previewAudioRef.current.pause();
                                setIsPlayingPreview(false);
                              } else {
                                previewAudioRef.current.play();
                                setIsPlayingPreview(true);
                              }
                            }
                          }}
                          className="w-9 h-9 rounded-full bg-[#5f6f52] text-white flex items-center justify-center hover:bg-[#4d5a42] transition cursor-pointer shrink-0 shadow-xs"
                        >
                          {isPlayingPreview ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-[#5f6f52] flex items-center gap-1">
                              <FileAudio className="w-4 h-4 text-[#5f6f52]" />
                              Voice Recording Ready
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-white text-[#5f6f52] px-2 py-0.5 rounded-md border border-[#5f6f52]/20">
                              {formatAudioTime(recordedAudioDuration)}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500">Click play to listen back or send directly below</p>
                        </div>
                        <audio
                          ref={previewAudioRef}
                          src={recordedAudioUrl}
                          onEnded={() => setIsPlayingPreview(false)}
                          className="hidden"
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSendMessage()}
                          className="bg-[#5f6f52] hover:bg-[#4d5a42] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send Voice Note
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRecordedAudioUrl(null);
                            setRecordedAudioDuration(0);
                            setRecordingDuration(0);
                          }}
                          className="bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 p-1.5 rounded-lg transition cursor-pointer"
                          title="Discard Recording"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Message Input text area, Voice buttons & Submit button */}
                  <div className="flex items-end gap-2">
                    {/* Voice-to-Text Button */}
                    <button
                      type="button"
                      id="parent-voice-to-text-btn"
                      onClick={isListening ? stopListening : startListening}
                      className={`px-3 py-2.5 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs shrink-0 relative ${
                        isListening
                          ? 'bg-rose-600 border-rose-500 text-white hover:bg-rose-700 ring-2 ring-rose-200 animate-pulse'
                          : !speechSupported
                          ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-60'
                          : 'bg-[#5f6f52]/10 border-[#5f6f52]/30 text-[#5f6f52] hover:bg-[#5f6f52]/20'
                      }`}
                      title={
                        !speechSupported
                          ? 'Voice-to-text is not supported in this browser'
                          : isListening
                          ? 'Recording text... Click to stop listening'
                          : 'Click to speak your message (Voice-to-Text)'
                      }
                    >
                      {isListening ? (
                        <MicOff className="w-4 h-4 text-white animate-bounce" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                      <span className="text-[11px] font-bold hidden sm:inline">
                        {isListening ? 'Listening...' : 'Voice-to-Text'}
                      </span>
                    </button>

                    {/* Record Voice Note Button */}
                    <button
                      type="button"
                      id="parent-record-voice-btn"
                      onClick={isRecordingAudio ? stopVoiceRecording : startVoiceRecording}
                      disabled={isRecordingAudio}
                      className={`px-3 py-2.5 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs shrink-0 ${
                        isRecordingAudio
                          ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                          : recordedAudioUrl
                          ? 'bg-amber-500 border-amber-400 text-white'
                          : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                      }`}
                      title="Record and send a voice audio clip to teacher"
                    >
                      <Radio className="w-4 h-4" />
                      <span className="text-[11px] font-bold hidden sm:inline">
                        {isRecordingAudio ? 'Recording...' : recordedAudioUrl ? 'Audio Ready' : 'Record Voice'}
                      </span>
                    </button>

                    <textarea
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder={`Write your direct feedback or question to ${selectedPartner.displayName}...`}
                      rows={2}
                      className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#5f6f52] resize-none bg-[#fdfbf7] leading-relaxed"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />

                    <button
                      type="submit"
                      disabled={!newMessageText.trim() && !recordedAudioUrl}
                      className="bg-[#5f6f52] hover:bg-[#4d5a42] text-white p-3 rounded-xl transition shadow-md disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer shrink-0"
                      title="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-purple-50 border border-purple-100 rounded-full flex items-center justify-center text-purple-500 animate-pulse">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <div className="max-w-md">
                  <h4 className="text-sm font-bold text-slate-800">No Chat Thread Selected</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    {isParent 
                      ? "Select one of your children's educators from the list on the left to discuss materials, ask clarifying questions, or send private homework study feedback."
                      : "Select a parent from the roster to answer questions, discuss classroom resources, or review feedback they provided on your curriculum documents."
                    }
                  </p>
                </div>
                
                {/* Quick stats / tips box */}
                <div className="bg-[#faf8f5] border border-[#e5e1da] rounded-2xl p-4 max-w-sm text-left space-y-2 mt-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#5f6f52] uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>How to use the feedback portal</span>
                  </div>
                  <ul className="space-y-1.5 text-[10px] text-slate-500">
                    <li className="flex gap-1.5">
                      <ArrowRight className="w-3 h-3 shrink-0 text-[#5f6f52] mt-0.5" />
                      <span>Real-time messages synchronize instantly without page reloads.</span>
                    </li>
                    <li className="flex gap-1.5">
                      <ArrowRight className="w-3 h-3 shrink-0 text-[#5f6f52] mt-0.5" />
                      <span>Attach any of the Shared Collaborative Documents to target specific lesson plans.</span>
                    </li>
                    <li className="flex gap-1.5">
                      <ArrowRight className="w-3 h-3 shrink-0 text-[#5f6f52] mt-0.5" />
                      <span>Teachers can reply instantly to clarify instructions and assignments.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* OFFLINE PARENTING BRIEFS TAB SCREEN */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[65vh] animate-fadeIn">
          {/* LEFT COLUMN: ACTIVE SYLLABUS READING CHECKLIST */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-[#e5e1da] shadow-sm flex flex-col h-[70vh] lg:h-[75vh] overflow-hidden">
            {/* Header info panel */}
            <div className="p-4 border-b border-[#f4f1ea] bg-[#faf8f5] space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Reading & AI Progress
                  </h3>
                  <p className="text-[10px] text-slate-400">Track and unlock offline parenting briefs</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                Instead of simple completion tracking, checking off documents automatically builds custom Socratic conversation starters to ask your child offline.
              </p>
            </div>

            {/* List of active materials */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {documents.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-400 italic">No syllabus documents loaded yet.</p>
                </div>
              ) : (
                documents.map((docItem) => {
                  const isCompleted = !!completedDocs[docItem.id];
                  const isSelected = selectedBriefDoc?.id === docItem.id;

                  return (
                    <div
                      key={docItem.id}
                      onClick={() => {
                        setSelectedBriefDoc(docItem);
                        handleGenerateParentBrief(docItem);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 relative ${
                        isSelected 
                          ? 'bg-[#5f6f52]/5 border-[#5f6f52]/20 shadow-xs' 
                          : 'bg-white border-slate-150 hover:bg-[#fdfbf7]'
                      }`}
                    >
                      {/* Checkbox button container */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDocCompleted(docItem.id);
                        }}
                        className="mt-0.5 shrink-0 text-[#5f6f52] hover:scale-115 transition"
                        aria-label={`Toggle completion of ${docItem.title}`}
                      >
                        {isCompleted ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[8px] font-bold bg-[#f4f1ea] text-slate-600 px-1.5 py-0.5 rounded-full uppercase">
                            {docItem.subject}
                          </span>
                          <span className="text-[8px] text-slate-400">
                            {docItem.classLevel}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 leading-tight mt-1 truncate">
                          {docItem.title}
                        </h4>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${
                            isCompleted ? 'text-emerald-600' : 'text-amber-500'
                          }`}>
                            {isCompleted ? '✓ Completed & Logged' : '○ Studying Now'}
                          </span>
                          {generatedBriefs[docItem.id] && (
                            <span className="text-[8px] bg-amber-50 text-amber-600 font-bold px-1 py-0.5 rounded border border-amber-100 flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" /> Brief Ready
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: DETAILED OFFLINE BRIEF SCREEN */}
          <div className="lg:col-span-8 flex flex-col h-[70vh] lg:h-[75vh] bg-white rounded-2xl border border-[#e5e1da] shadow-sm overflow-hidden">
            {selectedBriefDoc ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header panel */}
                <div className="p-4 border-b border-[#f4f1ea] bg-[#faf8f5] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#5f6f52] bg-[#5f6f52]/10 px-2 py-0.5 rounded-full uppercase">
                        {selectedBriefDoc.subject}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {selectedBriefDoc.classLevel}
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-800 truncate mt-1">
                      {selectedBriefDoc.title}
                    </h3>
                  </div>

                  {completedDocs[selectedBriefDoc.id] && (
                    <button
                      onClick={() => handleGenerateParentBrief(selectedBriefDoc)}
                      disabled={loadingBriefId === selectedBriefDoc.id}
                      className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                    >
                      <Activity className={`w-3.5 h-3.5 ${loadingBriefId === selectedBriefDoc.id ? 'animate-spin' : ''}`} />
                      <span>{loadingBriefId === selectedBriefDoc.id ? 'Regenerating...' : 'Refresh AI Brief'}</span>
                    </button>
                  )}
                </div>

                {/* Brief content wrapper */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {!completedDocs[selectedBriefDoc.id] ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-md mx-auto">
                      <div className="w-14 h-14 bg-amber-50 border border-amber-100 text-amber-500 rounded-full flex items-center justify-center animate-bounce">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-800">Brief Locked: Lesson is Active</h4>
                        <p className="text-xs text-slate-500 leading-relaxed mt-1.5">
                          Your student is currently studying or reviewing <strong>"{selectedBriefDoc.title}"</strong>.
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed mt-2">
                          Once they complete their reading, interact with the Socratic AI, or you discuss their homework, tap the checkbox on the left to instantly unlock the parenting brief and open-ended Socratic conversation guides!
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleDocCompleted(selectedBriefDoc.id)}
                        className="bg-[#5f6f52] hover:bg-[#4d5a42] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-md cursor-pointer flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>Mark Lesson as Completed</span>
                      </button>
                    </div>
                  ) : loadingBriefId === selectedBriefDoc.id ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                      <div className="relative flex items-center justify-center w-12 h-12">
                        <div className="absolute inset-0 border-4 border-[#5f6f52]/20 rounded-full" />
                        <div className="absolute inset-0 border-4 border-[#5f6f52] border-t-transparent rounded-full animate-spin" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-800">Synthesizing Socratic Brief</h4>
                        <p className="text-xs text-slate-400 max-w-xs leading-relaxed mt-1">
                          Our Socratic AI is scanning document concepts, vocabulary depths, and tutoring pathways to formulate personalized family discussion starters...
                        </p>
                      </div>
                    </div>
                  ) : generatedBriefs[selectedBriefDoc.id] ? (
                    <div className="space-y-6">
                      {/* Concept Summary Card */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                          📋 What Your Child Studied
                        </h4>
                        <div className="p-4 bg-[#faf8f5] border border-[#e5e1da] rounded-2xl">
                          <p className="text-xs font-medium text-slate-700 leading-relaxed">
                            {generatedBriefs[selectedBriefDoc.id].summary}
                          </p>
                        </div>
                      </div>

                      {/* Custom Parent Socratic Prompt Callout */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                          💡 Socratic Engagement Prompt
                        </h4>
                        <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200 rounded-2xl flex items-start gap-4 shadow-sm relative group">
                          <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                            <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-amber-700 font-extrabold uppercase tracking-wider">
                              Your dinner-table key question
                            </p>
                            <p className="text-xs font-bold text-slate-800 leading-relaxed mt-1 italic">
                              "{generatedBriefs[selectedBriefDoc.id].parentPrompt}"
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(generatedBriefs[selectedBriefDoc.id].parentPrompt);
                              setCopiedBriefId('prompt-' + selectedBriefDoc.id);
                              setTimeout(() => setCopiedBriefId(null), 2000);
                            }}
                            className="text-slate-400 hover:text-[#5f6f52] p-1.5 hover:bg-white rounded-lg transition shrink-0 self-center cursor-pointer"
                            title="Copy prompt to clipboard"
                          >
                            {copiedBriefId === 'prompt-' + selectedBriefDoc.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Open-Ended Discussion Questions */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                          🗣️ Deep Offline Discussion Questions
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {generatedBriefs[selectedBriefDoc.id].discussionQuestions.map((q, qIdx) => (
                            <div 
                              key={qIdx}
                              className="p-4 bg-white border border-slate-150 rounded-2xl shadow-2xs hover:shadow-xs transition relative group flex flex-col justify-between"
                            >
                              <p className="text-xs font-semibold text-slate-700 leading-relaxed italic pr-4">
                                "{q}"
                              </p>
                              
                              <div className="flex items-center justify-between mt-3 border-t border-slate-100 pt-3">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                  Discussion Starter {qIdx + 1}
                                </span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(q);
                                    setCopiedBriefId(`q-${qIdx}-${selectedBriefDoc.id}`);
                                    setTimeout(() => setCopiedBriefId(null), 2000);
                                  }}
                                  className="text-slate-400 hover:text-[#5f6f52] p-1 rounded-md hover:bg-slate-50 transition cursor-pointer"
                                  title="Copy question text"
                                >
                                  {copiedBriefId === `q-${qIdx}-${selectedBriefDoc.id}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bridge to Direct Messaging */}
                      <div className="p-4 bg-purple-50/40 border border-purple-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 text-purple-700 rounded-xl shrink-0">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">Coordinate Homework Planning</p>
                            <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">
                              Have questions regarding your child's progress or Socratic logs? Consult directly with the educator.
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setPortalTab('messaging');
                            // Select first teacher if available
                            const firstTeacher = partners.find(u => u.role === 'Teacher' || u.role === 'Administrator');
                            if (firstTeacher) {
                              setSelectedPartner(firstTeacher);
                            }
                            setSelectedDocRef(selectedBriefDoc.id);
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl shrink-0 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <span>Consult Educator</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Initial generation button state if not triggered yet
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-sm mx-auto">
                      <div className="w-12 h-12 bg-purple-50 border border-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                        <HelpCircle className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800">Generate Your Discussion Brief</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                          Unlock the personalized summaries and offline open-ended prompts based on Socratic AI.
                        </p>
                      </div>
                      <button
                        onClick={() => handleGenerateParentBrief(selectedBriefDoc)}
                        className="bg-[#5f6f52] hover:bg-[#4d5a42] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Socratic Brief</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-500 animate-pulse">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div className="max-w-md">
                  <h4 className="text-sm font-bold text-slate-800">No Learning Material Selected</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    Select any syllabus reading material from the list on the left to view the interactive offline briefing cards, completion logs, and customized Socratic family prompts.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component: Document selector filter
function FilterByDocument({ 
  documents, 
  value, 
  onChange 
}: { 
  documents: SavedDocument[]; 
  value: string; 
  onChange: (v: string) => void; 
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-slate-400 font-bold shrink-0">Filter:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-[10px] p-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none max-w-[150px] sm:max-w-[200px]"
      >
        <option value="All">All Messages</option>
        {documents.map((doc) => (
          <option key={doc.id} value={doc.id}>
            {doc.title}
          </option>
        ))}
      </select>
    </div>
  );
}
