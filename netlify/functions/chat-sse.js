// netlify/functions/chat-sse.js
// Server-Sent Events para streaming de resposta

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  console.log('📡 SSE Request recebido');
  
  const params = event.queryStringParameters || {};
  const question = params.question || 'Pergunta não informada';
  const contextRaw = params.context || '{}';
  
  let contextData = {};
  try {
    contextData = JSON.parse(decodeURIComponent(contextRaw));
  } catch (e) {
    console.warn('⚠️ Erro ao parsear contexto SSE:', e.message);
  }

  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  };

  try {
    // Tenta conectar ao Copilot
    const contextMessage = prepareContextForCopilot(contextData, question);
    
    console.log('🤖 Enviando para Copilot via SSE...');
    const answer = await sendToCopilot(contextMessage);
    
    const sseData = `data: ${JSON.stringify({
      answer,
      method: 'SSE',
      timestamp: new Date().toISOString(),
      success: true
    })}\n\n`;

    return {
      statusCode: 200,
      headers,
      body: sseData
    };

  } catch (error) {
    console.error('❌ Erro SSE:', error.message);
    
    // Fallback response
    const fallbackAnswer = generateFallbackResponse(question, contextData);
    
    const sseData = `data: ${JSON.stringify({
      answer: fallbackAnswer,
      method: 'SSE_FALLBACK',
      timestamp: new Date().toISOString(),
      success: false,
      error: error.message
    })}\n\n`;

    return {
      statusCode: 200,
      headers,
      body: sseData
    };
  }
};

function prepareContextForCopilot(context, question) {
  if (!context || (Array.isArray(context) && context.length === 0)) {
    return `Pergunta: "${question}"\nContexto: Nenhum dado disponível no Power BI.`;
  }

  if (Array.isArray(context)) {
    const summary = context.slice(0, 3).map((row, i) => 
      `Linha ${i+1}: ${Object.entries(row).map(([k,v]) => `${k}=${v}`).join(', ')}`
    ).join(' | ');
    
    return `DADOS POWER BI:
Pergunta: "${question}"
Registros: ${context.length}
Amostra: ${summary}
Analise estes dados para responder.`;
  }

  return `Pergunta: "${question}"\nDados: ${JSON.stringify(context)}`;
}

async function sendToCopilot(message) {
  const directLineSecret = process.env.COPILOT_SECRET;
  if (!directLineSecret) {
    throw new Error("COPILOT_SECRET não configurada");
  }

  const convResponse = await fetch('https://directline.botframework.com/v3/directline/conversations', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${directLineSecret}` }
  });

  if (!convResponse.ok) {
    throw new Error(`Conversa falhou: ${convResponse.status}`);
  }

  const { conversationId, token } = await convResponse.json();

  await fetch(`https://directline.botframework.com/v3/directline/conversations/${conversationId}/activities`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'message',
      from: { id: 'PowerBI_SSE_User' },
      text: message
    })
  });

  // Polling otimizado para SSE
  for (let i = 0; i < 6; i++) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const activitiesResponse = await fetch(`https://directline.botframework.com/v3/directline/conversations/${conversationId}/activities`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (activitiesResponse.ok) {
      const { activities } = await activitiesResponse.json();
      const botMessages = activities.filter(a => 
        a.type === 'message' && a.from.id !== 'PowerBI_SSE_User'
      );

      if (botMessages.length > 0) {
        return botMessages[botMessages.length - 1].text;
      }
    }
  }

  throw new Error('Timeout SSE: 9 segundos');
}

function generateFallbackResponse(question, context) {
  const q = question.toLowerCase();
  const hasData = Array.isArray(context) && context.length > 0;
  const rowCount = hasData ? context.length : 0;

  if (q.includes('total') || q.includes('soma')) {
    return `📊 ANÁLISE DE TOTAIS (via SSE): ${hasData ? `Processando ${rowCount} registros` : 'Nenhum dado disponível'}`;
  }
  
  if (q.includes('quantidade') || q.includes('qtd')) {
    return `🔢 ANÁLISE DE QUANTIDADES (via SSE): ${hasData ? `${rowCount} registros encontrados` : 'Carregue dados no visual'}`;
  }
  
  return `✅ Conectado via SSE! Pergunta: "${question}". Dados: ${hasData ? `${rowCount} registros` : 'Sem dados'}`;
}