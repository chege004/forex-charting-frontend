class ForexChart {
    constructor() {
        this.chartData = {};
        this.chartElement = document.getElementById('chart');
        this.initializeChart();
    }
    
    initializeChart() {
        const layout = {
            title: 'Forex Price Chart',
            xaxis: {
                title: 'Time',
                type: 'date'
            },
            yaxis: {
                title: 'Price',
                autorange: true
            },
            template: 'plotly_dark',
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)'
        };
        
        const config = {
            responsive: true,
            displayModeBar: true
        };
        
        Plotly.newPlot(this.chartElement, [], layout, config);
    }
    
    updateChart(pair, candleData) {
        if (!this.chartData[pair]) {
            this.chartData[pair] = {
                x: [],
                open: [],
                high: [],
                low: [],
                close: [],
                volume: []
            };
        }
        
        const pairData = this.chartData[pair];
        
        // Add new data point
        pairData.x.push(candleData.timestamp);
        pairData.open.push(candleData.open);
        pairData.high.push(candleData.high);
        pairData.low.push(candleData.low);
        pairData.close.push(candleData.close);
        pairData.volume.push(candleData.volume);
        
        // Keep only last 100 points
        if (pairData.x.length > 100) {
            pairData.x.shift();
            pairData.open.shift();
            pairData.high.shift();
            pairData.low.shift();
            pairData.close.shift();
            pairData.volume.shift();
        }
        
        this.renderChart(pair);
    }
    
    renderChart(pair) {
        const pairData = this.chartData[pair];
        
        const trace = {
            x: pairData.x,
            open: pairData.open,
            high: pairData.high,
            low: pairData.low,
            close: pairData.close,
            type: 'candlestick',
            name: pair,
            increasing: { line: { color: '#4CAF50' } },
            decreasing: { line: { color: '#f44336' } }
        };
        
        const layout = {
            title: `${pair} Price Chart`,
            xaxis: {
                title: 'Time',
                type: 'date'
            },
            yaxis: {
                title: 'Price',
                autorange: true
            },
            template: 'plotly_dark',
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)'
        };
        
        Plotly.react(this.chartElement, [trace], layout);
    }
    
    clearChart() {
        Plotly.purge(this.chartElement);
        this.initializeChart();
        this.chartData = {};
    }
}

// Initialize chart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.forexChart = new ForexChart();
    
    // Extend the main app to work with chart
    if (window.forexApp) {
        const originalUpdatePairData = window.forexApp.updatePairData;
        window.forexApp.updatePairData = function(data) {
            if (window.forexChart && data.pairData && data.pairData.lastCandle) {
                window.forexChart.updateChart(data.pair, data.pairData.lastCandle);
            }
            if (originalUpdatePairData) {
                originalUpdatePairData.call(this, data);
            }
        };
    }
});