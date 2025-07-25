// netlify/functions/chat.js
// 🚀 VERSÃO ULTRA-OTIMIZADA PARA NETLIFY FREE (limite 10 segundos)

const fetch = require('node-fetch');

// ⚡ CONFIGURAÇÕES OTIMIZADAS
const CONFIG = {
  MAX_EXECUTION_TIME: 8500,    // 8.5s (buffer de 1.5s)
  COPILOT_TIMEOUT: 6000,       // 6s para Copilot responder
  MAX_POLLING_ATTEMPTS: 3,     // Máximo 3 tentativas
  POLLING_INTERVAL: 1500,      // 1.5s entre tentativas
  FALLBACK_DELAY: 500          // 0.5s para fallback
};

exports.handler = async (event, context) => {
  const startTime = Date.now();
  
  // 🕐 TIMEOUT GLOBAL PARA NETLIFY FREE
  const globalTimeout = setTimeout(() => {
    console.log('⏰ TIMEOUT NETLIFY: 8.5s atingidos');
    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        answer: "⚡ Resposta rápida ativada! O Copilot está processando sua pergunta. Funcionalidade otimizada para plano gratuito.",
        method: "FAST_FALLBACK",
        executionTime: Date.now() - startTime,
        netlifyOptimized: true
      })
    };
  }, CONFIG.MAX_EXECUTION_TIME);

  try {
    console.log('🚀 CHAT OTIMIZADO INICIADO:', {
      timestamp: new Date().toISOString(),
      timeLimit: `${CONFIG.MAX_EXECUTION_TIME}ms`,
      method: event.httpMethod
    });

    if (event.httpMethod === 'OPTIONS') {
      clearTimeout(globalTimeout);
      return { statusCode: 204, headers: getCorsHeaders(), body: '' };
    }

    // 🔍 PROCESSAMENTO ULTRA-RÁPIDO DOS PARÂMETROS
    const params = event.queryStringParameters || {};
    const question = decodeURIComponent(params.question || '').substring(0, 500); // Limita pergunta
    
    if (!question) {
      clearTimeout(globalTimeout);
      throw new Error("Parâmetro 'question' é obrigatório");
    }

    let contextData = {};
    let contextSummary = "Sem dados";
    
    if (params.context) {
      try {
        const rawContext = decodeURIComponent(params.context);
        contextData = JSON.parse(rawContext.substring(0, 2000)); // Limita contexto
        
        if (Array.isArray(contextData) && contextData.length > 0) {
          contextSummary = `${contextData.length} registros com ${Object.keys(contextData[0]).length} colunas`;
        }
      } catch (e) {
        console.warn('⚠️ Contexto inválido, usando fallback');
        contextData = {};
      }
    }

    console.log('📊 DADOS PROCESSADOS:', {
      question: question.substring(0, 50) + '...',
      contextSummary,
      timeElapsed: Date.now() - startTime
    });

    // 🚀 TENTATIVA COPILOT COM TIMEOUT RIGOROSO
    let copilotResponse = null;
    let usedMethod = "FALLBACK";
    
    try {
      const copilotPromise = sendToCopilotOptimized(question, contextData);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Copilot timeout')), CONFIG.COPILOT_TIMEOUT)
      );
      
      copilotResponse = await Promise.race([copilotPromise, timeoutPromise]);
      usedMethod = "COPILOT";
      console.log('✅ COPILOT SUCCESS em:', Date.now() - startTime, 'ms');
      
    } catch (copilotError) {
      console.log('⚡ COPILOT TIMEOUT, usando fallback inteligente');
      // Continua para fallback
    }

    clearTimeout(globalTimeout);

    // 🧠 RESPOSTA FINAL (Copilot ou Fallback Inteligente)
    const finalAnswer = copilotResponse || generateIntelligentFallback(question, contextData);
    
    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        answer: finalAnswer,
        method: usedMethod,
        executionTime: Date.now() - startTime,
        contextSummary,
        netlifyOptimized: true,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    clearTimeout(globalTimeout);
    console.error('❌ ERRO CHAT:', {
      message: error.message,
      executionTime: Date.now() - startTime
    });
    
    return {
      statusCode: 200, // Sempre 200 para evitar erros no visual
      headers: getCorsHeaders(),
      body: JSON.stringify({
        answer: `⚠️ Erro de processamento: ${error.message}. Sistema funcionando em modo de recuperação.`,
        method: "ERROR_RECOVERY",
        executionTime: Date.now() - startTime,
        error: true
      })
    };
  }
};

// 🚀 COPILOT ULTRA-OTIMIZADO
async function sendToCopilotOptimized(question, context) {
  const directLineSecret = process.env.COPILOT_SECRET;
  if (!directLineSecret) {
    throw new Error("COPILOT_SECRET não configurada");
  }

  console.log('🤖 Iniciando Copilot otimizado...');
  
  // 1️⃣ CONVERSA RÁPIDA
  const convResponse = await fetch('https://directline.botframework.com/v3/directline/conversations', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${directLineSecret}` },
    timeout: 2000 // 2s timeout
  });

  if (!convResponse.ok) {
    throw new Error(`Conversa falhou: ${convResponse.status}`);
  }

  const { conversationId, token } = await convResponse.json();

  // 2️⃣ MENSAGEM OTIMIZADA
  const optimizedMessage = prepareOptimizedMessage(question, context);
  
  await fetch(`https://directline.botframework.com/v3/directline/conversations/${conversationId}/activities`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'message',
      from: { id: 'PowerBI_Fast_User' },
      text: optimizedMessage
    }),
    timeout: 1500 // 1.5s timeout
  });

  // 3️⃣ POLLING SUPER-RÁPIDO
  for (let attempt = 1; attempt <= CONFIG.MAX_POLLING_ATTEMPTS; attempt++) {
    await new Promise(resolve => setTimeout(resolve, CONFIG.POLLING_INTERVAL));
    
    try {
      const activitiesResponse = await fetch(
        `https://directline.botframework.com/v3/directline/conversations/${conversationId}/activities`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 1000 // 1s timeout
        }
      );

      if (activitiesResponse.ok) {
        const { activities } = await activitiesResponse.json();
        const botMessages = activities.filter(a => 
          a.type === 'message' && a.from.id !== 'PowerBI_Fast_User'
        );

        if (botMessages.length > 0) {
          return botMessages[botMessages.length - 1].text;
        }
      }
    } catch (pollError) {
      console.warn(`⚠️ Polling ${attempt} falhou:`, pollError.message);
    }
  }

  throw new Error('Polling timeout após 3 tentativas');
}

