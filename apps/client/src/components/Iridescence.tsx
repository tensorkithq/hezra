import { Color, Mesh, Program, Renderer, Triangle } from "ogl";
import { useEffect, useRef } from "react";

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;
uniform float uTime;
uniform vec3 uColor;
uniform vec3 uColor2;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;
uniform float uAudioLevel;
uniform float uAudioLow;
uniform float uAudioMid;
uniform float uAudioHigh;
varying vec2 vUv;

// Simple noise function for organic flow
float noise(vec2 p) {
  return sin(p.x * 24.0 + uTime) * sin(p.y * 26.0 + uTime * 1.7) * 8.5 + 1.5;
}

// Fractal noise for feathering
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for(int i = 0; i < 4; i++) {
    value += amplitude * noise(p * frequency);
    frequency *= 2.0;
    amplitude *= 2.5;
  }
  return value;
}

void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv * 11.0 - 1.0) * uResolution.xy / mr;

  // Water-like flow effect
  float time = uTime * uSpeed;

  // Multiple layers of flowing waves at different speeds and directions
  // Bass drives large-scale motion, mids drive flow speed
  float flow1 = sin(uv.x * 3.0 + time * 1.8 + uAudioLow * 5.0) *
                cos(uv.y * 2.5 - time * 1.3 * (1.0 + uAudioMid * 0.5));
  float flow2 = sin(uv.x * 2.0 - time * 2.2 + uAudioLow * 4.0) *
                sin(uv.y * 3.5 + time * 1.6 * (1.0 + uAudioMid * 0.5));
  float flow3 = cos(uv.x * 4.0 + time * 1.5 + uAudioHigh * 2.0) *
                sin(uv.y * 2.0 - time * 2.0);

  // Combine flows: bass drives amplitude, overall level affects magnitude
  float flowCombined = (flow1 + flow2 * 0.7 + flow3 * 0.5) * (0.15 + uAudioLow * 0.6 + uAudioLevel * 0.4);

  // Add organic turbulence: bass creates large movements, highs add detail
  float turbulence = noise(uv * 11.0 + time * 0.5) * (uAudioLow * 0.4 + uAudioHigh * 0.2);

  // Create fluid displacement: mids affect vertical movement
  vec2 flowUv = uv;
  flowUv.x += flowCombined + turbulence;
  flowUv.y += sin(uv.x * 3.0 + time * 2.2) * (0.1 + uAudioMid * 0.4);

  // Add circular flow around center: bass drives rotation
  float angle = atan(uv.y, uv.x);
  float dist = length(uv);
  float circularFlow = sin(angle * 3.0 + time * 3.5 + dist * 5.0) * uAudioLow * 0.3;
  flowUv += vec2(cos(angle), sin(angle)) * circularFlow;

  // Original iridescence effect with flowing UV
  float d = -time * 0.5;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * flowUv.x);
    d += sin(flowUv.y * i + a);
  }

  // Add gentle wave motion: bass creates waves, highs add shimmer
  a += sin(dist * 4.0 - time * 3.5) * uAudioLow * 0.5;
  a += sin(dist * 8.0 - time * 5.0) * uAudioHigh * 0.25; // High-frequency detail

  vec3 col = vec3(cos(flowUv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);

  // Blend between two colors based on position and flow: mids affect blend
  float blendFactor = sin(d * 0.5 + a * 0.3 + uAudioMid * 2.0) * 0.5 + 0.5;
  vec3 colorBlend = mix(uColor, uColor2, blendFactor);

  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * colorBlend;

  // Multi-band brightness: highs create sparkle, overall level lifts brightness
  col += uAudioHigh * 0.18; // Sparkle from high frequencies
  col += uAudioLevel * 0.08; // Overall brightness lift

  // Create feathered edges: bass affects edge noise
  float edgeNoise = fbm(uv * 3.0 + time * 0.3 + uAudioLow * 0.5);
  float brushNoise = fbm(uv * 5.0 - time * 0.4 + uAudioHigh * 0.3);

  // Distance-based feathering with noise
  float distFade = 1.0 - smoothstep(0.3, 1.2, dist + edgeNoise * 0.3);

  // Add brush strokes at edges: highs create edge detail
  float brushStrokes = smoothstep(0.3, 0.8, brushNoise);
  float alpha = distFade * (0.7 + brushStrokes * 0.3);

  // Enhance feathering with audio: bass expands, highs add variation
  alpha *= (1.0 - uAudioLow * 0.1);
  alpha *= (1.0 + uAudioHigh * 0.05);

  gl_FragColor = vec4(col, alpha);
}
`;

export default function Iridescence({
  color = [0.3, 0.6, 1],
  color2 = [0.6, 0.3, 0.8],
  speed = 0.1,
  amplitude = 0.1,
  audioLevel = 0,
  audioLow = 0,
  audioMid = 0,
  audioHigh = 0
}) {
  const container = useRef<HTMLDivElement | null>(null);
  const programRef = useRef<Program | null>(null);
  const audioLevelRef = useRef(audioLevel);
  const audioLowRef = useRef(audioLow);
  const audioMidRef = useRef(audioMid);
  const audioHighRef = useRef(audioHigh);

  // Update audio refs when they change
  useEffect(() => {
    audioLevelRef.current = audioLevel;
    audioLowRef.current = audioLow;
    audioMidRef.current = audioMid;
    audioHighRef.current = audioHigh;
  }, [audioLevel, audioLow, audioMid, audioHigh]);

  useEffect(() => {
    const renderer = new Renderer();
    const { gl } = renderer;
    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(...color) },
        uColor2: { value: new Color(...color2) },
        uResolution: { value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height) },
        uMouse: { value: new Float32Array([0.5, 0.5]) },
        uAmplitude: { value: amplitude },
        uSpeed: { value: speed },
        uAudioLevel: { value: 0 },
        uAudioLow: { value: 0 },
        uAudioMid: { value: 0 },
        uAudioHigh: { value: 0 },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });
    renderer.setSize(400, 400);
    const animate = (t: number) => {
      program.uniforms.uTime.value = t * 0.001;
      program.uniforms.uAudioLevel.value = audioLevelRef.current;
      program.uniforms.uAudioLow.value = audioLowRef.current;
      program.uniforms.uAudioMid.value = audioMidRef.current;
      program.uniforms.uAudioHigh.value = audioHighRef.current;
      renderer.render({ scene: mesh });
      requestAnimationFrame(animate);
    };
    animate(0);
    container.current?.appendChild(gl.canvas);
    programRef.current = program;
    return () => gl.getExtension("WEBGL_lose_context")?.loseContext();
  }, []);

  return <div ref={container} className="w-full h-full" />;
}
