// netlify/functions/storage-bridge.js
// Bridge para simular storage temporário

const responses = new Map(); // Em produção seria Redis/Database

exports.handler = async (event, context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    if (event.httpMethod === 'POST') {
      // Armazenar resposta
      const { action, sessionId, data } = JSON.parse(event.body);
      
      if (action === 'store') {
        responses.set(sessionId, {
          ...data,
          storedAt: new Date().toISOString()
        });
        
        console.log('📦 Resposta armazenada:', sessionId);
        
        // Auto-cleanup após 5 minutos
        setTimeout(() => {
          responses.delete(sessionId);
          console.log('🗑️ Sessão limpa:', sessionId);
        }, 5 * 60 * 1000);
        
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ stored: true, sessionId })
        };
      }
    }
    
    if (event.httpMethod === 'GET') {
      // Recuperar resposta
      const sessionId = event.queryStringParameters?.session;
      
      if (!sessionId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Session ID required' })
        };
      }
      
      const response = responses.get(sessionId);
      
      if (response) {
        // Remove após recuperar
        responses.delete(sessionId);
        
        console.log('📤 Resposta recuperada:', sessionId);
        
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            found: true,
            data: response
          })
        };
      } else {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            found: false,
            sessionId,
            waiting: true
          })
        };
      }
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('❌ Storage bridge error:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Internal error',
        details: error.message 
      })
    };
  }
};