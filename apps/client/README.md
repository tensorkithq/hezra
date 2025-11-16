# Moniewave Client

Voice-powered financial assistant application built with OpenAI's Realtime API for natural voice interactions.

## Overview

Moniewave enables users to manage finances through natural voice commands with support for payments, invoicing, account limits, virtual cards, and transaction analytics.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS with shadcn/ui components
- **Voice AI**: OpenAI Realtime API (WebRTC speech-to-speech)
- **Backend**: Supabase (Edge Functions, client SDK)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **HTTP Client**: ky
- **Testing**: Vitest

## Getting Started

### Prerequisites

- Node.js 18+ and npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Supabase account and project
- OpenAI API key

### Installation

```sh
# Clone the repository
git clone <repository-url>

# Navigate to the client directory
cd moniewave/apps/client

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the development server
npm run dev
```

The app will be available at `http://localhost:8080`

## Environment Variables

Create a `.env` file with the following variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SERVER_URL=http://localhost:4000
```

**Supabase Secrets** (set via Supabase CLI):
```bash
supabase secrets set OPENAI_API_KEY=sk-proj-...
```

## Available Scripts

```bash
npm run dev          # Start development server on :8080
npm run build        # Production build
npm run build:dev    # Development mode build
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:ui      # Open Vitest UI
```

## Features

### Voice Agent Tools

- **pay_contractors_bulk** - Bulk payment processing
- **set_account_limits** - Balance and transfer limits
- **set_beneficiary_transfer_limit** - Per-beneficiary policies
- **create_virtual_card** - Virtual debit card generation
- **send_invoice** - Invoice creation and sending
- **aggregate_transactions** - Analytics and reporting
- **account_snapshot** - Balance and KPI summary

### Widget System

JSON-driven widget system for rendering financial data with primitives like Frame, Text, Amount, Badge, KeyValueList, etc. See [Widget Documentation](src/components/widgets/README.md) for details.

## Project Structure

```
src/
├── components/
│   ├── openai/              # OpenAI Realtime integration
│   ├── widgets/             # JSON widget system
│   └── ui/                  # shadcn/ui components
├── hooks/                   # Audio analysis hooks
├── integrations/supabase/   # Supabase client config
├── lib/                     # API client (ky)
├── pages/                   # Route components
├── stores/                  # Zustand state stores
└── App.tsx                  # Router configuration
```

## Architecture

The application uses OpenAI's Realtime API for voice interactions with a custom tool execution system:

1. User speaks voice command
2. OpenAI processes and triggers tool call
3. Client requests user approval
4. On approval, HTTP request sent to Go server API
5. Server executes business logic with Paystack
6. Response rendered as widget in UI

See [CLAUDE.md](CLAUDE.md) for detailed architecture documentation.

## Development

### Path Aliases

Vite is configured with `@` alias pointing to `./src`:

```typescript
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
```

### Adding New Tools

1. Define tool in `src/components/openai/tools.ts`
2. Implement execution logic with server API call
3. Create widget structure for response visualization
4. Test with voice commands

### Testing

```bash
# Run all tests
npm run test:run

# Run tests in watch mode
npm test

# Open Vitest UI
npm run test:ui
```

## Deployment

Build the application:

```bash
npm run build
```

The `dist/` directory contains the production-ready static files that can be deployed to any static hosting service (Vercel, Netlify, Cloudflare Pages, etc.).

## Related Documentation

- [Project Root README](../../README.md) - Monorepo overview
- [CLAUDE.md](CLAUDE.md) - AI assistant context and architecture
- [Widget System](src/components/widgets/README.md) - Widget component documentation
- [MILESTONE.md](../../MILESTONE.md) - Implementation roadmap

## License

Private project - All rights reserved
