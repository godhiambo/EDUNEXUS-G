import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, cleanUndefined } from '../firebase';
import { UserAccount, SavedDocument, DocumentFeedback } from '../types';
import { 
  Star, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles, 
  BookOpen, 
  Mic, 
  Square, 
  Trash2 
} from 'lucide-react';
import { FeedbackAudioPlayer } from './FeedbackAudioPlayer';

interface DocumentFeedbackWidgetProps {
  document: SavedDocument;
  currentProfile: UserAccount | null;
}

export default function DocumentFeedbackWidget({ document, currentProfile }: DocumentFeedbackWidgetProps) {
  const [rating, setRating] = useState<number>(0);
  const [relevanceRating, setRelevanceRating] = useState<number>(0);
  const [writtenFeedback, setWrittenFeedback] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [hoverRelevance, setHoverRelevance] = useState<number>(0);

  // Microphone recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string | null>(null);
  const [voiceNoteDuration, setVoiceNoteDuration] = useState<number>(0);
  const [voiceNoteBase64, setVoiceNoteBase64] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  // Microphone recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isEligible = currentProfile && (currentProfile.role === 'Teacher' || currentProfile.role === 'Administrator');
  const feedbackId = currentProfile ? `feedback-${document.id}-${currentProfile.uid}` : '';

  useEffect(() => {
    if (!isEligible || !feedbackId) {
      setLoading(false);
      return;
    }

    const fetchFeedback = async () => {
      setLoading(true);
      try {
        const feedbackRef = doc(db, 'feedbacks', feedbackId);
        const docSnap = await getDoc(feedbackRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as DocumentFeedback;
          setRating(data.rating);
          setRelevanceRating(data.relevanceRating);
          setWrittenFeedback(data.writtenFeedback || '');
          setVoiceNoteUrl(data.voiceNoteUrl || null);
          setVoiceNoteDuration(data.voiceNoteDuration || 0);
          setVoiceNoteBase64(null); // Already persisted
          setSubmitted(true);
        } else {
          // Reset states if doc changes and no feedback exists
          setRating(0);
          setRelevanceRating(0);
          setWrittenFeedback('');
          setVoiceNoteUrl(null);
          setVoiceNoteDuration(0);
          setVoiceNoteBase64(null);
          setSubmitted(false);
        }
      } catch (err) {
        console.error('Error fetching existing feedback:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [document.id, feedbackId, isEligible]);

  // Clean up recording states on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
          if (mediaRecorderRef.current.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
          }
        } catch (e) {
          console.error('Error cleaning up media recorder on unmount:', e);
        }
      }
    };
  }, []);

  if (!isEligible) {
    return null; // Don't show feedback widget for Students or guests
  }

  // Audio recording helpers
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startRecording = async () => {
    setRecordingError(null);
    audioChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio recording capabilities.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream);
      } catch (e) {
        // Fallback for browsers with strict mimetype expectations
        recorder = new MediaRecorder(stream, { mimeType: 'audio/wav' });
      }

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const localUrl = URL.createObjectURL(audioBlob);
        setVoiceNoteUrl(localUrl);

        try {
          const base64Str = await blobToBase64(audioBlob);
          setVoiceNoteBase64(base64Str);
        } catch (err) {
          console.error('Failed to convert audio blob to Base64:', err);
        }
      };

      recorder.start();
      setIsRecording(true);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 59) {
            // Auto stop at 60 seconds
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err: any) {
      console.error('Error starting audio recording:', err);
      setRecordingError(err?.message || 'Could not access your microphone. Please check system permissions.');
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
        if (recorder.stream) {
          recorder.stream.getTracks().forEach((track) => track.stop());
        }
      } catch (err) {
        console.error('Error stopping recorder:', err);
      }
    }

    setIsRecording(false);
    setVoiceNoteDuration(recordingSeconds || 1);
  };

  const deleteRecording = () => {
    if (voiceNoteUrl && voiceNoteUrl.startsWith('blob:')) {
      URL.revokeObjectURL(voiceNoteUrl);
    }
    setVoiceNoteUrl(null);
    setVoiceNoteBase64(null);
    setVoiceNoteDuration(0);
    setRecordingSeconds(0);
    setRecordingError(null);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile || rating === 0 || relevanceRating === 0) return;

    setSubmitting(true);
    try {
      const feedbackRef = doc(db, 'feedbacks', feedbackId);
      const feedbackData: DocumentFeedback = {
        id: feedbackId,
        docId: document.id,
        docTitle: document.title,
        docType: document.docType,
        curriculum: document.curriculum,
        subject: document.subject,
        topic: document.topic,
        rating,
        relevanceRating,
        writtenFeedback,
        voiceNoteUrl: voiceNoteBase64 || voiceNoteUrl || undefined,
        voiceNoteDuration: voiceNoteDuration || undefined,
        authorUid: currentProfile.uid,
        authorName: currentProfile.displayName,
        authorEmail: currentProfile.email,
        createdAt: new Date().toISOString()
      };

      await setDoc(feedbackRef, cleanUndefined(feedbackData));
      setSubmitted(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `feedbacks/${feedbackId}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    setSubmitted(false);
  };

  if (loading) {
    return (
      <div className="bg-[#fdfbf7] rounded-2xl border border-[#e5e1da] shadow-sm p-5 text-center">
        <p className="text-xs text-slate-400 italic">Checking rating status...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e5e1da] shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-[#f4f1ea] pb-3">
        <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">AI Quality Assessment</h4>
          <p className="text-[10px] text-slate-400">Rate this generation to tune future prompts.</p>
        </div>
      </div>

      {submitted ? (
        <div className="bg-amber-50/40 border border-amber-100 p-4 rounded-xl space-y-3 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800">Feedback Submitted!</p>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Thank you! Your ratings have been logged. Administrators use this dataset for prompt engineering and refining our curriculum output models.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-white/70 p-2.5 rounded-lg border border-amber-50">
            <div>
              <p className="text-[9px] uppercase font-extrabold text-slate-400">Generation Quality</p>
              <div className="flex gap-0.5 mt-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      star <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[9px] uppercase font-extrabold text-slate-400">Curriculum Relevance</p>
              <div className="flex gap-0.5 mt-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      star <= relevanceRating ? 'text-[#5f6f52] fill-[#5f6f52]' : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Render Submitted Voice Note */}
          {voiceNoteUrl && (
            <div className="bg-white/50 p-2.5 rounded-lg border border-amber-50 space-y-1.5">
              <p className="text-[9px] uppercase font-extrabold text-slate-400">Your Voice Note Reflection</p>
              <FeedbackAudioPlayer src={voiceNoteUrl} duration={voiceNoteDuration} />
            </div>
          )}

          {writtenFeedback && (
            <div className="bg-white/50 p-2.5 rounded-lg border border-amber-50">
              <p className="text-[9px] uppercase font-extrabold text-slate-400 mb-1">Your comments</p>
              <p className="text-[11px] text-slate-600 italic leading-relaxed">"{writtenFeedback}"</p>
            </div>
          )}

          <button
            onClick={handleEdit}
            className="flex items-center gap-1.5 text-[10px] font-bold text-[#5f6f52] hover:text-[#4d5a42] transition cursor-pointer mt-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Update Feedback</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quality Stars */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 block">
              Overall Material Quality
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5 cursor-pointer hover:scale-110 transition shrink-0"
                >
                  <Star
                    className={`w-5.5 h-5.5 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
              <span className="text-[10px] font-bold text-slate-400 ml-1.5">
                {rating > 0 ? `${rating}/5` : 'Rate generation'}
              </span>
            </div>
          </div>

          {/* Relevance Stars */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 block">
              Curriculum & Subject Relevance
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRelevanceRating(star)}
                  onMouseEnter={() => setHoverRelevance(star)}
                  onMouseLeave={() => setHoverRelevance(0)}
                  className="p-0.5 cursor-pointer hover:scale-110 transition shrink-0"
                >
                  <Star
                    className={`w-5.5 h-5.5 transition-colors ${
                      star <= (hoverRelevance || relevanceRating)
                        ? 'text-[#5f6f52] fill-[#5f6f52]'
                        : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
              <span className="text-[10px] font-bold text-slate-400 ml-1.5">
                {relevanceRating > 0 ? `${relevanceRating}/5` : 'Rate alignment'}
              </span>
            </div>
          </div>

          {/* Voice-Note Recorder Section */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 block flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-[#5f6f52]" />
              Voice-Note Reflection (Optional, max 1 min)
            </label>

            {recordingError && (
              <p className="text-[10px] text-rose-500 font-semibold">{recordingError}</p>
            )}

            {!voiceNoteUrl ? (
              <div className="flex items-center gap-3">
                {isRecording ? (
                  <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 px-3.5 py-2 rounded-xl w-full max-w-md justify-between animate-pulse">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-ping" />
                      <span className="text-[11px] font-bold text-rose-700 font-mono">
                        Recording... {formatDuration(recordingSeconds)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer"
                    >
                      <Square className="w-3 h-3 fill-white" />
                      <span>Stop</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="flex items-center gap-2 px-3.5 py-2 border border-[#5f6f52] text-[#5f6f52] hover:bg-[#5f6f52]/5 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Record Voice Feedback</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <FeedbackAudioPlayer src={voiceNoteUrl} duration={voiceNoteDuration} />
                <button
                  type="button"
                  onClick={deleteRecording}
                  className="flex items-center gap-1 text-[10px] font-bold text-rose-600 hover:text-rose-700 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete & Re-record Voice Note</span>
                </button>
              </div>
            )}
          </div>

          {/* Written Feedback comments */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 block">
              Written Comments (Optional)
            </label>
            <textarea
              value={writtenFeedback}
              onChange={(e) => setWrittenFeedback(e.target.value)}
              placeholder="What worked well? What felt inaccurate or generic? Suggest changes..."
              maxLength={2000}
              className="w-full h-18 bg-[#fdfbf7] border border-[#e5e1da] px-3 py-2 rounded-xl text-[11px] focus:outline-none focus:border-[#5f6f52] transition resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-[#f4f1ea]">
            <p className="text-[9px] text-slate-400 max-w-[170px] leading-tight flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#a9b388] shrink-0" />
              <span>Feedback feeds directly into Admin Tuning dashboards.</span>
            </p>

            <button
              type="submit"
              disabled={rating === 0 || relevanceRating === 0 || submitting}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#5f6f52] hover:bg-[#4d5a42] text-white font-bold rounded-xl text-xs shadow-sm transition cursor-pointer disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  <span>Submit</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
