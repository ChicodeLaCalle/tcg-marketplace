// Card Detail Page
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const cardId = urlParams.get('id');
  
  if (!cardId) {
    window.location.href = '/';
    return;
  }

  let priceChart = null;
  let currentCard = null;
  let aggregatedPrices = null;

  // Back button
  document.getElementById('backBtn').addEventListener('click', () => {
    window.history.back();
  });

  // Price source selector
  document.getElementById('priceSource').addEventListener('change', (e) => {
    displayPricesForSource(e.target.value);
  });

  // Mock data button
  document.getElementById('mockDataBtn').addEventListener('click', async () => {
    const btn = document.getElementById('mockDataBtn');
    btn.disabled = true;
    btn.textContent = 'Generating...';
    
    try {
      const response = await fetch(`/api/cards/${cardId}/mock-history`, {
        method: 'POST'
      });
      
      if (response.ok) {
        // Reload the chart
        loadPriceHistory(cardId);
        btn.textContent = 'Demo Data Generated!';
        setTimeout(() => {
          btn.textContent = 'Generate Demo Data';
          btn.disabled = false;
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to generate mock data:', error);
      btn.textContent = 'Failed - Try Again';
      btn.disabled = false;
    }
  });

  // Load card details
  async function loadCardDetails() {
    try {
      const [cardResponse, pricesResponse] = await Promise.all([
        fetch(`/api/cards/${cardId}`),
        fetch(`/api/cards/${cardId}/prices`)
      ]);
      
      if (!cardResponse.ok) {
        throw new Error('Card not found');
      }
      
      currentCard = await cardResponse.json();
      aggregatedPrices = await pricesResponse.json();
      
      displayCardDetails(currentCard);
      displayPricesForSource('tcgplayer'); // Default source
      
      // Hide loading, show content
      document.getElementById('loading').style.display = 'none';
      document.getElementById('cardDetail').classList.remove('hidden');
      
      // Load price history
      loadPriceHistory(cardId);
    } catch (error) {
      console.error('Failed to load card:', error);
      document.getElementById('loading').style.display = 'none';
      document.getElementById('error').classList.remove('hidden');
    }
  }

  // Display card details
  function displayCardDetails(card) {
    document.getElementById('cardImage').src = card.images.large;
    document.getElementById('cardImage').alt = card.name;
    document.getElementById('cardName').textContent = card.name;
    document.getElementById('cardSet').textContent = `${card.set.name} (${card.set.series})`;
    document.getElementById('cardRarity').textContent = card.rarity || 'Unknown';
    document.getElementById('cardNumber').textContent = `#${card.number}/${card.set.printedTotal}`;
    document.getElementById('cardArtist').textContent = card.artist || 'Unknown';
  }

  // Display prices for selected source
  function displayPricesForSource(source) {
    const pricesList = document.getElementById('pricesList');
    const pricesTitle = document.getElementById('pricesTitle');
    const noteDiv = document.getElementById('priceSourceNote');
    
    let sourceName = 'TCGPlayer (US)';
    let prices = null;
    let note = '';

    switch (source) {
      case 'tcgplayer':
        sourceName = 'TCGPlayer (US)';
        prices = currentCard?.tcgplayer?.prices;
        note = 'Prices from TCGPlayer marketplace (USD)';
        break;
      case 'pricecharting':
        sourceName = 'PriceCharting (US)';
        prices = aggregatedPrices?.sources?.pricecharting;
        note = prices?.note || 'PriceCharting integration in progress. Visit their site for current prices.';
        break;
      case 'cardmarket':
        sourceName = 'Cardmarket (EU)';
        prices = null;
        note = 'Cardmarket does not have a public API. Manual price entry or browser extension coming soon. Prices shown in EUR.';
        break;
    }

    pricesTitle.textContent = `Current Prices - ${sourceName}`;
    noteDiv.textContent = note;
    noteDiv.style.display = note ? 'block' : 'none';

    if (!prices || Object.keys(prices).length === 0) {
      pricesList.innerHTML = `
        <div class="no-prices-message">
          <p>No price data available from ${sourceName}.</p>
          ${source === 'cardmarket' ? '<p>Cardmarket prices require manual entry or browser extension (coming soon).</p>' : ''}
          ${source === 'pricecharting' ? '<p><a href="https://www.pricecharting.com/search?q=' + encodeURIComponent(currentCard.name) + '" target="_blank">View on PriceCharting →</a></p>' : ''}
        </div>
      `;
      return;
    }

    // Format prices based on source
    if (source === 'tcgplayer') {
      pricesList.innerHTML = Object.entries(prices).map(([type, data]) => `
        <div class="price-card">
          <h4>${formatPriceType(type)}</h4>
          <div class="price-values">
            ${data.market ? `<div class="price-row"><span>Market</span><span class="price">$${data.market.toFixed(2)}</span></div>` : ''}
            ${data.low ? `<div class="price-row"><span>Low</span><span class="price-low">$${data.low.toFixed(2)}</span></div>` : ''}
            ${data.high ? `<div class="price-row"><span>High</span><span class="price-high">$${data.high.toFixed(2)}</span></div>` : ''}
            ${data.mid ? `<div class="price-row"><span>Mid</span><span>$${data.mid.toFixed(2)}</span></div>` : ''}
          </div>
        </div>
      `).join('');
    } else {
      // Generic price display for other sources
      pricesList.innerHTML = `
        <div class="price-card">
          <h4>Market Price</h4>
          <div class="price-values">
            <div class="price-row">
              <span>Current</span>
              <span class="price">See ${sourceName}</span>
            </div>
          </div>
        </div>
      `;
    }
  }

  // Load and display price history chart
  async function loadPriceHistory(cardId) {
    try {
      const response = await fetch(`/api/cards/${cardId}/history`);
      const history = await response.json();
      
      // Show last updated time
      if (history.lastUpdated) {
        const updated = new Date(history.lastUpdated);
        const timeStr = updated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        console.log(`📊 Prices updated at ${timeStr}`);
      }
      
      renderChart(history.data, history.cardName);
    } catch (error) {
      console.error('Failed to load price history:', error);
    }
  }

  // Render Chart.js chart
  function renderChart(historyData, cardName) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    const chartContainer = document.querySelector('.chart-container');
    
    // Destroy existing chart
    if (priceChart) {
      priceChart.destroy();
    }

    // Check if we have data
    if (!historyData || historyData.length === 0) {
      chartContainer.innerHTML = `
        <div class="no-chart-data">
          <p>No price history available yet.</p>
          <p>Click "Generate Demo Data" to see a sample price chart, or check back tomorrow after daily price tracking.</p>
        </div>
      `;
      return;
    }

    // Restore canvas if it was replaced
    if (!document.getElementById('priceChart')) {
      chartContainer.innerHTML = '<canvas id="priceChart"></canvas>';
    }

    // Group data by date and price type
    const dates = [...new Set(historyData.map(d => d.date))].sort();
    const priceTypes = [...new Set(historyData.map(d => d.price_type))];
    
    const datasets = priceTypes.map((type, index) => {
      const colors = ['#ff6b6b', '#4ade80', '#3b82f6', '#f59e0b', '#a855f7'];
      const color = colors[index % colors.length];
      
      return {
        label: formatPriceType(type),
        data: dates.map(date => {
          const entry = historyData.find(d => d.date === date && d.price_type === type);
          return entry ? entry.avg_price : null;
        }),
        borderColor: color,
        backgroundColor: color + '20',
        tension: 0.4,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6
      };
    });

    priceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          title: {
            display: true,
            text: `${cardName || 'Card'} - TCGPlayer Price History`,
            color: '#fff',
            font: { size: 14 }
          },
          legend: {
            position: 'top',
            labels: {
              color: '#fff',
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': $' + context.parsed.y.toFixed(2);
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#888'
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#888',
              callback: function(value) {
                return '$' + value.toFixed(2);
              }
            }
          }
        }
      }
    });
  }

  // Format price type for display
  function formatPriceType(type) {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace('Market', '(Market)')
      .replace('Low', '(Low)')
      .replace('High', '(High)');
  }

  // Load card on page load
  loadCardDetails();
});
