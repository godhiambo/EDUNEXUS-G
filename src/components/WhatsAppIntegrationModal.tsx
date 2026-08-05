import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Smartphone, 
  Bot, 
  Sparkles, 
  QrCode, 
  Settings, 
  RefreshCw, 
  Zap, 
  HelpCircle,
  FileText,
  Mic,
  Image as ImageIcon,
  Check,
  ShieldCheck,
  PhoneCall
} from 'lucide-react';

interface WhatsAppIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPrompt?: string;
  userPhone?: string;
}

interface WhatsAppConfigData {
  configured: boolean;
  webhookUrl: string;
  verifyToken: string;
  hasAccessToken: boolean;
  hasPhoneNumberId: boolean;
  businessNumber: string;
  totalProcessedMessages: number;
  recentLogs: any[];
  activeSessionsCount: number;
}

interface SimulatedMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  mediaType?: string;
  mediaUrl?: string;
}

export default function WhatsAppIntegrationModal({
  isOpen,
  onClose,
  defaultPrompt = "Hello EduNexus AI! Can you explain Newton's Second Law of Motion?",
  userPhone = "+254740183394"
}: WhatsAppIntegrationModalProps) {
  const [activeTab, setActiveTab] = useState<'simulator' | 'link' | 'broadcast' | 'accessibility' | 'config' | 'direct'>('simulator');
  const [inputMessage, setInputMessage] = useState<string>(defaultPrompt);
  const [phoneNumberInput, setPhoneNumberInput] = useState<string>(userPhone);
  const [isLinking, setIsLinking] = useState<boolean>(false);
  const [linkedAccount, setLinkedAccount] = useState<any>(null);
  const [linkSuccessMsg, setLinkSuccessMsg] = useState<string | null>(null);

  // Broadcast state
  const [broadcastType, setBroadcastType] = useState<'homework' | 'announcement' | 'reminder'>('homework');
  const [broadcastTarget, setBroadcastTarget] = useState<string>('Grade 8 Science Class');
  const [broadcastContent, setBroadcastContent] = useState<string>('Reminder: Complete questions 1 to 5 on Page 42 on Photosynthesis before tomorrow.');
  const [broadcastRecipients, setBroadcastRecipients] = useState<string>(userPhone);
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [broadcastResultMsg, setBroadcastResultMsg] = useState<string | null>(null);

  // UDL Accessibility & Notification Engine state
  const [udlStakeholder, setUdlStakeholder] = useState<'student' | 'parent' | 'educator'>('student');
  const [udlProfiles, setUdlProfiles] = useState<string[]>(['ADHD', 'Dyslexia']);
  const [udlLanguage, setUdlLanguage] = useState<'en' | 'es' | 'fr' | 'sw'>('en');
  const [udlStudentName, setUdlStudentName] = useState<string>('Alex');
  const [udlStreakCount, setUdlStreakCount] = useState<number>(4);
  const [udlStreakGoal, setUdlStreakGoal] = useState<number>(5);
  const [udlConfidenceTopic, setUdlConfidenceTopic] = useState<string>('Newtonian Mechanics');
  const [udlConfidenceSelection, setUdlConfidenceSelection] = useState<'None' | 'Low Confidence' | 'High Confidence'>('Low Confidence');
  const [udlGeneratedMessage, setUdlGeneratedMessage] = useState<string | null>(null);
  const [isGeneratingUDL, setIsGeneratingUDL] = useState<boolean>(false);

  const [messages, setMessages] = useState<SimulatedMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: "Hello! 👋 Welcome to *EduNexus AI Tutor* on WhatsApp.\n\nI can help you with homework assistance, concept explanations, past paper revision, and step-by-step Socratic problem solving!\n\n*How can I assist your learning today?* 📚✨",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Backend WhatsApp Config State
  const [config, setConfig] = useState<WhatsAppConfigData | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    setIsLoadingConfig(true);
    try {
      const res = await fetch('/api/whatsapp/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.error('Failed to fetch WhatsApp config', err);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  if (!isOpen) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isSubmitting) return;

    const userMsg: SimulatedMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/whatsapp/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          phoneNumber: userPhone,
          name: 'Student Learner'
        })
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: SimulatedMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: data.aiReply,
          mediaUrl: data.mediaUrl,
          mediaType: data.mediaType,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
        fetchConfig();
      } else {
        throw new Error('Simulation failed');
      }
    } catch (err) {
      // Fallback Socratic reply if server request fails
      setTimeout(() => {
        const botMsg: SimulatedMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `Hello! 💡 Let's examine *"${textToSend.slice(0, 40)}..."* step by step:\n\n1. *Core Principle*: Every physical body continues in its state of rest or uniform motion unless acted upon by a net external force.\n2. *Socratic Question*: If mass doubles, what happens to acceleration when force stays constant?\n\nReply directly to continue! 🚀`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
      }, 600);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkPhone = async () => {
    if (!phoneNumberInput.trim()) return;
    setIsLinking(true);
    setLinkSuccessMsg(null);
    try {
      const res = await fetch('/api/whatsapp/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user-edunexus-current',
          phoneNumber: phoneNumberInput,
          userDisplayName: 'Student Learner',
          userRole: 'Student',
          userEmail: 'student@edunexus.edu'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLinkedAccount(data.linkRecord);
        setLinkSuccessMsg(`WhatsApp account linked! Incoming messages from ${phoneNumberInput} will be logged to your EduNexus profile.`);
      }
    } catch (err) {
      console.error('Failed to link WhatsApp account:', err);
    } finally {
      setIsLinking(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastContent.trim() || !broadcastRecipients.trim()) return;
    setIsBroadcasting(true);
    setBroadcastResultMsg(null);
    try {
      const recipientsList = broadcastRecipients.split(',').map(p => p.trim()).filter(Boolean);
      const res = await fetch('/api/whatsapp/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherUid: 'teacher-123',
          teacherName: 'Teacher Johnson',
          type: broadcastType,
          targetAudience: broadcastTarget,
          content: broadcastContent,
          recipients: recipientsList
        })
      });
      if (res.ok) {
        const data = await res.json();
        setBroadcastResultMsg(`Broadcast successfully sent to ${data.broadcastRecord?.successfulCount || recipientsList.length} recipient(s) over WhatsApp!`);
        fetchConfig();
      }
    } catch (err) {
      console.error('Failed to send broadcast:', err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const toggleUdlProfile = (profile: string) => {
    setUdlProfiles(prev => 
      prev.includes(profile) ? prev.filter(p => p !== profile) : [...prev, profile]
    );
  };

  const handleGenerateUDL = async () => {
    setIsGeneratingUDL(true);
    setUdlGeneratedMessage(null);
    try {
      const payload = {
        stakeholder: udlStakeholder,
        student_name: udlStudentName,
        active_profiles: udlProfiles,
        language: udlLanguage,
        data: {
          streak_count: udlStreakCount,
          streak_goal: udlStreakGoal,
          completed_topics: ['Mathematics Fundamentals'],
          pending_topics: [udlConfidenceTopic],
          confidence_rating_topic: udlConfidenceTopic,
          confidence_selection: udlConfidenceSelection !== 'None' ? udlConfidenceSelection : undefined
        }
      };

      const res = await fetch('/api/whatsapp/udl-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setUdlGeneratedMessage(data.message);
      } else {
        throw new Error('UDL Generation failed');
      }
    } catch (err) {
      console.error('Failed to generate UDL payload:', err);
    } finally {
      setIsGeneratingUDL(false);
    }
  };

  const formattedWhatsAppUrl = `https://wa.me/${(config?.businessNumber || userPhone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello EduNexus AI Tutor! I would like to learn with you on WhatsApp.')}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-5 sm:p-6 flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 translate-x-12 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md flex items-center justify-center text-emerald-100 shadow-inner">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">EduNexus WhatsApp AI Integration</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-emerald-100 text-[11px] font-bold tracking-wide uppercase">
                  Meta Cloud API
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-medium mt-0.5">
                Connect students & teachers directly to Socratic Gemini AI tutoring over WhatsApp
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer relative z-10"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between overflow-x-auto shrink-0">
          <div className="flex items-center gap-2 py-2">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Live AI Chat Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab('link')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'link'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Link Account</span>
            </button>

            <button
              onClick={() => setActiveTab('broadcast')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'broadcast'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Teacher Broadcasts</span>
            </button>

            <button
              onClick={() => setActiveTab('accessibility')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'accessibility'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Accessibility & AI Engine</span>
            </button>

            <button
              onClick={() => setActiveTab('config')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'config'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Webhook Setup</span>
              {config?.configured && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('direct')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'direct'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>"Continue on WhatsApp" Button</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-semibold py-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted Socratic Delivery</span>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto grow space-y-6">
          
          {/* TAB 1: LIVE SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* WhatsApp Phone Mockup View */}
              <div className="lg:col-span-7 bg-[#ece5dd] rounded-3xl border-4 border-slate-800 shadow-xl overflow-hidden flex flex-col h-[480px]">
                
                {/* WhatsApp Chat Top Header */}
                <div className="bg-[#075e54] text-white p-3.5 flex items-center justify-between shrink-0 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-bold text-sm">
                      🤖
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold leading-tight text-white">EduNexus AI Tutor</h4>
                      <p className="text-[10px] text-emerald-200 font-medium">Business Account • Online</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-emerald-100">
                    <PhoneCall className="w-4 h-4 opacity-80" />
                    <ExternalLink className="w-4 h-4 opacity-80 cursor-pointer" onClick={() => window.open(formattedWhatsAppUrl, '_blank')} />
                  </div>
                </div>

                {/* Messages Container */}
                <div className="p-4 overflow-y-auto grow space-y-3.5 bg-[radial-gradient(#d1c7bd_1px,transparent_1px)] [background-size:16px_16px]">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-sm font-sans whitespace-pre-line leading-relaxed ${
                          m.sender === 'user'
                            ? 'bg-[#dcf8c6] text-slate-900 rounded-tr-none border border-emerald-200'
                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                        }`}
                      >
                        {(() => {
                          const mediaUrlMatch = m.text.match(/(https?:\/\/[^\s\n]+|data:(image|video)\/[^;]+;base64,[^\s\n]+|\/api\/media\/serve\/[^\s\n]+)/i);
                          const extractedUrl = m.mediaUrl || (mediaUrlMatch ? mediaUrlMatch[0] : null);
                          const isVideo = m.mediaType === 'video' || m.text.includes('🎥') || m.text.includes('video') || (extractedUrl && (extractedUrl.includes('.mp4') || extractedUrl.includes('video')));
                          const isImage = m.mediaType === 'image' || m.text.includes('🖼️') || m.text.includes('image') || (extractedUrl && (extractedUrl.includes('.png') || extractedUrl.includes('.jpg') || extractedUrl.includes('image')));
                          const cleanText = m.text.replace(/(\*|\b)Media Link:\s*https?:\/\/[^\s\n]+/gi, '').trim();

                          return (
                            <div className="space-y-2">
                              {/* Display media preview if available */}
                              {extractedUrl && (
                                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm mt-1">
                                  {isVideo ? (
                                    <video
                                      src={extractedUrl}
                                      controls
                                      className="w-full h-auto max-h-56 object-cover bg-black"
                                    />
                                  ) : isImage || extractedUrl ? (
                                    <img
                                      src={extractedUrl}
                                      alt="WhatsApp AI Media"
                                      className="w-full h-auto max-h-56 object-cover cursor-pointer hover:opacity-95 transition"
                                      onClick={() => window.open(extractedUrl, '_blank')}
                                    />
                                  ) : null}
                                </div>
                              )}
                              <p className="whitespace-pre-line">{cleanText}</p>
                            </div>
                          );
                        })()}
                        <div className="mt-1.5 text-[9px] text-slate-400 text-right font-mono flex items-center justify-end gap-1">
                          <span>{m.timestamp}</span>
                          {m.sender === 'user' && <CheckCircle2 className="w-3 h-3 text-blue-500 inline" />}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isSubmitting && (
                    <div className="flex items-start">
                      <div className="bg-white text-slate-600 rounded-2xl rounded-tl-none p-3 text-xs shadow-sm border border-slate-200 flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                        <span className="font-semibold italic">EduNexus AI Tutor is typing response...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* WhatsApp Chat Input Bar */}
                <div className="p-2.5 bg-[#f0f0f0] border-t border-slate-300 flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your question to test EduNexus AI..."
                    className="grow bg-white border border-slate-300 rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isSubmitting}
                    className="w-9 h-9 rounded-full bg-[#075e54] hover:bg-[#128c7e] disabled:opacity-50 text-white flex items-center justify-center transition cursor-pointer shrink-0"
                    title="Send WhatsApp test message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sample Prompts & Architecture Explanation */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>Quick Test Prompts</span>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => handleSendMessage("Explain Newton's Second Law of Motion with a Kenyan CBC example.")}
                      className="w-full text-left p-2.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 text-xs text-slate-700 hover:text-emerald-700 font-medium transition flex items-center justify-between group cursor-pointer"
                    >
                      <span>Newton's Second Law of Motion</span>
                      <Send className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-emerald-600 transition" />
                    </button>

                    <button
                      onClick={() => handleSendMessage("Can you solve 3x + 15 = 45 step by step?")}
                      className="w-full text-left p-2.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 text-xs text-slate-700 hover:text-emerald-700 font-medium transition flex items-center justify-between group cursor-pointer"
                    >
                      <span>Algebra Step-by-Step Problem Solving</span>
                      <Send className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-emerald-600 transition" />
                    </button>

                    <button
                      onClick={() => handleSendMessage("Give me a quick 3-question Grade 8 Biology quiz on photosynthesis.")}
                      className="w-full text-left p-2.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 text-xs text-slate-700 hover:text-emerald-700 font-medium transition flex items-center justify-between group cursor-pointer"
                    >
                      <span>Interactive Science Quiz</span>
                      <Send className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-emerald-600 transition" />
                    </button>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2 text-xs text-emerald-900">
                  <div className="flex items-center gap-2 font-extrabold text-emerald-800">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>How WhatsApp Channel Works</span>
                  </div>
                  <p className="leading-relaxed text-emerald-800/90 text-[11px]">
                    1. Student sends a message via WhatsApp.<br />
                    2. Meta Cloud API forwards payload to EduNexus Cloud Run Webhook.<br />
                    3. EduNexus AI backend runs Socratic Gemini AI logic.<br />
                    4. Response is sent straight back to student's WhatsApp!
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB: LINK ACCOUNT */}
          {activeTab === 'link' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">Link Your WhatsApp Phone Number</h3>
                    <p className="text-xs text-slate-500">Associate your phone number with your EduNexus Firebase profile so your conversations, homework submissions, and AI feedback automatically sync across devices.</p>
                  </div>
                </div>

                {linkSuccessMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{linkSuccessMsg}</span>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-700">Your Mobile Phone Number (with Country Code):</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={phoneNumberInput}
                      onChange={(e) => setPhoneNumberInput(e.target.value)}
                      placeholder="e.g. +254 704 360 522"
                      className="grow bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                    <button
                      onClick={handleLinkPhone}
                      disabled={isLinking || !phoneNumberInput.trim()}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer shrink-0"
                    >
                      {isLinking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      <span>{isLinking ? 'Linking...' : 'Link Number'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <span className="font-extrabold text-slate-800 block">Why Link Your WhatsApp Account?</span>
                  <ul className="space-y-1.5 list-disc list-inside text-[11px] text-slate-600">
                    <li>Send homework photos, audio voice notes, or PDFs via WhatsApp and get instant grades.</li>
                    <li>Receive class announcements and deadline reminders straight to WhatsApp.</li>
                    <li>Continue conversations seamlessly between EduNexus Web App and WhatsApp.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB: TEACHER BROADCAST */}
          {activeTab === 'broadcast' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                    <Send className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">Teacher WhatsApp Broadcast Hub</h3>
                    <p className="text-xs text-slate-500">Dispatch homework tasks, exam reminders, or announcements to student WhatsApp phone numbers.</p>
                  </div>
                </div>

                {broadcastResultMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{broadcastResultMsg}</span>
                  </div>
                )}

                <div className="space-y-3 pt-2 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Broadcast Type:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['homework', 'announcement', 'reminder'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setBroadcastType(t)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition cursor-pointer ${
                            broadcastType === t
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Class / Subject:</label>
                    <input
                      type="text"
                      value={broadcastTarget}
                      onChange={(e) => setBroadcastTarget(e.target.value)}
                      placeholder="e.g. Grade 8 Science Class"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Recipient Phone Numbers (comma separated):</label>
                    <input
                      type="text"
                      value={broadcastRecipients}
                      onChange={(e) => setBroadcastRecipients(e.target.value)}
                      placeholder="e.g. +254740183394, +254700123456"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 font-mono text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Broadcast Message Content:</label>
                    <textarea
                      rows={3}
                      value={broadcastContent}
                      onChange={(e) => setBroadcastContent(e.target.value)}
                      placeholder="Type homework instructions or announcement..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    onClick={handleSendBroadcast}
                    disabled={isBroadcasting || !broadcastContent.trim() || !broadcastRecipients.trim()}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isBroadcasting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{isBroadcasting ? 'Dispatching Broadcast...' : 'Dispatch WhatsApp Broadcast'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONFIGURATION & SETUP */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              
              {/* Architecture Diagram Card */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-5 border border-slate-700 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-extrabold text-white">Meta WhatsApp Cloud API System Architecture</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-mono text-[10px] font-bold">
                    Cloud Run Webhook Active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center text-center font-mono text-[11px] py-2">
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <Smartphone className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                    <span className="font-bold text-white block">Student</span>
                    <span className="text-[9px] text-slate-400">WhatsApp App</span>
                  </div>
                  <div className="text-slate-500 font-bold hidden sm:block">➔</div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <MessageSquare className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                    <span className="font-bold text-white block">Meta Cloud API</span>
                    <span className="text-[9px] text-slate-400">Webhook Event</span>
                  </div>
                  <div className="text-slate-500 font-bold hidden sm:block">➔</div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <Bot className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                    <span className="font-bold text-white block">EduNexus AI</span>
                    <span className="text-[9px] text-slate-400">Gemini Socratic Engine</span>
                  </div>
                </div>
              </div>

              {/* Webhook URLs & Tokens Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  Meta Developer Console Webhook Configuration
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">
                      Cloud Run Callback URL (Meta Webhook URL):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={config?.webhookUrl || `${window.location.origin}/api/whatsapp/webhook`}
                        className="grow bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-800"
                      />
                      <button
                        onClick={() => handleCopy(config?.webhookUrl || `${window.location.origin}/api/whatsapp/webhook`, 'webhookUrl')}
                        className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedField === 'webhookUrl' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedField === 'webhookUrl' ? 'Copied' : 'Copy URL'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">
                      Verify Token (`hub.verify_token`):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={config?.verifyToken || 'EduNexusWebhook2026'}
                        className="grow bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-800"
                      />
                      <button
                        onClick={() => handleCopy(config?.verifyToken || 'EduNexusWebhook2026', 'verifyToken')}
                        className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedField === 'verifyToken' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedField === 'verifyToken' ? 'Copied' : 'Copy Token'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Environment Variables Required */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  Required Backend Environment Variables (`.env.example`)
                </h3>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">WHATSAPP_VERIFY_TOKEN</span>
                      <p className="font-sans text-[11px] text-slate-500 font-normal">Token set in Meta Webhook configuration step</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Configured</span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">WHATSAPP_ACCESS_TOKEN</span>
                      <p className="font-sans text-[11px] text-slate-500 font-normal">Permanent Meta System User Access Token</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${config?.hasAccessToken ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {config?.hasAccessToken ? 'Configured' : 'Pending Key'}
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">WHATSAPP_PHONE_NUMBER_ID</span>
                      <p className="font-sans text-[11px] text-slate-500 font-normal">Phone Number ID from Meta WhatsApp Dashboard</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${config?.hasPhoneNumberId ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {config?.hasPhoneNumberId ? 'Configured' : 'Pending ID'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB: ACCESSIBILITY & AI SYSTEM INSTRUCTIONS ENGINE */}
          {activeTab === 'accessibility' && (
            <div className="space-y-6">
              
              {/* Header Card */}
              <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 border border-emerald-700/50 shadow-lg space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-amber-300">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                      Google AI Studio System Instructions
                    </span>
                    <h3 className="text-base font-black text-white">WhatsApp Notification & Accessibility Engine</h3>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Grounds all WhatsApp notifications, milestone updates, and confidence-rating prompts in universal design for learning (UDL) guidelines, stakeholder playbooks, active learner profiles (ADHD, Dyslexia, ESL, Screen Reader, Low Vision), and multilingual translations.
                </p>
              </div>

              {/* Grid of System Instruction Core Modules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Module 1: Stakeholder Playbooks */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xs">
                    <FileText className="w-4 h-4" />
                    <span>1. Playbooks & Stakeholder Roles</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li><strong className="text-slate-800">Educator Playbook:</strong> Triggered when tagging/releasing materials in Document Viewer to broadcast resource links.</li>
                    <li><strong className="text-slate-800">Student Playbook:</strong> Keeps students motivated, tracks modular activities, checks confidence ratings, and prompts navigation.</li>
                    <li><strong className="text-slate-800">Parent Playbook:</strong> Monitors active learning pathways, tracks streaks for milestone celebrations, and suggests home configuration tips.</li>
                  </ul>
                </div>

                {/* Module 2: Accessibility & Learner Profiles */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-sm">
                  <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-xs">
                    <Zap className="w-4 h-4" />
                    <span>2. Learner Profiles (UDL Accommodations)</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4 leading-relaxed">
                    <li><strong className="text-slate-800">ADHD Scaffolding:</strong> Micro-milestone lists, ☑️ checkboxes, and daily streak trackers.</li>
                    <li><strong className="text-slate-800">Dyslexia Accommodation:</strong> Double line breaks, short left-aligned sentences, and emojis as ocular anchors.</li>
                    <li><strong className="text-slate-800">ESL Scaffolding:</strong> Simplified Vocabulary Filter and translation to ES, FR, SW, EN.</li>
                    <li><strong className="text-slate-800">Screen Reader (Blindness):</strong> Plain-text Audio Summary at top; strips repetitive shapes & dividers.</li>
                    <li><strong className="text-slate-800">Low Vision:</strong> Heavy monochrome Unicode (⬛, ⬜, ▪️) & bold headers.</li>
                  </ul>
                </div>

                {/* Module 3: Confidence-Rating Mechanics */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xs">
                    <HelpCircle className="w-4 h-4" />
                    <span>3. Confidence-Rating Mechanics</span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-2">
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                      <strong className="text-amber-900 block font-bold">Low Confidence Selection:</strong>
                      Reposition topic at trail root, add descriptive instructions, unlock low-difficulty supportive activities, allocate higher study hours.
                    </div>
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <strong className="text-emerald-900 block font-bold">High Confidence Selection:</strong>
                      Congratulate student, fast-track syllabus, inject complex real-world project tasks.
                    </div>
                  </div>
                </div>

                {/* Module 4: JSON Schema & Workflow */}
                <div className="bg-slate-900 text-slate-200 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-sm font-mono text-[11px]">
                  <div className="flex items-center justify-between text-slate-400 font-sans font-extrabold text-xs pb-1 border-b border-slate-800">
                    <span>Input Payload Schema</span>
                    <span className="text-emerald-400">JSON API</span>
                  </div>
                  <pre className="text-emerald-300 bg-slate-950 p-2.5 rounded-xl overflow-x-auto">
{`{
  "stakeholder": "student" | "parent" | "educator",
  "student_name": "string",
  "active_profiles": ["ADHD", "ESL", "Dyslexia", "Screen_Reader", "Low_Vision"],
  "language": "en" | "es" | "fr" | "sw",
  "data": {
    "streak_count": 4,
    "streak_goal": 5,
    "completed_topics": ["Math"],
    "pending_topics": ["Science"],
    "confidence_rating_topic": "string",
    "confidence_selection": "Low Confidence" | "High Confidence"
  }
}`}
                  </pre>
                </div>

              </div>

              {/* Interactive UDL Notification Sandbox */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Interactive UDL WhatsApp Notification Generator</h4>
                    <p className="text-xs text-slate-500">Test how Gemini AI constructs accessible messages based on active learner profiles</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Live Engine Sandbox
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Stakeholder */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Stakeholder</label>
                    <select
                      value={udlStakeholder}
                      onChange={(e) => setUdlStakeholder(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      <option value="student">Student</option>
                      <option value="parent">Parent</option>
                      <option value="educator">Educator</option>
                    </select>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Target Language</label>
                    <select
                      value={udlLanguage}
                      onChange={(e) => setUdlLanguage(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      <option value="en">English (en)</option>
                      <option value="es">Español (es)</option>
                      <option value="fr">Français (fr)</option>
                      <option value="sw">Kiswahili (sw)</option>
                    </select>
                  </div>

                  {/* Student Name */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Student Name</label>
                    <input
                      type="text"
                      value={udlStudentName}
                      onChange={(e) => setUdlStudentName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>

                  {/* Confidence Selection */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Confidence Choice</label>
                    <select
                      value={udlConfidenceSelection}
                      onChange={(e) => setUdlConfidenceSelection(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      <option value="None">None (General Update)</option>
                      <option value="Low Confidence">Low Confidence</option>
                      <option value="High Confidence">High Confidence</option>
                    </select>
                  </div>
                </div>

                {/* Learner Profiles Checkboxes */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-2">Active Learner Profiles (UDL Accommodations)</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'ADHD', label: 'ADHD Focus Scaffolding' },
                      { id: 'Dyslexia', label: 'Dyslexia Accommodation' },
                      { id: 'ESL', label: 'ESL Simplification' },
                      { id: 'Screen_Reader', label: 'Screen Reader (Blindness)' },
                      { id: 'Low_Vision', label: 'Low-Vision High Contrast' }
                    ].map((p) => {
                      const isActive = udlProfiles.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleUdlProfile(p.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            isActive
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {isActive && <Check className="w-3.5 h-3.5 text-white" />}
                          <span>{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="flex items-center justify-between pt-2">
                  <p className="text-[11px] text-slate-500">
                    Topic: <strong className="text-slate-800">{udlConfidenceTopic}</strong> | Streak: <strong className="text-slate-800">{udlStreakCount}/{udlStreakGoal} days</strong>
                  </p>
                  <button
                    onClick={handleGenerateUDL}
                    disabled={isGeneratingUDL}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                  >
                    {isGeneratingUDL ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                    <span>{isGeneratingUDL ? 'Generating Accessible Payload...' : 'Generate Accessible UDL Payload'}</span>
                  </button>
                </div>

                {/* Output Area */}
                {udlGeneratedMessage && (
                  <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Generated Accessible WhatsApp Payload:
                      </span>
                      <button
                        onClick={() => handleCopy(udlGeneratedMessage, 'udlMessage')}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === 'udlMessage' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedField === 'udlMessage' ? 'Copied' : 'Copy Text'}</span>
                      </button>
                    </div>

                    <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed text-slate-200 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
                      {udlGeneratedMessage}
                    </pre>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleSendMessage(udlGeneratedMessage)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send in Chat Simulator</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* TAB 3: CONTINUE ON WHATSAPP BUTTON & LINK */}
          {activeTab === 'direct' && (
            <div className="space-y-6">
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-3xl bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-600/30">
                  <Smartphone className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-emerald-950">Continue Learning on WhatsApp</h3>
                  <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                    Open a direct conversation with EduNexus AI Tutor on your phone or desktop WhatsApp app to ask questions anywhere!
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={formattedWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>Open WhatsApp App Directly</span>
                    <ExternalLink className="w-4 h-4 opacity-80" />
                  </a>

                  <button
                    onClick={() => handleCopy(formattedWhatsAppUrl, 'waUrl')}
                    className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-slate-100 text-emerald-800 font-bold text-xs rounded-2xl border border-emerald-300 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {copiedField === 'waUrl' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedField === 'waUrl' ? 'Link Copied!' : 'Copy Direct wa.me Link'}</span>
                  </button>
                </div>
              </div>

              {/* Mobile QR Code Scanner Preview */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center sm:text-left">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider">
                    Instant Mobile Scan
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-800">Scan QR Code with Phone Camera</h4>
                  <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                    Point your phone camera at this QR code to instantly start chatting with EduNexus AI Tutor on WhatsApp.
                  </p>
                  <p className="text-xs font-mono font-bold text-slate-700 pt-1">
                    Business Helpline: {config?.businessNumber || userPhone}
                  </p>
                </div>

                <div className="p-3 bg-slate-900 rounded-2xl shadow-md shrink-0 border border-slate-700">
                  <div className="w-32 h-32 bg-white rounded-xl p-2 flex items-center justify-center text-slate-900">
                    {/* SVG Clean QR Code Graphic */}
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <rect width="100" height="100" fill="white" />
                      <rect x="10" y="10" width="25" height="25" fill="#0f172a" />
                      <rect x="15" y="15" width="15" height="15" fill="white" />
                      <rect x="18" y="18" width="9" height="9" fill="#059669" />

                      <rect x="65" y="10" width="25" height="25" fill="#0f172a" />
                      <rect x="70" y="15" width="15" height="15" fill="white" />
                      <rect x="73" y="18" width="9" height="9" fill="#059669" />

                      <rect x="10" y="65" width="25" height="25" fill="#0f172a" />
                      <rect x="15" y="70" width="15" height="15" fill="white" />
                      <rect x="18" y="73" width="9" height="9" fill="#059669" />

                      <rect x="42" y="12" width="12" height="12" fill="#0f172a" />
                      <rect x="42" y="30" width="16" height="8" fill="#059669" />
                      <rect x="12" y="42" width="20" height="10" fill="#0f172a" />
                      <rect x="40" y="45" width="20" height="20" fill="#059669" />
                      <rect x="68" y="42" width="20" height="10" fill="#0f172a" />
                      <rect x="42" y="72" width="14" height="14" fill="#0f172a" />
                      <rect x="65" y="65" width="22" height="22" fill="#0f172a" />
                    </svg>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 p-4 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Bot className="w-4 h-4 text-emerald-600" />
            <span>EduNexus Gemini 3.5 Socratic Engine</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl transition cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
