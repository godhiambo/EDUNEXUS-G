import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, cleanUndefined } from '../firebase';
import { UserAccount } from '../types';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Save, 
  Trash2, 
  Copy, 
  Download, 
  FileText, 
  Loader2, 
  Workflow, 
  Clock, 
  Search, 
  History, 
  Check, 
  Volume2,
  Info,
  ListTodo,
  FileDown,
  CheckSquare,
  Square,
  Plus,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Timer,
  Sliders,
  AlertTriangle
} from 'lucide-react';
import { MermaidDiagram } from './MermaidDiagram';
import { motion, AnimatePresence } from 'motion/react';

interface VoiceNotebookProps {
  currentProfile: UserAccount | null;
}

export interface AudioNote {
  id: string;
  userId: string;
  title: string;
  transcript: string;
  summary: string;
  mermaidChart: string;
  createdAt: string;
}

export interface VoiceTask {
  id: string;
  dbId?: string;
  noteId: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export default function VoiceNotebook({ currentProfile }: VoiceNotebookProps) {
  const [notes, setNotes] = useState<AudioNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<AudioNote | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Note inputs
  const [noteTitle, setNoteTitle] = useState('Untitled Lecture Note');
  const [noteContent, setNoteContent] = useState('');
  
  // AI Results
  const [aiSummary, setAiSummary] = useState('');
  const [mermaidChart, setMermaidChart] = useState('');
  
  // States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  // Notification / feedback states
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedMermaid, setCopiedMermaid] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [voiceCommandFeedback, setVoiceCommandFeedback] = useState<string | null>(null);
  
  // Speech Recognition Ref
  const recognitionRef = useRef<any>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  
  // Refs for continuous speech recording with a maximum of 1 hour
  const isListeningRef = useRef(false);
  const recordingStartTimeRef = useRef<number | null>(null);
  const maxRecordingTimerRef = useRef<any>(null);

