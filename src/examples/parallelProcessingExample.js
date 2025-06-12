/**
 * Exemplo de uso do serviço de processamento paralelo OpenAI
 * 
 * Este arquivo demonstra como usar o OpenAIParallelService para
 * processar múltiplas requisições de correção de texto simultaneamente.
 */

import { TextCorrectionService } from '../services/textCorrection.service';
import { OpenAIParallelService } from '../services/openaiParallel.service';

// Exemplo 1: Correção de textos em paralelo usando TextCorrectionService
async function exemploCorrecaoParalela() {
  // Configurar o serviço com parâmetros otimizados
  TextCorrectionService.configureParallelProcessing({
    concurrency: 10, // 10 requisições simultâneas
    maxRequestsPerMinute: 3500, // Limite de requisições por minuto
    enableAdaptiveConcurrency: true // Ajuste automático de concorrência
  });

  // Chunks de texto para corrigir
  const chunks = [
    { id: 1, text: "Esteéumtextocomespaçosfaltando" },
    { id: 2, text: "Apáginacontém3exemplosdiferentes" },
    { id: 3, text: "Osistemaprocessatextosrapidamente" },
    // ... mais chunks
  ];

  // Processar com callback de progresso
  const resultados = await TextCorrectionService.correctInBatches(chunks, (progress) => {
    console.log(`Progresso: ${progress.percentage}% (${progress.current}/${progress.total})`);
    console.log(`Requisições em andamento: ${progress.inFlight}`);
  });

  // Verificar resultados
  resultados.forEach(resultado => {
    if (resultado.error) {
      console.error(`Erro no chunk ${resultado.id}:`, resultado.error);
    } else {
      console.log(`Chunk ${resultado.id} corrigido:`, resultado.text);
    }
  });
}

// Exemplo 2: Uso direto do OpenAIParallelService para requisições customizadas
async function exemploRequisoesCustomizadas() {
  // Criar requisições personalizadas
  const requisicoes = [
    {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você é um assistente útil.' },
        { role: 'user', content: 'Explique o que é paralelização em 1 frase.' }
      ],
      temperature: 0.7
    },
    {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você é um assistente útil.' },
        { role: 'user', content: 'Qual a capital do Brasil?' }
      ],
      temperature: 0
    },
    // ... mais requisições
  ];

  // Processar em paralelo com controle detalhado
  const resultados = await OpenAIParallelService.processParallel(requisicoes, {
    concurrency: 5,
    maxRequestsPerMinute: 3500,
    onProgress: (progress) => {
      console.log(`📊 Progresso: ${progress.percentage}%`);
      console.log(`✅ Concluídas: ${progress.completed}`);
      console.log(`❌ Falhas: ${progress.failed}`);
      console.log(`⏱️ Tempo decorrido: ${(progress.elapsedTime / 1000).toFixed(2)}s`);
    },
    onRequestComplete: ({ index, result }) => {
      console.log(`✅ Requisição ${index + 1} concluída`);
    },
    onRequestError: ({ index, error }) => {
      console.error(`❌ Erro na requisição ${index + 1}:`, error);
    }
  });

  // Processar resultados
  resultados.forEach((resultado, index) => {
    if (resultado.success) {
      const resposta = resultado.data.choices[0].message.content;
      console.log(`Resposta ${index + 1}:`, resposta);
    }
  });
}

// Exemplo 3: Estimativa de tempo e custo
async function exemploEstimativa() {
  const chunks = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    text: `Texto de exemplo número ${i}`
  }));

  // Estimar tempo de processamento
  const estimativa = await TextCorrectionService.estimateParallelProcessingTime(chunks);
  
  console.log('📊 Estimativa de Processamento:');
  console.log(`- Total de chunks: ${estimativa.totalChunks}`);
  console.log(`- Concorrência: ${estimativa.concurrency}`);
  console.log(`- Batches estimados: ${estimativa.estimatedBatches}`);
  console.log(`- Tempo estimado: ${estimativa.estimatedTimeSeconds.toFixed(2)}s`);
  console.log(`- Tempo estimado: ${estimativa.estimatedTimeMinutes.toFixed(2)} minutos`);

  // Estimar custo
  const totalCaracteres = chunks.reduce((total, chunk) => total + chunk.text.length, 0);
  const custoEstimado = TextCorrectionService.estimateCost(totalCaracteres, chunks.length);
  
  console.log('\n💰 Estimativa de Custo:');
  console.log(`- Tokens de entrada estimados: ${custoEstimado.estimatedInputTokens}`);
  console.log(`- Tokens de saída estimados: ${custoEstimado.estimatedOutputTokens}`);
  console.log(`- Custo total estimado: $${custoEstimado.totalCost.toFixed(4)}`);
  console.log(`- Custo por chunk: $${custoEstimado.costPerChunk.toFixed(4)}`);
}

// Exemplo 4: Comparação entre processamento sequencial e paralelo
async function exemploComparacao() {
  const chunks = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    text: "Textoparacorrigircomespaçosfaltando"
  }));

  console.log('🔄 Iniciando comparação...\n');

  // Processamento sequencial (método legado)
  console.log('1️⃣ Processamento Sequencial:');
  const inicioSequencial = Date.now();
  await TextCorrectionService.correctInBatchesSequential(chunks);
  const tempoSequencial = Date.now() - inicioSequencial;
  console.log(`Tempo total: ${(tempoSequencial / 1000).toFixed(2)}s`);
  console.log(`Taxa: ${(chunks.length / (tempoSequencial / 1000)).toFixed(2)} chunks/s\n`);

  // Processamento paralelo
  console.log('2️⃣ Processamento Paralelo:');
  const inicioParalelo = Date.now();
  await TextCorrectionService.correctInBatches(chunks);
  const tempoParalelo = Date.now() - inicioParalelo;
  console.log(`Tempo total: ${(tempoParalelo / 1000).toFixed(2)}s`);
  console.log(`Taxa: ${(chunks.length / (tempoParalelo / 1000)).toFixed(2)} chunks/s\n`);

  // Comparação
  const melhoria = ((tempoSequencial - tempoParalelo) / tempoSequencial * 100).toFixed(1);
  const speedup = (tempoSequencial / tempoParalelo).toFixed(2);
  
  console.log('📊 Resultados:');
  console.log(`- Melhoria de performance: ${melhoria}%`);
  console.log(`- Speedup: ${speedup}x mais rápido`);
  console.log(`- Tempo economizado: ${((tempoSequencial - tempoParalelo) / 1000).toFixed(2)}s`);
}

// Exportar exemplos
export {
  exemploCorrecaoParalela,
  exemploRequisoesCustomizadas,
  exemploEstimativa,
  exemploComparacao
};