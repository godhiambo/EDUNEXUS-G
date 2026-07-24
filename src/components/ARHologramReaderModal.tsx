import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  Camera,
  RotateCcw,
  Sparkles,
  Layers,
  Box,
  Eye,
  Maximize2,
  Minimize2,
  X,
  Volume2,
  VolumeX,
  Download,
  Info,
  Radio,
  Sliders,
  Sun,
  Shield,
  Cpu,
  RefreshCw,
  Zap,
  CheckCircle,
  HelpCircle,
  Compass,
  Move,
  Scan,
  Grid
} from 'lucide-react';

export interface ARHologramModelData {
  modelName: string;
  category: string;
  shapeArchetype: string;
  primaryColorHex: string;
  secondaryColorHex?: string;
  description: string;
  realWorldTaskContext: string;
  components: Array<{
    id: string;
    name: string;
    functionDescription: string;
    shapeType: string;
    colorHex?: string;
    relativePosition?: { x: number; y: number; z: number };
  }>;
  hotspots: Array<{
    title: string;
    annotation: string;
    x: number;
    y: number;
    z: number;
  }>;
  taskSteps: string[];
}

interface ARHologramReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle?: string;
  documentContext?: string;
  initialTopic?: string;
}

// Built-in presets for instant AR holographic loading
const PRESET_MODELS: ARHologramModelData[] = [
  {
    modelName: 'Solar Water Filtration System',
    category: 'STEM / Environmental Engineering',
    shapeArchetype: 'assembly',
    primaryColorHex: '#00f0ff',
    secondaryColorHex: '#3b82f6',
    description: 'A 3D solar-driven centrifugal filtration model designed for rural community clean water projects.',
    realWorldTaskContext: 'Task: Calculate daily flow rates and optimize solar panel tilt angle to power the pump during peak sunlight hours.',
    components: [
      { id: 'c1', name: 'Photovoltaic Solar Panel', functionDescription: 'Converts sunlight into 24V DC power for pump operation.', shapeType: 'box', colorHex: '#38bdf8', relativePosition: { x: 0, y: 1.8, z: 0 } },
      { id: 'c2', name: 'Centrifugal Pump Motor', functionDescription: 'Draws raw water through pre-filters at 12 L/min.', shapeType: 'cylinder', colorHex: '#0284c7', relativePosition: { x: -1.2, y: 0.5, z: 0 } },
      { id: 'c3', name: 'Multi-Stage Sand & Carbon Filter', functionDescription: 'Removes micro-particulates, heavy metals, and odors.', shapeType: 'cylinder', colorHex: '#10b981', relativePosition: { x: 0, y: 0.5, z: 0 } },
      { id: 'c4', name: 'UV Sterilization Chamber', functionDescription: 'Eliminates 99.9% of bacteria using 254nm ultraviolet light.', shapeType: 'cylinder', colorHex: '#a855f7', relativePosition: { x: 1.2, y: 0.5, z: 0 } },
      { id: 'c5', name: 'Reinforced Storage Tank', functionDescription: 'Holds 500 liters of purified potable water.', shapeType: 'box', colorHex: '#0ea5e9', relativePosition: { x: 0, y: -0.8, z: 0 } }
    ],
    hotspots: [
      { title: 'Solar Inverter Stage', annotation: 'Monitors voltage stability and prevents pump stalling during overcast weather.', x: 0, y: 1.8, z: 0.5 },
      { title: 'Pre-Filter Pressure Gauge', annotation: 'Triggers maintenance alert when sediment pressure differential exceeds 15 PSI.', x: 0, y: 0.8, z: 0.8 },
      { title: 'UV Lamp Dosage Control', annotation: 'Ensures minimum irradiation dose of 40 mJ/cm² for water microbial safety.', x: 1.2, y: 0.5, z: 0.5 }
    ],
    taskSteps: [
      'Position the 3D model on your physical desk surface using the AR reticle.',
      'Adjust the solar panel angle relative to south-facing azimuth in your project report.',
      'Use Exploded View mode to inspect filter media layers (gravel, quartz sand, active carbon).',
      'Calculate the total pressure drop across the 3 filter chambers.'
    ]
  },
  {
    modelName: 'CRISPR-Cas9 Molecular Assembly',
    category: 'Biotechnology / Genetics',
    shapeArchetype: 'biological',
    primaryColorHex: '#a855f7',
    secondaryColorHex: '#ec4899',
    description: '3D holographic representation of the Cas9 enzyme complexed with guide RNA binding to target DNA.',
    realWorldTaskContext: 'Task: Identify target PAM sequences and simulate double-strand DNA cleavage site.',
    components: [
      { id: 'b1', name: 'Cas9 Endonuclease Protein', functionDescription: 'Molecular scissors that cut double-stranded DNA at specific loci.', shapeType: 'sphere', colorHex: '#c084fc', relativePosition: { x: 0, y: 0.2, z: 0 } },
      { id: 'b2', name: 'Single Guide RNA (sgRNA)', functionDescription: '20-nucleotide sequence that directs Cas9 to target genomic location.', shapeType: 'torus', colorHex: '#f43f5e', relativePosition: { x: 0, y: 1.1, z: 0 } },
      { id: 'b3', name: 'Target DNA Double Helix', functionDescription: 'Genomic strand undergoing precise targeted sequence editing.', shapeType: 'cylinder', colorHex: '#06b6d4', relativePosition: { x: 0, y: -0.9, z: 0 } }
    ],
    hotspots: [
      { title: 'PAM Sequence Recognition Site', annotation: '5\'-NGG-3\' motif required for Cas9 binding and unwinding DNA.', x: 0, y: -0.5, z: 0.6 },
      { title: 'RuvC & HNH Catalytic Domains', annotation: 'Dual nuclease domains responsible for cutting non-complementary and complementary strands.', x: -0.6, y: 0.3, z: 0.4 }
    ],
    taskSteps: [
      'Locate the PAM motif on the 3D DNA helix model.',
      'Observe sgRNA base pairing with target gene exon 3.',
      'Formulate a repair pathway strategy (NHEJ vs HDR) for gene knock-in.'
    ]
  },
  {
    modelName: 'Articulated 6-Axis Robotic Arm',
    category: 'Robotics & Automation',
    shapeArchetype: 'assembly',
    primaryColorHex: '#10b981',
    secondaryColorHex: '#f59e0b',
    description: 'Industrial robotic arm with revolute joints for precision manufacturing and pick-and-place tasks.',
    realWorldTaskContext: 'Task: Program forward kinematics vector coordinates and payload torque calculations.',
    components: [
      { id: 'r1', name: 'Heavy-Duty Base & Turret', functionDescription: 'Provides 360° rotation around J1 axis.', shapeType: 'cylinder', colorHex: '#475569', relativePosition: { x: 0, y: -1.2, z: 0 } },
      { id: 'r2', name: 'Lower Shoulder Servo Joint', functionDescription: 'Controls pitch arm movement (J2 axis).', shapeType: 'box', colorHex: '#059669', relativePosition: { x: 0, y: -0.3, z: 0 } },
      { id: 'r3', name: 'Forearm Linkage', functionDescription: 'Lightweight carbon-fiber structural extension (J3 axis).', shapeType: 'box', colorHex: '#10b981', relativePosition: { x: 0, y: 0.6, z: 0 } },
      { id: 'r4', name: 'Precision Servo Wrist & Gripper', functionDescription: '3-axis wrist rotation with magnetic end effector (J4-J6).', shapeType: 'cone', colorHex: '#f59e0b', relativePosition: { x: 0, y: 1.5, z: 0 } }
    ],
    hotspots: [
      { title: 'Servo Encoder Unit', annotation: '16-bit optical absolute encoder tracking joint angle down to 0.005°.', x: 0, y: -0.3, z: 0.5 },
      { title: 'Pneumatic End Effector', annotation: 'Dual vacuum suction gripper for handling delicate silicon wafers.', x: 0, y: 1.7, z: 0.3 }
    ],
    taskSteps: [
      'Calibrate home position on desk plane.',
      'Rotate shoulder joint J2 to inspect motor gearing efficiency.',
      'Calculate end effector reach radius based on 3D dimensions.'
    ]
  },
  {
    modelName: 'Smart Hydroponic Tower',
    category: 'Sustainable Agriculture',
    shapeArchetype: 'cylinder',
    primaryColorHex: '#06b6d4',
    secondaryColorHex: '#84cc16',
    description: 'Vertical aeroponic growth column with automated nutrient dosing and LED spectrum optimization.',
    realWorldTaskContext: 'Task: Monitor N-P-K EC electrical conductivity and pH balance for leafy green yield.',
    components: [
      { id: 'h1', name: 'Vertical Planting Column', functionDescription: 'Houses 32 net cups for aeroponic misting.', shapeType: 'cylinder', colorHex: '#65a30d', relativePosition: { x: 0, y: 0.2, z: 0 } },
      { id: 'h2', name: 'Nutrient Solution Sump', functionDescription: '50L reservoir with submersible pump and EC/pH probes.', shapeType: 'box', colorHex: '#0284c7', relativePosition: { x: 0, y: -1.2, z: 0 } },
      { id: 'h3', name: 'Full-Spectrum LED Array', functionDescription: 'Delivers 300 µmol/m²/s PAR light for optimal photosynthesis.', shapeType: 'ring', colorHex: '#eab308', relativePosition: { x: 0, y: 1.4, z: 0 } }
    ],
    hotspots: [
      { title: 'Aeroponic Atomizing Nozzle', annotation: 'Produces 50-micron droplet mist to maximize root oxygenation.', x: 0.4, y: 0.2, z: 0.4 },
      { title: 'IoT Sensor Node', annotation: 'Transmits real-time humidity, temperature, and nutrient levels via LoRaWAN.', x: 0, y: -0.8, z: 0.5 }
    ],
    taskSteps: [
      'Place vertical tower model on desk surface.',
      'Inspect root misting chamber using Exploded View.',
      'Draft a dosing schedule for lettuce vegetative vs harvest phases.'
    ]
  }
];

