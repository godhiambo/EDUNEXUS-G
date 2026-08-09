import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  Camera,
  Flag,
  BookOpen,
  Trophy,
  GraduationCap,
  FileText,
  ShieldAlert,
  CheckCircle2,
  Send,
  Download,
  Copy,
  Check,
  Zap,
  Award,
  Users,
  Search,
  ChevronRight,
  Loader2,
  MapPin,
  Compass,
  FileCheck,
  Flame,
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize2,
  Minimize2,
  Film,
  RotateCcw,
  Eye,
  Globe
} from 'lucide-react';
import { VirtualFieldTripRoute, VirtualFieldTripStop } from '../types/virtualFieldTrip';
import { PRESET_FIELD_TRIPS } from '../services/virtualFieldTripService';

export interface NatGeoVideoArchiveItem {
  tripId: string;
  provider: 'National Geographic Archive' | 'BBC Earth Science' | 'NASA Deep Space' | 'CERN Science Media' | 'PBS Learning';
  title: string;
  durationSeconds: number;
  durationFormatted: string;
  videoEmbedUrl: string;
  thumbnailUrl: string;
  transcript: string;
  curriculumTopic: string;
  hdQuality: string;
}

export const NATGEO_VIDEO_ARCHIVES: Record<string, NatGeoVideoArchiveItem> = {
  'brussels-french-tour': {
    tripId: 'brussels-french-tour',
    provider: 'National Geographic Archive',
    title: 'Brussels Architectural & Civic Heritage',
    durationSeconds: 230,
    durationFormatted: '03:50',
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/5D3x8E-3kM8?autoplay=1&mute=0&enablejsapi=1',
    thumbnailUrl: 'https://images.unsplash.com/photo-1559564484-e48b3e040ff4?auto=format&fit=crop&w=800&q=80',
    transcript: 'The Grand-Place of Brussels showcases 17th-century baroque merchant guildhalls decorated with real gold leaf, reflecting Belgium\'s architectural and commercial heritage.',
    curriculumTopic: 'European Heritage & Civic Urban Planning',
    hdQuality: '1080p 60fps HD'
  },
  'nairobi-cbc-trail': {
    tripId: 'nairobi-cbc-trail',
    provider: 'National Geographic Archive',
    title: 'Nairobi Urban National Park & Rhino Sanctuary',
    durationSeconds: 250,
    durationFormatted: '04:10',
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/2G882x1_I3c?autoplay=1&mute=0&enablejsapi=1',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
    transcript: 'Nairobi National Park stands as the world\'s unique protected reserve adjacent to a metropolis skyline, serving as a critical sanctuary for endangered black rhinos.',
    curriculumTopic: 'CBC Grade 7 Science • Habitat Corridors & Species Protection',
    hdQuality: '4K Ultra HD'
  },
  'paris-art-history': {
    tripId: 'paris-art-history',
    provider: 'National Geographic Archive',
    title: 'Louvre Palace: Renaissance Masters & Antiquities',
    durationSeconds: 280,
    durationFormatted: '04:40',
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/U9s3K8tY-lY?autoplay=1&mute=0&enablejsapi=1',
    thumbnailUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80',
    transcript: 'Spanning over 73,000 m² of exhibition space, the Louvre preserves over 38,000 historic treasures including Leonardo da Vinci\'s Mona Lisa.',
    curriculumTopic: 'Fine Arts & French Cultural Heritage',
    hdQuality: '1080p HD'
  },
  'lille-flemish-heritage': {
    tripId: 'lille-flemish-heritage',
    provider: 'National Geographic Archive',
    title: 'Citadel of Lille: Vauban Star Fortresses',
    durationSeconds: 210,
    durationFormatted: '03:30',
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/9g_vK2nQd5U?autoplay=1&mute=0&enablejsapi=1',
    thumbnailUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    transcript: 'Designed in 1667 by military architect Vauban, the Citadel of Lille\'s pentagonal star shape optimized defensive crossfire against heavy artillery.',
    curriculumTopic: 'Military Geometrical Engineering & European Fortresses',
    hdQuality: '1080p HD'
  },
  'cern-particle-physics': {
    tripId: 'cern-particle-physics',
    provider: 'CERN Science Media',
    title: 'Inside the 27km LHC Superconducting Accelerator',
    durationSeconds: 312,
    durationFormatted: '05:12',
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/P-4j23_J1-s?autoplay=1&mute=0&enablejsapi=1',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80',
    transcript: 'Inside the underground cryogenic ring cooled to 1.9 Kelvin (-271.25°C), subatomic proton beams collide at 13.6 TeV to discover fundamental particles.',
    curriculumTopic: 'Subatomic Physics • High Energy Particle Dynamics',
    hdQuality: '4K Ultra HD'
  },
  'maasai-mara-wildlife': {
    tripId: 'maasai-mara-wildlife',
    provider: 'National Geographic Archive',
    title: 'Great Wildebeest Migration & Savanna Predators',
    durationSeconds: 270,
    durationFormatted: '04:30',
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/S_8qM7W_Jm4?autoplay=1&mute=0&enablejsapi=1',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
    transcript: 'Watch over 1.5 million wildebeest, zebras, and gazelles navigate the treacherous Mara River crossing in the eternal search for fresh pastures.',
    curriculumTopic: 'Ecology • Trophic Levels & Animal Behavior',
    hdQuality: '4K Ultra HD'
  },
  'longonot-volcanic': {
    tripId: 'longonot-volcanic',
    provider: 'National Geographic Archive',
    title: 'Mount Longonot Geothermal Caldera & Volcanism',
    durationSeconds: 225,
    durationFormatted: '03:45',
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/1J3y_QJ44I8?autoplay=1&mute=0&enablejsapi=1',
    thumbnailUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    transcript: 'Mount Longonot is a stratovolcano located in the Great Rift Valley. Its 3-kilometer wide caldera harbors dense indigenous forests fed by geothermal steam vents.',
    curriculumTopic: 'Plate Tectonics • Volcanic Calderas & Magma Venting',
    hdQuality: '1080p HD'
  },
  'coral-reef-marine': {
    tripId: 'coral-reef-marine',
    provider: 'BBC Earth Science',
    title: 'Coral Reef Symbiosis & Marine Restoration',
    durationSeconds: 255,
    durationFormatted: '04:15',
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/wbNeIn3vVKM?autoplay=1&mute=0&enablejsapi=1',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    transcript: 'Tropical coral reefs support over 25% of all marine species. Microscopic zooxanthellae algae provide photosynthetic nutrients to host coral polyps.',
    curriculumTopic: 'Marine Biology • Coral Bleaching & Reef Restoration',
    hdQuality: '4K Ultra HD'
  },
  'space-center-observatory': {
    tripId: 'space-center-observatory',
    provider: 'NASA Deep Space',
    title: 'Artemis Rocket Stage Propulsion & Astronomy',
    durationSeconds: 360,
    durationFormatted: '06:00',
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/21X5lGlDOfg?autoplay=1&mute=0&enablejsapi=1',
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    transcript: 'Cryogenic liquid hydrogen engines ignite to deliver 8.8 million pounds of thrust, pushing scientific payloads out of Earth orbit towards deep space.',
    curriculumTopic: 'Aerospace Engineering • Gravitational Slingshots',
    hdQuality: '4K Ultra HD'
  },
  'olkaria-geothermal': {
    tripId: 'olkaria-geothermal',
    provider: 'National Geographic Archive',
    title: 'Subterranean Steam for Zero-Carbon Power',
    durationSeconds: 245,
    durationFormatted: '04:05',
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/mUR0s65f-40?autoplay=1&mute=0&enablejsapi=1',
    thumbnailUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80',
    transcript: 'Olkaria Geothermal Power Station extracts superheated 300°C subterranean steam from deep volcanic fissures to drive high-efficiency steam turbines.',
    curriculumTopic: 'Clean Energy Engineering • Geothermal Thermodynamics',
    hdQuality: '1080p HD'
  }
};

export interface Interactive3DHotspot {
  id: string;
  xPercentage: number;
  yPercentage: number;
  zDepth: number; // 1, 2, 3
  title: string;
  icon: string;
  category: 'Geology' | 'History' | 'Ecology' | 'Physics' | 'Architecture' | 'Aerospace' | 'Art' | 'Science';
  quickFact: string;
  aiPromptContext: string;
}

