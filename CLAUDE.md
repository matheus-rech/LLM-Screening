# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered systematic review application for scientific literature screening. Built with React, Vite, and Base44 SDK, it uses dual AI reviewers to screen references against PICO criteria with conflict resolution workflows.

## Commands

### Development
```bash
npm install        # Install dependencies
npm run dev        # Start dev server (localhost:5173)
npm run build      # Build for production
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

## Architecture

### Core Dependencies & Integration Points

The app relies on Base44 SDK for backend operations - all API calls go through `src/api/base44Client.js`. Key integration points:
- `InvokeLLM` - AI model invocations in screening components
- `Reference.filter/update` - Database operations in screening/review pages  
- `User` auth - Authentication through Base44

### AI Screening Pipeline

1. **Dual Reviewer System**: References processed by two independent AI reviewers with different contexts
2. **Conflict Detection**: Disagreements marked for human/third-party resolution
3. **Batch Processing**: Queue system with rate limiting (500ms delays)
4. **Structured Output**: JSON schemas enforce consistent AI responses

### Key Component Patterns

- **Page Components** (`src/pages/`): Top-level route handlers managing state and API calls
- **AI Components** (`src/components/ai/`): Screening logic, prompt engineering, batch processing
- **UI Components** (`src/components/ui/`): Radix UI primitives styled with Tailwind
- **Import Flow** (`src/components/import/`): File parsing, reference preview, progress tracking

## Migration Considerations

Active migration from Base44 to custom backend (see TODO.md). When modifying:
- Preserve existing API interfaces in `src/api/` for compatibility
- AI components should remain backend-agnostic via integration layer
- Database operations concentrated in pages, not scattered in components

## Development Patterns

- **Path Aliases**: Use `@/` for src directory imports
- **Styling**: Tailwind utilities preferred, custom CSS in App.css/index.css only when necessary
- **Routing**: React Router v7 with centralized route definitions in `src/pages/index.jsx`
- **State Management**: Local component state, lift to pages when shared
- **Error Handling**: AI operations wrapped in try-catch with fallback to "uncertain" status