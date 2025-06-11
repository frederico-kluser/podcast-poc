# Podcast POC - Onboarding para CLAUDE CODE

## Visão Geral do Projeto

<project-info>
Nome do Projeto: Podcast POC
Descrição: CLI Node.js para gravação de voz, transcrição, text-to-speech (TTS) e processamento de IA. Aplicação que permite gravação de áudio, extração de texto de PDFs, conversão de fala em texto e síntese de voz através da API da OpenAI.
Linguagens: JavaScript (ES6+), JSX
Frameworks: React 18.3.1, Vite 6.0.5
Bibliotecas Principais: OpenAI API, react-pdf, Material Tailwind, Web Audio API, MediaRecorder API
Plataforma: Web (aplicação de interface de linha de comando e processamento de áudio)
</project-info>

## Comandos Essenciais

```bash
# Instalação e setup
npm install                  # Instalar todas as dependências do projeto
npm ci                       # Instalação limpa baseada no package-lock.json

# Build
npm run dev                  # Iniciar servidor de desenvolvimento com Vite (hot reload)
npm run build                # Build de produção otimizado
npm run preview              # Visualizar build de produção localmente

# Testes
# Nota: Não há scripts de teste configurados ainda

# Lint e Verificação de Tipos
npm run lint                 # Executar ESLint em todos os arquivos JS/JSX
# Não há script de formatação configurado (considerar adicionar Prettier)

# Execução
npm run dev                  # Servidor de desenvolvimento na porta 5173
npm run preview              # Servidor de preview após build

# Ambiente
# Criar arquivo .env.local com:
VITE_OPENAI_API_KEY=sua_chave_aqui

# Git (convenções do projeto)
git checkout development     # Branch de desenvolvimento ativo
git checkout -b feature/nome # Criar nova feature
git add .                    # Adicionar mudanças
git commit -m "tipo: descrição"  # Formato de commit
```

## Arquitetura do Sistema

<architecture>
### Arquitetura Funcional e Modular

O projeto utiliza uma arquitetura modular organizada em 7 módulos principais que fornecem funcionalidades específicas e bem definidas:

#### 1. **Módulo de Interface do Usuário (UI)**
- **Responsabilidade**: Gerenciar toda a interação visual com o usuário
- **Componentes principais**:
  - `ChatInterface.jsx`: Interface de chat para interação com IA
  - `PDFUploader.jsx`: Upload e processamento de arquivos PDF
  - `ExtractedTextDisplay.jsx`: Exibição de texto extraído
  - `ErrorBoundary.jsx`: Tratamento de erros na interface
- **Tecnologias**: React, Material Tailwind, CSS Modules

#### 2. **Módulo de Processamento de Áudio**
- **Responsabilidade**: Captura, gravação e manipulação de áudio
- **Componentes principais**:
  - `audio.service.js`: Serviço principal de áudio
  - `useAudioRecording.js`: Hook para gravação de áudio
- **Tecnologias**: Web Audio API, MediaRecorder API
- **Funcionalidades**: Gravação de voz, conversão de formato, controle de qualidade

#### 3. **Módulo de Integração com OpenAI**
- **Responsabilidade**: Comunicação com a API da OpenAI
- **Componentes principais**:
  - `openai.service.js`: Serviço de integração com OpenAI
  - `useOpenAI.js`: Hook para funcionalidades de IA
- **Funcionalidades**: Transcrição (STT), síntese de voz (TTS), chat completions

#### 4. **Módulo de Processamento de Documentos**
- **Responsabilidade**: Extração e manipulação de conteúdo de PDFs
- **Componentes principais**:
  - `pdf.service.js`: Serviço de processamento de PDF
  - `usePDF.js`: Hook para operações com PDF
- **Tecnologias**: react-pdf, PDF.js
- **Funcionalidades**: Extração de texto, parsing de estrutura

#### 5. **Módulo de Gerenciamento de Estado**
- **Responsabilidade**: Controle do estado global da aplicação
- **Implementação**: React Hooks (useState, useEffect)
- **Estados gerenciados**:
  - Texto extraído de PDFs
  - Histórico de conversas
  - Estado de gravação de áudio
  - Configurações do usuário

#### 6. **Módulo de Utilidades**
- **Responsabilidade**: Funções auxiliares e helpers
- **Componentes**:
  - `format.js`: Formatação de dados
  - `validation.js`: Validação de entradas
  - `constants/index.js`: Constantes globais

#### 7. **Módulo de Configuração e Build**
- **Responsabilidade**: Configuração do ambiente e build
- **Arquivos principais**:
  - `vite.config.js`: Configuração do Vite
  - `tailwind.config.js`: Configuração do Tailwind CSS
  - `eslint.config.js`: Configuração de linting
  - `package.json`: Dependências e scripts

### Fluxo de Dados

1. **Entrada de Dados**:
   - Upload de PDF → Módulo de Documentos → Extração de texto
   - Gravação de áudio → Módulo de Áudio → Buffer de áudio

