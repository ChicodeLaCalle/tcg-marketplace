// Card Detail Page
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const cardId = urlParams.get('id');
  
  if (!cardId) {
    window.location.href = '/';
    return;
  }

  let priceChart = null;

  // Back button
  document.getElementById('backBtn').addEventListener('click', () => {
    window.history.back();
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
      const response = await fetch(`/api/cards/${cardId}`);
      
      if (!response.ok) {
        throw new Error('Card not found');
      }
      
      const card = await response.json();
      displayCardDetails(card);
      
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

    // Display prices
    const pricesList = document.getElementById('pricesList');
    const prices = card.tcgplayer?.prices || {};
    
    if (Object.keys(prices).length === 0) {
      pricesList.innerHTML = '<p class="no-prices">No price data available</p>';
    } else {
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
    }
  }

  // Load and display price history chart
  async function loadPriceHistory(cardId) {
    try {
      const response = await fetch(`/api/cards/${cardId}/history`);
      const history = await response.json();
      
      renderChart(history.data);
    } catch (error) {
      console.error('Failed to load price history:', error);
    }
  }

  // Render Chart.js chart
  function renderChart(historyData) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    
    // Destroy existing chart
    if (priceChart) {
      priceChart.destroy();
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
