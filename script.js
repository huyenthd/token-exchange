class TokenCalculator {
    // Assign a unique color for each token symbol
    getTokenColor(token) {
        // You can expand this palette for more tokens
        const palette = [
            '#0070f3', // blue
            '#e67e22', // orange
            '#16a085', // teal
            '#e84393', // pink
            '#8e44ad', // purple
            '#2d98da', // light blue
            '#27ae60', // green
            '#c0392b', // red
            '#f1c40f', // yellow
            '#636e72'  // gray
        ];
        // Hash token to a color index
        let hash = 0;
        for (let i = 0; i < token.length; i++) hash += token.charCodeAt(i);
        return palette[hash % palette.length];
    }
    constructor() {
        this.prices = {};
        this.trades = [];
        this.initEventListeners();
        this.loadDefaultData();
    }
    // Constructor to initialize prices and trades

    initEventListeners() {
        document.getElementById('calculate-btn').addEventListener('click', () => {
            this.calculatePL();
        });
    }
    // Set up event listeners for UI actions

    loadDefaultData() {
        // Load default trade data (sample)
        const defaultData = `[NEAR=2.57 STRK=0.142 ARB=0.2760 ZK=0.05150 APT=3.128]
STRK-1000 ARB-442.9
NEAR-50 ARB-440
ZK-2000 ARB-341.6
NEAR-158.9 ARB-949.4
STRK-1000 NEAR-52.3
APT-50 NEAR-60`;

        document.getElementById('trade-data').value = defaultData;
        this.calculatePL();
    }

    parsePrices(priceString) {
        // Parse the price line: [NEAR=2.57 STRK=0.142 ...]
        const priceMatch = priceString.match(/\[(.*?)\]/);
        if (!priceMatch) return false;

        const pricesText = priceMatch[1];
        const priceTokens = pricesText.split(' ');

        this.prices = {};
        priceTokens.forEach(token => {
            const [symbol, price] = token.split('=');
            if (symbol && price) {
                this.prices[symbol.trim()] = parseFloat(price);
            }
        });

        return Object.keys(this.prices).length > 0;
    }

    parseTrades(tradesText) {
        const lines = tradesText.split('\n').filter(line => line.trim() !== '');
        this.trades = [];

        for (let i = 1; i < lines.length; i++) { // Skip first line (prices)
            const line = lines[i].trim();
            if (line) {
                const trade = this.parseTradeLine(line);
                if (trade) {
                    this.trades.push(trade);
                }
            }
        }
    }
    // Parse all trade lines (skip the first line with prices)

    parseTradeLine(line) {
        // Parse a single trade line, e.g. APT-50 NEAR-60
        const parts = line.split(' ').filter(part => part.trim() !== '');
        if (parts.length !== 2) return null;

        const [sellPart, buyPart] = parts;
        const sellMatch = sellPart.match(/([A-Z]+)-([0-9.]+)/);
        const buyMatch = buyPart.match(/([A-Z]+)-([0-9.]+)/);

        if (!sellMatch || !buyMatch) return null;

        return {
            sellToken: sellMatch[1],
            sellAmount: parseFloat(sellMatch[2]),
            buyToken: buyMatch[1],
            buyAmount: parseFloat(buyMatch[2]),
            originalLine: line
        };
    }

    calculatePL() {
        const inputData = document.getElementById('trade-data').value.trim();
        if (!inputData) {
            this.displayError('Please enter your trade data');
            return;
        }

        const lines = inputData.split('\n');
        if (lines.length < 2) {
            this.displayError('Invalid data format');
            return;
        }

        // Parse prices from first line
        if (!this.parsePrices(lines[0])) {
            this.displayError('Cannot read token prices from the first line');
            return;
        }

        // Parse trades from remaining lines
        this.parseTrades(inputData);

        // Display current prices
        this.displayCurrentPrices();

        // Calculate and display P/L for each trade
        this.displayResults();
    }

    displayCurrentPrices() {
        const pricesDiv = document.getElementById('current-prices');
        pricesDiv.innerHTML = '';

        Object.entries(this.prices).forEach(([token, price]) => {
            const priceCard = document.createElement('div');
            priceCard.className = 'price-card';
            priceCard.innerHTML = `
                <div class="token-symbol">${token}</div>
                <div class="token-price">$${price.toFixed(4)}</div>
            `;
            pricesDiv.appendChild(priceCard);
        });
    }
    // Render the current token prices

    displayResults() {
        const resultsDiv = document.getElementById('results');

        if (this.trades.length === 0) {
            resultsDiv.innerHTML = '<p>No trades found to calculate.</p>';
            return;
        }

        let totalPL = 0;
        let resultsHTML = '<div class="trades-table">';
        resultsHTML += `
            <div class="table-header">
                <div>Bán</div>
                <div>Mua</div>
                <div>P/L ($)</div>
            </div>
        `;

        this.trades.forEach((trade) => {
            const pl = this.calculateTradePL(trade);
            totalPL += pl;
            const status = pl >= 0 ? 'profit' : 'loss';
            resultsHTML += `
                <div class="table-row ${status}">
                    <div class="sell-info">
                        <div><span class="token-label" style="color:${this.getTokenColor(trade.sellToken)}">${trade.sellToken}</span>@${trade.sellAmount}</div>
                    </div>
                    <div class="buy-info">
                        <div><span class="token-label" style="color:${this.getTokenColor(trade.buyToken)}">${trade.buyToken}</span>@${trade.buyAmount}</div>
                    </div>
                    <div class="pl-amount ${status}">
                        ${pl >= 0 ? '+' : ''}${pl.toFixed(2)}
                    </div>
                </div>
            `;
        });

        resultsHTML += '</div>';

        // Add total summary
                const totalColor = totalPL >= 0 ? 'total-profit' : 'total-loss';
                resultsHTML += `
                        <div class="total-summary no-bg">
                                <span class="${totalColor}" style="display:inline-block;width:100%;text-align:center;font-size:1.5em;font-weight:bold;">
                                    ${totalPL >= 0 ? '+' : ''}${totalPL.toFixed(2)}
                                </span>
                        </div>
                `;

        resultsDiv.innerHTML = resultsHTML;
    }
    // Render the P/L results table

    calculateTradePL(trade) {
        const buyValue = trade.buyAmount * (this.prices[trade.buyToken] || 0);
        const sellValue = trade.sellAmount * (this.prices[trade.sellToken] || 0);

        // P/L = Value of tokens bought - Value of tokens sold
        return buyValue - sellValue;
    }
    // Calculate P/L for a single trade

    displayError(message) {
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = `<div class="error">${message}</div>`;

        const pricesDiv = document.getElementById('current-prices');
        pricesDiv.innerHTML = '<p>No price data available</p>';
    }
    // Show error message in the UI
}

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TokenCalculator();
});