// src/errorHandler.ts
// 🔍 SISTEMA DE DEBUG VISUAL AVANÇADO COM DETECÇÃO INTELIGENTE DE ERROS

export interface ErrorDetails {
    code: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    solution: string;
    category: 'network' | 'cors' | 'auth' | 'data' | 'config' | 'unknown';
    timestamp: Date;
    context?: any;
}

export interface DebugInfo {
    environment: 'development' | 'production' | 'powerbi-service';
    browser: string;
    powerbiVersion: string;
    visualVersion: string;
    networkStatus: 'online' | 'offline' | 'limited';
    corsSupport: boolean;
    fetchSupport: boolean;
    websocketSupport: boolean;
}

export class AdvancedErrorHandler {
    private errorHistory: ErrorDetails[] = [];
    private debugPanel: HTMLElement | null = null;
    private isDebugMode: boolean = false;

    constructor() {
        this.detectEnvironment();
        this.setupGlobalErrorHandling();
    }

    // 🔍 DETECÇÃO AUTOMÁTICA DE ERROS COMUNS
    public analyzeError(error: Error, context?: any): ErrorDetails {
        const errorMessage = error.message.toLowerCase();
        let errorDetails: ErrorDetails;

        // 🚫 ERROS DE CORS
        if (this.isCorsError(errorMessage)) {
            errorDetails = {
                code: 'CORS_BLOCKED',
                message: 'Bloqueio CORS detectado',
                severity: 'high',
                solution: 'Usando método JSONP ou Iframe como alternativa',
                category: 'cors',
                timestamp: new Date(),
                context
            };
        }
        // 🔒 ERROS DE CSP (Content Security Policy)
        else if (this.isCspError(errorMessage)) {
            errorDetails = {
                code: 'CSP_VIOLATION',
                message: 'Violação de Content Security Policy',
                severity: 'high',
                solution: 'Tentando método Iframe para contornar CSP',
                category: 'cors',
                timestamp: new Date(),
                context
            };
        }
        // 📡 ERROS DE REDE
        else if (this.isNetworkError(errorMessage)) {
            errorDetails = {
                code: 'NETWORK_ERROR',
                message: 'Erro de conectividade',
                severity: 'medium',
                solution: 'Verificando conexão e tentando novamente',
                category: 'network',
                timestamp: new Date(),
                context
            };
        }
        // ⏰ ERROS DE TIMEOUT
        else if (this.isTimeoutError(errorMessage)) {
            errorDetails = {
                code: 'TIMEOUT_ERROR',
                message: 'Timeout na comunicação',
                severity: 'medium',
                solution: 'Reduzindo timeout e usando fallback',
                category: 'network',
                timestamp: new Date(),
                context
            };
        }
        // 🔑 ERROS DE AUTENTICAÇÃO
        else if (this.isAuthError(errorMessage)) {
            errorDetails = {
                code: 'AUTH_ERROR',
                message: 'Erro de autenticação Copilot',
                severity: 'critical',
                solution: 'Verifique COPILOT_SECRET nas variáveis de ambiente',
                category: 'auth',
                timestamp: new Date(),
                context
            };
        }
        // 📊 ERROS DE DADOS
        else if (this.isDataError(errorMessage)) {
            errorDetails = {
                code: 'DATA_ERROR',
                message: 'Erro no processamento de dados',
                severity: 'low',
                solution: 'Verificando formato dos dados do Power BI',
                category: 'data',
                timestamp: new Date(),
                context
            };
        }
        // ❓ ERRO DESCONHECIDO
        else {
            errorDetails = {
                code: 'UNKNOWN_ERROR',
                message: error.message,
                severity: 'medium',
                solution: 'Ativando modo de recuperação automática',
                category: 'unknown',
                timestamp: new Date(),
                context
            };
        }

        this.logError(errorDetails);
        return errorDetails;
    }

