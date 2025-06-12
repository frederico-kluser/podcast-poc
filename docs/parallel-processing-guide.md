# Guia de Processamento Paralelo para OpenAI API

Este guia explica como usar o sistema de processamento paralelo otimizado para a API da OpenAI no projeto Podcast POC.

## Visão Geral

O sistema de processamento paralelo foi desenvolvido para maximizar a eficiência ao fazer múltiplas requisições para a API da OpenAI, reduzindo drasticamente o tempo total de processamento enquanto respeita os limites de taxa (rate limits).

### Principais Benefícios

- **Redução de tempo**: Processa múltiplas requisições simultaneamente
- **Otimização de recursos**: Utiliza a capacidade máxima permitida pela API
- **Controle de rate limit**: Evita erros 429 com backoff exponencial inteligente
- **Monitoramento em tempo real**: Acompanhe o progresso detalhado
- **Resiliência**: Retry automático com backoff exponencial

## Arquitetura

### OpenAIParallelService

Serviço principal que gerencia o processamento paralelo:

```javascript
import { OpenAIParallelService } from './services/openaiParallel.service';
```

#### Características:
- Usa `p-limit` para controle de concorrência
- Rate limiter integrado para RPM (requests per minute)
- Sistema de retry com backoff exponencial
- Callbacks para progresso e eventos
- Estatísticas detalhadas de processamento

### TextCorrectionService

Serviço de correção de texto otimizado com paralelização:

```javascript
import { TextCorrectionService } from './services/textCorrection.service';
```

## Configuração

### Parâmetros de Paralelização

```javascript
TextCorrectionService.configureParallelProcessing({
  concurrency: 8,              // Requisições simultâneas (padrão: 8)
  maxRequestsPerMinute: 3500,  // Limite de RPM (padrão: 3500)
  enableAdaptiveConcurrency: true // Ajuste automático
});
```

### Níveis de Concorrência Recomendados

| Tier OpenAI | Concorrência | RPM Máximo |
|-------------|--------------|------------|
| Free        | 1-3          | 60         |
| Tier 1      | 5-8          | 3,500      |
| Tier 2      | 8-12         | 5,000      |
| Tier 3      | 10-15        | 10,000     |
| Tier 4      | 15-20        | 10,000+    |

## Uso Básico

### Correção de Textos em Paralelo

```javascript
const chunks = [
  { id: 1, text: "Texto1semespaços" },
  { id: 2, text: "Texto2semespaços" },
  // ... mais chunks
];

const resultados = await TextCorrectionService.correctInBatches(chunks, (progress) => {
  console.log(`Progresso: ${progress.percentage}%`);
  console.log(`Concluídas: ${progress.current}/${progress.total}`);
  console.log(`Em processamento: ${progress.inFlight}`);
});
```

### Requisições Customizadas

```javascript
const requisicoes = [
  {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Sistema prompt' },
      { role: 'user', content: 'User prompt' }
    ],
    temperature: 0.7
  },
  // ... mais requisições
];

const resultados = await OpenAIParallelService.processParallel(requisicoes, {
  concurrency: 10,
  onProgress: (progress) => {
    console.log(`${progress.percentage}% concluído`);
  }
});
```

## Monitoramento e Callbacks

### Callbacks Disponíveis

```javascript
{
  onProgress: (progress) => {
    // Chamado a cada atualização
    // progress.completed, progress.failed, progress.total, etc.
  },
  
  onRequestComplete: ({ index, result, completed, total }) => {
    // Chamado quando uma requisição é concluída com sucesso
  },
  
  onRequestError: ({ index, error, request, failed, total }) => {
    // Chamado quando uma requisição falha
  }
}
```

### Estrutura do Progresso

```javascript
{
  completed: 15,        // Requisições concluídas
  failed: 2,           // Requisições com erro
  total: 20,           // Total de requisições
  inFlight: 3,         // Requisições em andamento
  percentage: "85.00", // Percentual concluído
  elapsedTime: 12500   // Tempo decorrido em ms
}
```

## Tratamento de Erros

### Rate Limit (429)
- Retry automático com backoff exponencial
- Delay inicial: 1s, máximo: 32s
- Até 3 tentativas por padrão

### Erros Temporários (500, 502, 503, 504)
- Retry automático
- Mesma política de backoff

### Exemplo de Tratamento

```javascript
const resultados = await OpenAIParallelService.processParallel(requisicoes, {
  onRequestError: ({ index, error, request }) => {
    if (error.includes('rate limit')) {
      console.log('Rate limit atingido, aguardando...');
    } else {
      console.error(`Erro na requisição ${index}:`, error);
    }
  }
});

// Verificar resultados
resultados.forEach(resultado => {
  if (!resultado.success) {
    console.error('Falha:', resultado.error);
    // Implementar lógica de fallback
  }
});
```

