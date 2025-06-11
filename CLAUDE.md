# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project**: Podcast POC  
**Description**: Web application for educational podcast generation from PDFs using OpenAI APIs. Features include PDF text extraction, AI-powered chat interface, audio recording/transcription, and vector search capabilities.  
**Stack**: React 18.3.1 + Vite 6.0.5 + Material Tailwind + OpenAI APIs + LangChain  

## Essential Commands

```bash
# Development
npm install                  # Install all dependencies
npm run dev                  # Start dev server (http://localhost:5173)
npm run build                # Production build
npm run preview              # Preview production build
npm run lint                 # Run ESLint

# Environment Setup - Create .env.local file:
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Git Workflow
git checkout development     # Active development branch
git checkout -b feature/name # Create feature branch
git commit -m "type: description" # Commit format (feat/fix/docs/refactor)
```

## High-Level Architecture

### Application Flow
```
1. PDF Upload → Text Extraction → Context Storage
2. User Query → OpenAI API → Streaming Response
3. Audio Recording → Whisper API → Transcribed Text
```

### Key Architectural Patterns

1. **Service Layer Pattern**: Business logic isolated in service classes
   - `openai.service.js` - OpenAI API integration with LangChain
   - `pdf.service.js` - PDF text extraction
   - `audio.service.js` - Audio recording management

2. **Custom Hooks**: Stateful logic encapsulation
   - `useOpenAI` - Chat and transcription with loading states
   - `usePDF` - PDF processing with progress tracking
   - `useAudioRecording` - Audio capture and blob generation

3. **Component Organization**:
   - `components/features/` - Feature-specific components
   - `components/ui/` - Reusable UI components
   - Each component manages its own state

### OpenAI Integration Details

- **Chat Model**: GPT-4.1 (Note: Update to valid model like `gpt-4-turbo-preview`)
- **Whisper Model**: whisper-1 for transcription
- **Streaming**: Real-time responses via LangChain
- **Context**: PDF text passed as system message (max 3000 chars)
- **Temperature**: 0 (deterministic responses)

### Important Configuration Notes

1. **PDF Worker Required**: Ensure `pdf.worker.min.mjs` exists in `/public` folder

2. **Implementation Status**:
   - ✅ PDF text extraction with progress
   - ✅ Streaming chat with context
   - ✅ Audio recording and transcription
   - ❌ Text-to-speech (not implemented)
   - ❌ Vector search (hnswlib installed but unused)

### Code Style Conventions

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Components**: PascalCase (`ChatInterface.jsx`)
- **Hooks**: usePrefix (`useOpenAI`)
- **Services**: camelCase (`openai.service.js`)
- **Constants**: UPPER_SNAKE_CASE
- **Documentation**: JSDoc with @fileoverview, @param, @returns