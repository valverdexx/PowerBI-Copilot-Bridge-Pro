// src/chartGenerator.ts
// 🎨 GERADOR DE GRÁFICOS SIMPLIFICADO (SEM ERROS)

export interface ChartConfig {
    type: 'bar' | 'line' | 'pie' | 'scatter';
    data: any[];
    theme: 'light' | 'dark' | 'powerbi';
    animation: boolean;
    interactive: boolean;
}

export interface AIInsight {
    type: 'trend' | 'outlier' | 'recommendation';
    message: string;
    confidence: number;
}

export class IntelligentChartGenerator {
    private container: HTMLElement;
    private insights: AIInsight[] = [];

    constructor(container: HTMLElement) {
        this.container = container;
    }

    // 🧠 ANÁLISE BÁSICA DOS DADOS
    public analyzeDataAndSuggestChart(data: any[]): ChartConfig {
        if (!data || data.length === 0) {
            return this.getDefaultConfig();
        }

        const columns = Object.keys(data[0]);
        const numericColumns = this.getNumericColumns(data, columns);
        const categoricalColumns = this.getCategoricalColumns(data, columns);

        // 🎯 SUGESTÃO SIMPLES
        let suggestedType: ChartConfig['type'] = 'bar';
        
        if (categoricalColumns.length === 1 && numericColumns.length === 1) {
            if (data.length <= 10) {
                suggestedType = 'pie';
                this.insights.push({
                    type: 'recommendation',
                    message: '🥧 Poucas categorias - gráfico de pizza recomendado',
                    confidence: 0.8
                });
            } else {
                suggestedType = 'bar';
            }
        } else if (numericColumns.length >= 2) {
            suggestedType = 'scatter';
            this.insights.push({
                type: 'trend',
                message: '🔍 Múltiplas variáveis numéricas detectadas',
                confidence: 0.7
            });
        }

        return {
            type: suggestedType,
            data: data,
            theme: 'powerbi',
            animation: true,
            interactive: true
        };
    }

    // 🎨 GERAÇÃO BÁSICA DE GRÁFICO
    public async generateChart(config: ChartConfig): Promise<HTMLElement> {
        this.container.innerHTML = '';
        
        const chartContainer = document.createElement('div');
        chartContainer.className = 'simple-chart-container';
        
        // Header simples
        const header = document.createElement('div');
        header.className = 'chart-header';
        header.innerHTML = `
            <h3>${this.getChartIcon(config.type)} ${this.getChartName(config.type)}</h3>
            <span class="chart-badge">IA</span>
        `;
        
        // Conteúdo do gráfico (placeholder)
        const content = document.createElement('div');
        content.className = 'chart-content';
        content.innerHTML = `
            <div class="chart-placeholder">
                <div class="chart-icon">${this.getChartIcon(config.type)}</div>
                <p><strong>${this.getChartName(config.type)}</strong></p>
                <p>Dados: ${config.data.length} registros</p>
                <p>Tema: ${config.theme}</p>
                ${config.animation ? '<p>✨ Animações ativadas</p>' : ''}
                ${config.interactive ? '<p>🎯 Modo interativo</p>' : ''}
            </div>
        `;

        // Insights
        if (this.insights.length > 0) {
            const insightsDiv = document.createElement('div');
            insightsDiv.className = 'chart-insights';
            insightsDiv.innerHTML = `
                <h4>💡 Insights</h4>
                ${this.insights.map(insight => `
                    <div class="insight-item">
                        <span>${insight.message}</span>
                        <span class="confidence">${Math.round(insight.confidence * 100)}%</span>
                    </div>
                `).join('')}
            `;
            content.appendChild(insightsDiv);
        }

        chartContainer.appendChild(header);
        chartContainer.appendChild(content);
        this.container.appendChild(chartContainer);
        
        return chartContainer;
    }

    // 🔧 MÉTODOS AUXILIARES
    private getNumericColumns(data: any[], columns: string[]): string[] {
        return columns.filter(col => 
            typeof data[0][col] === 'number' && !isNaN(data[0][col])
        );
    }

    private getCategoricalColumns(data: any[], columns: string[]): string[] {
        return columns.filter(col => typeof data[0][col] === 'string');
    }

    private getChartIcon(type: string): string {
        const icons = { 
            bar: '📊', 
            line: '📈', 
            pie: '🥧', 
            scatter: '🔍' 
        };
        return icons[type] || '📊';
    }

    private getChartName(type: string): string {
        const names = { 
            bar: 'Gráfico de Barras', 
            line: 'Gráfico de Linha', 
            pie: 'Gráfico de Pizza', 
            scatter: 'Gráfico de Dispersão'
        };
        return names[type] || 'Gráfico';
    }

    private getDefaultConfig(): ChartConfig {
        return {
            type: 'bar',
            data: [],
            theme: 'powerbi',
            animation: true,
            interactive: true
        };
    }
}