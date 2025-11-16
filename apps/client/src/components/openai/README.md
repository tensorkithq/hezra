# OpenAI Voice Agent Implementation

This folder contains the implementation for OpenAI's Realtime Voice Agents using the speech-to-speech architecture.

## Architecture

The implementation uses OpenAI's official `@openai/agents` SDK which provides:
- WebRTC connection for low-latency voice communication
- Speech-to-speech model (`gpt-4o-realtime-preview-2024-12-17`)
- Automatic audio input/output handling
- Real-time transcription

## Files

### `useOpenAIVoiceAgent.ts`
Custom React hook that manages:
- Connection lifecycle (connect/disconnect)
- Session management with `RealtimeSession`
- Agent configuration with `RealtimeAgent`
- Message history tracking
- Audio level simulation
- Event handling for messages, errors, and connection status

### `OpenAIVoiceInterface.tsx`
UI component that provides:
- Minimal black interface matching design system
- Voice orb visualization with WebGL animations
- Transcript overlay
- Icon-based controls (mic, transcript, close)
- Connection status indicator
- Tool approval UI with toast notifications

## Configuration

Default settings in the hook:
- Model: `gpt-4o-realtime-preview-2024-12-17`
- Instructions: "You are a helpful voice assistant. Be concise and friendly."
- Name: "OpenAI Assistant"

These can be customized by modifying the hook parameters.

## Dependencies

- `@openai/agents` - Official OpenAI Agents SDK
- `zod@3` - Schema validation (required by SDK)
- React hooks (useState, useRef, useCallback, useEffect)
- Lucide icons for UI

## Notes

- The WebRTC connection is established directly between browser and OpenAI servers
- Audio is processed entirely client-side for low latency
- The SDK automatically handles microphone access and speaker output
- Transcripts are available for both user and assistant messages
