# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Moniewave** is a voice-powered financial assistant application that uses OpenAI's Realtime API for voice interactions. The app enables users to manage finances through natural voice commands with support for payments, invoicing, account limits, virtual cards, and transaction analytics.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand
- **Voice AI**: OpenAI Realtime API (WebRTC-based speech-to-speech)
- **Backend**: Supabase (Edge Functions, client SDK)
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router DOM

## Architecture

### Voice Agent System

The application uses OpenAI's Realtime API for voice-based interactions:

**OpenAI Realtime Voice Agent** (`/` route):
- **Hook**: [useOpenAIVoiceAgent.ts](src/components/openai/useOpenAIVoiceAgent.ts)
- **Component**: [OpenAIVoiceInterface.tsx](src/components/openai/OpenAIVoiceInterface.tsx)
- **Transport**: Direct WebRTC connection to OpenAI's Realtime API
- **Model**: `gpt-4o-realtime-preview-2024-12-17`
- **Authentication**: Ephemeral tokens via Supabase Edge Function
- **Tool Execution**: Manual approval system with toast notifications
- **State**: Zustand store ([useOpenAIStore.ts](src/stores/useOpenAIStore.ts)) persists messages, tool executions, and raw events

### Tool System

Financial tools are defined in [tools.ts](src/components/openai/tools.ts) using OpenAI function calling format:

- `pay_contractors_bulk` - Bulk payment processing
- `set_account_limits` - Balance and transfer limits
- `set_beneficiary_transfer_limit` - Per-beneficiary policies
- `create_virtual_card` - Virtual debit card generation
- `send_invoice` - Invoice creation and sending
- `aggregate_transactions` - Analytics and reporting
- `account_snapshot` - Balance and KPI summary

**Tool Execution Flow**:
1. Agent requests tool via `response.function_call_arguments.done` event
2. User approval requested via toast notification
3. On approval: `executeToolCall()` runs with mock data
4. Result sent back via `conversation.item.create` event
5. Execution logged to Zustand store with duration tracking

### State Management

**Zustand Store** ([useOpenAIStore.ts](src/stores/useOpenAIStore.ts)):
- `messages: Message[]` - Conversation transcript (user/assistant)
- `toolExecutions: ToolExecution[]` - Tool call history with arguments, results, duration
- `rawEvents: any[]` - Complete WebRTC event log for debugging
- `clearAll()` - Resets all state on disconnect

### Supabase Integration

**Edge Function**: [openai-ephemeral-token](supabase/functions/openai-ephemeral-token/index.ts)
- **Purpose**: Securely generate OpenAI ephemeral session tokens
- **Environment**: Requires `OPENAI_API_KEY` in Supabase secrets
- **Returns**: `client_secret.value` for WebRTC authentication

**Configuration**: [config.toml](supabase/config.toml)
- JWT verification disabled for ephemeral token endpoint

### Visual Components

**Voice Orb Visualization**:
- [VoiceOrb.tsx](src/components/VoiceOrb.tsx) - Animated orb using WebGL (OGL library)
- [Iridescence.tsx](src/components/Iridescence.tsx) - CSS-based iridescent animations

**Audio Hooks**:
- [use-combined-audio-level.ts](src/hooks/use-combined-audio-level.ts) - Combined mic/speaker levels
- [useFrequencyBandAudio.ts](src/hooks/useFrequencyBandAudio.ts) - Frequency band analysis

## Common Commands

```bash
# Development
npm run dev              # Start dev server on http://localhost:8080

# Production Build
npm run build            # Build for production
npm run build:dev        # Build in development mode
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
```

## Environment Variables

Required in `.env`:

```
VITE_SUPABASE_URL=https://edjxfoqjzuztpkpjzigs.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon_key>
VITE_SUPABASE_PROJECT_ID=edjxfoqjzuztpkpjzigs
```

**Supabase Secrets** (set via Supabase CLI):
```bash
supabase secrets set OPENAI_API_KEY=sk-proj-...
```

## Development Notes

### Adding New Financial Tools

1. Add tool definition to `toolsConfig` array in [tools.ts](src/components/openai/tools.ts:4)
2. Implement execution logic in `executeToolCall()` switch statement
3. Follow OpenAI function calling schema format
4. Return structured results with `status`, `message`, and relevant data

### WebRTC Event Handling

The OpenAI integration listens for these events via data channel:

- `session.created` → Send `session.update` with tools config
- `response.audio_transcript.delta` → Set `isSpeaking` state
- `response.audio_transcript.done` → Add assistant message
- `conversation.item.input_audio_transcription.completed` → Add user message
- `response.function_call_arguments.done` → Trigger tool approval flow

### Debugging Voice Connections

The OpenAI interface includes a debug panel that displays raw WebRTC events stored in the `rawEvents` array. Toggle debug view with the "More" (three dots) button.

### Path Aliases

Vite is configured with `@` alias pointing to `./src`:

```typescript
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
```

### UI Components

This project uses shadcn/ui components in `src/components/ui/`. Components are based on Radix UI primitives with Tailwind styling. Configuration in [components.json](components.json).

## Architecture Patterns

### Tool Approval Flow

The application uses a manual approval pattern for all financial tools:

1. Tool call triggers `pendingToolCall` state with event + promise resolver
2. User approves/rejects via UI callback
3. On rejection: Send error response + request new agent response
4. On approval: Execute tool → Send result → Request new agent response

This pattern ensures user control over all financial operations.

### Audio Level Simulation

Since WebRTC audio streams don't expose level meters directly, the OpenAI hook simulates audio levels based on `isSpeaking` state with smooth interpolation for visual feedback.

## Testing Locally

1. Ensure Supabase Edge Function is deployed with `OPENAI_API_KEY`
2. Navigate to `/` route
3. Click microphone button to start session
4. Grant browser microphone permissions
5. Speak naturally - agent responds with voice and executes tools

## Project Structure

```
src/
├── components/
│   ├── openai/              # OpenAI Realtime implementation
│   │   ├── OpenAIVoiceInterface.tsx
│   │   ├── useOpenAIVoiceAgent.ts
│   │   ├── tools.ts         # Financial tool definitions
│   │   └── README.md
│   ├── ui/                  # shadcn/ui components
│   ├── VoiceOrb.tsx         # WebGL visualization
│   └── Iridescence.tsx      # Shader effects
├── hooks/                   # Audio analysis hooks
├── integrations/
│   └── supabase/            # Supabase client config
├── layouts/
│   └── DefaultLayout.tsx    # Page wrapper
├── pages/                   # Route components
├── stores/
│   └── useOpenAIStore.ts    # Voice session state
└── App.tsx                  # Router configuration

supabase/
├── config.toml              # Supabase project config
└── functions/
    └── openai-ephemeral-token/  # Token generation Edge Function
```

## Package Manager

This project uses **npm** (package-lock.json present). The monorepo parent uses pnpm, but this client app is standalone with npm.
