import { useEffect, useRef, useState } from 'react';

/**
 * Hook that combines microphone input levels with AI speaking state
 * This allows the orb to react to both user voice and AI voice
 */
export function useCombinedAudioLevel(isActive: boolean, isSpeaking: boolean) {
  const [level, setLevel] = useState(0);
  const levelRef = useRef(0);
  const micLevelRef = useRef(0);
  const aiLevelRef = useRef(0);

  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);

  // Start microphone monitoring when active
  useEffect(() => {
    if (!isActive) {
      // Cleanup when not active
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (ctxRef.current) ctxRef.current.close();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());

      ctxRef.current = null;
      analyserRef.current = null;
      streamRef.current = null;
      micLevelRef.current = 0;
      aiLevelRef.current = 0;
      levelRef.current = 0;
      setLevel(0);
      return;
    }

    // Setup microphone analysis
    const setupMicrophone = async () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        ctxRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.8;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyserRef.current = analyser;

        const data = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          if (!analyserRef.current) return;

          // Analyze microphone input
          analyserRef.current.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b) / data.length;
          const micNorm = Math.min(1, Math.max(0, (avg - 16) / 90));
          micLevelRef.current += (micNorm - micLevelRef.current) * 0.15;

          // Simulate AI speaking with variation
          if (isSpeaking) {
            const randomVariation = Math.random() * 0.3 + 0.7; // 0.7 to 1.0
            aiLevelRef.current += (randomVariation - aiLevelRef.current) * 0.15;
          } else {
            aiLevelRef.current *= 0.9; // Decay
          }

          // Combine both levels (take the maximum)
          const combinedLevel = Math.max(micLevelRef.current, aiLevelRef.current);
          levelRef.current += (combinedLevel - levelRef.current) * 0.2;

          setLevel(levelRef.current);
          rafRef.current = requestAnimationFrame(tick);
        };

        tick();
      } catch (err) {
        console.error('Microphone access error:', err);

        // Fallback: just use AI speaking simulation if mic fails
        const fallbackTick = () => {
          if (isSpeaking) {
            const randomVariation = Math.random() * 0.3 + 0.7;
            aiLevelRef.current += (randomVariation - aiLevelRef.current) * 0.15;
          } else {
            aiLevelRef.current *= 0.9;
          }

          levelRef.current += (aiLevelRef.current - levelRef.current) * 0.2;
          setLevel(levelRef.current);
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
  }, [isActive, isSpeaking]);

  return level;
}
