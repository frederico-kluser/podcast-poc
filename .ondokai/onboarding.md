# Podcast POC - Guia para CLAUDE CODE


## Visão Geral do Projeto

<project-info>
Nome do Projeto: Podcast POC
Repositório: podcast-poc
Descrição: Web application para geração de podcasts educacionais a partir de PDFs usando APIs OpenAI. Recursos incluem extração de texto PDF, interface de chat com IA, gravação/transcrição de áudio e capacidades de busca vetorial.
Linguagens: JavaScript, React
Frameworks: React 18.3.1 + Vite 6.0.5 + Material Tailwind
Bibliotecas Principais: OpenAI API, PDF.js, MediaRecorder API
Plataforma: Web (navegador moderno com suporte a Web Workers)
</project-info>

## Comandos Essenciais

```bash
# Instalação e setup
npm install                  # Instalar todas as dependências
# Configurar VITE_OPENAI_API_KEY no .env.local

# Build
npm run build                # Build para produção
npm run preview              # Visualizar build de produção localmente

# Testes
# Testes ainda não implementados - TODO: configurar Jest/Vitest

# Lint e Verificação de Tipos
npm run lint                 # Executar ESLint para verificar código
# TypeScript não configurado - projeto usa JavaScript

# Execução
npm run dev                  # Iniciar servidor de desenvolvimento (http://localhost:5173)
npm run preview              # Executar preview da build de produção


# Git
git checkout development     # Branch de desenvolvimento ativo
git checkout -b feature/nome # Criar branch de feature
git commit -m "tipo: desc"   # Formato: feat/fix/docs/refactor/chore
```

## Arquitetura do Sistema

<architecture>
### Arquitetura Funcional e Modular

O Podcast POC é estruturado em uma arquitetura modular com os seguintes módulos principais que trabalham de forma integrada:


### Padrões de Design Utilizados

1. **Service Layer Pattern**: Lógica de negócio isolada em serviços
2. **Custom Hooks Pattern**: Encapsulamento de lógica stateful reutilizável
3. **Component Composition**: Componentes modulares e compostos
4. **Error Boundary Pattern**: Tratamento robusto de erros
5. **Worker Pattern**: Processamento pesado em Web Workers

### Fluxo de Dados Principal

```
1. Upload PDF → Web Worker → Extração de Texto
2. Texto → Text Splitter → Chunks
3. User Query + Context → OpenAI API
4. Streaming Response → UI Update
5. Audio Recording → Whisper → Query Text
```

### Comunicação Entre Módulos

- **Event-driven**: Callbacks e promises para operações assíncronas
- **State Management**: React hooks para estado local
- **Service Calls**: Funções puras nos serviços para processamento
- **Streaming**: Server-sent events para respostas em tempo real

### Integrações Externas

1. **OpenAI API**: Chat completions, Whisper transcription
2. **PDF.js**: Renderização e extração de PDF
3. **Material Tailwind**: Componentes UI
4. **Web APIs**: MediaRecorder, Web Workers, Blob API

### Considerações de Escalabilidade

- Processamento assíncrono com Workers previne bloqueio da UI
- Streaming de respostas reduz latência percebida
- Modularização permite evolução independente de componentes
- Fallbacks implementados para maior resiliência
</architecture>

## Estrutura do Repositório

```
podcast-poc/
├── src/                     # Código fonte da aplicação
│   ├── components/          # Componentes React organizados por tipo
│   │   ├── features/        # Componentes de funcionalidades específicas
│   │   │   ├── ChatInterface.jsx      # Interface de chat com IA
│   │   │   ├── ExtractedTextDisplay.jsx # Exibição de texto extraído
│   │   │   └── PDFUploader.jsx        # Upload e processamento de PDF
│   │   └── ui/              # Componentes de UI reutilizáveis
│   │       └── ErrorBoundary.jsx      # Tratamento global de erros
│   ├── hooks/               # Custom hooks React
│   │   ├── useOpenAI.js     # Hook para integração OpenAI
│   │   ├── usePDF.js        # Hook para processamento PDF
│   │   └── useAudioRecording.js # Hook para gravação de áudio
│   ├── services/            # Camada de serviços (lógica de negócio)
│   │   ├── openai.service.js    # Integração com APIs OpenAI
│   │   ├── pdf.service.js       # Extração de texto PDF
│   │   ├── audio.service.js     # Gravação e processamento de áudio
│   │   ├── config.service.js    # Gerenciamento de configurações
│   │   └── highQualityRAG.service.js # Serviço de RAG (não utilizado)
│   ├── workers/             # Web Workers para processamento pesado
│   │   └── pdf.worker.js    # Worker para extração de PDF
│   ├── utils/               # Funções utilitárias
│   │   ├── format.js        # Formatadores de dados
│   │   ├── textSplitter.js  # Divisão de texto em chunks
│   │   └── validation.js    # Validações gerais
│   ├── constants/           # Constantes da aplicação
│   │   └── index.js         # Configurações e limites
│   ├── App.jsx              # Componente principal
│   └── main.jsx             # Ponto de entrada React
├── public/                  # Arquivos públicos estáticos
│   └── pdf.worker.min.mjs   # Worker PDF.js (OBRIGATÓRIO)
├── docs/                    # Documentação do projeto
├── package.json             # Dependências e scripts
├── vite.config.js           # Configuração do Vite
├── tailwind.config.js       # Configuração do Tailwind CSS
├── eslint.config.js         # Configuração do ESLint
└── .env.local               # Variáveis de ambiente (não versionado)
```

