<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# LautoOverblik

Internt produktivitets-dashboard til Lauto (AI-automatisering og webdev). Solo-projekt.

## Features
- **To-do liste** – daglig + ugentlig, Framer Motion-animation ved færdiggørelse
- **Idégenerator** – LLM-chat om automation-løsninger (N8N, Make, Zapier m.m.)
- **Idé-capture** – voice-to-text (Web Speech API) → LLM formaterer og vurderer

## Tech stack
- **Framework**: Next.js 14+ med App Router
- **Sprog**: TypeScript overalt
- **Styling**: Tailwind CSS + Framer Motion
- **Database**: Supabase via `@supabase/ssr`
- **LLM primær**: OpenRouter API (OpenAI-kompatibelt)
- **LLM backup**: NVIDIA NIM (`USE_NVIDIA=TRUE` i .env.local)

## Kommandoer
```bash
npm run dev        # Start dev server (http://localhost:3000)
npm run build      # Produktionsbuild
npm run type-check # TypeScript check (tsc --noEmit)
```

## Projektstruktur
```
/app
  /page.tsx              # Dashboard forside
  /todos/page.tsx        # To-do liste (daglig + ugentlig tabs)
  /idea-generator/       # Idégenerator med LLM-chat
  /idea-capture/         # Voice-capture + AI-vurdering
  /api/llm/              # LLM API-routes (server-side)
/components
  /todos/                # TodoItem, TodoList, TodoForm
  /ideas/                # IdeaCapture, IdeaGenerator
  /ui/                   # Nav
/lib
  /supabase.ts           # Re-eksporterer getSupabase() fra utils/supabase/client
  /llm.ts                # OpenRouter/NVIDIA klient
/utils/supabase/
  /client.ts             # createClient() – brug i 'use client'-komponenter
  /server.ts             # createClient() – brug i Server Components
  /middleware.ts         # Session-håndtering
/types/index.ts          # Alle TypeScript typer
middleware.ts            # Supabase session refresh på alle routes
```

## Supabase-mønstre
- Browser-komponenter: `import { getSupabase } from '@/lib/supabase'`
- Server Components: `import { createClient } from '@/utils/supabase/server'`
- RLS er aktiveret – husk det ved queries
- Tabeller: `todos` (`id, title, type, completed, created_at`), `ideas` (`id, raw_transcript, formatted_text, ai_evaluation, created_at`)

## Miljøvariabler (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=
NVIDIA_API_KEY=
USE_NVIDIA=false
```

## LLM API-mønstre
- Al LLM-kommunikation server-side via `/api/llm` – API-nøgler aldrig til klient
- Streaming til idégeneratoren (`stream: true`)
- Idé-vurdering returnerer JSON: `{ "score": 1-10, "pros": [...], "cons": [...], "improvements": [...] }`

## Animationer (Framer Motion)
- Grøn flash → slide ud til højre → fjernes med `AnimatePresence`
- Hold animationer under 400ms

## Adfærdsregler
- Ret kun det der er spurgt om
- Dansk i UI-tekster og kommentarer
- Mobilvenligt design fra start
