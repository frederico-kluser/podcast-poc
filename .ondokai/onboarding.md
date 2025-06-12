# Template Abrangente para CLAUDE CODE


## Visão Geral do Projeto

<project-info>
Nome do Projeto: Podcast POC
Repositório: podcast-poc
Descrição: CLI Node.js para gravação de voz, transcrição automática, síntese de voz (TTS) e processamento com IA. Aplicação focada em criar um fluxo completo de produção de conteúdo em áudio através de interfaces de linha de comando.
Linguagens: JavaScript/Node.js
Frameworks: React (para interface web), Vite (build tool)
Bibliotecas Principais: OpenAI API, pdfjs-dist (extração de PDF), Material Tailwind (UI), TailwindCSS
Plataforma: CLI/Web - Aplicação híbrida com foco em terminal e interface web complementar
</project-info>

## Comandos Essenciais

```bash
# Instalação e setup
npm install                # Instalar todas as dependências do projeto
npm fund                   # Ver informações de financiamento dos pacotes (opcional)

# Build
npm run build             # Build para produção usando Vite
npm run preview           # Visualizar build de produção localmente

# Testes
# Nota: Este projeto não possui testes configurados ainda
# TODO: Implementar testes com Vitest ou Jest

# Lint e Verificação de Tipos
npm run lint              # Verificar código com ESLint
# Nota: Não há script de formatação automática configurado
# Recomenda-se configurar Prettier no futuro

# Execução
npm run dev               # Iniciar servidor de desenvolvimento Vite (port 5173)
# Acesso: http://localhost:5173

# CI/CD
# Não configurado - projeto em fase POC

# Git
git checkout development  # Branch de desenvolvimento principal
git checkout -b feature/nome-da-feature  # Criar nova feature
git commit -m "tipo: descrição"  # Formato de commit recomendado
```

## Arquitetura do Sistema

<architecture>
O sistema utiliza uma arquitetura funcional e modular organizada em 7 módulos principais, que fornecem funcionalidades específicas e se integram de forma coesa:

### Core Modules

1. **Voice Recorder (PvRecorder)**
   - Captura de áudio em tempo real usando Picovoice Recorder
   - Configuração de dispositivos de entrada de áudio
   - Buffer de áudio otimizado para processamento
   - Suporte multiplataforma (Windows, macOS, Linux)

2. **Transcriber (Whisper)**
   - Transcrição de áudio para texto usando OpenAI Whisper
   - Suporte para múltiplos idiomas
   - Processamento local ou via API
   - Alta precisão em transcrição

3. **TTS (Text-to-Speech)**
   - Conversão de texto em fala natural
   - Múltiplas vozes e idiomas disponíveis
   - Controle de velocidade e tom
   - Integração com OpenAI TTS API

4. **AI Processor**
   - Processamento inteligente de comandos e contexto
   - Integração com GPT-4 para respostas avançadas
   - Gerenciamento de histórico de conversação
   - Otimização de prompts e respostas

5. **Audio Player**
   - Reprodução de áudio sintetizado
   - Controle de volume e playback
   - Suporte para múltiplos formatos de áudio
   - Queue de reprodução para respostas longas

6. **Key Capture**
   - Captura de teclas de atalho globais
   - Ativação por voz ou teclado
   - Configuração customizável de hotkeys
   - Integração com sistema operacional

7. **Handlers Manager**
   - Gerenciamento centralizado de eventos
   - Coordenação entre módulos
   - Tratamento de erros e exceções
   - Sistema de callbacks e promises

### Fluxo de Dados

1. **Configuração Inicial**: O usuário configura a API key através do ApiKeySetup
2. **Upload de Documento**: PDFs são processados e texto é extraído
3. **Processamento RAG**: Texto é dividido em chunks e embeddings são gerados
4. **Interação por Chat**: Usuário faz perguntas via texto ou áudio
5. **Busca Semântica**: Sistema encontra chunks relevantes
6. **Geração de Resposta**: OpenAI processa contexto e gera resposta
7. **Síntese de Voz**: Resposta pode ser convertida em áudio

### Integrações Externas

- **OpenAI API**: Core da funcionalidade de IA (GPT-4, Whisper, TTS)
- **PDF.js**: Biblioteca Mozilla para processamento de PDFs
- **Web Audio API**: Captura nativa de áudio do navegador
- **localStorage**: Persistência de configurações e cache

### Padrões de Design

- **Separação de Responsabilidades**: Cada módulo tem uma função específica
- **Facade Pattern**: Services encapsulam complexidade das APIs
- **Observer Pattern**: Hooks React para gerenciamento de estado
- **Factory Pattern**: Criação dinâmica de clientes OpenAI
- **Singleton Pattern**: Instâncias únicas de serviços

