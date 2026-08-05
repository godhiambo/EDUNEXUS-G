import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  MessageSquare, 
  Send, 
  Sparkles, 
  Plus, 
  Bot, 
  User, 
  CheckCircle, 
  FileText, 
  HelpCircle, 
  Share2, 
  Copy, 
  BookOpen, 
  Brain, 
  Video, 
  Image as ImageIcon, 
  Clock, 
  Smartphone, 
  Zap, 
  ExternalLink,
  Search,
  Filter,
  Check,
  CheckSquare,
  ListTodo
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../lib/activityLogger';

export interface RoomParticipant {
  id: string;
  name: string;
  role: 'Student' | 'Teacher' | 'Parent' | 'Administrator' | 'AI Assistant';
  avatarBg: string;
  isAi?: boolean;
}

export interface RoomMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'Student' | 'Teacher' | 'Parent' | 'Administrator' | 'AI Assistant';
  text: string;
  timestamp: string;
  isAi?: boolean;
  actionPayload?: {
    type?: 'lesson-plan' | 'quiz' | 'study-plan' | 'meeting-minutes' | 'diagram' | 'video';
    title?: string;
    content?: string;
  };
}

export interface CollaborationRoom {
  id: string;
  title: string;
  category: 'student-study' | 'teacher-dept' | 'parent-teacher' | 'school-admin' | 'whatsapp-bridge';
  subject: string;
  topic: string;
  description: string;
  participants: RoomParticipant[];
  whatsappSynced?: boolean;
  whatsappGroupLink?: string;
  lastActive: string;
  messages: RoomMessage[];
}

interface AICollaborationRoomsProps {
  onNavigateToCreateDoc?: (initialTopic?: string, initialType?: string, initialContent?: string) => void;
  onOpenImageStudio?: (prompt?: string) => void;
  onOpenVideoStudio?: (prompt?: string) => void;
}