// 🧠 FALLBACK INTELIGENTE COM IA
function generateIntelligentFallback(question, context) {
  const q = question.toLowerCase();
  const hasData = Array.isArray(context) && context.length > 0;
  const rowCount = hasData ? context.length : 0;
  
  // 🎯 ANÁLISE INTELIGENTE DA PERGUNTA
  const questionTypes = {
    totals: ['total', 'soma', 'sum', 'somar', 'calcular'],
    quantities: ['quantidade', 'qtd', 'quantos', 'count', 'número'],
    sales: ['vendas', 'receita', 'faturamento', 'revenue', 'sales'],
    doctors: ['médico', 'doctor', 'dr.', 'dra.', 'profissional'],
    averages: ['média', 'average', 'mean', 'médio'],
    comparisons: ['comparar', 'versus', 'vs', 'diferença', 'maior', 'menor']
  };

  let responseType = 'general';
  let keywords = [];

  for (const [type, terms] of Object.entries(questionTypes)) {
    if (terms.some(term => q.includes(term))) {
      responseType = type;
      keywords = terms.filter(term => q.includes(term));
      break;
    }
  }

  // 📊 GERAÇÃO DE RESPOSTA CONTEXTUAL
  switch (responseType) {
    case 'totals':
      return `📊 **ANÁLISE DE TOTAIS** ${hasData ? `
      
✅ **Dados Processados:** ${rowCount} registros
🔍 **Palavras-chave:** ${keywords.join(', ')}
📈 **Sugestão:** Use a coluna de valores numéricos para calcular totais
🎯 **Próximo passo:** Identifique a coluna de valores e aplique SUM()

${hasData ? generateDataSample(context) : '⚠️ Adicione dados numéricos ao visual'}` : '⚠️ Nenhum dado disponível para cálculo de totais'}`;

    case 'doctors':
      return `👨‍⚕️ **ANÁLISE MÉDICOS** ${hasData ? `
      
✅ **Registros médicos:** ${rowCount} encontrados
🔍 **Filtros aplicados:** ${keywords.join(', ')}
📋 **Colunas disponíveis:** ${hasData ? Object.keys(context[0]).join(', ') : 'N/A'}
💡 **Insights:** Agrupe por nome do médico para ver distribuição

${generateDataSample(context)}` : '⚠️ Dados médicos não carregados no visual'}`;

    case 'sales':
      return `💰 **ANÁLISE DE VENDAS** ${hasData ? `
      
📊 **Transações:** ${rowCount} registros de vendas
💵 **Métricas:** Receita, quantidade, performance
📈 **Período:** Baseado nos dados carregados
🎯 **Recomendação:** Visualize por período ou vendedor

${generateDataSample(context)}` : '⚠️ Carregue dados de vendas no visual'}`;

    default:
      return `🤖 **ASSISTENTE BI ATIVO** ${hasData ? `
      
✅ **Status:** ${rowCount} registros processados
🔍 **Pergunta:** "${question.substring(0, 100)}..."
📊 **Dados:** ${Object.keys(context[0] || {}).length} colunas disponíveis
⚡ **Modo:** Resposta rápida (otimizado para Netlify Free)

${generateDataSample(context)}

💡 **Dica:** Seja mais específico para análises detalhadas` : '⚠️ Nenhum dado carregado no visual'}`;
  }
}

// 📋 GERADOR DE AMOSTRA DE DADOS
function generateDataSample(context) {
  if (!Array.isArray(context) || context.length === 0) return '';
  
  const sample = context.slice(0, 2);
  const columns = Object.keys(sample[0] || {});
  
  let sampleText = '\n📋 **Amostra dos dados:**\n';
  sample.forEach((row, index) => {
    sampleText += `**Registro ${index + 1}:** `;
    sampleText += Object.entries(row)
      .slice(0, 3) // Máximo 3 colunas para não sobrecarregar
      .map(([key, value]) => `${key}: ${value}`)
      .join(' | ');
    sampleText += '\n';
  });
  
  if (context.length > 2) {
    sampleText += `... e mais ${context.length - 2} registros`;
  }
  
  return sampleText;
}

// 📧 MENSAGEM OTIMIZADA PARA COPILOT
function prepareOptimizedMessage(question, context) {
  // Mensagem concisa para economizar tempo de processamento
  if (!Array.isArray(context) || context.length === 0) {
    return `Pergunta rápida: "${question}" - Sem dados do Power BI.`;
  }

  const sample = context.slice(0, 3); // Máximo 3 registros
  const columns = Object.keys(sample[0] || {}).slice(0, 5); // Máximo 5 colunas
  
  return `ANÁLISE RÁPIDA:
Pergunta: "${question}"
Dados: ${context.length} registros
Colunas: ${columns.join(', ')}
Amostra: ${JSON.stringify(sample[0] || {})}
RESPONDA DE FORMA CONCISA E DIRETA.`;
}

// 🌐 HEADERS CORS
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache'
  };
}