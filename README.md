# Hezra

A **voice-powered financial assistant** built with OpenAI's Realtime API and Paystack integration. Hezra is a Turborepo monorepo containing a React voice interface client and a Go HTTP API server for secure payment processing.

## Monorepo Structure

```
hezra/
├── apps/
│   ├── client/              # React voice interface with OpenAI Realtime API
│   └── server/              # Go HTTP API server for Paystack integration
└── packages/
    └── xmcp/                # ChatGPT widgets with xmcp and React
```

## Overview

**Hezra** enables users to manage finances through natural voice commands, powered by:

- **Voice AI**: OpenAI Realtime API for speech-to-speech interactions
- **Payment Processing**: Paystack API integration for transactions, invoices, and virtual cards
- **Secure Architecture**: Client-side voice UI with server-side payment logic
- **Real-time Updates**: WebRTC-based voice communication with tool execution

## Features

- **Voice-First Interface**: Natural language financial commands
- **Payment Operations**: Bulk transfers, invoicing, virtual card creation
- **Transaction Analytics**: Aggregation and reporting with visual widgets
- **Account Management**: Balance limits, beneficiary policies
- **Secure Tool Execution**: Manual approval flow for all financial operations
- **Real-time Visualization**: Animated voice orb with audio level feedback

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10.13.1+
- Go 1.23.0+
- Paystack API credentials
- OpenAI API key
- Supabase account (for ephemeral token generation)

### Installation

```bash
# Install all dependencies
pnpm install
```

### Environment Setup

#### Client (.env)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

#### Server (.env)
```bash
PAYSTACK_SECRET_KEY=sk_test_xxx
PORT=4000
DATABASE_PATH=./data/moniewave.db
```

#### Supabase Secrets
```bash
supabase secrets set OPENAI_API_KEY=sk-proj-xxx
```

### Development

Run all packages in development mode:

```bash
pnpm dev
```

Or run individually:

```bash
# Client (port 8080)
cd apps/client
npm run dev

# Server (port 4000)
cd apps/server
make run
```

### Production Build

```bash
# Build all packages
pnpm build

# Build client only
cd apps/client
npm run build

# Build server only
cd apps/server
make build
```

## Architecture

### Client App (`apps/client/`)

React application using OpenAI's Realtime API via WebRTC:

- **Framework**: React 18 with TypeScript, Vite
- **Voice Agent**: [useOpenAIVoiceAgent.ts](apps/client/src/components/openai/useOpenAIVoiceAgent.ts)
- **UI Components**: shadcn/ui with Tailwind CSS
- **State Management**: Zustand for conversation history and tool executions
- **Tool Definitions**: [tools.ts](apps/client/src/components/openai/tools.ts) with HTTP client (ky)
- **Visualization**: WebGL voice orb with OGL library

**Key Tools**:
- `pay_contractors_bulk` - Bulk payment processing
- `set_account_limits` - Balance and transfer limits
- `create_virtual_card` - Virtual debit card generation
- `send_invoice` - Invoice creation
- `aggregate_transactions` - Analytics and reporting
- `account_snapshot` - Balance and KPI summary

### Server App (`apps/server/`)

Go HTTP API server with Paystack SDK integration:

- **Framework**: Chi router with Go 1.23.0
- **Database**: SQLite for transaction logging
- **Payment SDK**: [paystack-go](https://github.com/borderlesshq/paystack-go)
- **API Design**: RESTful JSON endpoints
- **Middleware**: CORS, logging, recovery, timeout

**Endpoints**: `/api/v1/*` for all payment operations (see [server README](apps/server/README.md))

### xmcp Package (`packages/xmcp/`)

ChatGPT widgets using xmcp framework:

- **Framework**: xmcp 0.3.5 with React 19
- **Transport**: HTTP with SSR enabled
- **Build**: Custom xmcp build system
- **Integration**: Compatible with ChatGPT widget system

## Common Commands

```bash
# Root (all packages)
pnpm install             # Install dependencies
pnpm build               # Build all packages
pnpm dev                 # Run all in development
pnpm lint                # Lint all packages
pnpm format              # Format code with Prettier
pnpm clean               # Clean build artifacts

# Client
cd apps/client
npm run dev              # Dev server (http://localhost:8080)
npm run build            # Production build
npm run lint             # ESLint check

# Server
cd apps/server
make run                 # Run in development
make build               # Build binary
make test                # Run tests
make clean               # Clean build artifacts

# xmcp Widgets
cd packages/xmcp
pnpm dev                 # Dev server
pnpm build               # Build widgets
pnpm start               # Run production server
```

## Testing Locally

1. Start the Go server:
   ```bash
   cd apps/server
   PAYSTACK_SECRET_KEY=sk_test_xxx make run
   ```

2. Deploy Supabase Edge Function with `OPENAI_API_KEY`

3. Start the client:
   ```bash
   cd apps/client
   npm run dev
   ```

4. Navigate to `http://localhost:8080`

5. Click microphone button and grant permissions

6. Speak financial commands naturally

## Security Model

- **API Keys**: Never exposed to client
- **Ephemeral Tokens**: OpenAI keys managed via Supabase Edge Function
- **Server-Side Processing**: All Paystack operations on server
- **CORS**: Configured for client origin only
- **Manual Approval**: User confirmation required for financial tools

## Documentation

- [Client Architecture](apps/client/.claude/CLAUDE.md) - Voice interface implementation
- [Server Architecture](apps/server/README.md) - API server details
- [Project Guide](.claude/CLAUDE.md) - Comprehensive development guide
- [Implementation Roadmap](MILESTONE.md) - Feature milestones

## Technologies

**Frontend**:
- React 18, TypeScript, Vite
- OpenAI Realtime API (WebRTC)
- shadcn/ui, Tailwind CSS
- Zustand, TanStack Query
- OGL (WebGL), React Router

**Backend**:
- Go 1.23.0
- Chi Router
- Paystack Go SDK
- SQLite3

**Infrastructure**:
- Turborepo
- pnpm workspaces
- Supabase Edge Functions

## License

MIT License - Copyright (c) 2025 Tensor Kit HQ

See [LICENSE](LICENSE) for details.

## Project Status

Active development - see [MILESTONE.md](MILESTONE.md) for current implementation status.

---

**Built by [Tensor Kit HQ](https://github.com/tensorkithq)** - Voice-first financial tools for modern teams.