const DEFAULT_ROOMS: CollaborationRoom[] = [
  {
    id: 'room-physics-study',
    title: 'Physics Motion Study Guild',
    category: 'student-study',
    subject: 'Physics',
    topic: 'Projectile Motion & Equations',
    description: 'Student-led revision room for projectile motion problems and exam preparation.',
    whatsappSynced: true,
    whatsappGroupLink: 'https://chat.whatsapp.com/demo-physics-guild',
    lastActive: 'Just now',
    participants: [
      { id: 'p1', name: 'Brian', role: 'Student', avatarBg: 'bg-cyan-600' },
      { id: 'p2', name: 'Amina', role: 'Student', avatarBg: 'bg-emerald-600' },
      { id: 'p3', name: 'EduNexus AI', role: 'AI Assistant', avatarBg: 'bg-gradient-to-r from-teal-500 to-cyan-500', isAi: true }
    ],
    messages: [
      {
        id: 'm1',
        senderId: 'p1',
        senderName: 'Brian',
        senderRole: 'Student',
        text: 'How do we solve this projectile motion question regarding horizontal launch velocity?',
        timestamp: '10:14 AM'
      },
      {
        id: 'm2',
        senderId: 'p2',
        senderName: 'Amina',
        senderRole: 'Student',
        text: 'I think we use the equations of motion v = u + at, but horizontal velocity stays constant.',
        timestamp: '10:15 AM'
      },
      {
        id: 'm3',
        senderId: 'p3',
        senderName: 'EduNexus AI',
        senderRole: 'AI Assistant',
        isAi: true,
        text: `Great start, Amina and Brian! 🚀

Let me guide you through it step-by-step without spoiling the final answer immediately:

1️⃣ **Horizontal Component (x-axis)**: Since air resistance is negligible, acceleration $a_x = 0$. So $v_x = u_x$ (constant speed).
2️⃣ **Vertical Component (y-axis)**: Gravity acts vertically with $a_y = -9.81\\,m/s^2$.
3️⃣ **Time of flight ($t$)**: Depends purely on the initial height $h = \\frac{1}{2}g t^2$.

Which equation connects the horizontal range $R$ with time of flight $t$? Would you like me to generate a 3-question revision quiz or an illustrated diagram of projectile trajectories?`,
        timestamp: '10:16 AM',
        actionPayload: {
          type: 'quiz',
          title: 'Projectile Motion Checkup Quiz',
          content: '1. What happens to the horizontal velocity of a projectile in motion?\n2. Which force acts on the projectile vertically?\n3. Calculate time of flight if height h = 45m.'
        }
      }
    ]
  },
  {
    id: 'room-science-teachers',
    title: 'Grade 10 Science Teachers Guild',
    category: 'teacher-dept',
    subject: 'Biology / Integrated Science',
    topic: 'CBC Photosynthesis Practical Lesson Plan',
    description: 'Faculty collaborative room designing practical investigations and competency-based lesson structures.',
    whatsappSynced: true,
    whatsappGroupLink: 'https://chat.whatsapp.com/demo-science-teachers',
    lastActive: '2 mins ago',
    participants: [
      { id: 't1', name: 'Teacher A (Mr. Wanjala)', role: 'Teacher', avatarBg: 'bg-amber-600' },
      { id: 't2', name: 'Teacher B (Ms. Otieno)', role: 'Teacher', avatarBg: 'bg-[#5f6f52]' },
      { id: 't3', name: 'EduNexus AI', role: 'AI Assistant', avatarBg: 'bg-gradient-to-r from-teal-500 to-cyan-500', isAi: true }
    ],
    messages: [
      {
        id: 'tm1',
        senderId: 't1',
        senderName: 'Teacher A',
        senderRole: 'Teacher',
        text: 'We need a CBC-compliant lesson plan for Grade 10 Photosynthesis.',
        timestamp: '09:30 AM'
      },
      {
        id: 'tm2',
        senderId: 't2',
        senderName: 'Teacher B',
        senderRole: 'Teacher',
        text: "Let's include a practical investigation test for starch in Elodea leaves using iodine solution.",
        timestamp: '09:32 AM'
      },
      {
        id: 'tm3',
        senderId: 't3',
        senderName: 'EduNexus AI',
        senderRole: 'AI Assistant',
        isAi: true,
        text: `Excellent pedagogical strategy! 🌿 Here is a suggested CBC 5E Lesson Structure for Grade 10 Photosynthesis:

📌 **Learning Outcomes**:
• Identify reactants & products of photosynthesis.
• Conduct an starch test safely in groups.

🧪 **Practical Investigation**:
• Place aquatic Elodea under a funnel in sunlight.
• Collect oxygen bubbles & test leaves with iodine.

💬 **Discussion & Assessment**:
• Why does starch stain blue-black?
• What is the role of chlorophyll as a catalyst?

Click below to generate the complete ready-to-print lesson plan document or PowerPoint outline!`,
        timestamp: '09:34 AM',
        actionPayload: {
          type: 'lesson-plan',
          title: 'CBC Grade 10 Photosynthesis Lesson Plan',
          content: 'Title: Photosynthesis & Starch Test Practical\nGrade: Grade 10\nCurriculum: CBC Kenya\nLearning Activities: Group investigation, iodine starch test, reporting.'
        }
      }
    ]
  },
  {
    id: 'room-parent-teacher-math',
    title: "Brian's Mathematics Progress Consultation",
    category: 'parent-teacher',
    subject: 'Mathematics',
    topic: 'Algebraic Expressions & Equations Recovery',
    description: 'Direct consultation between parent Mrs. Wanjiku and math teacher Mr. Omondi.',
    whatsappSynced: true,
    whatsappGroupLink: 'https://chat.whatsapp.com/demo-parent-math',
    lastActive: '5 mins ago',
    participants: [
      { id: 'pt1', name: 'Mrs. Wanjiku (Parent)', role: 'Parent', avatarBg: 'bg-purple-600' },
      { id: 'pt2', name: 'Mr. Omondi (Math Teacher)', role: 'Teacher', avatarBg: 'bg-[#5f6f52]' },
      { id: 'pt3', name: 'EduNexus AI', role: 'AI Assistant', avatarBg: 'bg-gradient-to-r from-teal-500 to-cyan-500', isAi: true }
    ],
    messages: [
      {
        id: 'ptm1',
        senderId: 'pt1',
        senderName: 'Mrs. Wanjiku',
        senderRole: 'Parent',
        text: 'My child is struggling with linear equations in Mathematics.',
        timestamp: '08:10 AM'
      },
      {
        id: 'ptm2',
        senderId: 'pt2',
        senderName: 'Mr. Omondi',
        senderRole: 'Teacher',
        text: 'The main challenge is simplifying expressions with variables on both sides.',
        timestamp: '08:12 AM'
      },
      {
        id: 'ptm3',
        senderId: 'pt3',
        senderName: 'EduNexus AI',
        senderRole: 'AI Assistant',
        isAi: true,
        text: `📊 **Targeted Improvement Plan for Brian**:

Based on recent diagnostic trends in algebra, I recommend:
• **20 Minutes Daily**: Interactive algebra drills on variable balancing.
• **Weekly Progress Quizzes**: Short 5-minute confidence builders.
• **Interactive Graphing Exercises**: Visualizing $y = mx + c$.
• **Two Short Revision Videos**: Step-by-step visual demonstrations.

I can prepare a personalized 7-day study schedule and offline parenting brief right now!`,
        timestamp: '08:15 AM',
        actionPayload: {
          type: 'study-plan',
          title: '7-Day Algebra Mastery Plan',
          content: 'Day 1: Combining Like Terms\nDay 2: Two-step Linear Equations\nDay 3: Variables on both sides\nDay 4: Real-world word problems'
        }
      }
    ]
  },
  {
    id: 'room-admin-meeting',
    title: 'Weekly School Faculty & Admin Meeting',
    category: 'school-admin',
    subject: 'School Administration',
    topic: 'Midterm Exam Analysis & CBC Implementation',
    description: 'Executive room for principal, deputy principal, and department heads.',
    whatsappSynced: true,
    whatsappGroupLink: 'https://chat.whatsapp.com/demo-admin-meeting',
    lastActive: '15 mins ago',
    participants: [
      { id: 'ad1', name: 'Principal Dr. Mutua', role: 'Administrator', avatarBg: 'bg-rose-600' },
      { id: 'ad2', name: 'Deputy Principal Mrs. Njuguna', role: 'Administrator', avatarBg: 'bg-amber-600' },
      { id: 'ad3', name: 'EduNexus AI', role: 'AI Assistant', avatarBg: 'bg-gradient-to-r from-teal-500 to-cyan-500', isAi: true }
    ],
    messages: [
      {
        id: 'adm1',
        senderId: 'ad1',
        senderName: 'Principal Dr. Mutua',
        senderRole: 'Administrator',
        text: "Let's review our midterm exam performance trends across Grade 9 and Grade 10 science classes.",
        timestamp: '07:45 AM'
      },
      {
        id: 'adm2',
        senderId: 'ad2',
        senderName: 'Deputy Principal Mrs. Njuguna',
        senderRole: 'Administrator',
        text: 'Science practical scores improved by 14%, but mathematics problem-solving requires additional teacher coaching.',
        timestamp: '07:48 AM'
      },
      {
        id: 'adm3',
        senderId: 'ad3',
        senderName: 'EduNexus AI',
        senderRole: 'AI Assistant',
        isAi: true,
        text: `📋 **Meeting Minutes & Executive Action Plan**:

📌 **Key Highlights**:
• Science practical performance increased by **+14%** following CBC hands-on kits rollout.
• Mathematics requires targeted Socratic problem-solving drills.

✅ **Action Items Assigned**:
1. **Math Dept Head**: Implement 15-minute daily mental math warmups by Friday.
2. **Science HOD**: Share top-scoring practical rubric with colleague exchange.
3. **Admin Office**: Schedule parent-teacher consultation sessions.

Would you like me to broadcast this summary directly to the WhatsApp Staff Channel or export as a PDF report?`,
        timestamp: '07:50 AM',
        actionPayload: {
          type: 'meeting-minutes',
          title: 'Faculty Executive Meeting Minutes',
          content: 'Date: Aug 5, 2026\nAttendance: Principal, Deputy, HODs, EduNexus AI\nAction Items: Math warmups, Science rubric share, Parent consultations.'
        }
      }
    ]
  }
];