### Comunicação entre Módulos

- Módulos se comunicam através de interfaces bem definidas
- Services retornam Promises para operações assíncronas
- Hooks React abstraem a complexidade dos services
- Componentes consomem hooks para funcionalidades
- Sistema de eventos para atualizações em tempo real
</architecture>

## Estrutura do Repositório

```
podcast-poc/
├── src/                     # Código fonte da aplicação
│   ├── components/          # Componentes React reutilizáveis
│   │   ├── features/        # Componentes de funcionalidades específicas
│   │   └── ui/              # Componentes de interface genéricos
│   ├── services/            # Serviços e lógica de negócio
│   ├── hooks/               # Custom React hooks
│   ├── constants/           # Constantes e configurações
│   ├── utils/               # Funções utilitárias
│   ├── assets/              # Recursos estáticos (imagens, etc)
│   ├── App.jsx              # Componente principal da aplicação
│   ├── main.jsx             # Ponto de entrada da aplicação
│   └── index.css            # Estilos globais
├── public/                  # Arquivos públicos servidos diretamente
├── docs/                    # Documentação do projeto
├── .ondokai/                # Configurações e documentação do Ondokai
├── package.json             # Dependências e scripts npm
├── vite.config.js           # Configuração do Vite
├── tailwind.config.js       # Configuração do Tailwind CSS
├── postcss.config.js        # Configuração do PostCSS
└── eslint.config.js         # Configuração do ESLint
```

## Convenções de Código

<code-conventions>
### Estilo de Código
- Indentação: 2 espaços
- Comprimento máximo de linha: 80-100 caracteres (recomendado)
- Quotes: simples para imports, duplas para strings JSX
- Ponto-e-vírgula: obrigatório (aplicado pelo ESLint)
- Chaves: mesma linha (estilo K&R)
- Trailing comma: sempre em objetos e arrays multilinhas

### Nomenclatura
- Variáveis: camelCase (ex: `apiKey`, `isLoading`)
- Funções: camelCase (ex: `validateApiKey`, `extractText`)
- Classes: PascalCase (ex: `ConfigService`, `OpenAIService`)
- Constantes: UPPER_SNAKE_CASE (ex: `API_KEY_STORAGE`, `MAX_TOKENS`)
- Arquivos de componentes: PascalCase.jsx (ex: `ApiKeySetup.jsx`)
- Arquivos de serviços: camelCase.service.js (ex: `config.service.js`)
- Hooks customizados: use + PascalCase (ex: `useOpenAI`, `usePDF`)

### Documentação
- Estilo de comentários: JSDoc para funções públicas complexas
- Comentários inline: evitar, preferir código autoexplicativo
- TODOs: formato `// TODO: descrição da tarefa`
- Documentar propósito não óbvio, não o que o código faz

### Padrões de Projeto
- **Service Pattern**: Toda lógica de negócio em classes de serviço estáticas
- **Custom Hooks**: Encapsular lógica de estado e side-effects
- **Composição**: Preferir composição sobre herança
- **Single Responsibility**: Cada módulo/componente com uma única responsabilidade
- **Error Boundaries**: Usar para capturar erros em componentes React
</code-conventions>

## Fluxo de Trabalho Git

<git-workflow>
### Branches
- Branch principal: `main`
- Branch de desenvolvimento: `development`
- Branches de feature: `feature/nome-da-feature`
- Branches de fix: `fix/nome-do-bug`
- Branches de hotfix: `hotfix/nome-critico`

### Commits
- Formato de mensagem: `tipo: descrição breve (máx 50 chars)`
- Tipos aceitos:
  - `feat`: nova funcionalidade
  - `fix`: correção de bug
  - `docs`: apenas documentação
  - `style`: formatação, sem mudança de código
  - `refactor`: refatoração sem mudança de funcionalidade
  - `test`: adição ou correção de testes
  - `chore`: manutenção, atualização de dependências
- Corpo do commit: explicar o "porquê", não o "o quê"

### Pull Requests
- Template básico:
  - Descrição da mudança
  - Tipo de mudança (feature/fix/breaking change)
  - Como testar
  - Checklist de revisão
- Processo de revisão: auto-merge permitido em POC
- Critérios de merge: 
  - ESLint passando
  - Build bem-sucedido
  - Sem conflitos

### CI/CD
- Gatilhos: não configurado (projeto POC)
- Verificações manuais recomendadas antes do merge:
  - `npm run lint`
  - `npm run build`
  - Testar funcionalidades afetadas
</git-workflow>

## Gerenciamento de Dependências