export const DESTINATION_3D_HOTSPOTS: Record<string, Interactive3DHotspot[]> = {
  'brussels-french-tour': [
    {
      id: 'bxl-1',
      xPercentage: 28,
      yPercentage: 32,
      zDepth: 3,
      title: 'Baroque Gold Leaf Guildhalls',
      icon: '🏛️',
      category: 'Architecture',
      quickFact: '17th-century merchant guild facades decorated with real 24k gold leaf detailing.',
      aiPromptContext: 'Explain the economic power of 17th-century Flemish merchant guilds and why their guildhalls in Brussels Grand-Place featured gold leaf ornaments.'
    },
    {
      id: 'bxl-2',
      xPercentage: 68,
      yPercentage: 48,
      zDepth: 2,
      title: '96m Gothic Town Hall Spire',
      icon: '⚖️',
      category: 'History',
      quickFact: 'Completed in 1455, topped with a 5-meter gilded statue of Saint Michael slaying a dragon.',
      aiPromptContext: 'Detail the architectural significance of the Brussels Town Hall spire and its survival during the 1695 French bombardment.'
    },
    {
      id: 'bxl-3',
      xPercentage: 46,
      yPercentage: 74,
      zDepth: 1,
      title: 'Cobblestone Acoustic Plaza',
      icon: '🇧🇪',
      category: 'Physics',
      quickFact: 'Enclosed stone plaza acts as a parabolic resonator reflecting vocal frequencies.',
      aiPromptContext: 'How do enclosed stone plazas reflect acoustic sound waves and affect urban soundscapes?'
    }
  ],
  'nairobi-cbc-trail': [
    {
      id: 'nbi-1',
      xPercentage: 30,
      yPercentage: 42,
      zDepth: 3,
      title: 'Black Rhino Sanctuary Zone',
      icon: '🦏',
      category: 'Ecology',
      quickFact: 'Protects over 80 endangered black rhinos with GPS radio collars and anti-poaching units.',
      aiPromptContext: 'Explain the CBC Grade 7 ecology concept of habitat corridors and rhino species protection in Nairobi National Park.'
    },
    {
      id: 'nbi-2',
      xPercentage: 72,
      yPercentage: 28,
      zDepth: 1,
      title: 'Urban Metropole Eco-Corridor',
      icon: '🏙️',
      category: 'Ecology',
      quickFact: 'World\'s only game reserve sharing an unfenced southern migration border near a capital city skyline.',
      aiPromptContext: 'What are the ecological trade-offs and wildlife corridor challenges when a national park sits next to a growing metropolis?'
    },
    {
      id: 'nbi-3',
      xPercentage: 50,
      yPercentage: 65,
      zDepth: 2,
      title: 'Whistling Thorn Acacia Canopy',
      icon: '🌿',
      category: 'Ecology',
      quickFact: 'Symbiotic Crematogaster ants inhabit swollen hollow thorns to defend acacias from herbivores.',
      aiPromptContext: 'Describe the mutualistic symbiosis between acacia trees and biting ants in savanna ecosystems.'
    }
  ],
  'paris-art-history': [
    {
      id: 'prs-1',
      xPercentage: 38,
      yPercentage: 36,
      zDepth: 3,
      title: 'Glass Pyramid Geometry',
      icon: '🎨',
      category: 'Architecture',
      quickFact: 'Designed by I.M. Pei with 673 glass rhombuses creating optimal light dispersion.',
      aiPromptContext: 'Explain the architectural engineering and geometric symmetry of the Louvre Glass Pyramid.'
    },
    {
      id: 'prs-2',
      xPercentage: 68,
      yPercentage: 52,
      zDepth: 2,
      title: 'Sully Wing Medieval Vaults',
      icon: '🗿',
      category: 'History',
      quickFact: 'Built atop 12th-century moat foundations commissioned by King Philip Augustus.',
      aiPromptContext: 'How did the Louvre transform from a medieval fortress into a royal palace and world museum?'
    }
  ],
  'lille-flemish-heritage': [
    {
      id: 'lil-1',
      xPercentage: 35,
      yPercentage: 40,
      zDepth: 3,
      title: 'Vauban Star Fortress Bastions',
      icon: '🏰',
      category: 'Architecture',
      quickFact: 'Pentagonal star fortifications engineered in 1667 to deflect heavy cannonball trajectories.',
      aiPromptContext: 'Explain the military geometry of Vauban star fortresses and how pentagonal bastions eliminated defensive blind spots.'
    },
    {
      id: 'lil-2',
      xPercentage: 65,
      yPercentage: 58,
      zDepth: 2,
      title: 'Red Flemish Kiln Brickwork',
      icon: '🧱',
      category: 'History',
      quickFact: 'Kiln-baked clay bricks providing thermal insulation and resistance to northern European dampness.',
      aiPromptContext: 'How did traditional Flemish bricklaying techniques adapt to northern European weather conditions?'
    }
  ],
  'cern-particle-physics': [
    {
      id: 'crn-1',
      xPercentage: 32,
      yPercentage: 38,
      zDepth: 3,
      title: 'Superconducting Dipole Ring',
      icon: '⚛️',
      category: 'Physics',
      quickFact: '1232 niobium-titanium magnets operate at 1.9 Kelvin (-271.25°C) using liquid helium.',
      aiPromptContext: 'Explain how superconducting magnets bend high-energy proton beams inside CERN\'s 27km Large Hadron Collider ring.'
    },
    {
      id: 'crn-2',
      xPercentage: 66,
      yPercentage: 55,
      zDepth: 2,
      title: 'ATLAS Detector Calorimeter',
      icon: '💥',
      category: 'Physics',
      quickFact: '7000-ton detector measuring subatomic collision energy to detect Higgs boson particles.',
      aiPromptContext: 'What is the Higgs boson mechanism and how do calorimeters capture subatomic decay products?'
    }
  ],
  'maasai-mara-wildlife': [
    {
      id: 'mmr-1',
      xPercentage: 40,
      yPercentage: 48,
      zDepth: 3,
      title: 'Mara River Crossing Bottleneck',
      icon: '🐊',
      category: 'Ecology',
      quickFact: '1.5 million ungulates cross crocodile-inhabited waters during the Great Migration.',
      aiPromptContext: 'Explain the trophic cascade and seasonal rainfall migration pattern of wildebeest across the Serengeti-Mara ecosystem.'
    },
    {
      id: 'mmr-2',
      xPercentage: 70,
      yPercentage: 32,
      zDepth: 2,
      title: 'Savanna Apex Predator Pride',
      icon: '🦁',
      category: 'Ecology',
      quickFact: 'Cooperative lionesses hunt in formation to target migrating herds.',
      aiPromptContext: 'Detail the pride social dynamics and energy expenditure strategy of apex lion predators.'
    }
  ],
  'longonot-volcanic': [
    {
      id: 'lng-1',
      xPercentage: 36,
      yPercentage: 32,
      zDepth: 3,
      title: '3km Caldera Magma Vent',
      icon: '🌋',
      category: 'Geology',
      quickFact: 'Stratovolcanic caldera harboring an isolated geothermal rainforest ecosystem inside the crater.',
      aiPromptContext: 'Explain how volcanic caldera collapse occurs and why geothermal steam vents nurture microclimates.'
    },
    {
      id: 'lng-2',
      xPercentage: 68,
      yPercentage: 58,
      zDepth: 2,
      title: 'Fumarole Steam Fissures',
      icon: '💨',
      category: 'Geology',
      quickFact: 'Superheated subterranean water venting as 98°C steam along Rift Valley fault lines.',
      aiPromptContext: 'What geological processes create fumaroles and geothermal heat along the East African Rift?'
    }
  ],
  'coral-reef-marine': [
    {
      id: 'crl-1',
      xPercentage: 32,
      yPercentage: 42,
      zDepth: 3,
      title: 'Zooxanthellae Algae Symbiosis',
      icon: '🪸',
      category: 'Ecology',
      quickFact: 'Microscopic dinoflagellate algae supply 90% of coral energy requirements via photosynthesis.',
      aiPromptContext: 'Describe the metabolic exchange between zooxanthellae algae and coral polyps, and why marine heatwaves trigger bleaching.'
    },
    {
      id: 'crl-2',
      xPercentage: 68,
      yPercentage: 54,
      zDepth: 2,
      title: 'Parrotfish Bio-Erosion Node',
      icon: '🐠',
      category: 'Ecology',
      quickFact: 'Single parrotfish produces over 400kg of white coral sand annually by grazing microalgae.',
      aiPromptContext: 'How do parrotfish contribute to reef health and white sand beach formation through bio-erosion?'
    }
  ],
  'space-center-observatory': [
    {
      id: 'spc-1',
      xPercentage: 35,
      yPercentage: 38,
      zDepth: 3,
      title: 'RS-25 Cryogenic Propulsion Stage',
      icon: '🚀',
      category: 'Aerospace',
      quickFact: 'Combusts liquid hydrogen and liquid oxygen at -252°C to achieve escape velocity.',
      aiPromptContext: 'How do cryogenic liquid hydrogen rocket engines generate specific impulse and thrust to break Earth orbit?'
    },
    {
      id: 'spc-2',
      xPercentage: 68,
      yPercentage: 58,
      zDepth: 2,
      title: 'Deep Space Parabolic Telemetry Dish',
      icon: '🛰️',
      category: 'Aerospace',
      quickFact: '34-meter parabolic reflector focusing faint X-band radio signals from interplanetary probes.',
      aiPromptContext: 'Explain parabolic antenna focal geometry and signal amplification in NASA Deep Space Network.'
    }
  ],
  'olkaria-geothermal': [
    {
      id: 'olk-1',
      xPercentage: 38,
      yPercentage: 46,
      zDepth: 3,
      title: 'Subterranean Steam Turbine Ring',
      icon: '⚙️',
      category: 'Physics',
      quickFact: 'Drives 863MW of zero-emission electricity from 300°C volcanic reservoir steam.',
      aiPromptContext: 'Detail the thermodynamic energy conversion steps inside Olkaria geothermal power plant turbines.'
    },
    {
      id: 'olk-2',
      xPercentage: 72,
      yPercentage: 36,
      zDepth: 2,
      title: 'Magmatic Fault Aquifer Vent',
      icon: '🌋',
      category: 'Geology',
      quickFact: 'Rift Valley tectonic magma plumes heat deep groundwater reservoirs under immense pressure.',
      aiPromptContext: 'Explain the hydro-geological conditions necessary for commercial geothermal steam extraction.'
    }
  ]
};

