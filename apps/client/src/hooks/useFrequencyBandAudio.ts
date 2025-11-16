import { useEffect, useRef, useState } from 'react';

/**
 * Audio frequency band analysis configuration
 */
interface FrequencyBands {
  level: number;  // Overall audio level (0-1)
  low: number;    // Bass frequencies 20-250 Hz (0-1)
  mid: number;    // Mid frequencies 250-2000 Hz (0-1)
  high: number;   // High frequencies 2000-12000 Hz (0-1)
}

interface UseFrequencyBandAudioOptions {
  sensitivity?: number;  // Multiplier for audio sensitivity (default: 1.0)
  fftSize?: number;      // FFT size (default: 1024)
  smoothing?: number;    // Frequency smoothing (default: 0.75)
  attack?: number;       // Attack time coefficient (default: 0.35)
  release?: number;      // Release time coefficient (default: 0.08)
}

/**
 * Hook that provides multi-band frequency analysis from microphone input
 * Returns separate bands for bass, mids, highs plus overall level
 *
 * Includes attack/release envelope smoothing for musical dynamics
 * Falls back to silent oscillator if microphone access is denied
 */
export function useFrequencyBandAudio(
  isActive: boolean,
  isSpeaking: boolean,
  options: UseFrequencyBandAudioOptions = {}
) {
  const {
    sensitivity = 1.0,
    fftSize = 1024,
    smoothing = 0.75,
    attack = 0.35,
    release = 0.08,
  } = options;

  const [bands, setBands] = useState<FrequencyBands>({
    level: 0,
    low: 0,
    mid: 0,
    high: 0,
  });

  // Smoothed band values with attack/release
  const bandsRef = useRef<FrequencyBands>({
    level: 0,
    low: 0,
    mid: 0,
    high: 0,
  });

  // Microphone and AI simulation levels
  const micBandsRef = useRef<FrequencyBands>({
    level: 0,
    low: 0,
    mid: 0,
    high: 0,
  });

  const aiBandsRef = useRef<FrequencyBands>({
    level: 0,
    low: 0,
    mid: 0,
    high: 0,
  });

  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);

  /**
   * Convert frequency (Hz) to FFT bin index
   */
  const frequencyToBin = (frequency: number, sampleRate: number, fftSize: number): number => {
    return Math.round((frequency * fftSize) / sampleRate);
  };

  /**
   * Analyze a frequency band by averaging FFT bins in range
   */
  const analyzeBand = (
    data: Uint8Array,
    startHz: number,
    endHz: number,
    sampleRate: number,
    fftSize: number
  ): number => {
    const startBin = frequencyToBin(startHz, sampleRate, fftSize);
    const endBin = frequencyToBin(endHz, sampleRate, fftSize);

    let sum = 0;
    let count = 0;

    for (let i = startBin; i <= endBin && i < data.length; i++) {
      sum += data[i];
      count++;
    }

    if (count === 0) return 0;

    const avg = sum / count;
    // Normalize from 0-255 to 0-1 with threshold and scaling
    return Math.min(1, Math.max(0, (avg - 16) / 90));
  };

  /**
   * Apply attack/release envelope smoothing
   */
  const smoothWithEnvelope = (
    current: number,
    target: number,
    attack: number,
    release: number
  ): number => {
    // Use attack coefficient when rising, release when falling
    const coefficient = target > current ? attack : release;
    return current + (target - current) * coefficient;
  };

  // Setup microphone monitoring when active
  useEffect(() => {
    if (!isActive) {
      // Cleanup when not active
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (ctxRef.current) ctxRef.current.close();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());

      ctxRef.current = null;
      analyserRef.current = null;
      streamRef.current = null;

      micBandsRef.current = { level: 0, low: 0, mid: 0, high: 0 };
      aiBandsRef.current = { level: 0, low: 0, mid: 0, high: 0 };
      bandsRef.current = { level: 0, low: 0, mid: 0, high: 0 };
      setBands({ level: 0, low: 0, mid: 0, high: 0 });

      return;
    }

    // Setup microphone analysis
    const setupMicrophone = async () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        ctxRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = fftSize;
        analyser.smoothingTimeConstant = smoothing;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyserRef.current = analyser;

        const data = new Uint8Array(analyser.frequencyBinCount);
        const sampleRate = ctx.sampleRate;

        const tick = () => {
          if (!analyserRef.current) return;

          // Analyze microphone input across frequency bands
          analyserRef.current.getByteFrequencyData(data);

          // Extract frequency bands
          const lowBand = analyzeBand(data, 20, 250, sampleRate, fftSize);
          const midBand = analyzeBand(data, 250, 2000, sampleRate, fftSize);
          const highBand = analyzeBand(data, 2000, 12000, sampleRate, fftSize);

          // Overall level is weighted average (favor mids/lows for perceived loudness)
          const overallLevel = (lowBand * 0.4 + midBand * 0.4 + highBand * 0.2);

          // Apply attack/release smoothing to microphone bands
          micBandsRef.current.level = smoothWithEnvelope(
            micBandsRef.current.level,
            overallLevel,
            attack,
            release
          );
          micBandsRef.current.low = smoothWithEnvelope(
            micBandsRef.current.low,
            lowBand,
            attack,
            release
          );
          micBandsRef.current.mid = smoothWithEnvelope(
            micBandsRef.current.mid,
            midBand,
            attack,
            release
          );
          micBandsRef.current.high = smoothWithEnvelope(
            micBandsRef.current.high,
            highBand,
            attack,
            release
          );

          // Simulate AI speaking with variation across bands
          if (isSpeaking) {
            const randomVariation = Math.random() * 0.3 + 0.7; // 0.7 to 1.0

            // AI speech has more energy in mid frequencies
            aiBandsRef.current.level = smoothWithEnvelope(
              aiBandsRef.current.level,
              randomVariation,
              attack,
              release
            );
            aiBandsRef.current.low = smoothWithEnvelope(
              aiBandsRef.current.low,
              randomVariation * 0.6, // Less bass
              attack,
              release
            );
            aiBandsRef.current.mid = smoothWithEnvelope(
              aiBandsRef.current.mid,
              randomVariation * 1.0, // Most energy in mids
              attack,
              release
            );
            aiBandsRef.current.high = smoothWithEnvelope(
              aiBandsRef.current.high,
              randomVariation * 0.4, // Some highs
              attack,
              release
            );
          } else {
            // Decay all bands when not speaking
            aiBandsRef.current.level *= 0.9;
            aiBandsRef.current.low *= 0.9;
            aiBandsRef.current.mid *= 0.9;
            aiBandsRef.current.high *= 0.9;
          }

          // Combine both sources (take maximum for each band)
          bandsRef.current.level = Math.max(micBandsRef.current.level, aiBandsRef.current.level);
          bandsRef.current.low = Math.max(micBandsRef.current.low, aiBandsRef.current.low);
          bandsRef.current.mid = Math.max(micBandsRef.current.mid, aiBandsRef.current.mid);
          bandsRef.current.high = Math.max(micBandsRef.current.high, aiBandsRef.current.high);

          // Apply sensitivity scaling
          const scaledBands = {
            level: Math.min(1, bandsRef.current.level * sensitivity),
            low: Math.min(1, bandsRef.current.low * sensitivity),
            mid: Math.min(1, bandsRef.current.mid * sensitivity),
            high: Math.min(1, bandsRef.current.high * sensitivity),
          };

          setBands(scaledBands);
          rafRef.current = requestAnimationFrame(tick);
        };

        tick();
      } catch (err) {
        console.error('Microphone access error:', err);

        // Fallback: use silent oscillator with AI speaking simulation
        const fallbackTick = () => {
          if (isSpeaking) {
            const randomVariation = Math.random() * 0.3 + 0.7;

            // AI speech simulation
            aiBandsRef.current.level = smoothWithEnvelope(
              aiBandsRef.current.level,
              randomVariation,
              attack,
              release
            );
            aiBandsRef.current.low = smoothWithEnvelope(
              aiBandsRef.current.low,
              randomVariation * 0.6,
              attack,
              release
            );
            aiBandsRef.current.mid = smoothWithEnvelope(
              aiBandsRef.current.mid,
              randomVariation * 1.0,
              attack,
              release
            );
            aiBandsRef.current.high = smoothWithEnvelope(
              aiBandsRef.current.high,
              randomVariation * 0.4,
              attack,
              release
            );
          } else {
            // Gentle decay
            aiBandsRef.current.level *= 0.9;
            aiBandsRef.current.low *= 0.9;
            aiBandsRef.current.mid *= 0.9;
            aiBandsRef.current.high *= 0.9;
          }

          // Apply sensitivity scaling
          const scaledBands = {
            level: Math.min(1, aiBandsRef.current.level * sensitivity),
            low: Math.min(1, aiBandsRef.current.low * sensitivity),
            mid: Math.min(1, aiBandsRef.current.mid * sensitivity),
            high: Math.min(1, aiBandsRef.current.high * sensitivity),
          };

          setBands(scaledBands);
          rafRef.current = requestAnimationFrame(fallbackTick);
        };

        fallbackTick();
      }
    };

    setupMicrophone();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (ctxRef.current) ctxRef.current.close();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [isActive, isSpeaking, sensitivity, fftSize, smoothing, attack, release]);

  return bands;
}