  // Sync isListening ref to avoid stale closures in callbacks
  const [isListening, setIsListening] = useState(false);
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (maxRecordingTimerRef.current) {
        clearTimeout(maxRecordingTimerRef.current);
      }
    };
  }, []);

  // Lecture Recording Visual Countdown Timer State Engine
  const [targetLectureMinutes, setTargetLectureMinutes] = useState<number>(45);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [showTimerConfig, setShowTimerConfig] = useState<boolean>(false);

  // Sync countdown timer when recording
  useEffect(() => {
    let interval: any = null;
    if (isListening) {
      if (!recordingStartTimeRef.current) {
        recordingStartTimeRef.current = Date.now();
      }
      interval = setInterval(() => {
        if (recordingStartTimeRef.current) {
          const now = Date.now();
          const secs = Math.floor((now - recordingStartTimeRef.current) / 1000);
          setElapsedSeconds(secs);

          const maxSecs = targetLectureMinutes * 60;
          if (secs >= maxSecs) {
            if (isListeningRef.current) {
              recognitionRef.current?.stop();
              setIsListening(false);
              setErrorMessage(`Target lecture recording limit of ${targetLectureMinutes} minutes reached. Recording completed.`);
            }
          }
        }
      }, 500);
    } else {
      setElapsedSeconds(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isListening, targetLectureMinutes]);

  const totalTargetSeconds = targetLectureMinutes * 60;
  const remainingSeconds = Math.max(0, totalTargetSeconds - elapsedSeconds);
  const recordingProgressPct = Math.min(100, (elapsedSeconds / totalTargetSeconds) * 100);

  const formatCountdownTime = (totalSecs: number) => {
    if (isNaN(totalSecs) || totalSecs < 0) totalSecs = 0;
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const adjustLectureTarget = (deltaMins: number) => {
    setTargetLectureMinutes(prev => Math.max(1, Math.min(180, prev + deltaMins)));
  };

  // Tabs for the note workspace
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'notes' | 'summary' | 'mindmap'>('notes');

  // Tasks States
  const [localTasks, setLocalTasks] = useState<VoiceTask[]>([]);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [isExtractingTasks, setIsExtractingTasks] = useState(false);

  // Summary Toggle State ('detailed' for full Markdown, 'bullets' for clean parsed cards)
  const [summaryFormat, setSummaryFormat] = useState<'detailed' | 'bullets'>('detailed');

  // Ref to hold the latest localTasks state to avoid stale closure issues in SpeechRecognition callback
  const localTasksRef = useRef<VoiceTask[]>([]);
  useEffect(() => {
    localTasksRef.current = localTasks;
  }, [localTasks]);

  // Load user's notes history from Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoadingHistory(false);
      return;
    }

    try {
      const notesCol = collection(db, 'voiceNotes');
      const q = query(
        notesCol,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: AudioNote[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as AudioNote);
        });
        setNotes(list);
        setLoadingHistory(false);
      }, (error) => {
        console.error('Error listing voice notes:', error);
        setLoadingHistory(false);
      });

      return unsubscribe;
    } catch (err) {
      console.error('Firestore voiceNotes subscription setup failed:', err);
      setLoadingHistory(false);
    }
  }, [currentProfile]);

  // Sync / Subscribe to tasks subcollection when selectedNote changes
  useEffect(() => {
    if (!selectedNote) {
      setLocalTasks([]);
      return;
    }

    try {
      const tasksCol = collection(db, 'voiceNotes', selectedNote.id, 'tasks');
      const q = query(tasksCol, orderBy('createdAt', 'asc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: VoiceTask[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ 
            dbId: docSnap.id, 
            ...docSnap.data() 
          } as VoiceTask);
        });
        setLocalTasks(list);
      }, (error) => {
        console.error('Error loading tasks for voice note:', error);
      });

      return unsubscribe;
    } catch (err) {
      console.error('Failed to setup task listener:', err);
    }
  }, [selectedNote]);

  // Real-time Voice Command Parser for dictated transcript
  const parseVoiceCommands = (text: string) => {
    const textLower = text.toLowerCase().trim();
    
    // Command patterns like: "add task [do homework]", "create task [grade papers]", "todo [print papers]", "task [revise lecture]"
    const patterns = [
      /add\s+task\s+([a-zA-Z0-9\s,\.\-\'!]+)/i,
      /create\s+task\s+([a-zA-Z0-9\s,\.\-\'!]+)/i,
      /todo\s+([a-zA-Z0-9\s,\.\-\'!]+)/i,
      /task\s+([a-zA-Z0-9\s,\.\-\'!]+)/i,
      /remind\s+me\s+to\s+([a-zA-Z0-9\s,\.\-\'!]+)/i
    ];

    for (const pattern of patterns) {
      const match = textLower.match(pattern);
      if (match && match[1]) {
        const taskText = match[1].trim();
        if (taskText.length > 2) {
          const formattedText = taskText.charAt(0).toUpperCase() + taskText.slice(1);
          
          // Avoid exact duplicates in current note session
          if (localTasksRef.current.some(t => t.text.toLowerCase() === formattedText.toLowerCase())) {
            continue;
          }

          addNewTask(formattedText);
          
          // Highlight that a task was created
          setVoiceCommandFeedback(`Voice Command Captured: Added "${formattedText}"!`);
          setTimeout(() => setVoiceCommandFeedback(null), 4000);
          break;
        }
      }
    }
  };

  // Check browser SpeechRecognition support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += trans;
          } else {
            interimTranscript += trans;
          }
        }

        if (finalTranscript) {
          setNoteContent(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${finalTranscript.trim()}` : finalTranscript.trim();
          });

          // Run voice command parser on the newly added final text
          parseVoiceCommands(finalTranscript);
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access is blocked. Please enable microphone permissions in your browser.');
          setIsListening(false);
        } else if (event.error === 'aborted') {
          console.log('Speech recognition aborted');
        } else {
          setErrorMessage(`Speech recognition error: ${event.error}`);
        }
      };

      rec.onend = () => {
        const now = Date.now();
        const elapsed = now - (recordingStartTimeRef.current || now);
        // If the user hasn't explicitly stopped it and we are under the 1-hour limit, keep it alive!
        if (isListeningRef.current && elapsed < 3600000) {
          try {
            recognitionRef.current?.start();
          } catch (err) {
            console.error('Failed to restart speech recognition on end:', err);
            setIsListening(false);
          }
        } else {
          setIsListening(false);
          if (maxRecordingTimerRef.current) {
            clearTimeout(maxRecordingTimerRef.current);
            maxRecordingTimerRef.current = null;
          }
        }
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Toggle Listening
  const toggleListening = () => {
    if (!speechSupported) {
      alert('Speech Recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.');
      return;
    }

    if (isListening) {
      if (maxRecordingTimerRef.current) {
        clearTimeout(maxRecordingTimerRef.current);
        maxRecordingTimerRef.current = null;
      }
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setErrorMessage(null);
      try {
        recordingStartTimeRef.current = Date.now();

        // Clear any prior timer
        if (maxRecordingTimerRef.current) {
          clearTimeout(maxRecordingTimerRef.current);
        }

        // Auto-stop after teacher's configured target lecture duration
        const targetMs = targetLectureMinutes * 60 * 1000;
        maxRecordingTimerRef.current = setTimeout(() => {
          if (isListeningRef.current) {
            recognitionRef.current?.stop();
            setIsListening(false);
            setErrorMessage(`Target lecture recording limit of ${targetLectureMinutes} minutes reached. Live transcription stopped.`);
          }
        }, targetMs);

        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        setIsListening(false);
      }
    }
  };

  // Trigger Gemini AI Summary & Mindmap creation
  const handleGenerateMindmap = async () => {
    if (!noteContent.trim()) {
      alert('Please speak or type some note content first to summarize.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setActiveWorkspaceTab('summary'); // Switch tab to show progress / results

    try {
      const response = await fetch('/api/generate-mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server returned an error generating your mindmap.');
      }

      const data = await response.json();
      setAiSummary(data.summary || 'Summary generation completed.');
      setMermaidChart(data.mermaid || '');
      
      // Auto-update loaded state if editing existing note
      if (selectedNote) {
        const noteRef = doc(db, 'voiceNotes', selectedNote.id);
        await updateDoc(noteRef, {
          summary: data.summary,
          mermaidChart: data.mermaid,
          transcript: noteContent
        });
      }
    } catch (err: any) {
      console.error('Error generating mindmap:', err);
      setErrorMessage(err.message || 'Failed to generate summary and mindmap from notes.');
    } finally {
      setIsGenerating(false);
    }
  };

  // AI Task Extraction (Voice to Task AI)
  const handleExtractTasksAI = async () => {
    if (!noteContent.trim()) {
      alert('Please write or record some lecture notes content first.');
      return;
    }

    setIsExtractingTasks(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/extract-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server returned an error extracting tasks.');
      }

      const data = await response.json();
      const extracted = data.tasks || [];

      if (extracted.length === 0) {
        alert('No explicit tasks identified by AI. Try typing tasks manually in the panel.');
        return;
      }

      // Add each identified task to the list (avoiding duplicates)
      let countAdded = 0;
      for (const tText of extracted) {
        if (!localTasks.some(t => t.text.toLowerCase() === tText.toLowerCase())) {
          await addNewTask(tText);
          countAdded++;
        }
      }

      if (countAdded > 0) {
        setVoiceCommandFeedback(`AI extracted and created ${countAdded} new To-Do items!`);
        setTimeout(() => setVoiceCommandFeedback(null), 4000);
      } else {
        alert('All identified tasks are already on your To-Do list.');
      }
    } catch (err: any) {
      console.error('Error extracting tasks:', err);
      setErrorMessage(err.message || 'Failed to extract tasks using Gemini AI.');
    } finally {
      setIsExtractingTasks(false);
    }
  };

  // Create / Add individual task
  const addNewTask = async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    const newTask: VoiceTask = {
      id: Math.random().toString(36).substring(2, 11),
      noteId: selectedNote?.id || 'temp',
      text: cleanText,
      completed: false,
      createdAt: new Date().toISOString()
    };

    if (selectedNote) {
      // Save directly to Firestore under subcollection
      try {
        const tasksCol = collection(db, 'voiceNotes', selectedNote.id, 'tasks');
        await addDoc(tasksCol, {
          id: newTask.id,
          noteId: selectedNote.id,
          text: newTask.text,
          completed: newTask.completed,
          createdAt: newTask.createdAt
        });
      } catch (err) {
        console.error('Failed to add task to Firestore:', err);
        handleFirestoreError(err, OperationType.WRITE, `voiceNotes/${selectedNote.id}/tasks`);
      }
    } else {
      // Buffer locally in memory until note is saved
      setLocalTasks(prev => [...prev, newTask]);
    }
  };

  // Toggle Task Completion State
  const toggleTaskCompleted = async (taskId: string, currentCompleted: boolean, dbId?: string) => {
    if (selectedNote && dbId) {
      try {
        const taskRef = doc(db, 'voiceNotes', selectedNote.id, 'tasks', dbId);
        await updateDoc(taskRef, {
          completed: !currentCompleted
        });
      } catch (err) {
        console.error('Failed to update task:', err);
        handleFirestoreError(err, OperationType.WRITE, `voiceNotes/${selectedNote.id}/tasks`);
      }
    } else {
      // Update local state
      setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !currentCompleted } : t));
    }
  };

  // Delete Individual Task
  const deleteTask = async (taskId: string, dbId?: string) => {
    if (selectedNote && dbId) {
      try {
        const taskRef = doc(db, 'voiceNotes', selectedNote.id, 'tasks', dbId);
        await deleteDoc(taskRef);
      } catch (err) {
        console.error('Failed to delete task:', err);
        handleFirestoreError(err, OperationType.WRITE, `voiceNotes/${selectedNote.id}/tasks`);
      }
    } else {
      setLocalTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  // Save / Update Notes to Firebase Firestore
  const handleSaveNote = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert('You must be signed in to save notes.');
      return;
    }

    if (!noteTitle.trim()) {
      alert('Please enter a note title.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (selectedNote) {
        // Update existing note
        const noteRef = doc(db, 'voiceNotes', selectedNote.id);
        await updateDoc(noteRef, {
          title: noteTitle.trim(),
          transcript: noteContent,
          summary: aiSummary,
          mermaidChart: mermaidChart
        });
        alert('Note updated successfully!');
      } else {
        // Create new note
        const notesCol = collection(db, 'voiceNotes');
        const docRef = await addDoc(notesCol, cleanUndefined({
          userId: user.uid,
          title: noteTitle.trim(),
          transcript: noteContent,
          summary: aiSummary,
          mermaidChart: mermaidChart,
          createdAt: new Date().toISOString()
        }));
        
        // Write any buffered local tasks to Firestore
        if (localTasks.length > 0) {
          const newTasksCol = collection(db, 'voiceNotes', docRef.id, 'tasks');
          for (const task of localTasks) {
            await addDoc(newTasksCol, {
              id: task.id,
              noteId: docRef.id,
              text: task.text,
              completed: task.completed,
              createdAt: task.createdAt
            });
          }
        }

        // Set newly created note as active
        setSelectedNote({
          id: docRef.id,
          userId: user.uid,
          title: noteTitle.trim(),
          transcript: noteContent,
          summary: aiSummary,
          mermaidChart: mermaidChart,
          createdAt: new Date().toISOString()
        });
        alert('New note saved successfully!');
      }
    } catch (err) {
      console.error('Error saving voice note:', err);
      setErrorMessage('Failed to save your notes to the cloud database.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete a note
  const handleDeleteNote = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this audio note?')) return;

    try {
      await deleteDoc(doc(db, 'voiceNotes', noteId));
      if (selectedNote?.id === noteId) {
        handleNewNote();
      }
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Failed to delete note. Please check connection.');
    }
  };

  // Initialize a fresh new note session
  const handleNewNote = () => {
    setSelectedNote(null);
    setNoteTitle(`Lecture Note - ${new Date().toLocaleDateString()}`);
    setNoteContent('');
    setAiSummary('');
    setMermaidChart('');
    setLocalTasks([]);
    setActiveWorkspaceTab('notes');
    setErrorMessage(null);
  };

  // Load selected note from list
  const handleSelectNote = (note: AudioNote) => {
    setSelectedNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.transcript);
    setAiSummary(note.summary || '');
    setMermaidChart(note.mermaidChart || '');
    setActiveWorkspaceTab(note.summary ? 'summary' : 'notes');
    setErrorMessage(null);
  };

  // Copy Summary Clipboard helper
  const handleCopySummary = () => {
    navigator.clipboard.writeText(aiSummary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // Copy Mermaid Chart syntax helper
  const handleCopyMermaid = () => {
    navigator.clipboard.writeText(mermaidChart);
    setCopiedMermaid(true);
    setTimeout(() => setCopiedMermaid(false), 2000);
  };

  // Export Mindmap as Vector SVG file
  const handleExportSVG = () => {
    try {
      const container = document.querySelector('.mermaid-rendered-container');
      const svgElement = container?.querySelector('svg');
      
      if (!svgElement) {
        alert('Mindmap graphic is not loaded yet. Click "Summarize & Mindmap" to generate it.');
        return;
      }
      
      const svgClone = svgElement.cloneNode(true) as SVGElement;
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      const svgString = new XMLSerializer().serializeToString(svgClone);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${noteTitle.toLowerCase().replace(/\s+/g, '_')}_mindmap.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting SVG:', err);
      alert('Unable to export SVG diagram.');
    }
  };

  // Export Mindmap as high-res PNG image
  const handleExportPNG = () => {
    try {
      const container = document.querySelector('.mermaid-rendered-container');
      const svgElement = container?.querySelector('svg');
      
      if (!svgElement) {
        alert('Mindmap graphic is not loaded yet. Click "Summarize & Mindmap" to generate it.');
        return;
      }
      
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const blobURL = URL.createObjectURL(svgBlob);
      
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 2; // high resolution scaling
        const width = svgElement.clientWidth || 800;
        const height = svgElement.clientHeight || 600;
        
        canvas.width = width * scale;
        canvas.height = height * scale;
        const context = canvas.getContext('2d');
        
        if (context) {
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.scale(scale, scale);
          context.drawImage(image, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const pngURL = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = pngURL;
              link.download = `${noteTitle.toLowerCase().replace(/\s+/g, '_')}_mindmap.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(pngURL);
            }
          }, 'image/png');
        }
        URL.revokeObjectURL(blobURL);
      };
      image.src = blobURL;
    } catch (err) {
      console.error('Error exporting PNG:', err);
      alert('Unable to export PNG image.');
    }
  };

  // Parse summary lines for compact takeaways view
  const parseTakeawayBullets = (text: string) => {
    const lines = text.split('\n');
    const listItems = lines
      .map(line => line.trim())
      .filter(line => line.startsWith('* ') || line.startsWith('- ') || /^\d+\.\s/.test(line));
    
    if (listItems.length === 0) {
      // Simple chunking of short non-empty lines
      return lines
        .map(line => line.trim())
        .filter(line => line.length > 10 && !line.startsWith('#'))
        .slice(0, 7);
    }
    
    // Clean bullet symbols for raw display text
    return listItems.map(item => item.replace(/^[\*\-\d\.]+\s+/, ''));
  };

  // Print Summary and Notes
  const handlePrintNotes = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked. Please enable pop-ups to print notes.');
      return;
    }

    const html = `
      <html>
        <head>
          <title>${noteTitle}</title>
          <style>
            body { font-family: system-ui, sans-serif; color: #1e293b; padding: 40px; line-height: 1.6; }
            h1 { color: #5f6f52; border-bottom: 2px solid #5f6f52; padding-bottom: 8px; margin-bottom: 24px; }
            h2 { color: #334155; margin-top: 32px; font-size: 1.5em; }
            .section { margin-bottom: 30px; background: #fafaf9; padding: 20px; border-radius: 8px; border: 1px solid #e7e5e4; }
            pre { background: #f1f5f9; padding: 15px; border-radius: 6px; font-family: monospace; overflow-x: auto; }
            .meta { font-size: 0.85em; color: #64748b; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>${noteTitle}</h1>
          <div class="meta">Created on: ${new Date().toLocaleString()}</div>
          
          <div class="section">
            <h2>1. Original Notes Transcript</h2>
            <div style="white-space: pre-wrap;">${noteContent}</div>
          </div>
          
          ${aiSummary ? `
          <div class="section">
            <h2>2. AI Executive Pedagogical Summary</h2>
            <div style="white-space: pre-wrap;">${aiSummary}</div>
          </div>
          ` : ''}
          
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Filter notes based on search query
  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.transcript.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-[#e5e1da] shadow-sm flex flex-col lg:flex-row h-[780px] overflow-hidden relative" id="voice-notebook-root">
      {/* Sidebar: Lecture Note History */}
      <div className="w-full lg:w-80 border-r border-[#e5e1da] bg-[#faf9f6] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#e5e1da] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#5f6f52] uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4" /> Voice Notes Library
            </span>
            <button
              onClick={handleNewNote}
              className="px-2.5 py-1 bg-white hover:bg-[#e9e5db] text-[#5f6f52] border border-[#e5e1da] rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-2xs"
            >
              + New Note
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search audio notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-white border border-[#e5e1da] rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-[#5f6f52] font-medium"
            />
          </div>
        </div>

        {/* Note List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-[11px] font-medium">Syncing library...</span>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-slate-400 px-4 space-y-1">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold">No notes found</p>
              <p className="text-[10px] text-slate-400">Speak or write to create your very first summarized mindmap note!</p>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isActive = selectedNote?.id === note.id;
              return (
                <div
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={`p-3 rounded-xl border text-left transition duration-200 cursor-pointer relative group ${
                    isActive 
                      ? 'bg-[#5f6f52]/10 border-[#5f6f52]/40 shadow-2xs' 
                      : 'bg-white border-slate-200 hover:border-[#5f6f52]/20 hover:bg-[#faf9f6]'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-800 truncate pr-5">{note.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-normal">
                    {note.transcript || 'No transcripts recorded.'}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-dashed border-slate-100">
                    <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(note.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                    {note.mermaidChart && (
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Workflow className="w-2.5 h-2.5" /> Mindmap
                      </span>
                    )}
                  </div>

                  {/* Delete note */}
                  <button
                    onClick={(e) => handleDeleteNote(note.id, e)}
                    className="absolute top-3 right-3 p-1 text-slate-300 hover:text-rose-500 rounded-lg transition duration-150 opacity-0 group-hover:opacity-100"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Workspace Header */}
        <div className="p-4 border-b border-[#e5e1da] bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex-1">
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Lecture Topic / Title..."
              className="w-full text-base font-serif font-bold text-slate-800 focus:outline-none focus:border-b focus:border-[#5f6f52] pb-0.5 bg-transparent"
            />
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                STATUS: {selectedNote ? 'SAVED CLOUD NOTE' : 'NEW TRANSCRIPT'}
              </span>
              {selectedNote && (
                <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 rounded font-mono">
                  ID: {selectedNote.id.slice(0, 8)}...
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap relative">
            {/* Lecture Target Duration Timer Button & Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTimerConfig(!showTimerConfig)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-2xs cursor-pointer ${
                  isListening
                    ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                title="Configure lecture recording countdown timer duration"
              >
                <Timer className="w-4 h-4 text-[#5f6f52]" />
                <span>{targetLectureMinutes}m Timer</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showTimerConfig ? 'rotate-180' : ''}`} />
              </button>

              {/* Timer Config Popover */}
              {showTimerConfig && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-30 space-y-3 text-left">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5 text-[#5f6f52]" /> Lecture Countdown Target
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTimerConfig(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
                    >
                      ✕
                    </button>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Quick Presets</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[15, 30, 45, 60].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => {
                            setTargetLectureMinutes(mins);
                            setShowTimerConfig(false);
                          }}
                          className={`py-1.5 rounded-lg text-xs font-bold transition border ${
                            targetLectureMinutes === mins
                              ? 'bg-[#5f6f52] text-white border-[#5f6f52]'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom minutes input */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Custom Minutes</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={targetLectureMinutes}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setTargetLectureMinutes(Math.max(1, Math.min(180, val)));
                        }}
                        className="w-full text-xs font-bold border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-[#5f6f52]"
                      />
                      <span className="text-xs text-slate-500 font-semibold">mins</span>
                    </div>
                  </div>

                  {/* Adjust on the fly during live recording */}
                  {isListening && (
                    <div className="pt-2 border-t space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Extend / Reduce Live</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => adjustLectureTarget(5)}
                          className="flex-1 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-bold hover:bg-emerald-100"
                        >
                          +5 mins
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustLectureTarget(-5)}
                          className="flex-1 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-md text-[11px] font-bold hover:bg-rose-100"
                        >
                          -5 mins
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Record Option */}
            <button
              onClick={toggleListening}
              title={`Listen and transcribe live spoken audio (Target: ${targetLectureMinutes} minutes)`}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                isListening 
                  ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' 
                  : 'bg-[#5f6f52] text-white hover:bg-[#4d5a42]'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" /> Stop Recording
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" /> Voice Listen Live
                </>
              )}
            </button>

            {/* Live Countdown Clock Badge in Header when recording */}
            {isListening && (
              <div className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-2 border border-slate-700 shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-slate-400 text-[10px] font-sans font-semibold">REMAINING:</span>
                <span className={`text-xs font-black ${remainingSeconds < 300 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                  {formatCountdownTime(remainingSeconds)}
                </span>
              </div>
            )}

            {/* AI Generate mindmap */}
            <button
              disabled={isGenerating || !noteContent.trim()}
              onClick={handleGenerateMindmap}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                noteContent.trim()
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating Mindmap...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" /> Summarize & Mindmap
                </>
              )}
            </button>

            {/* Save to library */}
            <button
              disabled={isSaving}
              onClick={handleSaveNote}
              className="px-3.5 py-2 bg-white hover:bg-[#faf9f6] text-[#5f6f52] border border-[#e5e1da] rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save</span>
            </button>

            {/* Print Note */}
            <button
              onClick={handlePrintNotes}
              className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition shadow-2xs"
              title="Print Notes"
            >
              <Volume2 className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border-b border-red-100 text-xs text-red-800 flex items-center justify-between">
            <span className="font-semibold">{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-500 font-bold hover:underline ml-4">
              Dismiss
            </button>
          </div>
        )}

        {/* Workspace tab controls */}
        <div className="border-b border-[#f4f1ea] px-4 bg-white flex justify-between items-center shrink-0">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveWorkspaceTab('notes')}
              className={`py-3 text-xs font-bold transition-all relative cursor-pointer ${
                activeWorkspaceTab === 'notes' ? 'text-[#5f6f52] border-b-2 border-[#5f6f52]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              1. Lecture Notes & Tasks
            </button>
            <button
              onClick={() => setActiveWorkspaceTab('summary')}
              className={`py-3 text-xs font-bold transition-all relative cursor-pointer ${
                activeWorkspaceTab === 'summary' ? 'text-[#5f6f52] border-b-2 border-[#5f6f52]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              2. AI Executive Summary
            </button>
            <button
              onClick={() => setActiveWorkspaceTab('mindmap')}
              className={`py-3 text-xs font-bold transition-all relative cursor-pointer ${
                activeWorkspaceTab === 'mindmap' ? 'text-[#5f6f52] border-b-2 border-[#5f6f52]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              3. Visual Concept Mindmap
            </button>
          </div>

          <div className="text-[10px] text-slate-400 font-bold hidden sm:block">
            {isListening && (
              <span className="text-red-500 flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                LIVE COMMAND PARSING ENGAGED...
              </span>
            )}
          </div>
        </div>

        {/* Active Workspace Viewport */}
        <div className="flex-1 p-5 overflow-y-auto bg-[#faf9f6] custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeWorkspaceTab === 'notes' && (
              <motion.div
                key="notes-tab"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="h-full flex flex-col gap-4 text-left"
              >
                {/* Visual Countdown Timer & Recording Panel */}
                {isListening && (
                  <div className="p-4 bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-lg flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 animate-pulse">
                          <Mic className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                              Live Recording Active
                            </span>
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                              Target: {targetLectureMinutes} mins
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Say <span className="text-amber-300 font-bold">"add task [item]"</span> to dictate action items live!
                          </span>
                        </div>
                      </div>

                      {/* Prominent Digital Countdown Readout */}
                      <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800/80">
                        <div className="text-right">
                          <span className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider block">Remaining</span>
                          <span className={`text-xl font-mono font-black tracking-tight ${remainingSeconds < 300 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                            {formatCountdownTime(remainingSeconds)}
                          </span>
                        </div>
                        <div className="h-8 w-px bg-slate-800"></div>
                        <div>
                          <span className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider block">Elapsed</span>
                          <span className="text-sm font-mono font-bold text-slate-300">
                            {formatCountdownTime(elapsedSeconds)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar with Color Transitions */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-400">Lecture Time Progress</span>
                        <span className="text-slate-300 font-mono">{Math.round(recordingProgressPct)}% ({formatCountdownTime(elapsedSeconds)} / {targetLectureMinutes}:00)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden shadow-inner flex">
                        <div
                          className={`h-full transition-all duration-500 ${
                            remainingSeconds < 300
                              ? 'bg-rose-500 shadow-rose-500/50'
                              : remainingSeconds < 600
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${recordingProgressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Low Time Warning Alert */}
                    {remainingSeconds < 300 && remainingSeconds > 0 && (
                      <div className="bg-rose-950/60 border border-rose-800/80 text-rose-200 px-3 py-1.5 rounded-xl text-xs flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                          Warning: Less than 5 minutes remaining in lecture limit!
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => adjustLectureTarget(5)}
                            className="px-2 py-0.5 bg-rose-800 hover:bg-rose-700 text-white rounded text-[10px] font-bold transition cursor-pointer"
                          >
                            +5 Mins
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!speechSupported && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 items-start text-amber-800 text-xs shadow-2xs">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Browser Speech-to-Text Support:</span>
                      Your current browser does not natively support HTML5 speech transcription. You can still type or paste your notes manually, or switch to Chrome/Safari to transcribe automatically!
                    </div>
                  </div>
                )}

                <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-5 min-h-0">
                  {/* Left Column: Note Text Editor */}
                  <div className="xl:col-span-2 flex flex-col bg-white border border-[#e5e1da] rounded-2xl shadow-2xs overflow-hidden min-h-[350px]">
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Start talking to write notes automatically using audio-to-text, or begin typing your lecture outline here..."
                      className="w-full flex-1 p-4 text-sm leading-relaxed border-0 focus:ring-0 focus:outline-none resize-none text-slate-700 bg-transparent"
                    />
                    
                    <div className="bg-[#faf9f6] border-t border-[#e5e1da] px-4 py-2.5 flex justify-between items-center text-[11px] text-slate-400 font-medium">
                      <span>
                        {noteContent.split(/\s+/).filter(Boolean).length} words | {noteContent.length} characters
                      </span>
                      <span className="text-[#5f6f52] font-semibold hidden md:inline">
                        🎤 Pro Tip: Say "add task [x]" or "todo [x]" to record action items in real-time!
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Interactive To-Do List */}
                  <div className="flex flex-col bg-white border border-[#e5e1da] rounded-2xl shadow-2xs overflow-hidden min-h-[350px]">
                    {/* Header */}
                    <div className="p-4 border-b border-[#e5e1da] bg-[#faf9f6] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ListTodo className="w-4 h-4 text-[#5f6f52]" />
                        <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Classroom To-Dos</span>
                      </div>
                      <span className="text-[10px] font-bold bg-[#5f6f52]/10 text-[#5f6f52] px-2 py-0.5 rounded-full">
                        {localTasks.filter(t => !t.completed).length} pending
                      </span>
                    </div>

                    {/* AI Extraction & Manual Form */}
                    <div className="p-3 border-b border-[#e5e1da] bg-white space-y-3">
                      {/* Voice to Task AI Button */}
                      <button
                        onClick={handleExtractTasksAI}
                        disabled={isExtractingTasks || !noteContent.trim()}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                          noteContent.trim()
                            ? 'bg-gradient-to-r from-teal-600 to-[#5f6f52] hover:from-teal-700 hover:to-[#4d5a42] text-white font-bold'
                            : 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
                        }`}
                      >
                        {isExtractingTasks ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Scanning Notes...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                            <span>Voice to Task AI</span>
                          </>
                        )}
                      </button>

                      {/* Manual Task input */}
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (newTaskInput.trim()) {
                          addNewTask(newTaskInput);
                          setNewTaskInput('');
                        }
                      }} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add task manually..."
                          value={newTaskInput}
                          onChange={(e) => setNewTaskInput(e.target.value)}
                          className="flex-1 text-xs bg-[#faf9f6] border border-[#e5e1da] rounded-xl px-3 py-2 focus:outline-none focus:border-[#5f6f52] font-medium"
                        />
                        <button
                          type="submit"
                          className="px-3 py-2 bg-[#5f6f52] text-white rounded-xl text-xs font-bold hover:bg-[#4d5a42] transition shadow-xs cursor-pointer"
                        >
                          Add
                        </button>
                      </form>
                    </div>

                    {/* Task List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-slate-50/40">
                      {localTasks.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 space-y-2 px-4">
                          <CheckSquare className="w-8 h-8 mx-auto text-slate-300" />
                          <p className="text-xs font-bold text-slate-600">No tasks recorded yet</p>
                          <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                            To-Dos automatically populate here when voice commands or AI "Voice to Task" parses your transcribed lecture!
                          </p>
                        </div>
                      ) : (
                        <AnimatePresence initial={false}>
                          {localTasks.map((task) => (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="flex items-start gap-2.5 p-2.5 bg-white border border-slate-150 rounded-xl shadow-3xs group hover:border-[#5f6f52]/30 transition"
                            >
                              <button
                                type="button"
                                onClick={() => toggleTaskCompleted(task.id, task.completed, task.dbId)}
                                className="mt-0.5 text-slate-400 hover:text-[#5f6f52] transition shrink-0"
                              >
                                {task.completed ? (
                                  <CheckSquare className="w-4 h-4 text-[#5f6f52]" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                              
                              <span className={`text-xs leading-normal flex-1 text-slate-700 font-medium ${task.completed ? 'line-through text-slate-400' : ''}`}>
                                {task.text}
                              </span>

                              <button
                                type="button"
                                onClick={() => deleteTask(task.id, task.dbId)}
                                className="text-slate-300 hover:text-rose-500 transition opacity-0 group-hover:opacity-100 p-0.5"
                                title="Delete task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeWorkspaceTab === 'summary' && (
              <motion.div
                key="summary-tab"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4 text-left"
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '3s' }} /> 
                    AI Executive Pedagogical Summary
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    {/* Summary Toggle Segmented Switch */}
                    {aiSummary && (
                      <div className="bg-[#f0ede6] p-0.5 rounded-xl border border-[#e5e1da] flex text-[10px] font-bold shadow-2xs shrink-0">
                        <button
                          onClick={() => setSummaryFormat('detailed')}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            summaryFormat === 'detailed' 
                              ? 'bg-[#5f6f52] text-white shadow-2xs' 
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Detailed Review
                        </button>
                        <button
                          onClick={() => setSummaryFormat('bullets')}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            summaryFormat === 'bullets' 
                              ? 'bg-[#5f6f52] text-white shadow-2xs' 
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Compact Takeaways
                        </button>
                      </div>
                    )}

                    {aiSummary && (
                      <button
                        onClick={handleCopySummary}
                        className="px-2.5 py-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 transition flex items-center gap-1 bg-white shadow-3xs"
                      >
                        {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedSummary ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                </div>

                {isGenerating ? (
                  <div className="bg-white border border-[#e5e1da] rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3">
                    <Loader2 className="w-8 h-8 text-[#5f6f52] animate-spin" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Summarizing Classroom Audio Notes...</p>
                      <p className="text-xs text-slate-400 mt-1">EduNexus AI is extracting pedagogy objectives, key vocabulary, and mapping the concepts.</p>
                    </div>
                  </div>
                ) : !aiSummary ? (
                  <div className="bg-white border border-[#e5e1da] rounded-2xl p-8 text-center space-y-3">
                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-[#5f6f52]">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">No AI Summary available</p>
                      <p className="text-[10px] text-slate-400 max-w-xs mx-auto mt-0.5">Click the "Summarize & Mindmap" button above to process your live notes into structured educational takeaways.</p>
                    </div>
                  </div>
                ) : summaryFormat === 'detailed' ? (
                  // Detailed original review mode
                  <div className="bg-white border border-[#e5e1da] rounded-2xl p-6 shadow-2xs leading-relaxed text-sm text-slate-700 whitespace-pre-wrap font-sans">
                    {aiSummary}
                  </div>
                ) : (
                  // Compact Takeaways Mode: parses and displays content in visual cards
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-[#e5e1da] rounded-2xl p-5 shadow-3xs space-y-3 flex flex-col">
                      <span className="text-xs font-extrabold text-[#5f6f52] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <FileCheck className="w-4 h-4 text-emerald-600" /> Core Takeaways & Vocabulary
                      </span>
                      <div className="space-y-2.5 flex-1 overflow-y-auto">
                        {parseTakeawayBullets(aiSummary).slice(0, 5).map((bullet, idx) => (
                          <div key={idx} className="flex gap-2.5 items-start text-xs leading-relaxed text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
                            <span>{bullet}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-[#e5e1da] rounded-2xl p-5 shadow-3xs space-y-3 flex flex-col">
                      <span className="text-xs font-extrabold text-[#5f6f52] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <Sparkles className="w-4 h-4 text-amber-500" /> Classroom Next Steps
                      </span>
                      <div className="space-y-2.5 flex-1 overflow-y-auto">
                        {localTasks.length === 0 ? (
                          <div className="py-6 text-center text-slate-400 text-[11px] leading-relaxed">
                            No next steps currently registered on the To-Do list. Click "Voice to Task AI" in the first tab to pull next actions!
                          </div>
                        ) : (
                          localTasks.slice(0, 5).map((task, idx) => (
                            <div key={task.id} className="flex gap-2.5 items-center text-xs leading-normal text-slate-700">
                              <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${task.completed ? 'bg-emerald-50 border-emerald-500' : 'border-slate-300'}`}>
                                {task.completed && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                              </span>
                              <span className={task.completed ? 'line-through text-slate-400' : ''}>{task.text}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeWorkspaceTab === 'mindmap' && (
              <motion.div
                key="mindmap-tab"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Workflow className="w-4 h-4 text-[#5f6f52]" /> Visual Concept Mindmap
                    </h3>
                    <p className="text-[10px] text-slate-400">Interactive node graph tracing topics, themes, and educational definitions.</p>
                  </div>
                  
                  {mermaidChart && (
                    <div className="flex items-center gap-2">
                      {/* Export Dropdown / Buttons */}
                      <button
                        onClick={handleExportSVG}
                        className="px-2.5 py-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 transition flex items-center gap-1 bg-white shadow-3xs cursor-pointer"
                        title="Download as vector SVG"
                      >
                        <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Export SVG</span>
                      </button>

                      <button
                        onClick={handleExportPNG}
                        className="px-2.5 py-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 transition flex items-center gap-1 bg-white shadow-3xs cursor-pointer"
                        title="Download as transparent PNG"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-600" />
                        <span>Export PNG</span>
                      </button>

                      <button
                        onClick={handleCopyMermaid}
                        className="px-2.5 py-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 transition flex items-center gap-1 bg-white shadow-3xs cursor-pointer"
                      >
                        {copiedMermaid ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedMermaid ? 'Copied syntax' : 'Copy Mermaid'}
                      </button>
                    </div>
                  )}
                </div>

                {isGenerating ? (
                  <div className="bg-white border border-[#e5e1da] rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3">
                    <Loader2 className="w-8 h-8 text-[#5f6f52] animate-spin" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Plotting Mindmap Connections...</p>
                      <p className="text-xs text-slate-400 mt-1">Creating a crisp, clean node-link structure representing structural connections in your lecture notes.</p>
                    </div>
                  </div>
                ) : !mermaidChart ? (
                  <div className="bg-white border border-[#e5e1da] rounded-2xl p-8 text-center space-y-3">
                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-[#5f6f52]">
                      <Workflow className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">No Mindmap Generated Yet</p>
                      <p className="text-[10px] text-slate-400 max-w-xs mx-auto mt-0.5">Summary generation automatically builds beautiful, clean concept node maps. Press "Summarize & Mindmap" to try!</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-[#e5e1da] rounded-2xl p-2 md:p-4 shadow-2xs overflow-hidden flex flex-col">
                    <MermaidDiagram chart={mermaidChart} />
                    
                    <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-left">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Generated Mermaid Source Code</span>
                      <pre className="text-[10px] font-mono text-slate-600 overflow-x-auto whitespace-pre p-2 bg-white border border-slate-150 rounded-lg">
                        {mermaidChart}
                      </pre>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Voice command parser instant feedback toast */}
      <AnimatePresence>
        {voiceCommandFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 bg-slate-800 text-white text-xs font-semibold py-3 px-4 rounded-xl shadow-lg flex items-center gap-2.5 border border-slate-700 z-50 max-w-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{voiceCommandFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
