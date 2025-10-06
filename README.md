# KB Builder

A guided Knowledge Base Builder that creates comprehensive brand documentation through AI-powered research and visual analysis.

## Features

- 🔍 **Automated Research** - Powered by Perplexity AI for web research
- 🎨 **Visual Analysis** - OpenAI Vision for brand image analysis
- 🌍 **Multilingual** - Supports en-US, en-GB, pt-BR, pt-PT
- 📦 **Export** - JSON and ZIP packages for easy onboarding
- 🔒 **Secure** - Supabase with Row Level Security

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Shadcn/UI
- **Backend**: Express + TypeScript
- **Database**: Supabase (PostgreSQL + Storage)
- **AI**: Perplexity (research) + OpenAI (vision)

## Prerequisites

- Node.js >= 18.0.0
- pnpm (installed globally)
- Supabase account
- OpenAI API key
- Perplexity API key

## Environment Setup

1. Copy environment templates:
```bash
cp .env.example .env
cp .env.local.example .env.local
```

2. Fill in the required values in `.env`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3001
```

3. Fill in the required values in `.env.local`:
```
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
```

## Installation

```bash
pnpm install
```

## Development

Run both client and server in development mode:
```bash
pnpm dev
```

Or run them separately:
```bash
pnpm dev:client  # Frontend on http://localhost:5173
pnpm dev:server  # Backend on http://localhost:3001
```

## Building

```bash
pnpm build
```

## Type Checking

```bash
pnpm typecheck
```

## Linting

```bash
pnpm lint
```

## Project Structure

```
kb-builder/
├── client/              # Frontend React application
│   ├── src/
│   │   ├── routes/      # Route components
│   │   ├── components/  # Reusable components
│   │   ├── lib/         # Utilities
│   │   ├── i18n/        # Translations
│   │   ├── hooks/       # Custom hooks
│   │   └── providers/   # Context providers
│   └── index.html
├── server/              # Backend Express application
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── db/              # Database utilities
│   └── lib/             # Server utilities
├── supabase/
│   └── migrations/      # Database migrations
└── scripts/             # Build and utility scripts
```

## Documentation

See the specification files in the root directory:
- `KBBuilder_Specify_User_Journey.md` - User flow and requirements
- `KBBuilder_UI_UX_Spec.md` - UI/UX specifications
- `KBBuilder_Supabase_Audit_RLS.md` - Database schema and RLS policies
- `KBBuilder_Prompt_Playbook.md` - AI prompt templates
- `ui-kit-visual-guide.md` - Design system and components

## License

Proprietary