## Otimização de Performance

### 1. Cache de Resultados

O TextCorrectionService mantém cache automático:
```javascript
// Cache é verificado automaticamente
// Resultados são armazenados para evitar reprocessamento
```

### 2. Estimativa de Tempo e Custo

```javascript
// Estimar tempo
const estimativa = await TextCorrectionService.estimateParallelProcessingTime(chunks);
console.log(`Tempo estimado: ${estimativa.estimatedTimeMinutes} minutos`);

// Estimar custo
const custo = TextCorrectionService.estimateCost(totalCaracteres, numeroChunks);
console.log(`Custo estimado: $${custo.totalCost.toFixed(4)}`);
```

### 3. Métricas de Performance

```javascript
// Obter resumo das métricas
const metricas = TextCorrectionService.getMetricsSummary();
console.log('Taxa de sucesso:', metricas.successRate);
console.log('Tempo médio:', metricas.averageTime);

// Exportar métricas detalhadas
const metricasCompletas = TextCorrectionService.exportMetrics();
```

## Comparação: Sequencial vs Paralelo

### Processamento Sequencial
- 20 chunks × 2s/chunk = 40s total
- Taxa: 0.5 chunks/s

### Processamento Paralelo (concorrência 8)
- 20 chunks ÷ 8 paralelos = ~3 batches
- 3 batches × 2s = 6s total
- Taxa: 3.33 chunks/s
- **Speedup: 6.67x mais rápido**

## Boas Práticas

### 1. Escolha a Concorrência Adequada
- Comece com valores conservadores (5-8)
- Aumente gradualmente monitorando erros
- Considere o tier da sua conta OpenAI

### 2. Implemente Fallbacks
```javascript
if (resultado.error) {
  // Tentar método alternativo
  // Ou processar sequencialmente
}
```

### 3. Monitore Custos
- Use estimativas antes de processar grandes volumes
- Implemente limites de segurança
- Acompanhe métricas de uso

### 4. Use Cache Inteligentemente
- O cache automático evita reprocessamento
- Configure `maxCacheSize` conforme necessário

### 5. Trate Erros Graciosamente
- Não deixe uma falha parar todo o processamento
- Implemente logs detalhados
- Considere reprocessar falhas separadamente

## Troubleshooting

### "Too Many Requests" frequentes
- Reduza a concorrência
- Verifique seu tier na OpenAI
- Implemente delays entre batches

### Performance abaixo do esperado
- Verifique latência de rede
- Otimize o tamanho dos chunks
- Use cache quando possível

### Memória alta
- Processe em batches menores
- Limite o cache (`maxCacheSize`)
- Use streams para grandes volumes

## Exemplo Completo

```javascript
async function processarDocumentoCompleto(chunks) {
  // Configurar paralelização
  TextCorrectionService.configureParallelProcessing({
    concurrency: 10,
    maxRequestsPerMinute: 5000
  });

  // Estimar tempo e custo
  const estimativa = await TextCorrectionService.estimateParallelProcessingTime(chunks);
  console.log(`Processamento estimado: ${estimativa.estimatedTimeMinutes.toFixed(1)} minutos`);

  // Processar com monitoramento
  const startTime = Date.now();
  const resultados = await TextCorrectionService.correctInBatches(chunks, (progress) => {
    const tempoDecorrido = (Date.now() - startTime) / 1000;
    const velocidade = progress.current / tempoDecorrido;
    console.log(`[${progress.percentage}%] ${progress.current}/${progress.total} chunks`);
    console.log(`Velocidade: ${velocidade.toFixed(2)} chunks/s`);
    console.log(`ETA: ${((progress.total - progress.current) / velocidade / 60).toFixed(1)} minutos`);
  });

  // Análise dos resultados
  const sucesso = resultados.filter(r => !r.error).length;
  const falhas = resultados.filter(r => r.error).length;
  
  console.log(`\nProcessamento concluído!`);
  console.log(`✅ Sucesso: ${sucesso}`);
  console.log(`❌ Falhas: ${falhas}`);
  console.log(`⏱️ Tempo total: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);

  // Reprocessar falhas se necessário
  if (falhas > 0) {
    console.log('\nReprocessando falhas...');
    const chunksComFalha = resultados.filter(r => r.error);
    // Implementar lógica de reprocessamento
  }

  return resultados;
}
```

## Conclusão

O sistema de processamento paralelo oferece ganhos significativos de performance, podendo reduzir o tempo de processamento em até 10x ou mais, dependendo da configuração e do volume de dados. Use as configurações recomendadas e monitore constantemente para obter os melhores resultados.