export default function ARHologramReaderModal({
  isOpen,
  onClose,
  documentTitle = 'Project Materials',
  documentContext = '',
  initialTopic = ''
}: ARHologramReaderModalProps) {
  // Camera & Video stream state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');

  // Hologram Models State
  const [selectedModel, setSelectedModel] = useState<ARHologramModelData>(PRESET_MODELS[0]);
  const [activeTab, setActiveTab] = useState<'view' | 'inspect' | 'ai_gen' | 'custom'>('view');
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  // AR Projection Controls
  const [explodedView, setExplodedView] = useState<number>(0); // 0 to 1 scale
  const [hologramColor, setHologramColor] = useState<string>('#00f0ff');
  const [hologramStyle, setHologramStyle] = useState<'glow' | 'wireframe' | 'solid'>('glow');
  const [showLightBeam, setShowLightBeam] = useState<boolean>(true);
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [modelScale, setModelScale] = useState<number>(1.0);
  const [deskOffset, setDeskOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // AI Model Generation state
  const [aiPromptTopic, setAiPromptTopic] = useState<string>(initialTopic || documentTitle || '');
  const [isGeneratingAiModel, setIsGeneratingAiModel] = useState<boolean>(false);
  const [aiGenError, setAiGenError] = useState<string | null>(null);

  // Snapshot & UI state
  const [snapshotSuccess, setSnapshotSuccess] = useState<boolean>(false);
  const [activeHotspotIndex, setActiveHotspotIndex] = useState<number | null>(null);

  // Three.js References
  const threeSceneRef = useRef<THREE.Scene | null>(null);
  const threeCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const threeRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const lightBeamMeshRef = useRef<THREE.Mesh | null>(null);
  const componentMeshesRef = useRef<{ [key: string]: THREE.Mesh }>({});
  const animationFrameIdRef = useRef<number | null>(null);

  // Handle camera setup
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, cameraFacing]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
        }
      } else {
        setCameraError('Camera API not supported in this browser environment. Using simulated physical desk studio.');
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError('Camera access unavailable or permission denied. Using simulated physical desk surface mode.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Initialize Three.js WebGL Hologram Scene
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = canvas.clientWidth || 800;
    const height = canvas.clientHeight || 500;

    // Scene setup with transparent background
    const scene = new THREE.Scene();
    threeSceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 4.5);
    camera.lookAt(0, 0, 0);
    threeCameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    threeRendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00ffff, 1.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x00f0ff, 2, 10);
    pointLight.position.set(0, 2, 0);
    scene.add(pointLight);

    // Physical Desk Grid Anchor Base
    const gridHelper = new THREE.GridHelper(6, 20, 0x00f0ff, 0x0284c7);
    gridHelper.position.y = -1.5;
    scene.add(gridHelper);

    // Desk Hologram Platform Ring
    const ringGeo = new THREE.RingGeometry(0.8, 1.2, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.35, wireframe: true });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -1.49;
    scene.add(ringMesh);

    // Volumetric Hologram Light Beam (Cylinder)
    const beamGeo = new THREE.CylinderGeometry(1.2, 0.8, 4, 32, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.y = 0.5;
    scene.add(beamMesh);
    lightBeamMeshRef.current = beamMesh;

    // Create Main Model Group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Render loop
    let clock = new THREE.Clock();
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Rotate hologram platform ring and light beam pulsing
      ringMesh.rotation.z = elapsedTime * 0.3;
      if (lightBeamMeshRef.current) {
        lightBeamMeshRef.current.visible = showLightBeam;
        (lightBeamMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.1 + Math.sin(elapsedTime * 2) * 0.04;
      }

      // Auto-rotate model if enabled
      if (modelGroupRef.current && autoRotate) {
        modelGroupRef.current.rotation.y = elapsedTime * 0.4;
      }

      // Floating oscillation
      if (modelGroupRef.current) {
        modelGroupRef.current.position.y = Math.sin(elapsedTime * 1.5) * 0.08 + deskOffset.y;
        modelGroupRef.current.position.x = deskOffset.x;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!canvasRef.current || !renderer || !camera) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      renderer.dispose();
    };
  }, [isOpen]);

  // Build 3D Mesh Components whenever selectedModel, explodedView, hologramColor, hologramStyle changes
  useEffect(() => {
    if (!modelGroupRef.current || !selectedModel) return;

    const group = modelGroupRef.current;
    // Clear previous children
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
    componentMeshesRef.current = {};

    const colorHex = parseInt(hologramColor.replace('#', '0x'), 16) || 0x00f0ff;

    selectedModel.components.forEach((comp) => {
      let geo: THREE.BufferGeometry;
      switch (comp.shapeType) {
        case 'cylinder':
          geo = new THREE.CylinderGeometry(0.35, 0.35, 0.8, 24);
          break;
        case 'sphere':
          geo = new THREE.SphereGeometry(0.45, 24, 24);
          break;
        case 'torus':
        case 'ring':
          geo = new THREE.TorusGeometry(0.5, 0.12, 16, 32);
          break;
        case 'cone':
          geo = new THREE.ConeGeometry(0.4, 0.8, 24);
          break;
        case 'box':
        default:
          geo = new THREE.BoxGeometry(0.7, 0.5, 0.7);
          break;
      }

      const compColor = comp.colorHex ? parseInt(comp.colorHex.replace('#', '0x'), 16) : colorHex;

      // Material based on Hologram style
      let mat: THREE.Material;
      if (hologramStyle === 'wireframe') {
        mat = new THREE.MeshBasicMaterial({
          color: compColor,
          wireframe: true,
          transparent: true,
          opacity: 0.85
        });
      } else if (hologramStyle === 'solid') {
        mat = new THREE.MeshPhongMaterial({
          color: compColor,
          emissive: compColor,
          emissiveIntensity: 0.3,
          shininess: 80,
          transparent: true,
          opacity: 0.9
        });
      } else {
        // Default Cyber Glow Hologram
        mat = new THREE.MeshPhongMaterial({
          color: compColor,
          emissive: compColor,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: comp.id === selectedComponentId ? 0.95 : 0.75,
          wireframe: false
        });
      }

      const mesh = new THREE.Mesh(geo, mat);

      // Relative position + exploded view displacement
      const posX = comp.relativePosition?.x || 0;
      const posY = comp.relativePosition?.y || 0;
      const posZ = comp.relativePosition?.z || 0;

      // Multiply position by (1 + explodedView * 1.2)
      mesh.position.set(
        posX * (1 + explodedView * 1.5),
        posY * (1 + explodedView * 1.5),
        posZ * (1 + explodedView * 1.5)
      );

      // Save reference
      componentMeshesRef.current[comp.id] = mesh;
      group.add(mesh);

      // Add wireframe outline overlay for hologram aesthetic
      const wireGeo = new THREE.WireframeGeometry(geo);
      const wireMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
      const wireLine = new THREE.LineSegments(wireGeo, wireMat);
      mesh.add(wireLine);
    });

    // Add Hotspot markers if enabled
    if (showHotspots && selectedModel.hotspots) {
      selectedModel.hotspots.forEach((spot, idx) => {
        const spotGeo = new THREE.OctahedronGeometry(0.12, 0);
        const spotMat = new THREE.MeshBasicMaterial({ color: 0xfff000, wireframe: true });
        const spotMesh = new THREE.Mesh(spotGeo, spotMat);
        spotMesh.position.set(
          spot.x * (1 + explodedView * 1.5),
          spot.y * (1 + explodedView * 1.5),
          spot.z * (1 + explodedView * 1.5)
        );
        group.add(spotMesh);
      });
    }

    group.scale.set(modelScale, modelScale, modelScale);
  }, [selectedModel, explodedView, hologramColor, hologramStyle, showHotspots, selectedComponentId, modelScale]);

  // Handle AI Model Generation
  const handleGenerateAiModel = async () => {
    if (!aiPromptTopic.trim()) return;
    setIsGeneratingAiModel(true);
    setAiGenError(null);

    try {
      const res = await fetch('/api/generate-ar-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: aiPromptTopic,
          documentContext: documentContext.slice(0, 2000)
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to generate 3D model.');
      }

      const data: ARHologramModelData = await res.json();
      setSelectedModel(data);
      setActiveTab('view');
    } catch (err: any) {
      console.error('AR model generation error:', err);
      setAiGenError(err.message || 'Could not synthesize custom 3D model.');
    } finally {
      setIsGeneratingAiModel(false);
    }
  };

  // Capture Snapshot of Camera + AR Hologram
  const handleTakeSnapshot = () => {
    if (!canvasRef.current) return;
    try {
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.download = `EduNexus_AR_Hologram_${selectedModel.modelName.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();

      setSnapshotSuccess(true);
      setTimeout(() => setSnapshotSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to capture snapshot:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between overflow-hidden">
      {/* Top Header Bar */}
      <div className="relative z-20 flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800/80 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-xs">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-wide text-white flex items-center gap-2">
              <span>AR Hologram Reader Studio</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold tracking-normal uppercase">
                3D Physical Desk View
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-md">
              {selectedModel.modelName} &bull; {selectedModel.category}
            </p>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2">
          {/* Preset Model Dropdown */}
          <select
            value={selectedModel.modelName}
            onChange={(e) => {
              const found = PRESET_MODELS.find(m => m.modelName === e.target.value);
              if (found) setSelectedModel(found);
            }}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer"
          >
            {PRESET_MODELS.map((m) => (
              <option key={m.modelName} value={m.modelName}>
                📦 3D {m.modelName}
              </option>
            ))}
          </select>

          {/* Camera Switch Toggle */}
          <button
            onClick={() => setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment')}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition border border-slate-700 text-xs flex items-center gap-1 cursor-pointer"
            title="Toggle Rear/Front Camera Feed"
          >
            <Camera className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline text-[11px] font-bold">Cam Mode</span>
          </button>

          {/* AI Custom Model Synthesizer Modal Toggle */}
          <button
            onClick={() => setActiveTab('ai_gen')}
            className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-lg text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-cyan-200 animate-spin" style={{ animationDuration: '4s' }} />
            <span>AI Generate 3D Model</span>
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main AR Display & Control Grid */}
      <div className="relative flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950">
        {/* Left Interactive AR Stage (Camera + WebGL Canvas Overlay) */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {/* Live Desk Camera Stream Feed */}
          {cameraActive ? (
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover opacity-80"
              autoPlay
              playsInline
              muted
            />
          ) : (
            /* Simulated Physical Desk Studio Background */
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center text-center p-6">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:24px_24px]" />
              <div className="relative z-10 max-w-sm bg-slate-900/80 border border-cyan-500/30 p-4 rounded-2xl backdrop-blur-md shadow-2xl space-y-2">
                <Grid className="w-8 h-8 text-cyan-400 mx-auto animate-pulse" />
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  Simulated Desk Surface Mode
                </h4>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {cameraError || 'Point camera at physical desk surface for real-world AR placement.'}
                </p>
                <button
                  onClick={startCamera}
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
                >
                  Enable Real Camera Feed
                </button>
              </div>
            </div>
          )}

          {/* Three.js WebGL Hologram Overlay Canvas */}
          <canvas
            ref={canvasRef}
            className="relative z-10 w-full h-full cursor-grab active:cursor-grabbing"
          />

          {/* AR Target Reticle Overlay on Physical Desk Surface */}
          <div className="absolute z-20 pointer-events-none inset-0 flex items-center justify-center">
            {/* Center Reticle Target */}
            <div className="relative w-48 h-48 border border-cyan-500/30 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-36 h-36 border border-cyan-400/50 rounded-full border-dashed animate-spin" style={{ animationDuration: '15s' }} />
              <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_15px_#00f0ff]" />
              <Scan className="absolute top-2 left-2 w-4 h-4 text-cyan-400" />
              <Scan className="absolute top-2 right-2 w-4 h-4 text-cyan-400 rotate-90" />
              <Scan className="absolute bottom-2 left-2 w-4 h-4 text-cyan-400 -rotate-90" />
              <Scan className="absolute bottom-2 right-2 w-4 h-4 text-cyan-400 rotate-180" />
            </div>

            {/* Bottom Surface Anchor Status Pill */}
            <div className="absolute bottom-6 px-3 py-1.5 bg-slate-900/90 border border-cyan-500/40 rounded-full text-cyan-300 text-[11px] font-bold flex items-center gap-2 shadow-xl backdrop-blur-md">
              <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
              <span>Desk Surface Anchored &bull; 45cm Depth</span>
            </div>
          </div>

          {/* On-Stage Overlay Action Buttons */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <button
              onClick={() => setAutoRotate(prev => !prev)}
              className={`p-2 rounded-xl backdrop-blur-md border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                autoRotate
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-900/80 border-slate-700 text-slate-400'
              }`}
              title="Toggle Auto-Rotation"
            >
              <RotateCcw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '10s' }} />
              <span className="hidden sm:inline">Auto Orbit</span>
            </button>

            <button
              onClick={handleTakeSnapshot}
              className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white rounded-xl backdrop-blur-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-lg"
              title="Save AR Hologram Desk Photo"
            >
              <Camera className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">AR Photo</span>
            </button>

            {snapshotSuccess && (
              <div className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 rounded-lg text-[10px] font-extrabold animate-bounce">
                ✓ Photo Saved!
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: AR Controls, Task Inspector & AI Generator */}
        <div className="relative z-20 w-full md:w-80 lg:w-96 bg-slate-900/95 border-l border-slate-800 flex flex-col divide-y divide-slate-800 text-slate-200">
          {/* Navigation Tabs */}
          <div className="flex bg-slate-950 p-1">
            <button
              onClick={() => setActiveTab('view')}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'view' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              🎛️ Controls
            </button>
            <button
              onClick={() => setActiveTab('inspect')}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'inspect' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              🔬 Inspect ({selectedModel.components.length})
            </button>
            <button
              onClick={() => setActiveTab('ai_gen')}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'ai_gen' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              ✨ AI Generator
            </button>
          </div>

          {/* TAB 1: AR CONTROLS */}
          {activeTab === 'view' && (
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Exploded View Slider */}
              <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    Exploded View Deconstruction
                  </span>
                  <span className="text-cyan-400 font-mono text-[11px]">{Math.round(explodedView * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={explodedView}
                  onChange={(e) => setExplodedView(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <p className="text-[10px] text-slate-400">
                  Separates 3D components in real-time to reveal internal task mechanics.
                </p>
              </div>

              {/* Hologram Visual Styles */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Hologram Aesthetic & Color Scheme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setHologramStyle('glow')}
                    className={`p-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      hologramStyle === 'glow' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Cyber Glow
                  </button>
                  <button
                    onClick={() => setHologramStyle('wireframe')}
                    className={`p-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      hologramStyle === 'wireframe' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Wireframe
                  </button>
                  <button
                    onClick={() => setHologramStyle('solid')}
                    className={`p-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      hologramStyle === 'solid' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Solid Cyber
                  </button>
                </div>

                {/* Color Swatches */}
                <div className="flex items-center gap-2 pt-1">
                  {['#00f0ff', '#10b981', '#a855f7', '#f59e0b', '#ec4899'].map((hex) => (
                    <button
                      key={hex}
                      onClick={() => setHologramColor(hex)}
                      className={`w-6 h-6 rounded-full border-2 transition cursor-pointer ${
                        hologramColor === hex ? 'scale-110 border-white ring-2 ring-cyan-400' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Scale & Desk Position */}
              <div className="space-y-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">Hologram Scale</span>
                    <span className="text-cyan-400">{modelScale.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.4"
                    max="2.5"
                    step="0.1"
                    value={modelScale}
                    onChange={(e) => setModelScale(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* Light Beam & Hotspots Toggles */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showLightBeam}
                      onChange={(e) => setShowLightBeam(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <span className="text-slate-300">Volumetric Light Beam</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showHotspots}
                      onChange={(e) => setShowHotspots(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <span className="text-slate-300">Task Hotspots</span>
                  </label>
                </div>
              </div>

              {/* Real World Task Context Callout */}
              <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl space-y-1">
                <h5 className="text-[11px] font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  Real-World Task Challenge
                </h5>
                <p className="text-[11px] text-slate-300 leading-snug">
                  {selectedModel.realWorldTaskContext}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: COMPONENT INSPECTOR & STEP GUIDE */}
          {activeTab === 'inspect' && (
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <h4 className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider mb-2">
                  Interactive Component Breakdown
                </h4>
                <div className="space-y-2">
                  {selectedModel.components.map((comp) => {
                    const isSelected = selectedComponentId === comp.id;
                    return (
                      <div
                        key={comp.id}
                        onClick={() => setSelectedComponentId(isSelected ? null : comp.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-2">
                            <Box className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`} />
                            {comp.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                            {comp.shapeType}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          {comp.functionDescription}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Task Step-by-Step Instructions */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-amber-400" />
                  Student Project Task Steps
                </h4>
                <ol className="space-y-2">
                  {selectedModel.taskSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="leading-snug">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: AI CUSTOM 3D MODEL GENERATOR */}
          {activeTab === 'ai_gen' && (
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  AI Custom AR 3D Model Generator
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Enter any lesson topic, real-world engineering project, or biological system to synthesize a custom 3D holographic projection with component annotations.
                </p>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] font-bold text-slate-300">
                    Project Task / Topic Name
                  </label>
                  <input
                    type="text"
                    value={aiPromptTopic}
                    onChange={(e) => setAiPromptTopic(e.target.value)}
                    placeholder="e.g. Geothermal Heat Exchanger, Hydroelectric Dam, Human Heart Dual Pump..."
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {aiGenError && (
                  <p className="text-[11px] text-rose-400 font-semibold bg-rose-950/40 border border-rose-500/30 p-2 rounded-lg">
                    ⚠️ {aiGenError}
                  </p>
                )}

                <button
                  onClick={handleGenerateAiModel}
                  disabled={isGeneratingAiModel || !aiPromptTopic.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-lg transition flex items-center justify-center gap-2 cursor-pointer mt-3"
                >
                  {isGeneratingAiModel ? (
                    <>
                      <RefreshCw className="w-4 h-4 text-cyan-200 animate-spin" />
                      <span>Synthesizing 3D Hologram Mesh...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-cyan-200" />
                      <span>Generate 3D AR Model</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
