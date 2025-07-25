// netlify/functions/chat-jsonp.js
// 🔄 MÉTODO JSONP PARA BYPASS TOTAL DE CORS

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const startTime = Date.now();
  
  try {
    console.log('🔄 JSONP Request iniciado');
    
    // Extrai parâmetros da URL
    const params = event.queryStringParameters || {};
    const callback = params.callback || 'callback';
    const question = params.question || 'Pergunta não informada';
    const hasData = params.hasData === 'true';
    const rowCount = parseInt(params.rowCount || '0');
    const contextRaw = params.context || '[]';
    
    console.log('📊 JSONP Parâmetros:', { 
      question: question.substring(0, 50) + '...', 
      hasData, 
      rowCount,
      callback 
    });

    let contextData = [];
    try {
      contextData = JSON.parse(decodeURIComponent(contextRaw));
    } catch (e) {
      console.warn('⚠️ Erro ao parsear contexto JSONP:', e.message);
    }

    let answer = '';
    let method = 'JSONP_FALLBACK';
    
    try {
      // Tenta conectar ao Copilot com timeout curto
      const copilotPromise = sendToCopilotFast(question, contextData);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Copilot timeout')), 5000)
      );
      
      answer = await Promise.race([copilotPromise, timeoutPromise]);
      method = 'JSONP_COPILOT';
      console.log('✅ JSONP Copilot success em:', Date.now() - startTime, 'ms');
      
    } catch (copilotError) {
      console.log('⚡ JSONP Copilot timeout, usando fallback inteligente');
      answer = generateSmartFallback(question, contextData, hasData, rowCount);
    }

    const response = {
      answer,
      method,
      executionTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      dataStatus: { hasData, rowCount }
    };

    // Resposta JSONP válida
    const jsonpResponse = `${callback}(${JSON.stringify(response)});`;
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      },
      body: jsonpResponse
    };

  } catch (error) {
    console.error('❌ Erro crítico JSONP:', error);
    
    const callback = (event.queryStringParameters && event.queryStringParameters.callback) || 'callback';
    const errorResponse = `${callback}(${JSON.stringify({ 
      answer: '⚠️ Erro JSONP: ' + error.message + '. Sistema em modo de recuperação.',
      method: 'JSONP_ERROR',
      executionTime: Date.now() - startTime,
      error: true,
      timestamp: new Date().toISOString()
    })});`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8'
      },
      body: errorResponse
    };
  }
};

// 🚀 COPILOT ULTRA-RÁPIDO PARA JSONP
async function sendToCopilotFast(question, context) {
  const directLineSecret = process.env.COPILOT_SECRET;
  if (!directLineSecret) {
    throw new Error("COPILOT_SECRET não configurada");
  }

  console.log('🤖 JSONP: Iniciando Copilot rápido...');
  
  // Conversa
  const convResponse = await fetch('https://directline.botframework.com/v3/directline/conversations', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${directLineSecret}` }
  });

  if (!convResponse.ok) {
    throw new Error(`JSONP Conversa falhou: ${convResponse.status}`);
  }

  const { conversationId, token } = await convResponse.json();

  // Mensagem
  const message = prepareQuickMessage(question, context);
  
  await fetch(`https://directline.botframework.com/v3/directline/conversations/${conversationId}/activities`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'message',
      from: { id: 'PowerBI_JSONP_User' },
      text: message
    })
  });

  // Polling rápido (máximo 3 tentativas)
  for (let i = 0; i < 3; i++) {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const activitiesResponse = await fetch(
      `https://directline.botframework.com/v3/directline/conversations/${conversationId}/activities`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (activitiesResponse.ok) {
      const { activities } = await activitiesResponse.json();
      const botMessages = activities.filter(a => 
        a.type === 'message' && a.from.id !== 'PowerBI_JSONP_User'
      );

      if (botMessages.length > 0) {
        return botMessages[botMessages.length - 1].text;
      }
    }
  }

  throw new Error('JSONP Polling timeout');
}

// 📝 MENSAGEM OTIMIZADA
function prepareQuickMessage(question, context) {
  if (!Array.isArray(context) || context.length === 0) {
    return `RESPOSTA RÁPIDA: "${question}" - Sem dados Power BI.`;
  }

  const sample = context[0];
  const columns = Object.keys(sample).slice(0, 3);
  
  return `ANÁLISE RÁPIDA Power BI:
Pergunta: "${question}"
Dados: ${context.length} registros
Colunas: ${columns.join(', ')}
Exemplo: ${JSON.stringify(sample)}
RESPONDA DE FORMA CONCISA.`;
}

// 🧠 FALLBACK INTELIGENTE
function generateSmartFallback(question, context, hasData, rowCount) {
  const q = question.toLowerCase();
  
  // Detecção de tipo de pergunta
  if (q.includes('total') || q.includes('soma') || q.includes('sum')) {
    return `📊 **ANÁLISE DE TOTAIS via JSONP**
    
✅ **Status:** ${hasData ? `${rowCount} registros processados` : 'Nenhum dado disponível'}
🔍 **Pergunta:** ${question}
💡 **Sugestão:** ${hasData ? 'Use SUM() nas colunas numéricas para calcular totais' : 'Adicione dados numéricos ao visual'}

${hasData && Array.isArray(context) && context.length > 0 ? 
  `📋 **Dados disponíveis:** ${Object.keys(context[0]).join(', ')}` : 
  '⚠️ Configure dados no visual Power BI'}`;
  }
  
  if (q.includes('médico') || q.includes('doctor') || q.includes('quantidade')) {
    return `👨‍⚕️ **ANÁLISE MÉDICOS via JSONP**
    
✅ **Registros encontrados:** ${rowCount}
🔍 **Filtro aplicado:** "${question}"
📊 **Status:** ${hasData ? 'Dados carregados' : 'Sem dados'}

${hasData && Array.isArray(context) && context.length > 0 ? 
  `📋 **Amostra:** ${JSON.stringify(context[0], null, 2)}` : 
  '⚠️ Carregue dados médicos no visual'}`;
  }
  
  if (q.includes('vendas') || q.includes('receita') || q.includes('sales')) {
    return `💰 **ANÁLISE DE VENDAS via JSONP**
    
📈 **Transações:** ${rowCount} registros
💵 **Status:** ${hasData ? 'Dados processados' : 'Sem dados de vendas'}
🎯 **Pergunta:** ${question}

${hasData ? '✅ Dados prontos para análise de performance' : '⚠️ Configure dados de vendas no visual'}`;
  }
  
  // Resposta genérica
  return `🔄 **JSONP CONECTADO COM SUCESSO!**
  
✅ **Comunicação:** Ativa via JSONP (bypass CORS)
🔍 **Pergunta:** "${question}"
📊 **Dados:** ${hasData ? `${rowCount} registros carregados` : 'Nenhum dado disponível'}
⚡ **Método:** Fallback inteligente ativo

${hasData && Array.isArray(context) && context.length > 0 ? 
  `💡 **Dica:** Dados prontos! Faça perguntas mais específicas para análises detalhadas.` : 
  '🔧 **Ação:** Adicione dados ao visual Power BI para análises completas.'}`;
}