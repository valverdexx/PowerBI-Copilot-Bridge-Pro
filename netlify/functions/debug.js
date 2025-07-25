// netlify/functions/debug.js
// 🔍 SISTEMA DE DEBUG AVANÇADO E MONITORAMENTO

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
    // 🔍 INFORMAÇÕES DO SISTEMA
    const copilotSecret = process.env.COPILOT_SECRET;
    const netlifyUrl = process.env.URL || 'URL não disponível';
    const deployId = process.env.DEPLOY_ID || 'Deploy ID não disponível';
    const deployUrl = process.env.DEPLOY_URL || 'Deploy URL não disponível';
    
    // 🧪 TESTE DE CONECTIVIDADE
    let copilotConnectivity = 'unknown';
    let copilotError = null;
    
    if (copilotSecret) {
      try {
        const testResponse = await fetch('https://directline.botframework.com/v3/directline/conversations', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${copilotSecret}` },
          timeout: 3000
        });
        
        copilotConnectivity = testResponse.ok ? 'connected' : `error_${testResponse.status}`;
        
        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          copilotError = errorText;
        }
      } catch (e) {
        copilotConnectivity = 'connection_failed';
        copilotError = e.message;
      }
    }

    // 📊 ESTATÍSTICAS DE PERFORMANCE
    const performanceStats = {
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      platform: process.platform,
      arch: process.arch
    };

    // 🔧 INFORMAÇÕES DE DEBUG DETALHADAS
    const debugInfo = {
      // Timestamp e performance
      timestamp: new Date().toISOString(),
      executionTime: Date.now() - startTime,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      
      // Configuração Netlify
      netlify: {
        url: netlifyUrl,
        deployId: deployId.substring(0, 8) + '...',
        deployUrl: deployUrl,
        environment: process.env.NODE_ENV || 'production',
        region: process.env.AWS_REGION || 'us-east-1'
      },
      
      // Configuração Copilot
      copilot: {
        hasSecret: !!copilotSecret,
        secretLength: copilotSecret ? copilotSecret.length : 0,
        secretPreview: copilotSecret ? `${copilotSecret.substring(0, 8)}...${copilotSecret.slice(-4)}` : 'NOT_SET',
        connectivity: copilotConnectivity,
        error: copilotError
      },
      
      // Performance
      performance: performanceStats,
      
      // Request info
      request: {
        method: event.httpMethod,
        headers: Object.keys(event.headers || {}).length,
        queryParams: Object.keys(event.queryStringParameters || {}),
        userAgent: event.headers?.['user-agent']?.substring(0, 100) || 'Unknown',
        ip: event.headers?.['x-forwarded-for'] || 'Unknown'
      },
      
      // Funções disponíveis
      functions: {
        available: [
          'chat (principal)',
          'chat-jsonp (backup 1)',
          'chat-iframe (backup 2)', 
          'chat-sse (backup 3)',
          'chat-pixel (backup 4)',
          'storage-bridge (auxiliar)',
          'debug (este)',
          'health-check (monitoramento)'
        ],
        totalMethods: 4,
        backupStrategies: [
          'JSONP - Bypass total CORS',
          'Iframe - Contorna CSP',
          'SSE - Streaming real-time',
          'Pixel - Mais resiliente'
        ]
      }
    };

    // 🎯 ANÁLISE DE SAÚDE DO SISTEMA
    const healthStatus = analyzeSystemHealth(debugInfo);

    const response = {
      status: 'debug_success',
      health: healthStatus,
      info: debugInfo,
      
      // 🔧 TROUBLESHOOTING AUTOMÁTICO
      troubleshooting: generateTroubleshootingTips(debugInfo),
      
      // 📋 TESTES DISPONÍVEIS
      availableTests: {
        copilot: `${netlifyUrl}/.netlify/functions/chat?question=teste&context=[]`,
        jsonp: `${netlifyUrl}/.netlify/functions/chat-jsonp?callback=test&question=teste`,
        iframe: `${netlifyUrl}/.netlify/functions/chat-iframe?question=teste`,
        sse: `${netlifyUrl}/.netlify/functions/chat-sse?question=teste`,
        pixel: `${netlifyUrl}/.netlify/functions/chat-pixel?session=test&question=teste`,
        storage: `${netlifyUrl}/.netlify/functions/storage-bridge?session=test`,
        health: `${netlifyUrl}/.netlify/functions/health-check`
      }
    };

    console.log('🔍 Debug executado:', {
      copilotStatus: copilotConnectivity,
      systemHealth: healthStatus.overall,
      executionTime: Date.now() - startTime
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(response, null, 2)
    };

  } catch (error) {
    console.error('❌ Erro na função debug:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        status: 'debug_error',
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime
      }, null, 2)
    };
  }
};

// 🩺 ANÁLISE DE SAÚDE DO SISTEMA
function analyzeSystemHealth(debugInfo) {
  const issues = [];
  let score = 100;

  // Verifica Copilot
  if (!debugInfo.copilot.hasSecret) {
    issues.push('❌ COPILOT_SECRET não configurada');
    score -= 30;
  } else if (debugInfo.copilot.connectivity !== 'connected') {
    issues.push(`⚠️ Copilot não conectado: ${debugInfo.copilot.connectivity}`);
    score -= 20;
  }

  // Verifica performance
  const memoryMB = debugInfo.performance.memoryUsage.heapUsed / 1024 / 1024;
  if (memoryMB > 100) {
    issues.push(`⚠️ Alto uso de memória: ${Math.round(memoryMB)}MB`);
    score -= 10;
  }

  // Verifica ambiente
  if (!debugInfo.netlify.url.includes('netlify.app')) {
    issues.push('⚠️ Ambiente não é Netlify padrão');
    score -= 5;
  }

  let healthLevel = 'excellent';
  if (score < 60) healthLevel = 'critical';
  else if (score < 80) healthLevel = 'warning';
  else if (score < 95) healthLevel = 'good';

  return {
    overall: healthLevel,
    score: score,
    issues: issues,
    recommendations: issues.length === 0 ? 
      ['✅ Sistema funcionando perfeitamente!'] : 
      generateHealthRecommendations(issues)
  };
}

// 💡 DICAS DE TROUBLESHOOTING
function generateTroubleshootingTips(debugInfo) {
  const tips = [];

  if (!debugInfo.copilot.hasSecret) {
    tips.push({
      issue: 'COPILOT_SECRET não configurada',
      solution: 'Configure a variável COPILOT_SECRET no painel Netlify com seu Direct Line Secret',
      priority: 'high'
    });
  }

  if (debugInfo.copilot.connectivity === 'connection_failed') {
    tips.push({
      issue: 'Falha de conexão com Copilot',
      solution: 'Verifique se o Direct Line Secret está correto e não expirado',
      priority: 'high'
    });
  }

  if (debugInfo.performance.memoryUsage.heapUsed > 100 * 1024 * 1024) {
    tips.push({
      issue: 'Alto uso de memória',
      solution: 'Considere otimizar o processamento de dados ou reiniciar deploy',
      priority: 'medium'
    });
  }

  return tips;
}

// 🎯 RECOMENDAÇÕES DE SAÚDE
function generateHealthRecommendations(issues) {
  const recommendations = [];

  issues.forEach(issue => {
    if (issue.includes('COPILOT_SECRET')) {
      recommendations.push('🔑 Configure COPILOT_SECRET nas variáveis de ambiente Netlify');
    }
    if (issue.includes('Copilot não conectado')) {
      recommendations.push('🔌 Teste a conectividade do Direct Line Secret');
    }
    if (issue.includes('memória')) {
      recommendations.push('🧠 Monitore uso de memória e otimize processamento');
    }
    if (issue.includes('ambiente')) {
      recommendations.push('🌍 Verifique configuração do ambiente Netlify');
    }
  });

  return recommendations;
}