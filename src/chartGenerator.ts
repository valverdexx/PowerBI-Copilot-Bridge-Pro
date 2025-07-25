// src/chartGenerator.ts
// 🚀 GERADOR DE GRÁFICOS COM IA E RECURSOS INOVADORES

import * as d3 from 'd3';

export interface ChartConfig {
    type: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap' | 'treemap' | 'sankey';
    data: any[];
    theme: 'light' | 'dark' | 'powerbi' | 'rainbow';
    animation: boolean;
    interactive: boolean;
    insights: boolean;
}

export interface AIInsight {
    type: 'trend' | 'outlier' | 'correlation' | 'seasonal' | 'recommendation';
    message: string;
    confidence: number;
    action?: string;
}

export class IntelligentChartGenerator {
    private container: HTMLElement;
    private currentChart: any = null;
    private insights: AIInsight[] = [];

    constructor(container: HTMLElement) {
        this.container = container;
    }

    // 🧠 ANÁLISE INTELIGENTE DOS DADOS
    public analyzeDataAndSuggestChart(data: any[]): ChartConfig {
        if (!data || data.length === 0) {
            return this.getDefaultConfig();
        }

        const columns = Object.keys(data[0]);
        const numericColumns = this.getNumericColumns(data, columns);
        const categoricalColumns = this.getCategoricalColumns(data, columns);
        const dateColumns = this.getDateColumns(data, columns);

        // 🎯 LÓGICA DE SUGESTÃO INTELIGENTE
        let suggestedType: ChartConfig['type'] = 'bar';
        
        if (dateColumns.length > 0 && numericColumns.length > 0) {
            suggestedType = 'line'; // Série temporal
            this.insights.push({
                type: 'recommendation',
                message: '📈 Detectei dados temporais - gráfico de linha recomendado para tendências',
                confidence: 0.9
            });
        } else if (categoricalColumns.length === 1 && numericColumns.length === 1) {
            if (data.length <= 10) {
                suggestedType = 'pie'; // Poucas categorias
                this.insights.push({
                    type: 'recommendation',
                    message: '🥧 Poucas categorias detectadas - gráfico de pizza ideal para proporções',
                    confidence: 0.8
                });
            } else {
                suggestedType = 'bar'; // Muitas categorias
            }
        } else if (numericColumns.length >= 2) {
            suggestedType = 'scatter'; // Correlação
            this.insights.push({
                type: 'correlation',
                message: '🔍 Múltiplas variáveis numéricas - scatter plot para análise de correlação',
                confidence: 0.7
            });
        }

        return {
            type: suggestedType,
            data: data,
            theme: 'powerbi',
            animation: true,
            interactive: true,
            insights: true
        };
    }

    // 🎨 GERAÇÃO DE GRÁFICO COM IA
    public async generateIntelligentChart(config: ChartConfig): Promise<HTMLElement> {
        // Limpa gráfico anterior
        this.container.innerHTML = '';
        
        // Cria container do gráfico
        const chartContainer = document.createElement('div');
        chartContainer.className = 'intelligent-chart-container';
        
        // Header com insights
        const header = this.createChartHeader(config);
        chartContainer.appendChild(header);
        
        // Gráfico principal
        const chartElement = await this.createChart(config);
        chartContainer.appendChild(chartElement);
        
        // Painel de insights
        const insightsPanel = this.createInsightsPanel();
        chartContainer.appendChild(insightsPanel);
        
        // Controles interativos
        const controls = this.createInteractiveControls(config);
        chartContainer.appendChild(controls);
        
        this.container.appendChild(chartContainer);
        
        // Aplica animações
        if (config.animation) {
            this.animateChart(chartElement);
        }
        
        return chartContainer;
    }

    // 📊 CRIAÇÃO DE GRÁFICOS ESPECÍFICOS
    private async createChart(config: ChartConfig): Promise<HTMLElement> {
        const chartDiv = document.createElement('div');
        chartDiv.className = `chart-${config.type}`;
        
        switch (config.type) {
            case 'bar':
                return this.createAnimatedBarChart(config, chartDiv);
            case 'line':
                return this.createSmartLineChart(config, chartDiv);
            case 'pie':
                return this.createInteractivePieChart(config, chartDiv);
            case 'scatter':
                return this.createCorrelationScatter(config, chartDiv);
            case 'heatmap':
                return this.createDataHeatmap(config, chartDiv);
            default:
                return this.createAnimatedBarChart(config, chartDiv);
        }
    }