<dependencies>
### Dependências Críticas
- **openai**: v5.3.0 - Cliente oficial OpenAI para GPT-4, Whisper e embeddings
- **react**: v19.1.0 - Framework UI principal
- **@material-tailwind/react**: v2.1.10 - Componentes UI com Material Design
- **pdfjs-dist**: v5.3.31 - Extração de texto de PDFs (Mozilla)
- **@orama/orama**: v3.1.7 - Busca vetorial e full-text search
- **wavesurfer.js**: v7.9.5 - Visualização e reprodução de áudio

### Dependências de Desenvolvimento
- **vite**: v6.3.5 - Build tool e dev server ultrarrápido
- **eslint**: v9.25.0 - Linting e qualidade de código
- **tailwindcss**: v3.4.17 - Framework CSS utility-first
- **@vitejs/plugin-react**: v4.4.1 - Suporte React para Vite

### Política de Atualização
- Frequência: Mensal para patches, trimestral para minor versions
- Breaking changes: Criar branch específica, testar todas funcionalidades
- Monitoramento: 
  - `npm outdated` - verificar pacotes desatualizados
  - `npm audit` - verificar vulnerabilidades de segurança
  - Renovate Bot recomendado para automação futura
</dependencies>





## Configuração do Ambiente de Desenvolvimento

<dev-environment>
### Requisitos
- Node.js: v18.0.0+ (recomendado v20+)
- npm: v9.0.0+
- Git: v2.0+
- VSCode ou editor com suporte a JSX
- Chrome/Firefox/Safari (desenvolvimento web)

### Configuração Passo a Passo
1. Clone o repositório:
   ```bash
   git clone [url-do-repo]
   cd podcast-poc
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure variáveis de ambiente (se necessário):
   ```bash
   cp .env.example .env.local
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Acesse http://localhost:5173

### Configurações Específicas
- **VSCode**: Instalar extensões ESLint, Tailwind CSS IntelliSense
- **Git**: Configurar email e nome para commits
- **Node**: Usar nvm para gerenciar versões
- **Browser**: Instalar React Developer Tools

### Containers e Virtualização
- Docker: Não configurado (futuro: Dockerfile para produção)
- Dev Containers: Configuração VSCode recomendada para consistência
</dev-environment>

## Best Practices de Desenvolvimento

<development-best-practices>
### Estrutura de Componentes React
- Um componente por arquivo
- Props destructuring no início
- Hooks no topo do componente
- Handlers antes do return
- JSX limpo e legível

```jsx
// Exemplo de estrutura ideal
export function ComponentName({ prop1, prop2 }) {
  // Estados
  const [state, setState] = useState();
  
  // Hooks customizados
  const { data, loading } = useCustomHook();
  
  // Effects
  useEffect(() => {
    // lógica
  }, [dependências]);
  
  // Handlers
  const handleClick = () => {
    // lógica
  };
  
  // Render condicional early return
  if (loading) return <Spinner />;
  
  // JSX principal
  return (
    <div>
      {/* conteúdo */}
    </div>
  );
}
```

### Organização de Serviços
- Classes estáticas para serviços stateless
- Métodos puros sempre que possível
- Tratamento de erros consistente
- Retornar Promises para operações assíncronas

```javascript
export class ServiceName {
  static async methodName(params) {
    try {
      // validação de entrada
      if (!params) throw new Error('Params required');
      
      // lógica principal
      const result = await someOperation();
      
      // retorno padronizado
      return { success: true, data: result };
    } catch (error) {
      console.error('ServiceName.methodName error:', error);
      return { success: false, error: error.message };
    }
  }
}
```

### Estado e Performance
- useState para estado local simples
- useReducer para estado complexo
- Context API para estado global (evitar prop drilling)
- Memoização com useMemo/useCallback quando necessário
- Lazy loading de componentes pesados

### Segurança
- Nunca commitar API keys ou secrets
- Usar sessionStorage para dados sensíveis temporários
- Validar inputs do usuário
- Sanitizar conteúdo antes de renderizar
- CORS configurado apropriadamente

### Qualidade de Código
- Sempre rodar `npm run lint` antes de commitar
- Resolver warnings do ESLint
- Evitar any em TypeScript (quando migrar)
- Testes para funcionalidades críticas
- Code review mesmo em POC

### Debugging
- Console.log com prefixos descritivos
- React DevTools para estado e props
- Network tab para requisições API
- Breakpoints no código
- Error boundaries para capturar erros

### Performance
- Otimizar bundle size (analisar com vite-bundle-visualizer)
- Lazy loading de rotas e componentes pesados
- Debounce/throttle para inputs frequentes
- Virtualização para listas longas
- Cache de requisições quando apropriado
</development-best-practices>



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