2. **Processamento**:
   - Texto/Áudio → Módulo OpenAI → Transcrição/Resposta
   - Resposta → Módulo de Estado → Atualização da UI

3. **Saída**:
   - Texto processado → Módulo UI → Exibição ao usuário
   - Áudio sintetizado → Módulo de Áudio → Reprodução

### Comunicação entre Módulos

- **Padrão de comunicação**: Baseado em Promises e callbacks
- **Gerenciamento de estado**: Props drilling e hooks customizados
- **Tratamento de erros**: Try-catch blocks e error boundaries
- **Eventos**: Event listeners nativos do browser para áudio

### Integrações Externas

- **OpenAI API**: Autenticação via API key, comunicação REST
- **PDF.js Worker**: Processamento assíncrono de PDFs em web worker
- **Browser APIs**: MediaRecorder, Web Audio API, File API

### Core Modules

1. **Voice Recorder (PvRecorder)**
   - Módulo de captura de áudio de alta qualidade
   - Integração com microfone do sistema
   - Controle de taxa de amostragem e formato de áudio

2. **Transcriber (Whisper)**
   - Transcrição de fala para texto usando OpenAI Whisper
   - Suporte para múltiplos idiomas
   - Processamento assíncrono de áudio

3. **TTS (Text-to-Speech)**
   - Síntese de voz usando OpenAI TTS
   - Múltiplas vozes disponíveis
   - Controle de velocidade e entonação

4. **AI Processor**
   - Processamento de linguagem natural
   - Integração com modelos GPT da OpenAI
   - Gerenciamento de contexto e histórico de conversas

5. **Audio Player**
   - Reprodução de áudio sintetizado
   - Controles de playback (play, pause, stop)
   - Gerenciamento de buffer de áudio

6. **Key Capture**
   - Captura de eventos de teclado
   - Atalhos personalizáveis
   - Integração com comandos da aplicação

7. **Handlers Manager**
   - Gerenciamento centralizado de eventos
   - Coordenação entre módulos
   - Tratamento de erros e exceções
</architecture>

## Estrutura do Repositório

```
podcast-poc/
├── src/                     # Código fonte da aplicação
│   ├── components/          # Componentes React organizados por tipo
│   │   ├── features/        # Componentes de funcionalidades específicas
│   │   │   ├── ChatInterface.jsx       # Interface de chat com IA
│   │   │   ├── ExtractedTextDisplay.jsx # Exibição de texto extraído
│   │   │   └── PDFUploader.jsx         # Upload e processamento de PDF
│   │   └── ui/              # Componentes de UI reutilizáveis
│   │       └── ErrorBoundary.jsx       # Tratamento de erros React
│   ├── hooks/               # Custom React hooks
│   │   ├── useAudioRecording.js # Hook para gravação de áudio
│   │   ├── useOpenAI.js         # Hook para integração OpenAI
│   │   └── usePDF.js            # Hook para processamento PDF
│   ├── services/            # Serviços e lógica de negócio
│   │   ├── audio.service.js     # Serviço de áudio
│   │   ├── openai.service.js    # Integração com OpenAI API
│   │   └── pdf.service.js       # Processamento de PDF
│   ├── utils/               # Funções utilitárias
│   │   ├── format.js            # Formatação de dados
│   │   └── validation.js        # Validação de entradas
│   ├── constants/           # Constantes globais
│   │   └── index.js             # Exportação de constantes
│   ├── App.jsx              # Componente principal
│   ├── App.css              # Estilos do App
│   ├── index.css            # Estilos globais
│   └── main.jsx             # Ponto de entrada da aplicação
├── public/                  # Arquivos públicos estáticos
│   ├── pdf.worker.min.mjs       # Worker para processamento PDF
│   └── vite.svg                 # Logo do Vite
├── docs/                    # Documentação do projeto
│   └── Material-Tailwind-Guia-Completo.md
├── .ondokai/                # Configurações do ambiente ondokai
│   └── onboarding.md            # Este arquivo
├── package.json             # Dependências e scripts npm
├── vite.config.js           # Configuração do Vite
├── tailwind.config.js       # Configuração do Tailwind CSS
├── postcss.config.js        # Configuração do PostCSS
├── eslint.config.js         # Configuração do ESLint
├── index.html               # HTML principal
└── README.md                # Documentação principal
```

## Convenções de Código

