// netlify/functions/chat-pixel.js
// Método via pixel tracking + storage bridge

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  console.log('🖼️ Pixel Request recebido');
  
  const params = event.queryStringParameters || {};
  const sessionId = params.session || 'default';
  const question = params.question || 'Pergunta não informada';
  const contextRaw = params.context || '{}';
  
  // Headers para imagem 1x1 transparente
  const pixelHeaders = {
    'Content-Type': 'image/gif',
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*'
  };

  // GIF 1x1 transparente em base64
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

  try {
    let contextData = {};
    try {
      contextData = JSON.parse(decodeURIComponent(contextRaw));
    } catch (e) {
      console.warn('⚠️ Erro ao parsear contexto pixel:', e.message);
    }

    console.log('📊 Processando pixel request:', { sessionId, question: question.substring(0, 50) });

    // Processa em background (não bloqueia retorno do pixel)
    setImmediate(async () => {
      try {
        const contextMessage = prepareContextForCopilot(contextData, question);
        const answer = await sendToCopilot(contextMessage);
        
        // Simula storage via função auxiliar
        await storeResponse(sessionId, {
          answer,
          method: 'PIXEL',
          timestamp: new Date().toISOString(),
          success: true
        });

        console.log('✅ Resposta pixel armazenada para:', sessionId);
      } catch (error) {
        console.error('❌ Erro background pixel:', error.message);
        
        const fallbackAnswer = generateFallbackResponse(question, contextData);
        await storeResponse(sessionId, {
          answer: fallbackAnswer,
          method: 'PIXEL_FALLBACK',
          timestamp: new Date().toISOString(),
          success: false,
          error: error.message
        });
      }
    });

    // Retorna pixel imediatamente
    return {
      statusCode: 200,
      headers: pixelHeaders,
      body: pixel.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('❌ Erro crítico pixel:', error);
    
    // Mesmo em erro, retorna pixel válido
    return {
      statusCode: 200,
      headers: pixelHeaders,
      body: pixel.toString('base64'),
      isBase64Encoded: true
    };
  }
};

// Simula storage usando função auxiliar
async function storeResponse(sessionId, data) {
  try {
    // Em produção, usaria Redis ou banco de dados
    // Aqui vamos usar uma função netlify auxiliar como "storage"
    await fetch(`${process.env.URL}/.netlify/functions/storage-bridge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'store',
        sessionId,
        data
      })
    });
  } catch (e) {
    console.warn('⚠️ Storage bridge falhou:', e.message);
  }
}

function prepareContextForCopilot(context, question) {
  if (!context || (Array.isArray(context) && context.length === 0)) {
    return `Pergunta: "${question}"\nContexto: Sem dados no Power BI.`;
  }

  if (Array.isArray(context)) {
    const columns = Object.keys(context[0] || {});
    const sample = context.slice(0, 2).map(row => 
      Object.entries(row).map(([k,v]) => `${k}:${v}`).join(', ')
    ).join(' | ');
    
    return `ANÁLISE POWER BI:
Pergunta: "${question}"
Dados: ${context.length} registros
Colunas: ${columns.join(', ')}
Exemplo: ${sample}`;
  }

  return `Pergunta: "${question}"\nContexto: ${JSON.stringify(context)}`;
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
    throw new Error(`Falha conversa: ${convResponse.status}`);
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
      from: { id: 'PowerBI_Pixel_User' },
      text: message
    })
  });

  for (let i = 0; i < 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const activitiesResponse = await fetch(`https://directline.botframework.com/v3/directline/conversations/${conversationId}/activities`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (activitiesResponse.ok) {
      const { activities } = await activitiesResponse.json();
      const botMessages = activities.filter(a => 
        a.type === 'message' && a.from.id !== 'PowerBI_Pixel_User'
      );

      if (botMessages.length > 0) {
        return botMessages[botMessages.length - 1].text;
      }
    }
  }

  throw new Error('Timeout pixel: 10 segundos');
}

function generateFallbackResponse(question, context) {
  const q = question.toLowerCase();
  const hasData = Array.isArray(context) && context.length > 0;
  const rowCount = hasData ? context.length : 0;

  if (q.includes('médico') || q.includes('doctor')) {
    return `👨‍⚕️ ANÁLISE MÉDICOS (via Pixel): ${hasData ? `Encontrados ${rowCount} registros médicos` : 'Dados médicos não disponíveis'}`;
  }
  
  if (q.includes('vendas') || q.includes('receita')) {
    return `💰 ANÁLISE VENDAS (via Pixel): ${hasData ? `Processando ${rowCount} transações` : 'Dados de vendas não carregados'}`;
  }
  
  return `🖼️ Conectado via Pixel Tracking! Pergunta: "${question}". Status: ${hasData ? `${rowCount} registros` : 'Sem dados'}`;
}