    // 🎨 PAINEL DE DEBUG VISUAL
    public createDebugPanel(): HTMLElement {
        if (this.debugPanel) {
            return this.debugPanel;
        }

        const panel = document.createElement('div');
        panel.className = 'debug-panel-pro';
        panel.innerHTML = `
            <div class="debug-header">
                <span class="debug-title">🔍 Debug Console Pro</span>
                <div class="debug-controls">
                    <button id="clearDebug" class="debug-btn clear">🗑️ Limpar</button>
                    <button id="exportDebug" class="debug-btn export">📄 Exportar</button>
                    <button id="toggleDebug" class="debug-btn toggle">👁️ Ocultar</button>
                </div>
            </div>
            <div class="debug-content">
                <div class="debug-tabs">
                    <button class="debug-tab active" data-tab="errors">❌ Erros</button>
                    <button class="debug-tab" data-tab="network">📡 Rede</button>
                    <button class="debug-tab" data-tab="data">📊 Dados</button>
                    <button class="debug-tab" data-tab="performance">⚡ Performance</button>
                </div>
                <div class="debug-tab-content">
                    <div id="debug-errors" class="debug-section active"></div>
                    <div id="debug-network" class="debug-section"></div>
                    <div id="debug-data" class="debug-section"></div>
                    <div id="debug-performance" class="debug-section"></div>
                </div>
            </div>
        `;

        this.setupDebugPanelEvents(panel);
        this.debugPanel = panel;
        
        return panel;
    }

    // 📊 MONITORAMENTO EM TEMPO REAL
    public startRealTimeMonitoring(): void {
        setInterval(() => {
            this.updateNetworkStatus();
            this.updatePerformanceMetrics();
        }, 5000);
    }

    // 🚨 LOG DE ERRO COM CLASSIFICAÇÃO
    private logError(error: ErrorDetails): void {
        this.errorHistory.push(error);
        
        // Mantém apenas os últimos 50 erros
        if (this.errorHistory.length > 50) {
            this.errorHistory = this.errorHistory.slice(-50);
        }

        this.updateDebugPanel();
        
        // Console com cores
        const style = this.getConsoleStyle(error.severity);
        console.group(`%c🔍 ${error.code}`, style);
        console.log('Mensagem:', error.message);
        console.log('Solução:', error.solution);
        console.log('Categoria:', error.category);
        console.log('Contexto:', error.context);
        console.groupEnd();
    }

    // 🎨 ESTILOS PARA CONSOLE
    private getConsoleStyle(severity: string): string {
        const styles = {
            low: 'color: #48bb78; font-weight: bold',
            medium: 'color: #ed8936; font-weight: bold',
            high: 'color: #f56565; font-weight: bold',
            critical: 'color: #e53e3e; font-weight: bold; font-size: 14px'
        };
        return styles[severity] || styles.medium;
    }

    // 🔍 DETECÇÃO DE TIPOS DE ERRO
    private isCorsError(message: string): boolean {
        return message.includes('cors') || 
               message.includes('cross-origin') || 
               message.includes('access-control-allow-origin');
    }

    private isCspError(message: string): boolean {
        return message.includes('content security policy') ||
               message.includes('unsafe-inline') ||
               message.includes('unsafe-eval') ||
               message.includes('violates the following content security policy');
    }

    private isNetworkError(message: string): boolean {
        return message.includes('network') ||
               message.includes('fetch') ||
               message.includes('connection') ||
               message.includes('offline');
    }

    private isTimeoutError(message: string): boolean {
        return message.includes('timeout') ||
               message.includes('timed out') ||
               message.includes('request timeout');
    }

    private isAuthError(message: string): boolean {
        return message.includes('unauthorized') ||
               message.includes('403') ||
               message.includes('401') ||
               message.includes('authentication');
    }

    private isDataError(message: string): boolean {
        return message.includes('json') ||
               message.includes('parse') ||
               message.includes('data') ||
               message.includes('undefined');
    }

    // 🌍 DETECÇÃO DE AMBIENTE
    private detectEnvironment(): void {
        const userAgent = navigator.userAgent;
        const hostname = window.location.hostname;
        
        if (hostname.includes('app.powerbi.com')) {
            this.isDebugMode = false; // Produção Power BI
        } else if (hostname.includes('localhost')) {
            this.isDebugMode = true; // Desenvolvimento
        }
    }

