// src/visual.ts - VISUAL HÍBRIDO COM MÚLTIPLOS MÉTODOS DE COMUNICAÇÃO
import "core-js/stable";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { VisualSettings } from "./settings";

interface CommunicationMethod {
    name: string;
    func: (question: string, context: any) => Promise<string>;
    priority: number;
    enabled: boolean;
}

export class Visual implements powerbi.extensibility.visual.IVisual {
    private target: HTMLElement;
    private host: powerbi.extensibility.visual.IVisualHost;
    private settings: VisualSettings;
    private formattingSettingsService: FormattingSettingsService;

    private chatContainer: HTMLElement;
    private dataContext: any = { hasData: false, rowCount: 0, columns: [], sampleData: [] };
    
    private baseUrl: string = '';
    private communicationMethods: CommunicationMethod[] = [];
    private lastUsedMethod: string = '';

    constructor(options: powerbi.extensibility.visual.VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();

        this.initializeCommunicationMethods();
        this.chatContainer = this.createAdvancedChatInterface();
        this.target.appendChild(this.chatContainer);
    }

    public update(options: powerbi.extensibility.visual.VisualUpdateOptions) {
        this.settings = this.formattingSettingsService.populateFormattingSettingsModel(VisualSettings, options.dataViews?.[0]);
        
        // Atualiza URL base das configurações
        this.baseUrl = this.settings.chatSettings.directLineSecret.value || 'https://copilotassistbi.netlify.app';
        
        if (options.dataViews?.[0]) {
            this.dataContext = this.processDataView(options.dataViews[0]);
            this.updateDataStatusMessage();
            this.updateMethodStatus();
        }
    }
    
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.settings);
    }

    private initializeCommunicationMethods() {
        this.communicationMethods = [
            {
                name: 'JSONP',
                func: this.sendViaJSONP.bind(this),
                priority: 1,
                enabled: true
            },
            {
                name: 'Iframe',
                func: this.sendViaIframe.bind(this),
                priority: 2,
                enabled: true
            },
            {
                name: 'SSE',
                func: this.sendViaSSE.bind(this),
                priority: 3,
                enabled: true
            },
            {
                name: 'Pixel',
                func: this.sendViaPixel.bind(this),
                priority: 4,
                enabled: true
            }
        ];
    }

    // MÉTODO 1: JSONP
    private async sendViaJSONP(question: string, context: any): Promise<string> {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            const callbackName = 'jsonp_callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const cleanup = () => {
                if (script.parentNode) {
                    document.head.removeChild(script);
                }
                delete (window as any)[callbackName];
            };

            const timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error('JSONP timeout após 15 segundos'));
            }, 15000);

            (window as any)[callbackName] = (data: any) => {
                clearTimeout(timeoutId);
                cleanup();
                
                if (data.error) {
                    reject(new Error(data.answer || 'Erro JSONP'));
                } else {
                    resolve(data.answer || 'Resposta JSONP recebida');
                }
            };

            const params = new URLSearchParams({
                callback: callbackName,
                question: question,
                hasData: context.hasData.toString(),
                rowCount: context.rowCount.toString(),
                context: JSON.stringify(context.sampleData || [])
            });

            script.src = `${this.baseUrl}/.netlify/functions/chat-jsonp?${params.toString()}`;
            script.onerror = () => {
                clearTimeout(timeoutId);
                cleanup();
                reject(new Error('Erro ao carregar script JSONP'));
            };

            document.head.appendChild(script);
        });
    }

    // MÉTODO 2: IFRAME + POSTMESSAGE
    private async sendViaIframe(question: string, context: any): Promise<string> {
        return new Promise((resolve, reject) => {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');

            const timeoutId = setTimeout(() => {
                window.removeEventListener('message', messageHandler);
                if (iframe.parentNode) {
                    document.body.removeChild(iframe);
                }
                reject(new Error('Iframe timeout após 15 segundos'));
            }, 15000);

            const messageHandler = (event: MessageEvent) => {
                if (!event.origin.includes(this.baseUrl.replace('https://', ''))) return;
                
                clearTimeout(timeoutId);
                window.removeEventListener('message', messageHandler);
                
                if (iframe.parentNode) {
                    document.body.removeChild(iframe);
                }
                
                if (event.data.error) {
                    reject(new Error(event.data.error));
                } else {
                    resolve(event.data.answer || 'Resposta iframe recebida');
                }
            };

            window.addEventListener('message', messageHandler);

            const params = new URLSearchParams({
                question: question,
                hasData: context.hasData.toString(),
                rowCount: context.rowCount.toString(),
                context: JSON.stringify(context.sampleData || [])
            });

            iframe.src = `${this.baseUrl}/.netlify/functions/chat-iframe?${params.toString()}`;
            iframe.onerror = () => {
                clearTimeout(timeoutId);
                window.removeEventListener('message', messageHandler);
                if (iframe.parentNode) {
                    document.body.removeChild(iframe);
                }
                reject(new Error('Erro ao carregar iframe'));
            };

            document.body.appendChild(iframe);
        });
    }

    // MÉTODO 3: SERVER-SENT EVENTS
    private async sendViaSSE(question: string, context: any): Promise<string> {
        return new Promise((resolve, reject) => {
            const params = new URLSearchParams({
                question: question,
                hasData: context.hasData.toString(),
                rowCount: context.rowCount.toString(),
                context: JSON.stringify(context.sampleData || [])
            });

            const eventSource = new EventSource(
                `${this.baseUrl}/.netlify/functions/chat-sse?${params.toString()}`
            );

            const timeoutId = setTimeout(() => {
                eventSource.close();
                reject(new Error('SSE timeout após 15 segundos'));
            }, 15000);

            eventSource.onmessage = (event) => {
                clearTimeout(timeoutId);
                
                try {
                    const data = JSON.parse(event.data);
                    eventSource.close();
                    
                    if (data.error) {
                        reject(new Error(data.answer || 'Erro SSE'));
                    } else {
                        resolve(data.answer || 'Resposta SSE recebida');
                    }
                } catch (e) {
                    eventSource.close();
                    reject(new Error('Erro ao parsear resposta SSE'));
                }
            };

            eventSource.onerror = () => {
                clearTimeout(timeoutId);
                eventSource.close();
                reject(new Error('Erro de conexão SSE'));
            };
        });
    }

    // MÉTODO 4: PIXEL TRACKING + POLLING
    private async sendViaPixel(question: string, context: any): Promise<string> {
        const sessionId = 'pbi_pixel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        return new Promise((resolve, reject) => {
            // Carrega pixel para iniciar processamento
            const img = new Image();
            const params = new URLSearchParams({
                session: sessionId,
                question: question,
                hasData: context.hasData.toString(),
                rowCount: context.rowCount.toString(),
                context: JSON.stringify(context.sampleData || [])
            });

            img.src = `${this.baseUrl}/.netlify/functions/chat-pixel?${params.toString()}`;

            // Polling para verificar resposta
            let attempts = 0;
            const maxAttempts = 15; // 15 tentativas x 1 segundo = 15 segundos

            const checkResponse = async () => {
                attempts++;
                
                if (attempts > maxAttempts) {
                    reject(new Error('Pixel timeout após 15 segundos'));
                    return;
                }

                try {
                    const response = await fetch(`${this.baseUrl}/.netlify/functions/storage-bridge?session=${sessionId}`);
                    const data = await response.json();
                    
                    if (data.found && data.data) {
                        if (data.data.error) {
                            reject(new Error(data.data.answer || 'Erro pixel'));
                        } else {
                            resolve(data.data.answer || 'Resposta pixel recebida');
                        }
                    } else {
                        // Continua polling
                        setTimeout(checkResponse, 1000);
                    }
                } catch (error) {
                    // Em caso de erro, continua tentando
                    setTimeout(checkResponse, 1000);
                }
            };

            // Inicia polling após 2 segundos
            setTimeout(checkResponse, 2000);
        });
    }

    // SISTEMA DE FALLBACK INTELIGENTE
    private async sendMessageWithFallback(question: string): Promise<string> {
        const enabledMethods = this.communicationMethods
            .filter(m => m.enabled)
            .sort((a, b) => a.priority - b.priority);

        let lastError: Error | null = null;

        for (const method of enabledMethods) {
            try {
                this.updateMethodStatus(`Tentando ${method.name}...`);
                
                const result = await Promise.race([
                    method.func(question, this.dataContext),
                    new Promise<string>((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout geral')), 16000)
                    )
                ]);

                this.lastUsedMethod = method.name;
                this.updateMethodStatus(`✅ Conectado via ${method.name}`);
                
                return result;
            } catch (error) {
                console.warn(`❌ Método ${method.name} falhou:`, error.message);
                lastError = error as Error;
                
                // Desabilita método que falhou por 30 segundos
                method.enabled = false;
                setTimeout(() => {
                    method.enabled = true;
                }, 30000);
            }
        }

        this.updateMethodStatus('❌ Todos os métodos falharam');
        throw new Error(`Comunicação falhou. Último erro: ${lastError?.message}`);
    }

    private createAdvancedChatInterface(): HTMLElement {
        const container = document.createElement('div');
        container.className = "chat-visual-container-pro";

        container.innerHTML = `
            <div class="chat-header-pro">
                <div class="header-title">
                    <span class="bot-icon">🤖</span>
                    <span>Assistente BI Pro</span>
                </div>
                <div class="status-indicators">
                    <span id="dataStatus" class="data-status">Sem dados</span>
                    <span id="methodStatus" class="method-status">Inicializando...</span>
                </div>
            </div>
            <div id="chatMessages" class="chat-messages-pro">
                <div class="chat-message bot">
                    <div class="message-content">
                        <strong>🚀 Sistema Multi-Método Iniciado!</strong><br>
                        Olá! Sou seu assistente de BI com conexão redundante ao Copilot Studio.<br>
                        <em>Métodos disponíveis: JSONP, Iframe, SSE, Pixel Tracking</em>
                    </div>
                    <div class="message-time">${new Date().toLocaleTimeString()}</div>
                </div>
            </div>
            <div class="chat-input-area-pro">
                <input type="text" id="chatInput" placeholder="Ex: Qual o total de vendas por médico?" />
                <button id="sendButton" class="send-button-pro" title="Enviar">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                </button>
            </div>
        `;

        const input = container.querySelector('#chatInput') as HTMLInputElement;
        const button = container.querySelector('#sendButton') as HTMLButtonElement;
        const messagesContainer = container.querySelector('#chatMessages') as HTMLElement;

        const handleSendMessage = async () => {
            const message = input.value.trim();
            if (!message) return;

            this.addMessageToChat(messagesContainer, message, 'user');
            input.value = '';
            this.setLoadingState(true);

            try {
                const response = await this.sendMessageWithFallback(message);
                this.addMessageToChat(messagesContainer, response, 'bot');
            } catch (error) {
                const errorMsg = `Erro de comunicação: ${error.message}\n\nDados disponíveis: ${this.dataContext.hasData ? `${this.dataContext.rowCount} registros` : 'Nenhum dado carregado'}`;
                this.addMessageToChat(messagesContainer, errorMsg, 'bot', true);
            }
            
            this.setLoadingState(false);
            input.focus();
        };

        button.addEventListener('click', handleSendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
            }
        });

        return container;
    }

    private addMessageToChat(container: HTMLElement, message: string, type: 'user' | 'bot', isError: boolean = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type} ${isError ? 'error' : ''}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (type === 'bot' && !isError) {
            // Formatação especial para respostas do bot
            contentDiv.innerHTML = message.replace(/\n/g, '<br>');
        } else {
            contentDiv.textContent = message;
        }
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = new Date().toLocaleTimeString();
        
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }

    private updateDataStatusMessage() {
        const statusEl = this.chatContainer.querySelector('#dataStatus') as HTMLElement;
        if (statusEl) {
            if (this.dataContext.hasData) {
                statusEl.textContent = `📊 ${this.dataContext.rowCount} registros`;
                statusEl.className = 'data-status loaded';
            } else {
                statusEl.textContent = '📭 Sem dados';
                statusEl.className = 'data-status empty';
            }
        }
    }

    private updateMethodStatus(status: string = '') {
        const statusEl = this.chatContainer.querySelector('#methodStatus') as HTMLElement;
        if (statusEl) {
            if (status) {
                statusEl.textContent = status;
            } else if (this.lastUsedMethod) {
                statusEl.textContent = `🔗 Via ${this.lastUsedMethod}`;
                statusEl.className = 'method-status connected';
            } else {
                statusEl.textContent = '🔄 Standby';
                statusEl.className = 'method-status standby';
            }
        }
    }
    
    private setLoadingState(isLoading: boolean) {
        const button = this.chatContainer.querySelector('#sendButton') as HTMLButtonElement;
        const input = this.chatContainer.querySelector('#chatInput') as HTMLInputElement;
        
        if (isLoading) {
            button.disabled = true;
            input.disabled = true;
            button.innerHTML = '<div class="loader-pro"></div>';
        } else {
            button.disabled = false;
            input.disabled = false;
            button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';
        }
    }

    private processDataView(dataView: powerbi.DataView): any {
        const context = { hasData: false, rowCount: 0, columns: [], sampleData: [] };
        
        if (!dataView?.categorical) return context;

        const categorical = dataView.categorical;
        const categories = categorical.categories || [];
        const values = categorical.values || [];
        
        const allColumns = [...categories, ...values];
        if (allColumns.length === 0) return context;
        
        context.hasData = true;
        context.columns = allColumns.map(col => ({ 
            name: col.source.displayName, 
            type: col.source.isMeasure ? 'medida' : 'categoria' 
        }));
        
        const rowCount = allColumns[0]?.values.length || 0;
        context.rowCount = rowCount;

        // Pega mais amostras para melhor contexto
        const sampleData = [];
        const sampleSize = Math.min(rowCount, 10);
        
        for (let i = 0; i < sampleSize; i++) {
            const row: any = {};
            allColumns.forEach(col => {
                row[col.source.displayName] = col.values[i];
            });
            sampleData.push(row);
        }
        context.sampleData = sampleData;
        
        return context;
    }
}