    // 📊 GRÁFICO DE BARRAS ANIMADO
    private createAnimatedBarChart(config: ChartConfig, container: HTMLElement): HTMLElement {
        const width = 400;
        const height = 300;
        const margin = { top: 20, right: 30, bottom: 40, left: 90 };

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const data = config.data.slice(0, 10); // Máximo 10 itens
        const keys = Object.keys(data[0] || {});
        const xKey = keys.find(k => typeof data[0][k] === 'string') || keys[0];
        const yKey = keys.find(k => typeof data[0][k] === 'number') || keys[1];

        const x = d3.scaleBand()
            .domain(data.map(d => d[xKey]))
            .range([margin.left, width - margin.right])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d[yKey]) || 0])
            .range([height - margin.bottom, margin.top]);

        // Gradiente para barras
        const gradient = svg.append('defs')
            .append('linearGradient')
            .attr('id', 'barGradient')
            .attr('gradientUnits', 'userSpaceOnUse')
            .attr('x1', 0).attr('y1', height)
            .attr('x2', 0).attr('y2', 0);

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#667eea');

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#764ba2');

        // Barras com animação
        svg.selectAll('.bar')
            .data(data)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d[xKey]) || 0)
            .attr('y', height - margin.bottom)
            .attr('width', x.bandwidth())
            .attr('height', 0)
            .attr('fill', 'url(#barGradient)')
            .attr('rx', 4)
            .transition()
            .duration(1000)
            .ease(d3.easeElastic)
            .attr('y', d => y(d[yKey]))
            .attr('height', d => y(0) - y(d[yKey]));

        // Eixos
        svg.append('g')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('font-size', '12px')
            .attr('fill', '#4a5568');

        svg.append('g')
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y))
            .selectAll('text')
            .style('font-size', '12px')
            .attr('fill', '#4a5568');

        // Tooltip interativo
        if (config.interactive) {
            this.addInteractiveTooltip(svg, data, xKey, yKey);
        }

        return container;
    }

    // 📈 GRÁFICO DE LINHA INTELIGENTE
    private createSmartLineChart(config: ChartConfig, container: HTMLElement): HTMLElement {
        // Implementação similar ao bar chart, mas com linha e detecção de tendências
        const width = 400;
        const height = 300;
        const margin = { top: 20, right: 30, bottom: 40, left: 50 };

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Detecção automática de tendência
        const trend = this.detectTrend(config.data);
        if (trend) {
            this.insights.push({
                type: 'trend',
                message: `📊 Tendência ${trend.direction}: ${trend.strength}% de correlação`,
                confidence: trend.strength / 100
            });
        }

        return container;
    }

    // 🎯 HEADER DO GRÁFICO
    private createChartHeader(config: ChartConfig): HTMLElement {
        const header = document.createElement('div');
        header.className = 'chart-header-pro';
        
        header.innerHTML = `
            <div class="chart-title">
                <span class="chart-icon">${this.getChartIcon(config.type)}</span>
                <span class="chart-name">${this.getChartName(config.type)}</span>
                <span class="chart-badge">IA</span>
            </div>
            <div class="chart-actions">
                <button class="chart-btn" data-action="refresh">🔄</button>
                <button class="chart-btn" data-action="fullscreen">🔍</button>
                <button class="chart-btn" data-action="export">💾</button>
                <button class="chart-btn" data-action="insights">💡</button>
            </div>
        `;

        // Eventos dos botões
        header.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = (e.target as HTMLElement).dataset.action;
                this.handleChartAction(action, config);
            });
        });

        return header;
    }

    // 💡 PAINEL DE INSIGHTS
    private createInsightsPanel(): HTMLElement {
        const panel = document.createElement('div');
        panel.className = 'insights-panel-pro';
        
        if (this.insights.length === 0) {
            panel.innerHTML = `
                <div class="no-insights">
                    <span class="insight-icon">🤖</span>
                    <span>Analisando dados para gerar insights...</span>
                </div>
            `;
        } else {
            panel.innerHTML = `
                <div class="insights-header">
                    <span class="insights-title">💡 Insights Inteligentes</span>
                    <span class="insights-count">${this.insights.length}</span>
                </div>
                <div class="insights-list">
                    ${this.insights.map(insight => `
                        <div class="insight-item ${insight.type}">
                            <div class="insight-content">
                                <span class="insight-message">${insight.message}</span>
                                <div class="insight-confidence">
                                    <span>Confiança: ${Math.round(insight.confidence * 100)}%</span>
                                    <div class="confidence-bar">
                                        <div class="confidence-fill" style="width: ${insight.confidence * 100}%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        return panel;
    }

    // 🎛️ CONTROLES INTERATIVOS
    private createInteractiveControls(config: ChartConfig): HTMLElement {
        const controls = document.createElement('div');
        controls.className = 'chart-controls-pro';
        
        controls.innerHTML = `
            <div class="controls-section">
                <label class="control-label">Tipo de Gráfico:</label>
                <select class="chart-type-select">
                    <option value="bar" ${config.type === 'bar' ? 'selected' : ''}>📊 Barras</option>
                    <option value="line" ${config.type === 'line' ? 'selected' : ''}>📈 Linha</option>
                    <option value="pie" ${config.type === 'pie' ? 'selected' : ''}>🥧 Pizza</option>
                    <option value="scatter" ${config.type === 'scatter' ? 'selected' : ''}>🔍 Dispersão</option>
                </select>
            </div>
            <div class="controls-section">
                <label class="control-label">Tema:</label>
                <select class="chart-theme-select">
                    <option value="powerbi" ${config.theme === 'powerbi' ? 'selected' : ''}>🎨 Power BI</option>
                    <option value="dark" ${config.theme === 'dark' ? 'selected' : ''}>🌙 Escuro</option>
                    <option value="light" ${config.theme === 'light' ? 'selected' : ''}>☀️ Claro</option>
                    <option value="rainbow" ${config.theme === 'rainbow' ? 'selected' : ''}>🌈 Arco-íris</option>
                </select>
            </div>
            <div class="controls-section">
                <label class="control-checkbox">
                    <input type="checkbox" ${config.animation ? 'checked' : ''} class="animation-toggle">
                    <span>✨ Animações</span>
                </label>
                <label class="control-checkbox">
                    <input type="checkbox" ${config.interactive ? 'checked' : ''} class="interactive-toggle">
                    <span>🎯 Interativo</span>
                </label>
            </div>
        `;

        // Eventos dos controles
        this.setupControlEvents(controls, config);

        return controls;
    }

    // 🎬 ANIMAÇÕES DE GRÁFICO
    private animateChart(chartElement: HTMLElement): void {
        chartElement.style.opacity = '0';
        chartElement.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            chartElement.style.transition = 'all 0.6s ease-out';
            chartElement.style.opacity = '1';
            chartElement.style.transform = 'translateY(0)';
        }, 100);
    }

    // 🔍 DETECÇÃO DE TENDÊNCIAS
    private detectTrend(data: any[]): { direction: string; strength: number } | null {
        if (data.length < 3) return null;

        // Implementação simplificada de detecção de tendência linear
        const numericColumns = this.getNumericColumns(data, Object.keys(data[0]));
        if (numericColumns.length === 0) return null;

        const values = data.map(d => d[numericColumns[0]]);
        const n = values.length;
        const indices = Array.from({length: n}, (_, i) => i);

        // Correlação simples
        const correlation = this.calculateCorrelation(indices, values);
        
        return {
            direction: correlation > 0 ? 'crescente' : 'decrescente',
            strength: Math.abs(correlation) * 100
        };
    }

    // 📊 UTILITÁRIOS
    private getNumericColumns(data: any[], columns: string[]): string[] {
        return columns.filter(col => 
            typeof data[0][col] === 'number' && !isNaN(data[0][col])
        );
    }

    private getCategoricalColumns(data: any[], columns: string[]): string[] {
        return columns.filter(col => typeof data[0][col] === 'string');
    }

    private getDateColumns(data: any[], columns: string[]): string[] {
        return columns.filter(col => {
            const value = data[0][col];
            return value instanceof Date || 
                   (typeof value === 'string' && !isNaN(Date.parse(value)));
        });
    }

    private calculateCorrelation(x: number[], y: number[]): number {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        return denominator === 0 ? 0 : numerator / denominator;
    }

    private getChartIcon(type: string): string {
        const icons = { bar: '📊', line: '📈', pie: '🥧', scatter: '🔍', heatmap: '🌡️' };
        return icons[type] || '📊';
    }

    private getChartName(type: string): string {
        const names = { 
            bar: 'Gráfico de Barras', 
            line: 'Gráfico de Linha', 
            pie: 'Gráfico de Pizza', 
            scatter: 'Gráfico de Dispersão',
            heatmap: 'Mapa de Calor'
        };
        return names[type] || 'Gráfico';
    }

    private getDefaultConfig(): ChartConfig {
        return {
            type: 'bar',
            data: [],
            theme: 'powerbi',
            animation: true,
            interactive: true,
            insights: true
        };
    }

    private addInteractiveTooltip(svg: any, data: any[], xKey: string, yKey: string): void {
        // Implementação de tooltip interativo com D3.js
        const tooltip = d3.select('body').append('div')
            .attr('class', 'chart-tooltip')
            .style('opacity', 0);

        svg.selectAll('.bar')
            .on('mouseover', (event: any, d: any) => {
                tooltip.transition().duration(200).style('opacity', .9);
                tooltip.html(`<strong>${d[xKey]}</strong><br/>${yKey}: ${d[yKey]}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                tooltip.transition().duration(500).style('opacity', 0);
            });
    }

    private setupControlEvents(controls: HTMLElement, config: ChartConfig): void {
        // Implementação dos eventos dos controles
        controls.querySelector('.chart-type-select')?.addEventListener('change', (e) => {
            const newType = (e.target as HTMLSelectElement).value as ChartConfig['type'];
            config.type = newType;
            this.generateIntelligentChart(config);
        });

        // Outros eventos...
    }

    private handleChartAction(action: string | undefined, config: ChartConfig): void {
        switch (action) {
            case 'refresh':
                this.generateIntelligentChart(config);
                break;
            case 'export':
                this.exportChart();
                break;
            case 'fullscreen':
                this.toggleFullscreen();
                break;
            case 'insights':
                this.showInsights();
                break;
        }
    }

    private exportChart(): void {
        // Implementação de exportação
        console.log('Exportando gráfico...');
    }

    private toggleFullscreen(): void {
        // Implementação de tela cheia
        console.log('Toggle fullscreen...');
    }

    private showInsights(): void {
        // Implementação de exibição de insights
        console.log('Mostrando insights...');
    }
}