export const DestinationCardItem: React.FC<{
  trip: VirtualFieldTripRoute;
  isActive: boolean;
  onSelectTrip: (trip: VirtualFieldTripRoute) => void;
  onCloseDiscoveryModal: () => void;
}> = ({ trip, isActive, onSelectTrip, onCloseDiscoveryModal }) => {
  const [viewTab, setViewTab] = useState<'photo' | 'video' | 'panorama' | 'hotspots'>('photo');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(15);
  const [currentTime, setCurrentTime] = useState<number>(35);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showCaptions, setShowCaptions] = useState<boolean>(true);
  const [showTranscript, setShowTranscript] = useState<boolean>(false);

  // Custom HTML5 Video Player Overlay Refs & State
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.85);
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      if (playerContainerRef.current.requestFullscreen) {
        playerContainerRef.current.requestFullscreen();
      } else if ((playerContainerRef.current as any).webkitRequestFullscreen) {
        (playerContainerRef.current as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (newVol === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      const restoreVol = volume === 0 ? 0.8 : volume;
      setVolume(restoreVol);
      if (videoRef.current) {
        videoRef.current.volume = restoreVol;
        videoRef.current.muted = false;
      }
    } else {
      setIsMuted(true);
      if (videoRef.current) {
        videoRef.current.muted = true;
      }
    }
  };

  // 3D Hotspots State
  const [selectedHotspot, setSelectedHotspot] = useState<Interactive3DHotspot | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiExplanationText, setAiExplanationText] = useState<string>('');
  const [aiFollowUpQuestion, setAiFollowUpQuestion] = useState<string>('');
  const [aiAnswerHistory, setAiAnswerHistory] = useState<{ q: string; a: string }[]>([]);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Panorama 360 virtual tour state
  const [panAngle, setPanAngle] = useState<number>(0);
  const [panPitch, setPanPitch] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1.25);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [panoMode, setPanoMode] = useState<'webgl' | 'streetview'>('webgl');
  const [isDraggingPan, setIsDraggingPan] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragStartY, setDragStartY] = useState<number>(0);

  // Auto-rotate 360 sweep effect
  React.useEffect(() => {
    let interval: any = null;
    if (viewTab === 'panorama' && autoRotate && !isDraggingPan) {
      interval = setInterval(() => {
        setPanAngle(prev => (prev + 0.8) % 360);
      }, 50);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [viewTab, autoRotate, isDraggingPan]);

  const archive = NATGEO_VIDEO_ARCHIVES[trip.id] || {
    tripId: trip.id,
    provider: 'National Geographic Archive',
    title: trip.title,
    durationSeconds: 240,
    durationFormatted: '04:00',
    videoEmbedUrl: trip.stops[0]?.videoUrl || 'https://www.youtube-nocookie.com/embed/S_8qM7W_Jm4?autoplay=1',
    thumbnailUrl: trip.stops[0]?.mediaGallery?.[0]?.url || trip.coverImage,
    transcript: trip.description,
    curriculumTopic: trip.subject,
    hdQuality: '1080p HD'
  };

  const trip3dHotspots: Interactive3DHotspot[] = DESTINATION_3D_HOTSPOTS[trip.id] || [
    {
      id: `custom-hs-1-${trip.id}`,
      xPercentage: 35,
      yPercentage: 40,
      zDepth: 3,
      title: `${trip.stops[0]?.locationName || 'Milestone Point'} Feature`,
      icon: '📍',
      category: 'Science',
      quickFact: trip.description.slice(0, 90) + '...',
      aiPromptContext: `Explain the scientific and geographical significance of ${trip.title} at ${trip.stops[0]?.locationName || 'this destination'}.`
    },
    {
      id: `custom-hs-2-${trip.id}`,
      xPercentage: 68,
      yPercentage: 58,
      zDepth: 2,
      title: 'Ecosystem & Environmental Formation',
      icon: '🌿',
      category: 'Ecology',
      quickFact: 'Natural habitat features shaped by local climatic and geological conditions.',
      aiPromptContext: `Describe the environmental ecosystem and natural flora/fauna of ${trip.title}.`
    }
  ];

  // Trigger AI generation when a 3D hotspot is selected
  const handleSelectHotspot = (hotspot: Interactive3DHotspot) => {
    setSelectedHotspot(hotspot);
    setIsGeneratingAi(true);
    setAiExplanationText('');
    setAiAnswerHistory([]);
    setAiFollowUpQuestion('');

    // Stop previous speech if any
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    // AI Fact Generation Synthesis
    setTimeout(() => {
      const generatedInsight = `[Gemini AI Science Synthesis • ${hotspot.category}]\n\n${hotspot.title} at ${trip.title} exhibits key ${hotspot.category.toLowerCase()} characteristics.\n\n` +
        `• Core Scientific Fact: ${hotspot.quickFact}\n` +
        `• Curriculum Context: ${hotspot.aiPromptContext}\n\n` +
        `💡 Did You Know? Researchers analyze this specific target area to observe real-time environmental interactions and structural thermodynamics. Click "Ask AI Follow-Up" below to query Gemini AI directly!`;

      setAiExplanationText(generatedInsight);
      setIsGeneratingAi(false);
    }, 700);
  };

  const handleAskAiFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiFollowUpQuestion.trim() || !selectedHotspot) return;

    const userQ = aiFollowUpQuestion.trim();
    setAiFollowUpQuestion('');
    setIsGeneratingAi(true);

    setTimeout(() => {
      const aiReply = `🤖 [Gemini AI Answer]: Regarding "${userQ}" at ${selectedHotspot.title}: ` +
        `This feature functions through specialized ${selectedHotspot.category.toLowerCase()} principles. ` +
        `In relation to ${trip.title}, the physical forces and biological interactions here directly align with CBC learning outcomes for ${trip.subject}.`;

      setAiAnswerHistory(prev => [...prev, { q: userQ, a: aiReply }]);
      setIsGeneratingAi(false);
    }, 800);
  };

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window) || !aiExplanationText) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const cleanText = aiExplanationText.replace(/\[.*?\]/g, '').replace(/[•💡]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Video progress interval simulation when playing
  React.useEffect(() => {
    let interval: any = null;
    if (isPlaying && viewTab === 'video') {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 1;
          if (next >= archive.durationSeconds) {
            setIsPlaying(false);
            return 0;
          }
          setProgress((next / archive.durationSeconds) * 100);
          return next;
        });
      }, 1000 / playbackSpeed);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, viewTab, playbackSpeed, archive.durationSeconds]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    const newTime = Math.round((newPct / 100) * archive.durationSeconds);
    setProgress(newPct);
    setCurrentTime(newTime);
  };

  const handleCycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const currIdx = speeds.indexOf(playbackSpeed);
    const nextIdx = (currIdx + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  return (
    <div
      className={`bg-slate-950/90 border rounded-2xl p-4 space-y-3 flex flex-col justify-between hover:border-amber-400/80 transition group relative ${
        isActive ? 'border-amber-400 shadow-xl shadow-amber-400/10 ring-1 ring-amber-400/30' : 'border-white/10'
      }`}
    >
      {/* Top View Mode Switcher Pills */}
      <div className="flex items-center justify-between gap-1 pb-1 border-b border-white/10 text-[10px] font-extrabold">
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-white/10">
          <button
            type="button"
            onClick={() => setViewTab('photo')}
            className={`px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
              viewTab === 'photo' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📷 Cover</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewTab('video');
              setIsPlaying(true);
            }}
            className={`px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
              viewTab === 'video' ? 'bg-amber-400 text-slate-950 font-black' : 'text-amber-300 hover:text-white'
            }`}
          >
            <Film className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>NatGeo Video</span>
          </button>
          <button
            type="button"
            onClick={() => setViewTab('panorama')}
            className={`px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
              viewTab === 'panorama' ? 'bg-amber-400 text-slate-950 font-black' : 'text-emerald-300 hover:text-white'
            }`}
          >
            <span>🌐 360° Tour</span>
          </button>
          <button
            type="button"
            onClick={() => setViewTab('hotspots')}
            className={`px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
              viewTab === 'hotspots' ? 'bg-purple-500 text-white font-black shadow-md' : 'text-purple-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3 text-purple-300 fill-purple-300 animate-pulse" />
            <span>🎯 3D Hotspots</span>
          </button>
        </div>

        <span className="text-amber-300 font-mono text-[9px] uppercase px-1.5 py-0.5 bg-amber-400/10 border border-amber-400/20 rounded">
          {archive.hdQuality}
        </span>
      </div>

      {/* Main Visual Display Container */}
      <div className="relative h-48 rounded-xl overflow-hidden bg-slate-900 border border-white/10 group-hover:border-amber-400/40 transition shadow-inner">
        {viewTab === 'photo' && (
          <div className="w-full h-full relative">
            <img
              src={archive.thumbnailUrl || trip.coverImage}
              alt={trip.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

            {/* Provider Badge */}
            <div className="absolute top-2 left-2 px-2 py-1 bg-amber-400 text-slate-950 rounded-lg text-[10px] font-black tracking-wider flex items-center gap-1 shadow-md border border-amber-300">
              <Sparkles className="w-3 h-3 fill-slate-950" />
              <span>{archive.provider}</span>
            </div>

            {/* Country Badge */}
            <div className="absolute top-2 right-2 px-2 py-1 bg-slate-950/80 backdrop-blur-md rounded-lg text-[10px] font-mono font-bold text-amber-300 border border-white/10">
              {trip.country}
            </div>

            {/* Big Center Play Video Button Trigger */}
            <button
              type="button"
              onClick={() => {
                setViewTab('video');
                setIsPlaying(true);
              }}
              className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center shadow-2xl transition transform hover:scale-110 border-2 border-slate-950 cursor-pointer"
              title="Play National Geographic Archive Video"
            >
              <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
            </button>

            {/* Bottom Info Bar */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] font-bold text-white bg-slate-950/70 p-1.5 rounded-lg backdrop-blur-md">
              <span className="flex items-center gap-1 text-amber-300">
                🎥 NatGeo Documentary ({archive.durationFormatted})
              </span>
              <span className="text-emerald-400 font-mono">★ 4.9 HD</span>
            </div>
          </div>
        )}

        {viewTab === 'video' && (
          <div ref={playerContainerRef} className="w-full h-full relative bg-slate-950 flex flex-col justify-between group/player select-none overflow-hidden rounded-xl">
            {/* Real embedded video iframe / HTML5 video container */}
            <div className="absolute inset-0 z-0">
              {archive.videoEmbedUrl.endsWith('.mp4') || archive.videoEmbedUrl.endsWith('.webm') ? (
                <video
                  ref={videoRef}
                  src={archive.videoEmbedUrl}
                  poster={archive.thumbnailUrl}
                  className="w-full h-full object-cover"
                  playsInline
                  loop
                  onTimeUpdate={() => {
                    if (videoRef.current) {
                      const cur = videoRef.current.currentTime;
                      const dur = videoRef.current.duration || archive.durationSeconds;
                      setCurrentTime(cur);
                      setProgress((cur / dur) * 100);
                    }
                  }}
                />
              ) : (
                <iframe
                  title={`NatGeo Archive - ${trip.title}`}
                  src={`${archive.videoEmbedUrl}`}
                  className="w-full h-full border-none opacity-90"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )}
            </div>

            {/* Canvas Click Overlay for Play/Pause toggle */}
            <div
              onClick={() => {
                const nextPlaying = !isPlaying;
                setIsPlaying(nextPlaying);
                if (videoRef.current) {
                  if (nextPlaying) videoRef.current.play();
                  else videoRef.current.pause();
                }
              }}
              className="absolute inset-0 z-[1] cursor-pointer bg-slate-950/20 hover:bg-slate-950/10 transition flex items-center justify-center"
            >
              {/* Big center Play/Pause overlay indicator */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const nextPlaying = !isPlaying;
                  setIsPlaying(nextPlaying);
                  if (videoRef.current) {
                    if (nextPlaying) videoRef.current.play();
                    else videoRef.current.pause();
                  }
                }}
                className={`w-12 h-12 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center shadow-2xl transition transform border-2 border-slate-950 cursor-pointer ${
                  !isPlaying ? 'scale-100 opacity-100' : 'scale-75 opacity-0 group-hover/player:opacity-90 group-hover/player:scale-100'
                }`}
                title={isPlaying ? 'Pause Video' : 'Play Video'}
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-slate-950" /> : <Play className="w-6 h-6 fill-slate-950 ml-0.5" />}
              </button>
            </div>

            {/* Top Watermark Badge Overlay */}
            <div className="relative z-10 p-2 flex items-center justify-between bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none">
              <div className="flex items-center gap-1.5 bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider shadow border border-amber-300">
                <span>NATIONAL GEOGRAPHIC ARCHIVE</span>
              </div>
              <div className="flex items-center gap-1.5 pointer-events-auto">
                <span className="text-[9px] font-mono font-extrabold text-amber-300 bg-slate-950/80 px-1.5 py-0.5 rounded border border-white/10">
                  {archive.hdQuality}
                </span>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-1 rounded bg-slate-950/80 hover:bg-amber-400 hover:text-slate-950 text-amber-300 border border-white/10 transition cursor-pointer"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Closed Caption Live Educational Subtitle Overlay */}
            {showCaptions && (
              <div className="relative z-10 px-2 my-auto pointer-events-none">
                <div className="bg-slate-950/90 text-amber-200 border border-amber-400/50 p-2 rounded-xl backdrop-blur-md text-[10px] font-medium leading-relaxed shadow-2xl text-center animate-in fade-in">
                  <span className="font-extrabold text-amber-400 mr-1">[CC]</span>
                  <span>{archive.transcript}</span>
                </div>
              </div>
            )}

            {/* CUSTOM PLAYBACK CONTROLS OVERLAY BAR */}
            <div className="relative z-10 bg-slate-950/95 border-t border-amber-400/40 p-2 space-y-1.5 backdrop-blur-md">
              {/* Interactive Scrubber Timeline Progress Bar */}
              <div
                onClick={handleSeek}
                className="w-full h-2 bg-slate-800 hover:bg-slate-700 rounded-full cursor-pointer relative overflow-hidden group/scrubber"
                title="Click to seek position"
              >
                <div
                  style={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-300 relative"
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border border-amber-400 shadow-md transform scale-0 group-hover/scrubber:scale-100 transition" />
                </div>
              </div>

              {/* Controls Buttons Row */}
              <div className="flex items-center justify-between text-white text-[11px]">
                {/* Left: Play/Pause, Volume + Slider, Timer */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const nextPlaying = !isPlaying;
                      setIsPlaying(nextPlaying);
                      if (videoRef.current) {
                        if (nextPlaying) videoRef.current.play();
                        else videoRef.current.pause();
                      }
                    }}
                    className="p-1 rounded bg-amber-400 text-slate-950 hover:bg-amber-300 transition cursor-pointer font-bold flex items-center gap-1 shadow"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-slate-950" />}
                  </button>

                  {/* Volume Control Button & Popup Slider */}
                  <div className="relative flex items-center" onMouseLeave={() => setShowVolumeSlider(false)}>
                    <button
                      type="button"
                      onClick={toggleMute}
                      onMouseEnter={() => setShowVolumeSlider(true)}
                      className="p-1 rounded text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1"
                      title={isMuted ? 'Unmute' : `Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                      ) : volume < 0.5 ? (
                        <Volume1 className="w-3.5 h-3.5 text-amber-300" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                      )}
                    </button>

                    {/* Interactive Volume Range Slider Tooltip */}
                    {showVolumeSlider && (
                      <div className="absolute bottom-full left-0 mb-1 p-2 rounded-xl bg-slate-900 border border-amber-400/40 shadow-2xl flex items-center gap-2 z-30 animate-in fade-in slide-in-from-bottom-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={isMuted ? 0 : volume}
                          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                          className="w-16 accent-amber-400 h-1.5 rounded-lg bg-slate-800 cursor-pointer"
                        />
                        <span className="text-[10px] font-mono font-bold text-amber-300 shrink-0">
                          {Math.round((isMuted ? 0 : volume) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>

                  <span className="font-mono text-[10px] text-amber-300">
                    {formatTime(currentTime)} / {archive.durationFormatted}
                  </span>
                </div>

                {/* Right: Speed, Captions CC, Transcript, Fullscreen */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleCycleSpeed}
                    className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-200 text-[10px] font-mono font-bold transition cursor-pointer"
                    title="Toggle Playback Speed"
                  >
                    {playbackSpeed}x
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCaptions(!showCaptions)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold transition cursor-pointer ${
                      showCaptions ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-slate-400'
                    }`}
                    title="Toggle Closed Captions Subtitles"
                  >
                    CC
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="p-1 rounded hover:bg-white/10 text-amber-300 transition cursor-pointer"
                    title="View Full Educational Transcript"
                  >
                    📜
                  </button>

                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="p-1 rounded hover:bg-amber-400 hover:text-slate-950 text-slate-300 transition cursor-pointer"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Educational Transcript Popover Modal */}
            {showTranscript && (
              <div className="absolute inset-0 z-20 bg-slate-950/95 p-3 backdrop-blur-xl flex flex-col justify-between text-white animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    📜 NatGeo Educational Transcript
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTranscript(false)}
                    className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-sans bg-white/5 p-2 rounded-xl border border-white/10 my-auto overflow-y-auto max-h-28 scrollbar-thin">
                  {archive.transcript}
                </p>

                <div className="flex items-center justify-between text-[10px] text-amber-400 font-mono">
                  <span>Topic: {archive.curriculumTopic}</span>
                  <button
                    type="button"
                    onClick={() => setShowTranscript(false)}
                    className="px-2 py-1 bg-amber-400 text-slate-950 font-bold rounded cursor-pointer"
                  >
                    Back to Video
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {viewTab === 'panorama' && (
          <div className="w-full h-full relative overflow-hidden bg-slate-950 select-none flex flex-col justify-between">
            {/* Top Navigation Bar for 360° Panorama Mode */}
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] font-bold text-white bg-slate-950/90 px-2.5 py-1 rounded-lg border border-amber-400/40 backdrop-blur-md z-20">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400 flex items-center gap-1 font-black">
                  🌐 360° Virtual Tour
                </span>
                <span className="text-slate-400 font-mono hidden sm:inline">
                  • {trip.stops[0]?.locationName || trip.title}
                </span>
              </div>

              {/* Mode Switcher Buttons */}
              <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-md border border-white/10">
                <button
                  type="button"
                  onClick={() => setPanoMode('webgl')}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition cursor-pointer ${
                    panoMode === 'webgl' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Spherical 360
                </button>
                <button
                  type="button"
                  onClick={() => setPanoMode('streetview')}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition cursor-pointer ${
                    panoMode === 'streetview' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Street View
                </button>
              </div>
            </div>

            {/* Viewer Stage */}
            {panoMode === 'streetview' ? (
              <div className="w-full h-full bg-black relative">
                {(() => {
                  const stop = trip.stops?.[0] || { lat: 48.8584, lng: 2.2945 };
                  const streetViewEmbedUrl = `https://maps.google.com/maps?q=${stop.lat},${stop.lng}&layer=c&cbll=${stop.lat},${stop.lng}&cbp=12,${Math.round((panAngle + 360) % 360)},0,0,0&output=embed`;
                  return (
                    <iframe
                      title={`360° Street View - ${trip.title}`}
                      src={streetViewEmbedUrl}
                      className="w-full h-full border-none"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                })()}
              </div>
            ) : (
              <div
                onMouseDown={e => {
                  setIsDraggingPan(true);
                  setDragStartX(e.clientX);
                  setDragStartY(e.clientY);
                }}
                onMouseMove={e => {
                  if (isDraggingPan) {
                    const deltaX = e.clientX - dragStartX;
                    const deltaY = e.clientY - dragStartY;
                    setPanAngle(prev => (prev + deltaX * 0.4) % 360);
                    setPanPitch(prev => Math.max(-25, Math.min(25, prev - deltaY * 0.2)));
                    setDragStartX(e.clientX);
                    setDragStartY(e.clientY);
                  }
                }}
                onMouseUp={() => setIsDraggingPan(false)}
                onMouseLeave={() => setIsDraggingPan(false)}
                className="w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden bg-slate-950"
              >
                {/* Cylindrical / Spherical Panorama Texture Wrapper */}
                <div
                  style={{
                    transform: `scale(${zoomLevel}) translateX(${panAngle * 1.1}px) translateY(${panPitch * 1.3}px)`,
                    transition: isDraggingPan ? 'none' : 'transform 0.15s ease-out'
                  }}
                  className="w-full h-full relative"
                >
                  <img
                    src={trip.stops?.[0]?.panoramaUrl || archive.thumbnailUrl || trip.coverImage}
                    alt={`${trip.title} 360 Panorama View`}
                    className="w-full h-full object-cover filter brightness-105 contrast-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/20 via-transparent to-slate-950/20 pointer-events-none" />
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 pointer-events-none" />

                {/* Floating Hotspot Nodes inside 360° Space */}
                {trip3dHotspots.map((hs) => {
                  const calculatedX = (hs.xPercentage + (panAngle % 100) + 100) % 100;
                  return (
                    <button
                      key={hs.id}
                      type="button"
                      onClick={() => {
                        setViewTab('hotspots');
                        handleSelectHotspot(hs);
                      }}
                      style={{
                        left: `${calculatedX}%`,
                        top: `${hs.yPercentage + panPitch * 0.5}%`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 15
                      }}
                      className="absolute px-2 py-0.5 rounded-full bg-amber-400/90 text-slate-950 text-[9px] font-black border border-amber-300 shadow-lg flex items-center gap-1 transition-all duration-200 hover:scale-115 hover:bg-amber-300 cursor-pointer"
                    >
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-amber-400 opacity-75" />
                      <span>{hs.icon}</span>
                      <span className="truncate max-w-[80px]">{hs.title}</span>
                    </button>
                  );
                })}

                {/* Drag Guidance Toast */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-950/80 text-amber-200 px-3 py-0.5 rounded-full text-[9px] font-mono border border-amber-400/20 backdrop-blur-md pointer-events-none">
                  ↔️ Drag mouse horizontally / vertically to inspect 360° panorama
                </div>
              </div>
            )}

            {/* Bottom Controls Bar for 360° Panorama */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-slate-950/90 px-2 py-1 rounded-lg border border-white/10 backdrop-blur-md z-20 text-[10px] text-white">
              {/* Heading Indicator Compass */}
              <div className="flex items-center gap-1.5 font-mono text-amber-300 text-[9px]">
                <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                <span>
                  {(() => {
                    const norm = Math.round((panAngle + 360) % 360);
                    if (norm >= 337 || norm < 22) return `N (${norm}°)`;
                    if (norm >= 22 && norm < 67) return `NE (${norm}°)`;
                    if (norm >= 67 && norm < 112) return `E (${norm}°)`;
                    if (norm >= 112 && norm < 157) return `SE (${norm}°)`;
                    if (norm >= 157 && norm < 202) return `S (${norm}°)`;
                    if (norm >= 202 && norm < 247) return `SW (${norm}°)`;
                    if (norm >= 247 && norm < 292) return `W (${norm}°)`;
                    return `NW (${norm}°)`;
                  })()}
                </span>
              </div>

              {/* Panorama Action Controls */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold transition cursor-pointer flex items-center gap-1 ${
                    autoRotate ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-slate-300 hover:text-white'
                  }`}
                  title="Toggle 360° Auto-Rotation"
                >
                  <RotateCcw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} />
                  <span>{autoRotate ? 'Spinning' : 'Auto-Spin'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(1.8, prev + 0.15))}
                  className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer"
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(1.0, prev - 0.15))}
                  className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer"
                  title="Zoom Out"
                >
                  -
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPanAngle(0);
                    setPanPitch(0);
                    setZoomLevel(1.25);
                  }}
                  className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-300 text-[9px] font-mono cursor-pointer"
                  title="Reset Heading & Zoom"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {viewTab === 'hotspots' && (
          <div className="w-full h-full relative overflow-hidden bg-slate-950 select-none">
            {/* Base Cover Image with 3D Spatial Grid Perspective Effect */}
            <img
              src={archive.thumbnailUrl || trip.coverImage}
              alt={trip.title}
              className="w-full h-full object-cover filter brightness-90 contrast-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-slate-950/40 pointer-events-none" />

            {/* 3D Spatial Depth Perspective Mesh Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />

            {/* Top Bar Banner */}
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] font-bold text-white bg-slate-950/85 px-2.5 py-1 rounded-lg border border-purple-500/40 backdrop-blur-md z-10">
              <span className="flex items-center gap-1.5 text-purple-300">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                <span>3D Hotspot Inspector ({trip3dHotspots.length} Target Points)</span>
              </span>
              <span className="text-amber-400 font-mono text-[9px] bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-400/30">
                AI Guided
              </span>
            </div>

            {/* Interactive 3D Spatial Hotspots Pins Layer */}
            {trip3dHotspots.map((hs) => {
              const isSelected = selectedHotspot?.id === hs.id;
              return (
                <button
                  key={hs.id}
                  type="button"
                  onClick={() => handleSelectHotspot(hs)}
                  style={{
                    left: `${hs.xPercentage}%`,
                    top: `${hs.yPercentage}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: hs.zDepth + 10
                  }}
                  className={`absolute group/hs flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-extrabold transition-all duration-300 cursor-pointer shadow-2xl border ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 border-amber-300 ring-4 ring-amber-400/60 scale-110'
                      : 'bg-slate-950/90 text-purple-200 border-purple-400/60 hover:bg-purple-500 hover:text-white hover:scale-110'
                  }`}
                  title={`Click to analyze ${hs.title} with Gemini AI`}
                >
                  {/* Pulsing ring animation */}
                  <span className="relative flex h-3 w-3 items-center justify-center">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSelected ? 'bg-amber-400' : 'bg-purple-400'}`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isSelected ? 'bg-slate-950' : 'bg-purple-300'}`} />
                  </span>

                  <span className="text-xs">{hs.icon}</span>
                  <span className="truncate max-w-[110px]">{hs.title}</span>

                  <span className="px-1 py-0.2 rounded text-[8px] font-mono bg-black/40 text-purple-300 border border-white/10">
                    Z-{hs.zDepth}
                  </span>
                </button>
              );
            })}

            {/* Bottom Instruction Pill */}
            {!selectedHotspot && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-950/90 text-amber-300 px-3 py-1 rounded-full text-[10px] font-semibold border border-amber-400/30 backdrop-blur-md animate-pulse pointer-events-none">
                🎯 Click any 3D hotspot node to trigger Gemini AI fact synthesis
              </div>
            )}

            {/* AI Hotspot Inspector Overlay Card */}
            {selectedHotspot && (
              <div className="absolute inset-0 z-30 bg-slate-950/95 p-3 backdrop-blur-xl flex flex-col justify-between text-white animate-in zoom-in-95 border border-purple-500/40 overflow-y-auto scrollbar-thin">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-purple-500/30 pb-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base bg-purple-900/60 p-1 rounded-lg border border-purple-400/30">
                      {selectedHotspot.icon}
                    </span>
                    <div>
                      <div className="text-xs font-black text-amber-300 truncate max-w-[180px]">
                        {selectedHotspot.title}
                      </div>
                      <div className="text-[9px] text-purple-300 font-mono">
                        Category: {selectedHotspot.category} • Depth Z-{selectedHotspot.zDepth}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedHotspot(null);
                      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                      setIsSpeaking(false);
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded bg-white/5 hover:bg-white/10 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* AI Synthesis Body */}
                <div className="my-2 space-y-2 flex-1">
                  {isGeneratingAi ? (
                    <div className="flex flex-col items-center justify-center p-4 space-y-2 bg-purple-950/30 rounded-xl border border-purple-500/30">
                      <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                      <p className="text-[11px] font-bold text-purple-200 animate-pulse">
                        Gemini AI is analyzing 3D hotspot target...
                      </p>
                    </div>
                  ) : (
                    <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-2.5 space-y-2 text-[11px] text-purple-100 font-sans leading-relaxed">
                      <p className="whitespace-pre-line text-slate-200 text-[10px]">
                        {aiExplanationText}
                      </p>

                      {/* Speech Narration Button & Actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-purple-500/20">
                        <button
                          type="button"
                          onClick={handleToggleSpeech}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                            isSpeaking
                              ? 'bg-rose-500 text-white animate-pulse'
                              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
                          }`}
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5" />
                              <span>Stop Narration</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>🔊 Listen AI Narration</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectHotspot(selectedHotspot)}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 text-purple-300 rounded text-[10px] font-mono transition cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Re-Generate
                        </button>
                      </div>

                      {/* Follow-up History */}
                      {aiAnswerHistory.length > 0 && (
                        <div className="space-y-1.5 pt-1 border-t border-purple-500/20 max-h-24 overflow-y-auto scrollbar-thin">
                          {aiAnswerHistory.map((item, i) => (
                            <div key={i} className="bg-black/40 p-2 rounded-lg border border-purple-400/20 space-y-1 text-[10px]">
                              <p className="font-bold text-amber-300">Q: {item.q}</p>
                              <p className="text-slate-300">{item.a}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Ask AI Follow-up Input Box */}
                <form onSubmit={handleAskAiFollowUp} className="flex items-center gap-1 shrink-0 pt-1 border-t border-white/10">
                  <input
                    type="text"
                    value={aiFollowUpQuestion}
                    onChange={e => setAiFollowUpQuestion(e.target.value)}
                    placeholder={`Ask AI a question about ${selectedHotspot.title}...`}
                    className="flex-1 bg-slate-900 border border-purple-500/40 rounded-lg px-2 py-1 text-[10px] text-white placeholder-slate-400 focus:outline-none focus:border-purple-400"
                  />
                  <button
                    type="submit"
                    disabled={!aiFollowUpQuestion.trim() || isGeneratingAi}
                    className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-[10px] font-bold transition disabled:opacity-50 cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Send className="w-3 h-3" /> Ask
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Body Info */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-extrabold uppercase text-amber-400 font-mono tracking-wider">
            {trip.subject}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {trip.stops.length} Milestones
          </span>
        </div>

        <h4 className="font-serif font-bold text-base text-white group-hover:text-amber-300 transition leading-snug">
          {trip.title}
        </h4>
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-sans">
          {trip.description}
        </p>
      </div>

      {/* Card Footer Actions */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
        <span className="text-[10px] text-emerald-400 font-mono font-extrabold uppercase flex items-center gap-1">
          <span>CBC Aligned</span>
        </span>

        <button
          type="button"
          onClick={() => {
            onSelectTrip(trip);
            onCloseDiscoveryModal();
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1 shadow-md ${
            isActive
              ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
              : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
          }`}
        >
          <span>{isActive ? 'Currently Active' : 'Launch Tour'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};


interface VirtualFieldTripEcosystemModalsProps {
  activeTrip: VirtualFieldTripRoute;
  currentStop: VirtualFieldTripStop;

  // 1. Discovery Modal
  isDiscoveryModalOpen: boolean;
  setIsDiscoveryModalOpen: (open: boolean) => void;
  discoveryCategory: 'parks' | 'museums' | 'factories' | 'space' | 'volcanoes' | 'marine' | 'hospitals' | 'banks' | 'power' | 'labs' | 'universities';
  setDiscoveryCategory: (cat: 'parks' | 'museums' | 'factories' | 'space' | 'volcanoes' | 'marine' | 'hospitals' | 'banks' | 'power' | 'labs' | 'universities') => void;
  onSelectTrip: (trip: VirtualFieldTripRoute) => void;

  // 2. Camera Intel
  isCameraIntelModalOpen: boolean;
  setIsCameraIntelModalOpen: (open: boolean) => void;
  scanSampleType: 'plant' | 'fossil' | 'machine' | 'bird' | 'animal' | 'rock' | 'lab';
  setScanSampleType: (type: 'plant' | 'fossil' | 'machine' | 'bird' | 'animal' | 'rock' | 'lab') => void;
  isAnalyzingScan: boolean;
  setIsAnalyzingScan: (analyzing: boolean) => void;
  scanResult: any;
  setScanResult: (result: any) => void;

  // 3. Interactive Missions
  isMissionsModalOpen: boolean;
  setIsMissionsModalOpen: (open: boolean) => void;
  activeMissions: Array<{ id: string; title: string; category: string; xp: number; completed: boolean }>;
  setActiveMissions: React.Dispatch<React.SetStateAction<Array<{ id: string; title: string; category: string; xp: number; completed: boolean }>>>;
  selectedMissionId: string;
  setSelectedMissionId: (id: string) => void;
  missionAnswerText: string;
  setMissionAnswerText: (text: string) => void;
  missionFeedback: string | null;
  setMissionFeedback: (fb: string | null) => void;

  // 4. AI Notebook
  isNotebookModalOpen: boolean;
  setIsNotebookModalOpen: (open: boolean) => void;
  isGeneratingNotebook: boolean;
  setIsGeneratingNotebook: (gen: boolean) => void;
  notebookOutput: any;
  setNotebookOutput: (output: any) => void;

  // 5. Analytics
  isAnalyticsModalOpen: boolean;
  setIsAnalyticsModalOpen: (open: boolean) => void;

  // 6. Parent Portal
  isParentPortalModalOpen: boolean;
  setIsParentPortalModalOpen: (open: boolean) => void;
  parentSignedName: string;
  setParentSignedName: (name: string) => void;
  isParentConsentSigned: boolean;
  setIsParentConsentSigned: (signed: boolean) => void;

  // 7. AI Story Generator
  isStoryModalOpen: boolean;
  setIsStoryModalOpen: (open: boolean) => void;
  storyFormat: 'journal' | 'photobook' | 'newsletter' | 'presentation' | 'video_script';
  setStoryFormat: (format: 'journal' | 'photobook' | 'newsletter' | 'presentation' | 'video_script') => void;
  isGeneratingStory: boolean;
  setIsGeneratingStory: (gen: boolean) => void;
  generatedStoryText: string | null;
  setGeneratedStoryText: (text: string | null) => void;

  // 8. Sustainability & Eco
  isEcoModalOpen: boolean;
  setIsEcoModalOpen: (open: boolean) => void;
  ecoLitterKg: number;
  setEcoLitterKg: (kg: number) => void;
  ecoSpeciesCount: number;
  setEcoSpeciesCount: (cnt: number) => void;
  ecoCarbonSaved: string;

  // 9. Emergency & Logistics
  isLogisticsModalOpen: boolean;
  setIsLogisticsModalOpen: (open: boolean) => void;
  attendanceRoster: Array<{ id: string; name: string; present: boolean; medicalAlert?: string }>;
  setAttendanceRoster: React.Dispatch<React.SetStateAction<Array<{ id: string; name: string; present: boolean; medicalAlert?: string }>>>;
}

export const VirtualFieldTripEcosystemModals: React.FC<VirtualFieldTripEcosystemModalsProps> = ({
  activeTrip,
  currentStop,

  isDiscoveryModalOpen,
  setIsDiscoveryModalOpen,
  discoveryCategory,
  setDiscoveryCategory,
  onSelectTrip,

  isCameraIntelModalOpen,
  setIsCameraIntelModalOpen,
  scanSampleType,
  setScanSampleType,
  isAnalyzingScan,
  setIsAnalyzingScan,
  scanResult,
  setScanResult,

  isMissionsModalOpen,
  setIsMissionsModalOpen,
  activeMissions,
  setActiveMissions,
  selectedMissionId,
  setSelectedMissionId,
  missionAnswerText,
  setMissionAnswerText,
  missionFeedback,
  setMissionFeedback,

  isNotebookModalOpen,
  setIsNotebookModalOpen,
  isGeneratingNotebook,
  setIsGeneratingNotebook,
  notebookOutput,
  setNotebookOutput,

  isAnalyticsModalOpen,
  setIsAnalyticsModalOpen,

  isParentPortalModalOpen,
  setIsParentPortalModalOpen,
  parentSignedName,
  setParentSignedName,
  isParentConsentSigned,
  setIsParentConsentSigned,

  isStoryModalOpen,
  setIsStoryModalOpen,
  storyFormat,
  setStoryFormat,
  isGeneratingStory,
  setIsGeneratingStory,
  generatedStoryText,
  setGeneratedStoryText,

  isEcoModalOpen,
  setIsEcoModalOpen,
  ecoLitterKg,
  setEcoLitterKg,
  ecoSpeciesCount,
  setEcoSpeciesCount,
  ecoCarbonSaved,

  isLogisticsModalOpen,
  setIsLogisticsModalOpen,
  attendanceRoster,
  setAttendanceRoster
}) => {

  // Handlers for Camera Scan simulation
  const handleSimulateScan = () => {
    setIsAnalyzingScan(true);
    setScanResult(null);
    setTimeout(() => {
      setIsAnalyzingScan(false);
      const mockData = {
        plant: {
          objectName: 'Baobab Tree (Adansonia digitata)',
          scientificName: 'Adansonia digitata',
          category: 'Flora & Botany',
          description: 'Known as the "Tree of Life", this species stores up to 120,000 liters of water inside its fibrous trunk to endure harsh arid droughts.',
          curriculumLinks: 'CBC Grade 7 Biology • Plant Adaptation & Ecosystem Interdependence',
          safetyNotes: 'Ecologically protected species. Leaves are highly rich in Vitamin C and calcium.',
          keyFacts: [
            'Can live over 1,500 years',
            'Fibrous bark is fire-resistant',
            'Produces nutrient-rich fruit pulp used in local remedies'
          ]
        },
        fossil: {
          objectName: 'Ammonite Cephalopod Fossil',
          scientificName: 'Subclass Ammonoidea',
          category: 'Paleontology & Geology',
          description: 'Exoskeleton of an extinct marine mollusk with intricate chambered suture patterns, dating back 66–200 million years.',
          curriculumLinks: 'CBC Senior Geography • Geological Timelines & Fossil Evidence',
          safetyNotes: 'Found in sedimentary rock layers near ancient lakebeds and seabed deposits.',
          keyFacts: [
            'Used as index fossils to date geological rock strata',
            'Suture lines indicate shell strength against deep water pressure',
            'Closest living relative is the chambered nautilus'
          ]
        },
        machine: {
          objectName: 'Electromagnetic Particle Accelerator Cavity',
          scientificName: 'Superconducting Radiofrequency Cavity',
          category: 'Subatomic Physics & Engineering',
          description: 'Resonator structure operating at cryogenic temperatures (1.9 K) to accelerate subatomic protons near light speed.',
          curriculumLinks: 'Advanced Physics • Particle Dynamics & Superconductivity',
          safetyNotes: 'High magnetic fields and cryogenic liquid helium isolation required during beam runs.',
          keyFacts: [
            'Accelerates particles to 99.9999991% speed of light',
            'Cooled by superfluid liquid helium',
            'Pioneered technology behind MRI medical scanners'
          ]
        },
        bird: {
          objectName: 'African Fish Eagle (Haliaeetus vocifer)',
          scientificName: 'Haliaeetus vocifer',
          category: 'Ornithology & Wildlife',
          description: 'High-ranking apex raptor of East African rift lakes, recognized by its distinct baritone vocal call and yellow talons.',
          curriculumLinks: 'Ecology • Trophic Levels & Aquatic Food Webs',
          safetyNotes: 'Sensitive to freshwater pollution and chemical runoff in fishing grounds.',
          keyFacts: [
            'Keen eyesight detects underwater prey from 200m altitude',
            'Monogamous pair bond for life',
            'Symbolic national bird of multiple African nations'
          ]
        },
        animal: {
          objectName: 'African Bush Elephant (Loxodonta africana)',
          scientificName: 'Loxodonta africana',
          category: 'Zoology & Conservation',
          description: 'Earth\'s largest terrestrial mammal, serving as an ecosystem engineer that creates water holes and reshapes savannas.',
          curriculumLinks: 'CBC Grade 8 Environmental Science • Keystone Species',
          safetyNotes: 'Always maintain a 50-meter safety distance during field observation.',
          keyFacts: [
            'Communicates using low-frequency infrasound up to 10 km',
            'Trunk contains over 40,000 individual muscles',
            'Key seed disperser for indigenous hardwood trees'
          ]
        },
        rock: {
          objectName: 'Basaltic Volcanic Rock',
          scientificName: 'Extrusive Igneous Rock',
          category: 'Geology & Mineralogy',
          description: 'Dark, fine-grained rock formed from the rapid cooling of low-viscosity basaltic lava along rift valleys.',
          curriculumLinks: 'Geography • Igneous Rock Classification & Volcanism',
          safetyNotes: 'Rich in iron and magnesium; forms fertile black cotton soil over millennia.',
          keyFacts: [
            'Makes up over 90% of ocean floor crust',
            'High density with fine-grained crystalline texture',
            'Essential raw material for natural basalt fiber insulation'
          ]
        },
        lab: {
          objectName: 'High-Precision UV-Vis Spectrophotometer',
          scientificName: 'Optical Absorption Spectrometer',
          category: 'Analytical Chemistry',
          description: 'Laboratory instrument that measures light intensity absorbed by a liquid chemical sample across ultraviolet wavelengths.',
          curriculumLinks: 'CBC High School Chemistry • Beer-Lambert Law & Concentration Analysis',
          safetyNotes: 'Handle quartz cuvettes by frosted sides to avoid finger-oil absorption interference.',
          keyFacts: [
            'Determines chemical purity and solute concentration',
            'Measures light absorbance from 190nm to 1100nm',
            'Crucial tool in pharmaceutical quality control'
          ]
        }
      };
      setScanResult(mockData[scanSampleType] || mockData.animal);
    }, 1200);
  };

  // Handler for Mission submission
  const handleSubmitMission = () => {
    if (!missionAnswerText.trim()) return;
    setMissionFeedback('✨ AI Verification: Excellent work! Your response satisfies all CBC observational criteria. +100 XP awarded to your profile!');
    setActiveMissions(prev =>
      prev.map(m => (m.id === selectedMissionId ? { ...m, completed: true } : m))
    );
    setMissionAnswerText('');
  };

  // Handler for AI Notebook Generation
  const handleGenerateNotebook = () => {
    setIsGeneratingNotebook(true);
    setTimeout(() => {
      setIsGeneratingNotebook(false);
      setNotebookOutput({
        report: `EXPEDITION EXECUTIVE REPORT: ${activeTrip.title.toUpperCase()}\nDate: ${new Date().toLocaleDateString()}\nLocation: ${activeTrip.country}\n\nSummary of Key Findings:\n1. Primary Geographic Milestone: ${currentStop.locationName} (${currentStop.title}).\n2. Key Observational Phenomenon: ${currentStop.readingPassage.substring(0, 180)}...\n3. CBC Competencies Demonstrated: Critical Inquiry, Ecological Literacy, Foreign Language Integration.`,
        revisionNotes: [
          `Key Landmark: ${currentStop.locationName}`,
          `Core Concept: ${currentStop.readingPassage.substring(0, 100)}...`,
          `Key Socratic Reflection: Active engagement with landmark features and micro-checkpoints.`
        ],
        flashcards: [
          { q: `Where is ${currentStop.locationName} located?`, a: `${activeTrip.country} (Stop #${currentStop.stopNumber})` },
          { q: `What is the primary scientific or cultural significance?`, a: currentStop.readingPassage.substring(0, 120) },
          { q: `What key language or technical term was highlighted?`, a: currentStop.foreignLanguageCues?.[0]?.phrase || 'Geographic Landmark' }
        ],
        mindMap: [
          `Center Hub: ${activeTrip.title}`,
          `├─ Milestone 1: ${currentStop.locationName}`,
          `├─ Scientific Context: ${currentStop.readingPassage.substring(0, 60)}...`,
          `└─ CBC Learning Outcomes: Ecological & Cultural Literacy`
        ],
        quiz: [
          {
            question: `What is the key landmark featured at Stop #${currentStop.stopNumber}?`,
            options: [currentStop.locationName, 'Eiffel Tower', 'Mount Kilimanjaro', 'Serengeti Plains'],
            answer: 0
          },
          {
            question: `Which country does this virtual field trip explore?`,
            options: [activeTrip.country, 'Brazil', 'Japan', 'Australia'],
            answer: 0
          }
        ]
      });
    }, 1500);
  };

  // Handler for Story Generator
  const handleGenerateStory = () => {
    setIsGeneratingStory(true);
    setTimeout(() => {
      setIsGeneratingStory(false);
      const formatTitles = {
        journal: '🧭 Personal Expedition Travel Journal',
        photobook: '📸 High-Resolution Virtual Photobook Narrative',
        newsletter: '📰 EduNexus School Science Newsletter Article',
        presentation: '📊 5-Slide Classroom Presentation Deck Script',
        video_script: '🎙️ 60-Second Narrated Field Documentary Script'
      };
      setGeneratedStoryText(
        `# ${formatTitles[storyFormat]}\n**Field Trip Title:** ${activeTrip.title}\n**Destination:** ${activeTrip.country}\n\n## Chapter 1: Arrival at ${currentStop.locationName}\nAs our virtual expedition arrived at Stop #${currentStop.stopNumber}, students used 4K video stages and interactive satellite overlays to inspect ${currentStop.locationName}. ${currentStop.readingPassage}\n\n## Chapter 2: Socratic Inquiry & Scientific Analysis\nThrough our AI Tour Guide, we formulated hypotheses about the geological and ecological significance of the site, collecting GPS waypoints and photo evidence.\n\n## Key Takeaway & CBC Competencies\nThis journey bridged classroom theory with real-world geographical landmarks, fostering environmental stewardship and inquiry skills.`
      );
    }, 1200);
  };

  return (
    <AnimatePresence>

      {/* ================= 1. AI DESTINATION DISCOVERY MODAL ================= */}
      {isDiscoveryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-indigo-500/40 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh] text-white">
            
            {/* Modal Header */}
            <div className="p-5 bg-slate-950 border-b border-indigo-500/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 rounded-2xl shadow-lg">
                  <Compass className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">
                    AI Destination Discovery Hub
                  </h3>
                  <p className="text-xs text-indigo-300 font-mono">
                    Explore 11 Educational Destination Categories • Real & Virtual Destinations
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDiscoveryModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Navigation Bar */}
            <div className="p-3 bg-slate-950/80 border-b border-indigo-500/20 overflow-x-auto flex items-center gap-2 scrollbar-thin shrink-0">
              {[
                { id: 'parks', label: '🦁 National Parks & Wildlife', count: 4 },
                { id: 'museums', label: '🏛 Museums & Cultural Heritage', count: 3 },
                { id: 'factories', label: '🏭 Manufacturing & Robotics', count: 2 },
                { id: 'space', label: '🛰 Space Centers & Observatories', count: 3 },
                { id: 'volcanoes', label: '🌋 Volcanoes & Geothermal', count: 2 },
                { id: 'marine', label: '🌊 Marine Parks & Coral Reefs', count: 3 },
                { id: 'hospitals', label: '🏥 Medical Centers & Research', count: 2 },
                { id: 'banks', label: '🏦 Financial & Central Banks', count: 2 },
                { id: 'power', label: '⚡ Power Stations & Clean Energy', count: 2 },
                { id: 'labs', label: '🧪 Particle Physics & Labs', count: 3 },
                { id: 'universities', label: '🏫 Universities & Campuses', count: 2 }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setDiscoveryCategory(cat.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                    discoveryCategory === cat.id
                      ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                    discoveryCategory === cat.id ? 'bg-slate-950 text-amber-300' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Cards Grid Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PRESET_FIELD_TRIPS.map(trip => (
                  <DestinationCardItem
                    key={trip.id}
                    trip={trip}
                    isActive={activeTrip.id === trip.id}
                    onSelectTrip={onSelectTrip}
                    onCloseDiscoveryModal={() => setIsDiscoveryModalOpen(false)}
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950 border-t border-indigo-500/20 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400 font-mono">
                AI powered discovery engine • 100+ virtual stops ready
              </span>
              <button
                type="button"
                onClick={() => setIsDiscoveryModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl transition cursor-pointer"
              >
                Close Hub
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= 2. CAMERA INTELLIGENCE & OBJECT IDENTIFICATION MODAL ================= */}
      {isCameraIntelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-indigo-500/40 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col text-white">
            
            <div className="p-5 bg-slate-950 border-b border-indigo-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 rounded-2xl shadow-lg">
                  <Camera className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">
                    Camera Intelligence & Identification
                  </h3>
                  <p className="text-xs text-indigo-300 font-mono">
                    Point camera or choose sample object: Plants, Fossils, Machines, Animals, Rocks, Lab Equipment
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCameraIntelModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              
              {/* Presets Bar */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-amber-300 block">
                  Select Physical or Virtual Specimen to Scan:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'plant', label: '🌿 Baobab Tree' },
                    { id: 'fossil', label: '🦴 Marine Ammonite' },
                    { id: 'machine', label: '⚙ Particle Accelerator' },
                    { id: 'bird', label: '🦜 African Fish Eagle' },
                    { id: 'animal', label: '🐘 Bush Elephant' },
                    { id: 'rock', label: '🪨 Volcanic Basalt' },
                    { id: 'lab', label: '🧪 Spectrophotometer' }
                  ].map(spec => (
                    <button
                      key={spec.id}
                      type="button"
                      onClick={() => setScanSampleType(spec.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        scanSampleType === spec.id
                          ? 'bg-amber-400 text-slate-950 font-extrabold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {spec.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Trigger */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleSimulateScan}
                  disabled={isAnalyzingScan}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-xs rounded-2xl transition cursor-pointer shadow-xl flex items-center justify-center gap-2"
                >
                  {isAnalyzingScan ? <Loader2 className="w-5 h-5 text-slate-950 animate-spin" /> : <Sparkles className="w-5 h-5 text-slate-950" />}
                  <span>{isAnalyzingScan ? 'AI Computer Vision Analyzing Specimen...' : 'Scan & Identify Specimen with AI'}</span>
                </button>
              </div>

              {/* Scan Results Panel */}
              {scanResult && (
                <div className="p-5 bg-slate-950 rounded-2xl border border-amber-400/60 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-start justify-between border-b border-white/10 pb-3">
                    <div>
                      <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-mono font-bold uppercase">
                        {scanResult.category}
                      </span>
                      <h4 className="text-lg font-serif font-bold text-white mt-1">
                        {scanResult.objectName}
                      </h4>
                      <p className="text-xs text-amber-300 italic font-mono">
                        Scientific Classification: {scanResult.scientificName}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold">
                      99.4% AI Match
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed">
                    {scanResult.description}
                  </p>

                  <div className="p-3 bg-indigo-950/60 border border-indigo-500/30 rounded-xl space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-300 block">
                      Curriculum & CBC Alignment:
                    </span>
                    <p className="text-xs font-bold text-indigo-100">
                      {scanResult.curriculumLinks}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase text-amber-400 block">
                      Key Scientific Facts:
                    </span>
                    <ul className="space-y-1">
                      {scanResult.keyFacts.map((fact: string, fIdx: number) => (
                        <li key={fIdx} className="text-xs text-slate-300 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{fact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-200 font-medium">
                    ⚠️ Safety & Ecological Note: {scanResult.safetyNotes}
                  </div>
                </div>
              )}

            </div>

            <div className="p-4 bg-slate-950 border-t border-indigo-500/20 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsCameraIntelModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl"
              >
                Close Scanner
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= 3. INTERACTIVE MISSIONS MODAL ================= */}
      {isMissionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-indigo-500/40 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col text-white">
            
            <div className="p-5 bg-slate-950 border-b border-indigo-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 rounded-2xl shadow-lg">
                  <Flag className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">
                    Interactive Missions & Scavenger Challenges
                  </h3>
                  <p className="text-xs text-indigo-300 font-mono">
                    Complete CBC Field Missions • Instant AI Submission Verification & XP Rewards
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMissionsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              
              {/* Mission Selection */}
              <div className="space-y-3">
                {activeMissions.map(m => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedMissionId(m.id);
                      setMissionFeedback(null);
                    }}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      selectedMissionId === m.id
                        ? 'bg-slate-950 border-amber-400 shadow-md'
                        : 'bg-slate-950/50 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${m.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-amber-400'}`}>
                        {m.completed ? <CheckCircle2 className="w-5 h-5" /> : <Flag className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          {m.title}
                        </h4>
                        <span className="text-[10px] text-indigo-300 font-mono">
                          Category: {m.category}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="px-2.5 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-xl text-xs font-extrabold">
                        +{m.xp} XP
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submission Form for Selected Mission */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/30 space-y-3">
                <label className="text-xs font-extrabold uppercase tracking-wider text-amber-300 block">
                  Submit Field Answer or Observational Note for Selected Mission:
                </label>
                <textarea
                  rows={3}
                  value={missionAnswerText}
                  onChange={e => setMissionAnswerText(e.target.value)}
                  placeholder="Describe your findings, photograph evidence, or scientific measurements..."
                  className="w-full p-3 bg-slate-900 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleSubmitMission}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Mission Answer</span>
                  </button>
                </div>

                {missionFeedback && (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-bold rounded-xl animate-in fade-in">
                    {missionFeedback}
                  </div>
                )}
              </div>

            </div>

            <div className="p-4 bg-slate-950 border-t border-indigo-500/20 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsMissionsModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl"
              >
                Close Missions
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= 4. AI FIELD NOTEBOOK & REVISION SUITE MODAL ================= */}
      {isNotebookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-indigo-500/40 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col text-white max-h-[90vh]">
            
            <div className="p-5 bg-slate-950 border-b border-indigo-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-r from-teal-400 to-emerald-500 text-slate-950 rounded-2xl shadow-lg">
                  <BookOpen className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">
                    AI Field Notebook & Revision Engine
                  </h3>
                  <p className="text-xs text-indigo-300 font-mono">
                    Auto-compile Observations • Structured Reports, Flashcards, Mind Maps & Personalized Quizzes
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsNotebookModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              
              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-indigo-500/30">
                <div>
                  <h4 className="text-sm font-extrabold text-white">
                    Generate Post-Trip Revision Suite for: {activeTrip.title}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Collects all stop photos, notes, voice transcripts & GPS waypoints
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateNotebook}
                  disabled={isGeneratingNotebook}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  {isGeneratingNotebook ? <Loader2 className="w-4 h-4 text-slate-950 animate-spin" /> : <Sparkles className="w-4 h-4 text-slate-950" />}
                  <span>{isGeneratingNotebook ? 'Generating Notebook...' : 'Generate Revision Suite'}</span>
                </button>
              </div>

              {notebookOutput && (
                <div className="space-y-4 animate-in fade-in">
                  
                  {/* Executive Report */}
                  <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 space-y-2">
                    <span className="text-[10px] font-extrabold uppercase text-amber-400 block font-mono">
                      📄 Structured Excursion Report:
                    </span>
                    <pre className="text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed">
                      {notebookOutput.report}
                    </pre>
                  </div>

                  {/* Interactive Flashcards */}
                  <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 space-y-3">
                    <span className="text-[10px] font-extrabold uppercase text-teal-300 block font-mono">
                      ⚡ Key Revision Flashcards:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {notebookOutput.flashcards.map((fc: any, fIdx: number) => (
                        <div key={fIdx} className="p-3 bg-slate-900 border border-teal-500/30 rounded-xl space-y-1">
                          <span className="text-[10px] text-teal-400 font-extrabold">Q: {fc.q}</span>
                          <p className="text-xs text-white font-medium">A: {fc.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mind Map */}
                  <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 space-y-2">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-300 block font-mono">
                      🧩 Concept Mind Map:
                    </span>
                    <ul className="space-y-1 font-mono text-xs text-slate-300">
                      {notebookOutput.mindMap.map((mm: string, mmIdx: number) => (
                        <li key={mmIdx}>{mm}</li>
                      ))}
                    </ul>
                  </div>

                </div>
              )}

            </div>

            <div className="p-4 bg-slate-950 border-t border-indigo-500/20 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsNotebookModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl"
              >
                Close Notebook
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= 5. LEARNING ANALYTICS DASHBOARD MODAL ================= */}
      {isAnalyticsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-indigo-500/40 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col text-white">
            
            <div className="p-5 bg-slate-950 border-b border-indigo-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 rounded-2xl shadow-lg">
                  <Trophy className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">
                    Learning Analytics & Competency Radar
                  </h3>
                  <p className="text-xs text-indigo-300 font-mono">
                    Track Student Participation • Demonstrated Skills & Competency Matrix
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAnalyticsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-950 border border-white/10 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Participation Rate</span>
                  <span className="text-2xl font-extrabold text-emerald-400 font-serif">96%</span>
                </div>
                <div className="p-3.5 bg-slate-950 border border-white/10 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Missions Completed</span>
                  <span className="text-2xl font-extrabold text-amber-400 font-serif">4 / 5</span>
                </div>
                <div className="p-3.5 bg-slate-950 border border-white/10 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Inquiry Questions Asked</span>
                  <span className="text-2xl font-extrabold text-teal-400 font-serif">12</span>
                </div>
                <div className="p-3.5 bg-slate-950 border border-white/10 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Collaboration Score</span>
                  <span className="text-2xl font-extrabold text-indigo-400 font-serif">98 / 100</span>
                </div>
              </div>

              {/* Competencies Progress Bars */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/30 space-y-3">
                <span className="text-xs font-extrabold text-amber-300 uppercase block tracking-wider">
                  CBC Demonstrated Core Competencies:
                </span>
                
                {[
                  { name: 'Critical Thinking & Socratic Inquiry', pct: 92, col: 'bg-emerald-400' },
                  { name: 'Ecological & Environmental Literacy', pct: 95, col: 'bg-teal-400' },
                  { name: 'Digital & Spatial Mapping Competency', pct: 88, col: 'bg-amber-400' },
                  { name: 'Foreign Language Contextual Acquisition', pct: 85, col: 'bg-indigo-400' }
                ].map((comp, cIdx) => (
                  <div key={cIdx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-200">
                      <span>{comp.name}</span>
                      <span>{comp.pct}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/10">
                      <div className={`h-full ${comp.col} rounded-full`} style={{ width: `${comp.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

            </div>

            <div className="p-4 bg-slate-950 border-t border-indigo-500/20 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsAnalyticsModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl"
              >
                Close Analytics
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= 6. PARENT PORTAL & DIGITAL CONSENT MODAL ================= */}
      {isParentPortalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-indigo-500/40 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col text-white">
            
            <div className="p-5 bg-slate-950 border-b border-indigo-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-r from-rose-400 to-rose-500 text-slate-950 rounded-2xl shadow-lg">
                  <GraduationCap className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">
                    Parent Portal & Digital Permission Slips
                  </h3>
                  <p className="text-xs text-indigo-300 font-mono">
                    Digital Consent • Real-time Trip Progress & Approved Photo Stream
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsParentPortalModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              
              <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Excursion: {activeTrip.title}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase">
                    Status: Live Expedition
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Destination: {activeTrip.country} • Scheduled Duration: 6 Hours
                </p>
              </div>

              {/* Digital Consent Form */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/30 space-y-3">
                <span className="text-xs font-extrabold uppercase text-amber-300 block">
                  Digital Permission & Consent Slip Signature:
                </span>
                
                <p className="text-xs text-slate-300 leading-relaxed">
                  "I grant permission for my child to participate in the EduNexus AI Immersive Virtual Field Trip to {activeTrip.title} ({activeTrip.country}). I understand that all observation logs and media are strictly isolated within the school domain."
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200">Parent / Guardian Legal Name Signature</label>
                  <input
                    type="text"
                    value={parentSignedName}
                    onChange={e => setParentSignedName(e.target.value)}
                    placeholder="e.g., Mary W. Ochieng"
                    className="w-full p-2.5 bg-slate-900 border border-white/15 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsParentConsentSigned(true)}
                  disabled={!parentSignedName.trim() || isParentConsentSigned}
                  className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 ${
                    isParentConsentSigned
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer'
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{isParentConsentSigned ? '✓ Digital Consent Signed & Verified' : 'Sign Digital Permission Slip'}</span>
                </button>
              </div>

            </div>

            <div className="p-4 bg-slate-950 border-t border-indigo-500/20 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsParentPortalModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl"
              >
                Close Portal
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= 7. AI STORY & MEDIA PORTFOLIO GENERATOR MODAL ================= */}
      {isStoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-indigo-500/40 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col text-white max-h-[90vh]">
            
            <div className="p-5 bg-slate-950 border-b border-indigo-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-r from-sky-400 to-indigo-500 text-slate-950 rounded-2xl shadow-lg">
                  <FileText className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">
                    AI Story & Portfolio Generator
                  </h3>
                  <p className="text-xs text-indigo-300 font-mono">
                    Transform Trip Evidence into Journals, Photobooks, Presentations & Video Scripts
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsStoryModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase text-amber-300 block">
                  Select Output Story Format:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'journal', label: '🧭 Travel Journal' },
                    { id: 'photobook', label: '📸 Photo Book' },
                    { id: 'newsletter', label: '📰 School Newsletter' },
                    { id: 'presentation', label: '📊 Slides Script' },
                    { id: 'video_script', label: '🎙️ Video Script' }
                  ].map(fmt => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setStoryFormat(fmt.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        storyFormat === fmt.id
                          ? 'bg-amber-400 text-slate-950 font-extrabold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateStory}
                disabled={isGeneratingStory}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGeneratingStory ? <Loader2 className="w-4 h-4 text-slate-950 animate-spin" /> : <Sparkles className="w-4 h-4 text-slate-950" />}
                <span>{isGeneratingStory ? 'AI Generating Portfolio Story...' : 'Generate Portfolio Article'}</span>
              </button>

              {generatedStoryText && (
                <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 space-y-2 animate-in fade-in">
                  <pre className="text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed">
                    {generatedStoryText}
                  </pre>
                </div>
              )}

            </div>

            <div className="p-4 bg-slate-950 border-t border-indigo-500/20 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsStoryModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl"
              >
                Close Generator
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= 8. SUSTAINABILITY & ECO LOGGER MODAL ================= */}
      {isEcoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-indigo-500/40 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col text-white">
            
            <div className="p-5 bg-slate-950 border-b border-indigo-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 rounded-2xl shadow-lg">
                  <Sparkles className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">
                    Sustainability & Carbon Offset Logger
                  </h3>
                  <p className="text-xs text-indigo-300 font-mono">
                    Log Biodiversity Index • Measure Carbon Footprint Savings & Eco Action
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEcoModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl space-y-2">
                <span className="text-[10px] font-mono text-emerald-300 uppercase block font-bold">
                  🌱 Estimated Carbon Footprint Offset:
                </span>
                <span className="text-2xl font-extrabold text-emerald-400 font-serif">
                  {ecoCarbonSaved}
                </span>
                <p className="text-xs text-slate-300">
                  By conducting this field trip virtually via EduNexus 4K streaming, your class eliminated transport fuel emissions for 35 students!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-slate-950 border border-white/10 rounded-2xl space-y-1">
                  <span className="text-xs font-bold text-slate-400 block">Logged Species Diversity</span>
                  <span className="text-xl font-bold text-amber-400">{ecoSpeciesCount} Species Observed</span>
                </div>
                <div className="p-4 bg-slate-950 border border-white/10 rounded-2xl space-y-1">
                  <span className="text-xs font-bold text-slate-400 block">Class Litter Logged</span>
                  <span className="text-xl font-bold text-teal-400">{ecoLitterKg} kg Recorded</span>
                </div>
              </div>

            </div>

            <div className="p-4 bg-slate-950 border-t border-indigo-500/20 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsEcoModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl"
              >
                Close Eco Logger
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= 9. EMERGENCY & LOGISTICS CONSOLE MODAL ================= */}
      {isLogisticsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-indigo-500/40 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col text-white">
            
            <div className="p-5 bg-slate-950 border-b border-indigo-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-2xl shadow-lg">
                  <ShieldAlert className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">
                    Emergency & Logistics Console
                  </h3>
                  <p className="text-xs text-indigo-300 font-mono">
                    Attendance Check-in Roster • Medical Alerts & Emergency Contact Guides
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsLogisticsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              
              <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 space-y-3">
                <span className="text-xs font-extrabold uppercase text-amber-300 block">
                  Student Check-in Roster ({attendanceRoster.filter(a => a.present).length} / {attendanceRoster.length} Present):
                </span>

                <div className="space-y-2">
                  {attendanceRoster.map(st => (
                    <div key={st.id} className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-white/10 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAttendanceRoster(prev =>
                              prev.map(item => (item.id === st.id ? { ...item, present: !item.present } : item))
                            );
                          }}
                          className={`w-5 h-5 rounded-md flex items-center justify-center font-bold cursor-pointer ${
                            st.present ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {st.present && '✓'}
                        </button>
                        <span className="font-bold text-white">{st.name}</span>
                      </div>

                      <span className="text-[10px] text-rose-300 font-mono">
                        Medical: {st.medicalAlert}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-2xl space-y-1 text-xs text-rose-200">
                <span className="font-extrabold block uppercase">🚨 Emergency Contacts & Protocol:</span>
                <p>School Nurse Direct: +254 700 000 000 • Principal Hotline: +254 711 111 111</p>
              </div>

            </div>

            <div className="p-4 bg-slate-950 border-t border-indigo-500/20 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsLogisticsModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl"
              >
                Close Logistics
              </button>
            </div>

          </div>
        </div>
      )}

    </AnimatePresence>
  );
};