<code-conventions>
### Estilo de Código
- Indentação: 2 espaços
- Comprimento máximo de linha: ~100 caracteres (não enforçado)
- Quotes: Simples (') para strings
- Ponto-e-vírgula: Obrigatório
- Chaves: Mesma linha (estilo K&R)
- Trailing comma: Permitido em arrays e objetos multilinhas

### Nomenclatura
- Variáveis: camelCase (ex: extractedText, errorMessage)
- Funções: camelCase (ex: handleTextExtracted, transcribeAudio)
- Classes/Componentes: PascalCase (ex: ChatInterface, ErrorBoundary)
- Constantes: UPPER_SNAKE_CASE (ex: API_ENDPOINTS, MAX_FILE_SIZE)
- Arquivos de componentes: PascalCase.jsx (ex: PDFUploader.jsx)
- Arquivos de serviços/utils: camelCase.js (ex: audio.service.js)
- Hooks customizados: use + PascalCase (ex: useAudioRecording)

### Documentação
- Estilo de comentários: JSDoc para funções e componentes
- Requisitos para funções públicas: 
  - @fileoverview no topo dos arquivos
  - @param para todos os parâmetros
  - @returns para retornos não óbvios
  - @component para componentes React
- Formato de TODOs: // TODO: descrição da tarefa

### Padrões de Projeto
- Composição sobre herança: Usar hooks e componentes funcionais
- Separação de responsabilidades: 
  - Componentes em /components (UI)
  - Lógica de negócio em /services
  - Hooks customizados em /hooks
  - Utilitários em /utils
- Error Boundaries: Usar componente ErrorBoundary para tratamento de erros
- Estado local vs global: Preferir useState local, elevar estado quando necessário
- Async/Await: Preferir sobre .then() para operações assíncronas
</code-conventions>

## Best Practices de Desenvolvimento

<best-practices>
### Estrutura de Componentes
- Manter componentes pequenos e focados em uma única responsabilidade
- Usar desestruturação de props no parâmetro da função
- Ordenar: imports → componente → exports
- Exemplo de estrutura:
  ```jsx
  import { useState, useCallback } from 'react';
  import { ComponenteDependente } from './ComponenteDependente';

  export function MeuComponente({ prop1, prop2 }) {
    const [estado, setEstado] = useState(valorInicial);
    
    const handleEvento = useCallback(() => {
      // lógica
    }, [dependencias]);
    
    return (
      <div>
        {/* JSX */}
      </div>
    );
  }
  ```

### Gerenciamento de Estado
- useState para estado local simples
- useReducer para estado complexo com múltiplas atualizações
- Elevar estado apenas quando necessário
- Evitar prop drilling excessivo

### Performance
- Usar useCallback para funções passadas como props
- Usar useMemo para cálculos computacionalmente caros
- Lazy loading de componentes grandes com React.lazy()
- Otimizar re-renders com React.memo quando apropriado

### Tratamento de Erros
- Sempre usar try-catch em operações assíncronas
- Implementar Error Boundaries para erros de renderização
- Logar erros no console em desenvolvimento
- Mostrar mensagens amigáveis ao usuário

### Integração com APIs
- Centralizar chamadas de API em services
- Usar AbortController para cancelar requests
- Implementar retry logic para falhas temporárias
- Validar respostas antes de usar

### Segurança
- Nunca expor API keys no código
- Usar variáveis de ambiente com prefixo VITE_
- Sanitizar inputs do usuário
- Validar uploads de arquivo (tipo, tamanho)

### Acessibilidade
- Usar elementos HTML semânticos
- Adicionar aria-labels quando necessário
- Garantir navegação por teclado
- Testar com screen readers

### Debugging
- Usar React DevTools para inspecionar componentes
- Console.log com contexto descritivo
- Breakpoints no Chrome DevTools
- Network tab para debug de APIs
</best-practices>

## Fluxo de Trabalho Git

<git-workflow>
### Branches
- Branch principal: main
- Branch de desenvolvimento: development
- Branches de feature: feature/nome-da-feature
- Branches de fix: fix/nome-do-bug

### Commits
- Formato de mensagem: tipo: descrição
- Tipos aceitos: feat/fix/docs/style/refactor
</git-workflow>






## Configuração do Ambiente de Desenvolvimento

<dev-environment>
### Requisitos
- Node.js: v18.0.0 ou superior (recomendado v20+)
- npm: v9.0.0 ou superior
- Git: v2.0.0 ou superior
- Editor: VSCode recomendado (com extensões React e ESLint)
- Browser: Chrome/Edge/Firefox moderno com DevTools

### Configuração Passo a Passo
1. Clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd podcast-poc
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   ```bash
   # Criar arquivo .env.local na raiz do projeto
   echo "VITE_OPENAI_API_KEY=sua_chave_api_aqui" > .env.local
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

5. Acesse a aplicação em http://localhost:5173

### Configurações Específicas
- VSCode: Instalar extensões
  - ESLint
  - Prettier (opcional)
  - Tailwind CSS IntelliSense
  - ES7+ React snippets
- Chrome DevTools: Habilitar React Developer Tools
- Git: Configurar user.name e user.email

### Troubleshooting Comum
- Erro de CORS: Verificar configuração do Vite proxy
- PDF Worker não carrega: Verificar se pdf.worker.min.mjs está em /public
- Erro de API Key: Confirmar que .env.local está configurado corretamente
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