export default function AICollaborationRooms({
  onNavigateToCreateDoc,
  onOpenImageStudio,
  onOpenVideoStudio
}: AICollaborationRoomsProps) {
  const { profile } = useAuth();
  
  // Storage & State
  const [rooms, setRooms] = useState<CollaborationRoom[]>(() => {
    try {
      const saved = localStorage.getItem('edunexus_collab_rooms');
      return saved ? JSON.parse(saved) : DEFAULT_ROOMS;
    } catch {
      return DEFAULT_ROOMS;
    }
  });

  const [activeRoomId, setActiveRoomId] = useState<string>(DEFAULT_ROOMS[0].id);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // New Room Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newRoomTitle, setNewRoomTitle] = useState<string>('');
  const [newRoomCategory, setNewRoomCategory] = useState<'student-study' | 'teacher-dept' | 'parent-teacher' | 'school-admin' | 'whatsapp-bridge'>('student-study');
  const [newRoomSubject, setNewRoomSubject] = useState<string>('General Science');
  const [newRoomTopic, setNewRoomTopic] = useState<string>('');
  const [newRoomDescription, setNewRoomDescription] = useState<string>('');
  const [enableWhatsAppSync, setEnableWhatsAppSync] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('edunexus_collab_rooms', JSON.stringify(rooms));
  }, [rooms]);

  const activeRoom = rooms.find(r => r.id === activeRoomId) || rooms[0];

  // Auto-scroll chat stream
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeRoom?.messages, isAiThinking]);

  // Handle message submit
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isAiThinking) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    const userMsg: RoomMessage = {
      id: `msg-${Date.now()}`,
      senderId: profile?.uid || 'user-1',
      senderName: profile?.displayName || 'User',
      senderRole: (profile?.role as any) || 'Teacher',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Append user message
    const updatedMessages = [...activeRoom.messages, userMsg];
    updateRoomMessages(activeRoom.id, updatedMessages);

    // Trigger EduNexus AI response if @EduNexus mentioned or automatically
    const isExplicitMention = userText.toLowerCase().includes('@edunexus') || userText.toLowerCase().includes('@ai');
    const shouldRespond = isExplicitMention || true; // Always respond as co-participant in room

    if (shouldRespond) {
      setIsAiThinking(true);
      try {
        const response = await fetch('/api/collaboration/ai-respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomType: activeRoom.category,
            roomTitle: activeRoom.title,
            subject: activeRoom.subject,
            topic: activeRoom.topic,
            history: updatedMessages.map(m => ({
              senderName: m.senderName,
              senderRole: m.senderRole,
              text: m.text,
              timestamp: m.timestamp
            })),
            prompt: userText,
            userRole: profile?.role || 'Teacher'
          })
        });

        if (!response.ok) throw new Error('Failed to get AI collaboration response');
        const data = await response.json();

        const aiMsg: RoomMessage = {
          id: `msg-ai-${Date.now()}`,
          senderId: 'edunexus-ai',
          senderName: 'EduNexus AI',
          senderRole: 'AI Assistant',
          isAi: true,
          text: data.aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        updateRoomMessages(activeRoom.id, [...updatedMessages, aiMsg]);
        logActivity('feedback', `Consulted EduNexus AI in room: "${activeRoom.title}"`, profile, activeRoom.id, activeRoom.title);
      } catch (err) {
        console.error('AI Collaboration respond error:', err);
        // Fallback message if server error
        const aiMsg: RoomMessage = {
          id: `msg-ai-${Date.now()}`,
          senderId: 'edunexus-ai',
          senderName: 'EduNexus AI',
          senderRole: 'AI Assistant',
          isAi: true,
          text: `I heard you! Regarding "${activeRoom.topic}", let's work through this together. What specific aspect would you like to explore or generate next?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        updateRoomMessages(activeRoom.id, [...updatedMessages, aiMsg]);
      } finally {
        setIsAiThinking(false);
      }
    }
  };

  const updateRoomMessages = (roomId: string, newMessages: RoomMessage[]) => {
    setRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        return {
          ...r,
          lastActive: 'Just now',
          messages: newMessages
        };
      }
      return r;
    }));
  };

  // Generate Bulleted Action Items from Chat Log
  const handleGenerateActionItems = async () => {
    if (isAiThinking || !activeRoom) return;

    setIsAiThinking(true);
    const actionPrompt = `Please analyze the entire chat log for "${activeRoom.title}" above and generate a clear, structured bulleted list of "Action Items & Next Steps" for participants based on our discussion. Categorize by participant / role (e.g. Assigned Tasks, Immediate Next Steps, Follow-ups). Format cleanly with Markdown and emojis.`;

    try {
      const response = await fetch('/api/collaboration/ai-respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomType: activeRoom.category,
          roomTitle: activeRoom.title,
          subject: activeRoom.subject,
          topic: activeRoom.topic,
          history: activeRoom.messages.map(m => ({
            senderName: m.senderName,
            senderRole: m.senderRole,
            text: m.text,
            timestamp: m.timestamp
          })),
          prompt: actionPrompt,
          userRole: profile?.role || 'Teacher'
        })
      });

      if (!response.ok) throw new Error('Failed to generate action items');
      const data = await response.json();

      const aiMsg: RoomMessage = {
        id: `msg-ai-actions-${Date.now()}`,
        senderId: 'edunexus-ai',
        senderName: 'EduNexus AI',
        senderRole: 'AI Assistant',
        isAi: true,
        text: data.aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionPayload: {
          type: 'meeting-minutes',
          title: `Action Items - ${activeRoom.title}`,
          content: data.aiReply
        }
      };

      updateRoomMessages(activeRoom.id, [...activeRoom.messages, aiMsg]);
      logActivity('feedback', `Generated Action Items for room: "${activeRoom.title}"`, profile, activeRoom.id, activeRoom.title);
    } catch (err) {
      console.error('Error generating action items:', err);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Create New Room
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomTitle.trim()) return;

    const newId = `room-custom-${Date.now()}`;
    const newRoom: CollaborationRoom = {
      id: newId,
      title: newRoomTitle.trim(),
      category: newRoomCategory,
      subject: newRoomSubject,
      topic: newRoomTopic.trim() || 'General Collaborative Discussion',
      description: newRoomDescription.trim() || 'Custom collaborative discussion room with EduNexus AI.',
      whatsappSynced: enableWhatsAppSync,
      whatsappGroupLink: enableWhatsAppSync ? `https://chat.whatsapp.com/edunexus-${Date.now().toString().slice(-6)}` : undefined,
      lastActive: 'Just now',
      participants: [
        { id: 'p-me', name: profile?.displayName || 'Creator', role: (profile?.role as any) || 'Teacher', avatarBg: 'bg-[#5f6f52]' },
        { id: 'p-ai', name: 'EduNexus AI', role: 'AI Assistant', avatarBg: 'bg-gradient-to-r from-teal-500 to-cyan-500', isAi: true }
      ],
      messages: [
        {
          id: `init-${Date.now()}`,
          senderId: 'p-ai',
          senderName: 'EduNexus AI',
          senderRole: 'AI Assistant',
          isAi: true,
          text: `Welcome everyone to **${newRoomTitle}**! 🚀\nI am EduNexus AI, your built-in participant co-consultant. I can help explain concepts, generate CBC lesson plans, create revision quizzes, summarize meeting notes, and sync our discussions with WhatsApp. Mention me with **@EduNexus** anytime!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    setRooms(prev => [newRoom, ...prev]);
    setActiveRoomId(newId);
    setIsCreateModalOpen(false);

    // Reset form
    setNewRoomTitle('');
    setNewRoomTopic('');
    setNewRoomDescription('');
  };

  // Filtered Rooms
  const filteredRooms = rooms.filter(r => {
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
    const matchesSearch = 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1">
                <Bot className="w-3.5 h-3.5 text-cyan-400" />
                Live AI Co-Participant Mode
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                WhatsApp Group Synced
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold font-serif text-slate-100 flex items-center gap-2">
              AI Collaboration Rooms
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Invite classmates, teaching colleagues, parents, and administrators into collaborative workspaces where <strong>EduNexus AI participates directly in discussions</strong> — answering questions, creating CBC lesson plans, drafting quizzes, and summarizing meeting minutes.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg transition duration-200 cursor-pointer flex items-center gap-2 shrink-0 border border-emerald-400/40"
          >
            <Plus className="w-4 h-4" />
            <span>Create AI Collaboration Room</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar Rooms + Main Discussion Room */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[70vh]">
        
        {/* ROOMS LIST SIDEBAR (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-[75vh] overflow-hidden">
          
          {/* Header & Filter Controls */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                Active Collaboration Rooms
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full border border-slate-700">
                {rooms.length} Rooms
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search rooms, subjects, topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 pl-8 pr-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-1 text-[10px]">
              {[
                { id: 'all', label: 'All' },
                { id: 'student-study', label: '👥 Student Study' },
                { id: 'teacher-dept', label: '👨‍🏫 Teacher Guilds' },
                { id: 'parent-teacher', label: '👨‍👩‍👧 Parent Consult' },
                { id: 'school-admin', label: '🏫 Admin & Staff' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                    categoryFilter === cat.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rooms List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
            {filteredRooms.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                No rooms matching search filter.
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isActive = room.id === activeRoomId;
                const lastMsg = room.messages[room.messages.length - 1];

                return (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoomId(room.id)}
                    className={`w-full text-left p-3.5 rounded-xl transition cursor-pointer flex flex-col gap-2 ${
                      isActive
                        ? 'bg-emerald-950/70 border border-emerald-500/40 text-white'
                        : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                          {room.subject}
                        </span>
                        <h4 className="text-xs font-bold text-slate-100 leading-snug line-clamp-1">
                          {room.title}
                        </h4>
                      </div>

                      {room.whatsappSynced && (
                        <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0" title="WhatsApp Synced">
                          <Smartphone className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {lastMsg ? `${lastMsg.senderName}: ${lastMsg.text}` : room.description}
                    </p>

                    <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-800/40">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-cyan-400" />
                        <span>{room.participants.length} Participants</span>
                      </div>
                      <span className="font-mono">{room.lastActive}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* MAIN DISCUSSION STREAM (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-[75vh] overflow-hidden">
          
          {/* Active Room Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  {activeRoom.subject}
                </span>
                <span className="text-xs text-slate-400 font-medium">• {activeRoom.topic}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                {activeRoom.title}
              </h3>
            </div>

            {/* Participants, Action Items & WhatsApp Link Button */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {activeRoom.participants.map((p) => (
                  <div
                    key={p.id}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-slate-900 ${p.avatarBg}`}
                    title={`${p.name} (${p.role})`}
                  >
                    {p.isAi ? '🤖' : p.name.charAt(0)}
                  </div>
                ))}
              </div>

              <button
                onClick={handleGenerateActionItems}
                disabled={isAiThinking}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                title="Parse chat log and generate bulleted Action Items for participants"
              >
                <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span>Action Items</span>
              </button>

              {activeRoom.whatsappGroupLink && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activeRoom.whatsappGroupLink || '');
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 3000);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Copy WhatsApp Group Invite Link"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{copiedLink ? 'Copied WhatsApp Link!' : 'WhatsApp Sync'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Discussion Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40">
            {activeRoom.messages.map((msg) => {
              const isAi = msg.isAi;
              const isOwn = msg.senderId === (profile?.uid || 'user-1');

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    isOwn ? 'flex-row-reverse' : ''
                  }`}
                >
                  {/* Sender Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold text-white shrink-0 ${
                    isAi
                      ? 'bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-600 ring-2 ring-cyan-400/50 shadow-md'
                      : isOwn
                      ? 'bg-[#5f6f52]'
                      : 'bg-slate-700'
                  }`}>
                    {isAi ? '🤖' : msg.senderName.charAt(0)}
                  </div>

                  {/* Message Bubble Container */}
                  <div className={`space-y-1.5 max-w-[85%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="font-bold text-slate-200">{msg.senderName}</span>
                      <span className={`px-1.5 py-0.2 rounded font-semibold text-[8px] ${
                        isAi ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {msg.senderRole}
                      </span>
                      <span>• {msg.timestamp}</span>
                    </div>

                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed space-y-2 ${
                      isAi
                        ? 'bg-slate-900/90 border border-cyan-500/30 text-slate-100 shadow-md'
                        : isOwn
                        ? 'bg-emerald-950 text-emerald-100 border border-emerald-500/30'
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700'
                    }`}>
                      <div className="whitespace-pre-line font-sans">
                        {msg.text}
                      </div>

                      {/* Generative Action Payload buttons attached to AI messages */}
                      {isAi && (
                        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={() => onNavigateToCreateDoc?.(activeRoom.topic, 'lesson-plan', msg.text)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1 cursor-pointer transition text-[10px]"
                            title="Convert into ready-to-print CBC Lesson Plan"
                          >
                            <FileText className="w-3 h-3 text-emerald-400" />
                            <span>Create CBC Lesson Plan</span>
                          </button>

                          <button
                            onClick={() => onNavigateToCreateDoc?.(activeRoom.topic, 'quiz-worksheet', msg.text)}
                            className="px-2.5 py-1 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-500/30 text-amber-300 font-bold flex items-center gap-1 cursor-pointer transition text-[10px]"
                            title="Generate Quiz & Worksheet"
                          >
                            <Brain className="w-3 h-3 text-amber-400" />
                            <span>Generate Quiz</span>
                          </button>

                          <button
                            onClick={() => onOpenImageStudio?.(`Educational diagram for ${activeRoom.topic}: ${activeRoom.subject}`)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 font-bold flex items-center gap-1 cursor-pointer transition text-[10px]"
                            title="Generate Educational Diagram"
                          >
                            <ImageIcon className="w-3 h-3 text-indigo-400" />
                            <span>Diagram</span>
                          </button>

                          <button
                            onClick={() => onOpenVideoStudio?.(`Educational animation concept for ${activeRoom.topic}`)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 font-bold flex items-center gap-1 cursor-pointer transition text-[10px]"
                            title="Generate Video Concept"
                          >
                            <Video className="w-3 h-3 text-cyan-400" />
                            <span>Video</span>
                          </button>

                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(msg.text);
                              setCopiedMessageId(msg.id);
                              setTimeout(() => setCopiedMessageId(null), 2000);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-1 cursor-pointer transition text-[10px]"
                            title="Copy text for WhatsApp"
                          >
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>{copiedMessageId === msg.id ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isAiThinking && (
              <div className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-white text-xs">
                  🤖
                </div>
                <div className="bg-slate-900 border border-cyan-500/30 p-3 rounded-2xl text-xs text-cyan-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>EduNexus AI is analyzing room context and formulating response...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Room Input Form */}
          <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-800 bg-slate-950/80 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-300">Consulting:</span>
                <span className="text-cyan-400 font-mono font-bold flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  @EduNexus AI Participant
                </span>
              </div>

              <button
                type="button"
                onClick={() => setInputMessage(prev => prev ? `${prev} @EduNexus` : '@EduNexus ')}
                className="text-emerald-400 hover:underline font-bold cursor-pointer"
              >
                + Mention @EduNexus
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Ask a question or consult @EduNexus in ${activeRoom.title}...`}
                className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500 transition"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isAiThinking}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* CREATE ROOM MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 text-slate-100 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold font-serif flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Create New AI Collaboration Room
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Room Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 10 Physics Motion Guild or Math HOD Room"
                  value={newRoomTitle}
                  onChange={(e) => setNewRoomTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-emerald-500 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Category / Audience:</label>
                  <select
                    value={newRoomCategory}
                    onChange={(e) => setNewRoomCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-emerald-500 text-slate-100"
                  >
                    <option value="student-study">👥 Student Group Study</option>
                    <option value="teacher-dept">👨‍🏫 Teacher Department Guild</option>
                    <option value="parent-teacher">👨‍👩‍👧 Parent-Teacher Progress</option>
                    <option value="school-admin">🏫 School Staff & Admin</option>
                    <option value="whatsapp-bridge">📱 WhatsApp Synced Hub</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Subject:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Physics, Mathematics, CBC Science"
                    value={newRoomSubject}
                    onChange={(e) => setNewRoomSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-emerald-500 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Discussion Topic:</label>
                <input
                  type="text"
                  placeholder="e.g. Projectile motion equations or Photosynthesis practicals"
                  value={newRoomTopic}
                  onChange={(e) => setNewRoomTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-emerald-500 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Description:</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of room goals..."
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-emerald-500 text-slate-100"
                />
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-200 block">Enable WhatsApp Live Group Sync</span>
                  <span className="text-[10px] text-slate-400">Generates a WhatsApp group invite link and connects @EduNexus bot.</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableWhatsAppSync}
                  onChange={(e) => setEnableWhatsAppSync(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Room</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
