// netlify/functions/health-check.js
// 🩺 MONITORAMENTO DE SAÚDE SIMPLIFICADO

exports.handler = async (event, context) => {
  const startTime = Date.now();
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  try {
    console.log('🩺 Health check iniciado');

    // 🔍 VERIFICAÇÕES BÁSICAS
    const copilotSecret = process.env.COPILOT_SECRET;
    const memoryUsage = process.memoryUsage();
    const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    
    // 🧪 TESTE RÁPIDO DO COPILOT
    let copilotStatus = 'unknown';
    if (copilotSecret) {
      try {
        const testResponse = await fetch('https://directline.botframework.com/v3/directline/conversations', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${copilotSecret}` },
          timeout: 3000
        });
        copilotStatus = testResponse.ok ? 'connected' : 'error';
      } catch (e) {
        copilotStatus = 'timeout';
      }
    } else {
      copilotStatus = 'no_secret';
    }

    // 📊 STATUS GERAL
    const allTestsPassed = copilotSecret && copilotStatus === 'connected' && memoryMB < 128;
    
    const healthData = {
      status: allTestsPassed ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      executionTime: Date.now() - startTime,
      
      tests: {
        copilot_secret: !!copilotSecret,
        copilot_connection: copilotStatus === 'connected',
        memory_ok: memoryMB < 128,
        response_time_ok: (Date.now() - startTime) < 2000
      },
      
      metrics: {
        memory_mb: memoryMB,
        uptime_seconds: Math.round(process.uptime()),
        node_version: process.version,
        copilot_status: copilotStatus
      },
      
      functions: {
        available: [
          'chat (principal)',
          'chat-jsonp (backup 1)',
          'chat-iframe (backup 2)', 
          'chat-sse (backup 3)',
          'chat-pixel (backup 4)',
          'storage-bridge (auxiliar)',
          'debug (diagnóstico)',
          'health-check (este)'
        ],
        total_methods: 4
      }
    };

    console.log('✅ Health check concluído:', {
      status: healthData.status,
      copilotStatus,
      memoryMB,
      executionTime: Date.now() - startTime
    });

    return {
      statusCode: allTestsPassed ? 200 : 503,
      headers: corsHeaders,
      body: JSON.stringify(healthData, null, 2)
    };

  } catch (error) {
    console.error('❌ Health check error:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime
      }, null, 2)
    };
  }
};