    // 📡 MONITORAMENTO DE REDE
    private updateNetworkStatus(): void {
        const networkSection = document.getElementById('debug-network');
        if (!networkSection) return;

        const status = navigator.onLine ? 'online' : 'offline';
        const timestamp = new Date().toLocaleTimeString();
        
        networkSection.innerHTML += `
            <div class="debug-entry network-${status}">
                <span class="debug-time">${timestamp}</span>
                <span class="debug-status">📡 Status: ${status}</span>
            </div>
        `;
    }

    // ⚡ MÉTRICAS DE PERFORMANCE
    private updatePerformanceMetrics(): void {
        const perfSection = document.getElementById('debug-performance');
        if (!perfSection) return;

        const memory = (performance as any).memory;
        const timestamp = new Date().toLocaleTimeString();
        
        if (memory) {
            perfSection.innerHTML += `
                <div class="debug-entry performance">
                    <span class="debug-time">${timestamp}</span>
                    <span class="debug-metric">🧠 Memória: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB</span>
                </div>
            `;
        }
    }

    // 🎛️ CONFIGURAÇÃO DE EVENTOS DO PAINEL
    private setupDebugPanelEvents(panel: HTMLElement): void {
        // Tabs
        panel.querySelectorAll('.debug-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const tabName = target.dataset.tab;
                
                // Remove active de todas as tabs
                panel.querySelectorAll('.debug-tab').forEach(t => t.classList.remove('active'));
                panel.querySelectorAll('.debug-section').forEach(s => s.classList.remove('active'));
                
                // Adiciona active na tab clicada
                target.classList.add('active');
                panel.querySelector(`#debug-${tabName}`)?.classList.add('active');
            });
        });

        // Botões de controle
        panel.querySelector('#clearDebug')?.addEventListener('click', () => {
            this.clearDebugHistory();
        });

        panel.querySelector('#exportDebug')?.addEventListener('click', () => {
            this.exportDebugData();
        });

        panel.querySelector('#toggleDebug')?.addEventListener('click', () => {
            this.toggleDebugPanel();
        });
    }

    // 🗑️ LIMPEZA DO HISTÓRICO
    private clearDebugHistory(): void {
        this.errorHistory = [];
        this.updateDebugPanel();
    }

    // 📄 EXPORTAÇÃO DE DADOS
    private exportDebugData(): void {
        const debugData = {
            timestamp: new Date().toISOString(),
            errorHistory: this.errorHistory,
            environment: this.detectEnvironment(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        const blob = new Blob([JSON.stringify(debugData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `powerbi-debug-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // 👁️ TOGGLE DO PAINEL
    private toggleDebugPanel(): void {
        if (this.debugPanel) {
            const content = this.debugPanel.querySelector('.debug-content') as HTMLElement;
            const isVisible = content.style.display !== 'none';
            
            content.style.display = isVisible ? 'none' : 'block';
            
            const toggleBtn = this.debugPanel.querySelector('#toggleDebug') as HTMLElement;
            toggleBtn.textContent = isVisible ? '👁️ Mostrar' : '👁️ Ocultar';
        }
    }

    // 🔄 ATUALIZAÇÃO DO PAINEL
    private updateDebugPanel(): void {
        const errorsSection = document.getElementById('debug-errors');
        if (!errorsSection) return;

        errorsSection.innerHTML = this.errorHistory
            .slice(-20) // Últimos 20 erros
            .reverse()
            .map(error => `
                <div class="debug-entry error-${error.severity}">
                    <div class="debug-error-header">
                        <span class="debug-code">${error.code}</span>
                        <span class="debug-time">${error.timestamp.toLocaleTimeString()}</span>
                        <span class="debug-severity severity-${error.severity}">${error.severity.toUpperCase()}</span>
                    </div>
                    <div class="debug-error-message">${error.message}</div>
                    <div class="debug-error-solution">💡 ${error.solution}</div>
                </div>
            `).join('');
    }

    // ⚙️ CONFIGURAÇÃO GLOBAL DE ERROS
    private setupGlobalErrorHandling(): void {
        window.addEventListener('error', (event) => {
            this.analyzeError(new Error(event.message), {
                filename: event.filename,
                line: event.lineno,
                column: event.colno
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.analyzeError(new Error(event.reason), {
                type: 'unhandled_promise_rejection'
            });
        });
    }
}

// 🔍 INSTÂNCIA GLOBAL
export const errorHandler = new AdvancedErrorHandler();