class ForexApp {
    constructor() {
        this.socket = null;
        this.currentPair = null;
        this.isConnected = false;
        this.pairData = new Map();
        
        this.initializeElements();
        this.bindEvents();
        this.loadForexPairs();
    }
    
    initializeElements() {
        this.elements = {
            pairSelector: document.getElementById('pairSelector'),
            connectBtn: document.getElementById('connectBtn'),
            currentPair: document.getElementById('currentPair'),
            currentPrice: document.getElementById('currentPrice'),
            priceChange: document.getElementById('priceChange'),
            ratesTable: document.getElementById('ratesTable'),
            chart: document.getElementById('chart')
        };
    }
    
    bindEvents() {
        this.elements.pairSelector.addEventListener('change', (e) => {
            this.selectPair(e.target.value);
        });
        
        this.elements.connectBtn.addEventListener('click', () => {
            this.toggleConnection();
        });
    }
    
    async loadForexPairs() {
        try {
            const response = await fetch('https://forex-charting-backend-zl1y.onrender.com/api/forex/pairs');
            const data = await response.json();
            
            if (data.success) {
                this.populatePairSelector(data.data);
            }
        } catch (error) {
            console.error('Error loading forex pairs:', error);
        }
    }
    
    populatePairSelector(pairs) {
        this.elements.pairSelector.innerHTML = '<option value="">Select a pair</option>';
        
        pairs.forEach(pair => {
            const option = document.createElement('option');
            option.value = pair.symbol;
            option.textContent = `${pair.symbol} - ${pair.name}`;
            this.elements.pairSelector.appendChild(option);
        });
    }
    
    selectPair(pair) {
        this.currentPair = pair;
        if (pair) {
            this.elements.currentPair.textContent = pair;
            if (this.isConnected) {
                this.subscribeToPair(pair);
            }
        } else {
            this.elements.currentPair.textContent = 'Select a pair';
            this.elements.currentPrice.textContent = '--';
        }
    }
    
    toggleConnection() {
        if (this.isConnected) {
            this.disconnect();
        } else {
            this.connect();
        }
    }
    
    connect() {
        try {
            // Using your actual Render backend URL
            this.socket = io('https://forex-charting-backend-zl1y.onrender.com');
            
            this.socket.on('connect', () => {
                console.log('Connected to server');
                this.isConnected = true;
                this.elements.connectBtn.textContent = 'Disconnect';
                this.elements.connectBtn.style.backgroundColor = '#f44336';
                
                if (this.currentPair) {
                    this.subscribeToPair(this.currentPair);
                }
            });
            
            this.socket.on('forexUpdate', (data) => {
                this.updateAllRates(data);
            });
            
            this.socket.on('pairUpdate', (data) => {
                this.updatePairData(data);
            });
            
            this.socket.on('disconnect', () => {
                console.log('Disconnected from server');
                this.isConnected = false;
                this.elements.connectBtn.textContent = 'Connect';
                this.elements.connectBtn.style.backgroundColor = '#4CAF50';
            });
            
            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                this.showError('Connection failed. Please try again.');
            });
            
        } catch (error) {
            console.error('Connection error:', error);
            this.showError('Failed to connect to server');
        }
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.isConnected = false;
            this.elements.connectBtn.textContent = 'Connect';
            this.elements.connectBtn.style.backgroundColor = '#4CAF50';
        }
    }
    
    subscribeToPair(pair) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('subscribe', pair);
        }
    }
    
    updateAllRates(data) {
        this.renderRatesTable(data);
        
        // Update current pair if selected
        if (this.currentPair && data[this.currentPair]) {
            this.updateCurrentPairDisplay(data[this.currentPair]);
        }
    }
    
    updatePairData(data) {
        // This will be called when pair-specific data arrives
        if (data.pairData) {
            this.updateCurrentPairDisplay(data.pairData);
        }
    }
    
    updateCurrentPairDisplay(pairData) {
        const rate = pairData.currentRate;
        this.elements.currentPrice.textContent = rate.toFixed(6);
        
        // Calculate change (simplified)
        const previousRate = this.elements.currentPrice.dataset.previous || rate;
        const change = ((rate - previousRate) / previousRate) * 100;
        
        this.elements.priceChange.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(4)}%`;
        this.elements.priceChange.className = `change ${change >= 0 ? 'positive' : 'negative'}`;
        
        this.elements.currentPrice.dataset.previous = rate;
    }
    
    renderRatesTable(data) {
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Pair</th>
                        <th>Rate</th>
                        <th>Change</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        Object.keys(data).forEach(pair => {
            const pairData = data[pair];
            const rate = pairData.currentRate;
            html += `
                <tr>
                    <td>${pair}</td>
                    <td>${rate.toFixed(6)}</td>
                    <td>--</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        this.elements.ratesTable.innerHTML = html;
    }
    
    showError(message) {
        const error
