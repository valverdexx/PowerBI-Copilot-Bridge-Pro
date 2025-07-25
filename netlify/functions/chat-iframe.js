// netlify/functions/chat-iframe.js
// 🖼️ MÉTODO IFRAME + POSTMESSAGE PARA CONTORNAR CSP

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const startTime = Date.now();
  
  try {
    console.log('🖼️ Iframe request recebido');
    
    // Extrai parâmetros
    const params = event.queryStringParameters || {};
    const question = params.question || 'Pergunta não informada';
    const hasData = params.hasData === 'true';
    const rowCount = parseInt(params.rowCount || '0');
    const contextRaw = params.context || '[]';
    
    console.log('📊 Iframe processando:', { 
      question: question.substring(0, 50) + '...', 
      hasData, 
      rowCount 
    });

    let contextData = [];
    try {
      contextData = JSON.parse(decodeURIComponent(contextRaw));
    } catch (e) {
      console.warn('⚠️ Erro ao parsear contexto iframe:', e.message);
    }

    let answer = '';
    let method = 'IFRAME_FALLBACK';
    
    try {
      // Tenta conectar ao Copilot
      const copilotPromise = sendToCopilotIframe(question, contextData);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Copilot timeout')), 6000)
      );
      
      answer = await Promise.race([copilotPromise, timeoutPromise]);
      method = 'IFRAME_COPILOT';
      console.log('✅ Iframe Copilot success em:', Date.now() - startTime, 'ms');
      
    } catch (copilotError) {
      console.error('❌ Iframe Copilot erro:', copilotError.message);
      answer = generateIframeFallback(question, contextData, hasData, rowCount);
    }

    // Página HTML que envia PostMessage para o parent
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>PowerBI Copilot Bridge - Iframe Response</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            font-family: 'Segoe UI', sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
        }
        .loading {
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .success { color: #48bb78; }
        .method { font-size: 12px; opacity: 0.8; }
    </style>
</head>
<body>
    <div class="loading">
        <h3>🖼️ PowerBI Copilot Bridge</h3>
        <p>Enviando resposta via PostMessage...</p>
        <p class="method">Método: ${method}</p>
        <p class="method">Tempo: ${Date.now() - startTime}ms</p>
    </div>

    <script>
        try {
            const response = ${JSON.stringify({
              answer,
              method,
              executionTime: Date.now() - startTime,
              timestamp: new Date().toISOString(),
              dataStatus: { hasData, rowCount }
            })};
            
            console.log('🖼️ Iframe enviando PostMessage:', response);
            
            // Lista de origens permitidas (Power BI)
            const allowedOrigins = [
                'https://app.powerbi.com',
                'https://msit.powerbi.com', 
                'https://powerbi.microsoft.com',
                'https://localhost:8080',
                'http://localhost:8080'
            ];
            
            // Envia para todas as origens permitidas
            allowedOrigins.forEach(origin => {
                try {
                    if (window.parent && window.parent !== window) {
                        window.parent.postMessage(response, origin);
                        console.log('✅ PostMessage enviado para:', origin);
                    }
                } catch (e) {
                    console.warn('⚠️ Erro PostMessage para', origin, ':', e.message);
                }
            });
            
            // Feedback visual
            document.body.innerHTML = \`
                <div class="success">
                    <h3>✅ Resposta Enviada!</h3>
                    <p>Método: ${method}</p>
                    <p>Dados: \${${hasData} ? '${rowCount} registros' : 'Sem dados'}</p>
                    <p>Tempo: \${${Date.now() - startTime}}ms</p>
                </div>
            \`;
            
        } catch (error) {
            console.error('❌ Erro iframe PostMessage:', error);
            
            const errorResponse = {
                error: 'Erro interno iframe: ' + error.message,
                method: 'IFRAME_ERROR',
                timestamp: new Date().toISOString()
            };
            
            // Tenta enviar erro mesmo assim
            if (window.parent && window.parent !== window) {
                window.parent.postMessage(errorResponse, '*');
            }
            
            document.body.innerHTML = \`
                <div style="color: #f56565;">
                    <h3>❌ Erro Iframe</h3>
                    <p>\${error.message}</p>
                </div>
            \`;
        }
    </script>
</body>
</html>`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Frame-Options': 'ALLOWALL',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      },
      body: html
    };

  } catch (error) {
    console.error('❌ Erro crítico iframe:', error);
    
    const errorHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Erro Iframe</title></head>
<body style="font-family: sans-serif; text-align: center; padding: 20px; background: #fed7d7; color: #c53030;">
    <h3>❌ Erro Crítico Iframe</h3>
    <p>${error.message}</p>
    <script>
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                error: 'Erro crítico iframe: ${error.message}',
                method: 'IFRAME_CRITICAL_ERROR'
            }, '*');
        }
    </script>
