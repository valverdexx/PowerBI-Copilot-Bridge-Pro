// netlify/functions/health-check.js
// 🩺 MONITORAMENTO DE SAÚDE E STATUS EM TEMPO REAL

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

    // 🧪 TESTES DE FUNCIONALIDADE
    const healthTests = await runHealthTests();
    
    // 📊 MÉTRICAS DE SISTEMA
    const systemMetrics = gatherSystemMetrics();
    
    // 🔍 STATUS DETALHADO
    const detailedStatus = {
      timestamp: new Date().toISOString(),
      executionTime: Date.now() - startTime,
      
      // Status geral
      status: healthTests.allPassed ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      
      // Testes funcionais
      tests: healthTests,
      
      // Métricas de sistema
      metrics: systemMetrics,
      
      // Conectividade externa
      external: await testExternalConnectivity(),
      
      // Informações de deploy
      deployment: {
        netlifyUrl: process.env.URL || 'unknown',
        deployId: process.env.DEPLOY_ID || 'unknown',
        environment: process.env.NODE_ENV || 'production',
        nodeVersion: process.version,
        region: process.env.AWS_REGION || 'unknown'
      }
    };

    // 🚨 ALERTAS AUTOMÁTICOS
    const alerts = generateAlerts(detailedStatus);
    if (alerts.length > 0) {
      console.warn('🚨 Health check alertas:', alerts);
    }

    const response = {
      status: detailedStatus.status,
      summary: {
        allSystemsOperational: healthTests.allPassed,
        totalTests: healthTests.results.length,
        passedTests: healthTests.results.filter(r => r.passed).length,
        failedTests: healthTests.results.filter(r => !r.passed).length,
        responseTime: Date.now() - startTime
      },
      details: detailedStatus,
      alerts: alerts,
      recommendations: generateRecommendations(detailedStatus)
    };

    return {
      statusCode: healthTests.allPassed ? 200 : 503,
      headers: corsHeaders,
      body: JSON.stringify(response, null, 2)
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

// 🧪 EXECUTAR TESTES DE SAÚDE
async function runHealthTests() {
  const tests = [];
  
  // Teste 1: Variáveis de ambiente
  tests.push({
    name: 'Environment Variables',
    test: 'COPILOT_SECRET configured',
    passed: !!process.env.COPILOT_SECRET,
    details: process.env.COPILOT_SECRET ? 'Configured' : 'Missing COPILOT_SECRET'
  });

  // Teste 2: Conectividade Copilot
  let copilotTest = { name: 'Copilot Connectivity', test: 'Direct Line connection', passed: false, details: 'Not tested' };
  if (process.env.COPILOT_SECRET) {
    try {
      const response = await fetch('https://directline.botframework.com/v3/directline/conversations', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.COPILOT_SECRET}` },
        timeout: 5000
      });
      
      copilotTest.passed = response.ok;
      copilotTest.details = response.ok ? 
        `Connected (${response.status})` : 
        `Failed (${response.status})`;
    } catch (e) {
      copilotTest.details = `Connection error: ${e.message}`;
    }
  }
  tests.push(copilotTest);

  // Teste 3: Memória
  const memoryMB = process.memoryUsage().heapUsed / 1024 / 1024;
  tests.push({
    name: 'Memory Usage',
    test: 'Memory under 128MB',
    passed: memoryMB < 128,
    details: `${Math.round(memoryMB)}MB used`
  });

  // Teste 4: Tempo de resposta
  const responseTime = Date.now() - startTime;
  tests.push({
    name: 'Response Time',
    test: 'Response under 2 seconds',
    passed: responseTime < 2000,
    details: `${responseTime}ms`
  });

  return {
    allPassed: tests.every(t => t.passed),
    results: tests
  };
}

// 📊 COLETAR MÉTRICAS DO SISTEMA
function gatherSystemMetrics() {
  const memory = process.memoryUsage();
  
  return {
    memory: {
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
      external: Math.round(memory.external / 1024 / 1024),
      rss: Math.round(memory.rss / 1024 / 1024)
    },
    cpu: {
      uptime: Math.round(process.uptime()),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version
    },
    process: {
      pid: process.pid,
      ppid: process.ppid,
      cwd: process.cwd()
    }
  };
}

// 🌐 TESTAR CONECTIVIDADE EXTERNA
async function testExternalConnectivity() {
  const tests = {};
  
  // Teste Direct Line API
  try {
    const dlTest = await fetch('https://directline.botframework.com', {
      method: 'HEAD',
      timeout: 3000
    });
    tests.directLineApi = {
      available: dlTest.ok,
      status: dlTest.status,
      responseTime: 'measured'
    };
  } catch (e) {
    tests.directLineApi = {
      available: false,
      error: e.message
    };
  }

  // Teste conectividade geral
  try {
    const internetTest = await fetch('https://api.github.com', {
      method: 'HEAD',
      timeout: 3000
    });
    tests.internet = {
      available: internetTest.ok,
      status: internetTest.status
    };
  } catch (e) {
    tests.internet = {
      available: false,
      error: e.message
    };
  }

  return tests;
}

// 🚨 GERAR ALERTAS
function generateAlerts(status) {
  const alerts = [];
  
  // Alerta de memória alta
  if (status.metrics.memory.heapUsed > 100) {
    alerts.push({
      level: 'warning',
      message: `High memory usage: ${status.metrics.memory.heapUsed}MB`,
      action: 'Monitor memory consumption'
    });
  }

  // Alerta de Copilot desconectado
  const copilotTest = status.tests.results.find(r => r.name === 'Copilot Connectivity');
  if (copilotTest && !copilotTest.passed) {
    alerts.push({
      level: 'critical',
      message: 'Copilot connectivity failed',
      action: 'Check COPILOT_SECRET configuration'
    });
  }

  // Alerta de tempo de resposta alto
  if (status.executionTime > 5000) {
    alerts.push({
      level: 'warning',
      message: `Slow response time: ${status.executionTime}ms`,
      action: 'Investigate performance issues'
    });
  }

  return alerts;
}

// 💡 GERAR RECOMENDAÇÕES
function generateRecommendations(status) {
  const recommendations = [];
  
  if (!status.tests.allPassed) {
    recommendations.push('🔧 Address failed health checks immediately');
  }
  
  if (status.metrics.memory.heapUsed > 80) {
    recommendations.push('🧠 Consider optimizing memory usage');
  }
  
  if (status.metrics.cpu.uptime < 300) {
    recommendations.push('⏰ System recently restarted - monitor stability');
  }
  
  if (!status.external.directLineApi?.available) {
    recommendations.push('🌐 Check network connectivity to Direct Line API');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ All systems operating normally');
  }
  
  return recommendations;
}