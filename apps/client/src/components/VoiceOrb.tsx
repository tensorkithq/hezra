import { useFrequencyBandAudio } from "@/hooks/useFrequencyBandAudio";
import Iridescence from "./Iridescence";

interface VoiceOrbProps {
  isActive: boolean;
  isSpeaking: boolean;
}

const VoiceOrb = ({ isActive, isSpeaking }: VoiceOrbProps) => {
  // Use frequency band audio monitoring (mic + AI speaking)
  const audioData = useFrequencyBandAudio(isActive, isSpeaking, {
    sensitivity: 1.2,
    attack: 0.35,
    release: 0.08,
  });

  // Calculate final level: base level when active + audio level
  const baseLevel = isActive ? 0.15 : 0;
  const level = Math.max(baseLevel, audioData.level);

  const amplitude = 0.075 + level * 1.5;
  const speed = 0.5 + level * 0.5;
  const scale = 1 + level * 0.175;

  return (
    <div className="relative flex items-center justify-center">
      <div className="relative w-[210px] aspect-square">
        {/* Main orb */}
        <div
          className="relative h-full w-full rounded-full overflow-hidden transition-transform duration-150 ease-out"
          style={{ transform: `scale(${scale})` }}
        >
          <Iridescence
            amplitude={amplitude}
            speed={speed}
            color={[0.2, 0.9, 0.4]}
            color2={[0.2, 0.5, 1.0]}
            audioLevel={level}
            audioLow={audioData.low}
            audioMid={audioData.mid}
            audioHigh={audioData.high}
          />
        </div>
      </div>
    </div>
  );
};

export default VoiceOrb;