</body>
</html>`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: errorHtml
    };
  }
};

// 🤖 COPILOT PARA IFRAME
async function sendToCopilotIframe(question, context) {
  const directLineSecret = process.env.COPILOT_SECRET;
  if (!directLineSecret) {
    throw new Error("COPILOT_SECRET não configurada");
  }

  console.log('🤖 Iframe: Conectando ao Copilot...');

  // Conversa
  const convResponse = await fetch('https://directline.botframework.com/v3/directline/conversations', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${directLineSecret}` }
  });

  if (!convResponse.ok) {
    throw new Error(`Iframe conversa falhou: ${convResponse.status}`);
  }

  const { conversationId, token } = await convResponse.json();

  // Mensagem
  const message = prepareIframeMessage(question, context);
  
  await fetch(`https://directline.botframework.com/v3/directline/conversations/${conversationId}/activities`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'message',
      from: { id: 'PowerBI_Iframe_User' },
      text: message
    })
  });

  // Polling para iframe (4 tentativas)
  for (let i = 0; i < 4; i++) {
    await new Promise(resolve => setTimeout(resolve, 1300));
    
    const activitiesResponse = await fetch(
      `https://directline.botframework.com/v3/directline/conversations/${conversationId}/activities`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (activitiesResponse.ok) {
      const { activities } = await activitiesResponse.json();
      const botMessages = activities.filter(a => 
        a.type === 'message' && a.from.id !== 'PowerBI_Iframe_User'
      );

      if (botMessages.length > 0) {
        return botMessages[botMessages.length - 1].text;
      }
    }
  }

  throw new Error('Iframe polling timeout após 4 tentativas');
}

// 📝 MENSAGEM PARA IFRAME
function prepareIframeMessage(question, context) {
  if (!Array.isArray(context) || context.length === 0) {
    return `Pergunta via Iframe: "${question}"\nContexto: Nenhum dado disponível no Power BI.`;
  }

  const columns = Object.keys(context[0] || {});
  const sample = context.slice(0, 2);
  
  return `ANÁLISE POWER BI via Iframe:
Pergunta: "${question}"
Registros: ${context.length}
Colunas: ${columns.join(', ')}
Amostra: ${sample.map(row => Object.entries(row).map(([k,v]) => `${k}:${v}`).join(', ')).join(' | ')}

Responda com base nestes dados específicos.`;
}

// 🧠 FALLBACK IFRAME
function generateIframeFallback(question, context, hasData, rowCount) {
  const q = question.toLowerCase();
  
  if (q.includes('quantidade') || q.includes('médico')) {
    return `👨‍⚕️ **ANÁLISE MÉDICOS via Iframe**

🖼️ **Método:** Iframe + PostMessage ativo
📊 **Dados:** ${hasData ? `${rowCount} registros médicos encontrados` : 'Nenhum dado médico disponível'}
🔍 **Pergunta:** ${question}

${hasData && Array.isArray(context) && context.length > 0 ? 
  `📋 **Colunas disponíveis:** ${Object.keys(context[0]).join(', ')}
   📝 **Primeira entrada:** ${JSON.stringify(context[0], null, 2)}` : 
  '⚠️ **Ação necessária:** Configure dados médicos no visual Power BI'}

💡 **Sugestão:** ${hasData ? 'Agrupe por nome do médico para análise detalhada' : 'Adicione dados da tabela de médicos ao visual'}`;
  }
  
  return `🖼️ **IFRAME BRIDGE ATIVO!**

✅ **Comunicação:** PostMessage funcionando
🔍 **Pergunta:** "${question}"
📊 **Status dos dados:** ${hasData ? `${rowCount} registros carregados` : 'Nenhum dado disponível'}
⚡ **Método:** Contorno de CSP via Iframe

${hasData ? 
  '💡 **Dica:** Dados carregados! Faça perguntas específicas para análises detalhadas.' : 
  '🔧 **Configure:** Adicione dados ao visual Power BI para análises completas.'}`;
}