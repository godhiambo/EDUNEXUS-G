export type AmbientPresetKey = 'city' | 'factory' | 'museum' | 'nature' | 'cosmic';

export interface AmbientPresetInfo {
  key: AmbientPresetKey;
  label: string;
  description: string;
  iconName: string;
  colorClass: string;
}

export const AMBIENT_PRESETS: Record<AmbientPresetKey, AmbientPresetInfo> = {
  city: {
    key: 'city',
    label: 'Urban Street & Traffic Hum',
    description: 'Distant traffic rumble, urban breeze & city street atmosphere',
    iconName: 'Building',
    colorClass: 'bg-amber-500 text-slate-950',
  },
  factory: {
    key: 'factory',
    label: 'Industrial & Factory Machinery',
    description: 'Rhythmic mechanical hum, motor pulses & industrial plant resonance',
    iconName: 'Cpu',
    colorClass: 'bg-indigo-600 text-white',
  },
  museum: {
    key: 'museum',
    label: 'Museum & Historic Hall Reverberation',
    description: 'Acoustic hall room tone, warm stone resonance & museum atmosphere',
    iconName: 'Landmark',
    colorClass: 'bg-emerald-700 text-white',
  },
  nature: {
    key: 'nature',
    label: 'Ocean Breeze & Wilderness Wind',
    description: 'Gentle wind sweeps, aquatic breeze & nature atmosphere',
    iconName: 'Wind',
    colorClass: 'bg-teal-600 text-white',
  },
  cosmic: {
    key: 'cosmic',
    label: 'Observatory & Deep Space Drone',
    description: 'Subtle sci-fi hum, sub-bass drone & observatory resonance',
    iconName: 'Sparkles',
    colorClass: 'bg-purple-700 text-white',
  }
};

/**
  Detects the appropriate ambient soundscape preset based on trip and stop context keywords.
 */