## Convenções de Código

<code-conventions>
### Estilo de Código
- Indentação: 2 espaços (configurado no ESLint)
- Comprimento máximo de linha: 100 caracteres (recomendado)
- Quotes: Aspas simples para strings
- Ponto-e-vírgula: Obrigatório no final de statements
- Chaves: Mesma linha (estilo JavaScript moderno)

### Nomenclatura
- Variáveis: camelCase (ex: extractedText, isLoading)
- Funções: camelCase (ex: handleSubmit, processAudio)
- Classes: PascalCase (ex: OpenAIService, PDFProcessor)
- Constantes: UPPER_SNAKE_CASE (ex: MAX_FILE_SIZE, API_TIMEOUT)
- Arquivos: 
  - Componentes: PascalCase.jsx (ex: ChatInterface.jsx)
  - Hooks: camelCase com prefixo 'use' (ex: useOpenAI.js)
  - Serviços: camelCase.service.js (ex: openai.service.js)
  - Utilitários: camelCase.js (ex: textSplitter.js)

### Documentação
- Estilo de comentários: JSDoc para funções públicas
- Requisitos para funções públicas: @fileoverview, @param, @returns
- Formato de TODOs: // TODO: [descrição] - [autor] [data]
- Evitar comentários desnecessários - código deve ser autoexplicativo

### Padrões de Projeto
- Service Layer Pattern: Toda lógica de negócio em arquivos .service.js
- Custom Hooks: Lógica stateful encapsulada em hooks use*
- Error Boundaries: Tratamento de erros em componentes wrapper
- Composition over Inheritance: Preferir composição de componentes
- Single Responsibility: Cada módulo/componente com uma única responsabilidade
</code-conventions>

## Fluxo de Trabalho Git

<git-workflow>
### Branches
- Branch principal: main
- Branch de desenvolvimento: development
- Branches de feature: feature/nome-da-feature
- Branches de fix: fix/nome-do-bug

### Commits
- Formato de mensagem: tipo: descrição
- Tipos aceitos: feat/fix/docs/refactor/chore
</git-workflow>






## Configuração do Ambiente de Desenvolvimento

<dev-environment>
### Requisitos
- Node.js: v18.0.0 ou superior (recomendado v20+)
- npm: v9.0.0 ou superior
- Git: v2.0.0 ou superior
- Editor: VSCode recomendado com extensões ESLint e Tailwind CSS IntelliSense
- Navegador moderno com suporte a Web Workers e MediaRecorder API

### Configuração Passo a Passo
1. Clonar o repositório:
   ```bash
   git clone [url-do-repositorio]
   cd podcast-poc
   git checkout development
   ```

2. Instalar dependências:
   ```bash
   npm install
   ```

3. Configurar variáveis de ambiente:
   ```bash
   # Criar arquivo .env.local
   echo "VITE_OPENAI_API_KEY=sua_chave_aqui" > .env.local
   ```

4. Verificar arquivo do worker PDF:
   ```bash
   # Garantir que existe em public/
   ls public/pdf.worker.min.mjs
   ```

5. Iniciar servidor de desenvolvimento:
   ```bash
   npm run dev
   # Acessar http://localhost:5173
   ```

### Configurações Específicas
- VSCode: Instalar extensões ESLint, Tailwind CSS IntelliSense, ES7+ React snippets
- Git: Configurar email e nome para commits
- Chrome DevTools: Habilitar source maps para debugging
- OpenAI API: Obter chave em https://platform.openai.com/api-keys

### Containers e Virtualização
- Docker não configurado atualmente
- Para desenvolvimento, usar ambiente Node.js local
- Possível containerização futura para deployment
</dev-environment>



## Instruções para Mode de Pensamento Estendido

<thinking-mode>
Use as seguintes técnicas para ativar o modo de pensamento estendido do Claude CODE:

- "think" - Ativa 4.000 tokens de pensamento
- "think hard" ou "think a lot" ou "think deeply" - Ativa 10.000 tokens de pensamento 
- "think harder" ou "think very hard" - Ativa 31.999 tokens de pensamento
- "ultrathink" ou "megathink" - Ativa o nível máximo de pensamento (31.999 tokens)

Use essas técnicas para análises complexas de arquitetura, planejamento de features ou debugging de problemas difíceis.
</thinking-mode>






---

**Notas Adicionais para o CLAUDE CODE:**

Este template deve ser adaptado conforme as necessidades específicas do seu projeto. Seções podem ser removidas ou adicionadas de acordo com a complexidade e requisitos. Mantenha este arquivo atualizado conforme o projeto evolui para garantir que o CLAUDE CODE sempre tenha informações precisas sobre o contexto técnico.

Para referências a diretórios ou arquivos específicos, use caminhos relativos à raiz do projeto para facilitar a navegação do CLAUDE CODE.

Use o comando "think hard" quando precisar de análises mais profundas sobre arquitetura ou refatoração, e "ultrathink" para problemas particularmente complexos ou decisões críticas.