export function detectAmbientPreset(
  trip: { title: string; destination: string; category?: string; subject?: string },
  stop?: { title: string; locationName: string }
): AmbientPresetKey {
  const combinedText = `${trip.title} ${trip.destination} ${trip.category || ''} ${trip.subject || ''} ${stop?.title || ''} ${stop?.locationName || ''}`.toLowerCase();

  if (combinedText.match(/factory|industrial|robotics|manufactur|engine|bmw|car|assembly|plant|machinery|tech|lab|mechanic|hardware/)) {
    return 'factory';
  }
  if (combinedText.match(/museum|gallery|art|louvre|exhibit|hall|cathedral|temple|pyramid|tomb|history|ancient|monument|archeolog/)) {
    return 'museum';
  }
  if (combinedText.match(/reef|ocean|sea|rainforest|jungle|park|nature|wildlife|volcano|canyon|river|mountain|geography|island|coast|beach/)) {
    return 'nature';
  }
  if (combinedText.match(/space|nasa|observatory|astronomy|planet|star|cosmic|telescope|mars|apollo/)) {
    return 'cosmic';
  }
  if (combinedText.match(/london|tokyo|paris|rome|new york|city|street|urban|capital|metropolis|traffic|plaza|square|avenue|tower/)) {
    return 'city';
  }

  return 'city';
}

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentPreset: AmbientPresetKey = 'city';
  private currentVolume: number = 0.35; // 0.0 to 1.0

  // Active audio nodes references for cleanup
  private activeNodes: Array<AudioNode | { stop?: () => void; disconnect: () => void }> = [];
  private lfoOscillators: OscillatorNode[] = [];

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private createPinkNoiseBuffer(ctx: AudioContext, durationSec: number = 5): AudioBuffer {
    const bufferSize = ctx.sampleRate * durationSec;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11; // scale down
      b6 = white * 0.115926;
    }
    return buffer;
  }

  public play(preset: AmbientPresetKey = 'city', volume: number = 0.35) {
    this.initContext();
    if (!this.ctx) return;

    this.currentPreset = preset;
    this.currentVolume = volume;

    this.stopActiveNodes();

    // Create Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Build synth nodes based on preset
    switch (preset) {
      case 'city':
        this.buildCitySynth(this.ctx, this.masterGain);
        break;
      case 'factory':
        this.buildFactorySynth(this.ctx, this.masterGain);
        break;
      case 'museum':
        this.buildMuseumSynth(this.ctx, this.masterGain);
        break;
      case 'nature':
        this.buildNatureSynth(this.ctx, this.masterGain);
        break;
      case 'cosmic':
        this.buildCosmicSynth(this.ctx, this.masterGain);
        break;
      default:
        this.buildCitySynth(this.ctx, this.masterGain);
    }

    this.isPlaying = true;
  }

  public stop() {
    this.stopActiveNodes();
    this.isPlaying = false;
  }

  public setVolume(volume: number) {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.currentVolume, this.ctx.currentTime, 0.05);
    }
  }

  public setPreset(preset: AmbientPresetKey) {
    if (this.currentPreset === preset && this.isPlaying) return;
    this.currentPreset = preset;
    if (this.isPlaying) {
      this.play(preset, this.currentVolume);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentPreset(): AmbientPresetKey {
    return this.currentPreset;
  }

  public getCurrentVolume(): number {
    return this.currentVolume;
  }

  private stopActiveNodes() {
    this.lfoOscillators.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch (e) {}
    });
    this.lfoOscillators = [];

    this.activeNodes.forEach(node => {
      try {
        if ('stop' in node && typeof node.stop === 'function') {
          node.stop();
        }
        node.disconnect();
      } catch (e) {}
    });
    this.activeNodes = [];

    if (this.masterGain) {
      try { this.masterGain.disconnect(); } catch (e) {}
      this.masterGain = null;
    }
  }

  // --- SYNTH BUILDERS --- //

  private buildCitySynth(ctx: AudioContext, destination: GainNode) {
    // 1. Filtered pink noise for road traffic rumble
    const noiseBuffer = this.createPinkNoiseBuffer(ctx, 4);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const lpFilter = ctx.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.frequency.setValueAtTime(320, ctx.currentTime);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, ctx.currentTime);

    noiseSource.connect(lpFilter);
    lpFilter.connect(noiseGain);
    noiseGain.connect(destination);

    noiseSource.start();
    this.activeNodes.push(noiseSource, lpFilter, noiseGain);

    // 2. Low-frequency engine rumble oscillator
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(55, ctx.currentTime);

    // LFO to modulate rumble frequency (simulates distant car passing)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.15, ctx.currentTime);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(8, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(subOsc.frequency);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.25, ctx.currentTime);

    subOsc.connect(subGain);
    subGain.connect(destination);

    subOsc.start();
    lfo.start();

    this.activeNodes.push(subOsc, subGain, lfoGain);
    this.lfoOscillators.push(lfo);
  }

  private buildFactorySynth(ctx: AudioContext, destination: GainNode) {
    // 1. Mechanical saw oscillator with lowpass filter
    const sawOsc = ctx.createOscillator();
    sawOsc.type = 'sawtooth';
    sawOsc.frequency.setValueAtTime(70, ctx.currentTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);
    filter.Q.setValueAtTime(4, ctx.currentTime);

    // LFO for periodic machine pulse
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(1.2, ctx.currentTime); // 1.2 Hz pulse

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(150, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const sawGain = ctx.createGain();
    sawGain.gain.setValueAtTime(0.3, ctx.currentTime);

    sawOsc.connect(filter);
    filter.connect(sawGain);
    sawGain.connect(destination);

    sawOsc.start();
    lfo.start();

    this.activeNodes.push(sawOsc, filter, sawGain, lfoGain);
    this.lfoOscillators.push(lfo);

    // 2. High-frequency metallic mechanical hiss
    const noiseBuffer = this.createPinkNoiseBuffer(ctx, 3);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const bpFilter = ctx.createBiquadFilter();
    bpFilter.type = 'bandpass';
    bpFilter.frequency.setValueAtTime(1800, ctx.currentTime);
    bpFilter.Q.setValueAtTime(2, ctx.currentTime);

    const hissGain = ctx.createGain();
    hissGain.gain.setValueAtTime(0.12, ctx.currentTime);

    noiseSource.connect(bpFilter);
    bpFilter.connect(hissGain);
    hissGain.connect(destination);

    noiseSource.start();
    this.activeNodes.push(noiseSource, bpFilter, hissGain);
  }

  private buildMuseumSynth(ctx: AudioContext, destination: GainNode) {
    // Warm, reverberant room tone & subtle harmonic chord
    const freqA = 110; // A2
    const freqB = 164.81; // E3

    const oscA = ctx.createOscillator();
    oscA.type = 'sine';
    oscA.frequency.setValueAtTime(freqA, ctx.currentTime);

    const oscB = ctx.createOscillator();
    oscB.type = 'sine';
    oscB.frequency.setValueAtTime(freqB, ctx.currentTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, ctx.currentTime);

    const gainA = ctx.createGain();
    gainA.gain.setValueAtTime(0.18, ctx.currentTime);

    const gainB = ctx.createGain();
    gainB.gain.setValueAtTime(0.12, ctx.currentTime);

    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(destination);

    oscA.start();
    oscB.start();

    this.activeNodes.push(oscA, oscB, filter, gainA, gainB);

    // Subtle pink noise for room air circulation
    const noiseBuffer = this.createPinkNoiseBuffer(ctx, 5);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const airFilter = ctx.createBiquadFilter();
    airFilter.type = 'lowpass';
    airFilter.frequency.setValueAtTime(200, ctx.currentTime);

    const airGain = ctx.createGain();
    airGain.gain.setValueAtTime(0.2, ctx.currentTime);

    noiseSource.connect(airFilter);
    airFilter.connect(airGain);
    airGain.connect(destination);

    noiseSource.start();
    this.activeNodes.push(noiseSource, airFilter, airGain);
  }

  private buildNatureSynth(ctx: AudioContext, destination: GainNode) {
    // Sweeping pink noise simulating ocean breeze / wind gusts
    const noiseBuffer = this.createPinkNoiseBuffer(ctx, 6);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(400, ctx.currentTime);
    windFilter.Q.setValueAtTime(1.5, ctx.currentTime);

    // LFO for slow wind modulation (wave sweeping)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // ~12 second cycle

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(350, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(windFilter.frequency);

    const windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0.35, ctx.currentTime);

    noiseSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(destination);

    noiseSource.start();
    lfo.start();

    this.activeNodes.push(noiseSource, windFilter, windGain, lfoGain);
    this.lfoOscillators.push(lfo);
  }

  private buildCosmicSynth(ctx: AudioContext, destination: GainNode) {
    // Deep sub-bass hum + cosmic filter sweep
    const subOsc = ctx.createOscillator();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(42, ctx.currentTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, ctx.currentTime);

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.05, ctx.currentTime);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(80, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.3, ctx.currentTime);

    subOsc.connect(filter);
    filter.connect(subGain);
    subGain.connect(destination);

    subOsc.start();
    lfo.start();

    this.activeNodes.push(subOsc, filter, subGain, lfoGain);
    this.lfoOscillators.push(lfo);
  }
}

export const ambientAudioEngine = new AmbientAudioEngine();
