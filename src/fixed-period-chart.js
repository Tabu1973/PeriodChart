import { LitElement, html, css } from 'lit';
import Chart from 'chart.js/auto';

class FixedPeriodChart extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      chartData: { type: Array },
      _isLoading: { type: Boolean, state: true },
    };
  }

  constructor() {
    super();
    this.chartData = [];
    this.chartLabels = [];
    this.chart = null;
    this._isLoading = false;
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('You need to define an entity');
    }
    this.config = config;
  }

  async updated(changedProperties) {
    super.updated(changedProperties);
    
    if (changedProperties.has('hass') || changedProperties.has('config')) {
      if (this.hass && this.config) {
        await this.updateDatesAndFetch();
      }
    }
  }

  async updateDatesAndFetch() {
    let start, end;

    if (this.config.period) {
      const now = new Date();
      if (this.config.period === 'this_year') {
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      } else if (this.config.period === 'last_year') {
        start = new Date(now.getFullYear() - 1, 0, 1);
        end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
      } else if (this.config.period === 'this_month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      } else if (this.config.period === 'last_month') {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      } else if (this.config.period === 'today') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      }
    } else if (this.config.start_entity && this.config.end_entity) {
      const startState = this.hass.states[this.config.start_entity];
      const endState = this.hass.states[this.config.end_entity];
      if (startState && endState && startState.state !== 'unknown' && endState.state !== 'unknown') {
        // e.g. input_datetime state "2026-05-01" or "2026-05-01 12:00:00"
        let sStr = startState.state.includes(' ') ? startState.state.replace(' ', 'T') : startState.state;
        let eStr = endState.state.includes(' ') ? endState.state.replace(' ', 'T') : endState.state;
        if (sStr.length === 10) sStr += 'T00:00:00';
        if (eStr.length === 10) eStr += 'T23:59:59';
        start = new Date(sStr);
        end = new Date(eStr);
      }
    } else if (this.config.start && this.config.end) {
      start = new Date(this.config.start);
      end = new Date(this.config.end);
    }

    if (start && end) {
      // Check if dates actually changed to avoid infinite loops when hass updates
      if (this._currentStart?.getTime() !== start.getTime() || this._currentEnd?.getTime() !== end.getTime()) {
        this._currentStart = start;
        this._currentEnd = end;
        await this.fetchData(start, end);
      }
    }
  }

  async fetchData(start, end) {
    try {
      this._isLoading = true;
      this.chartData = []; 
      const response = await this.hass.callWS({
        type: 'recorder/statistics_during_period',
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        statistic_ids: [this.config.entity],
        period: this.config.resolution || 'day'
      });

      const data = response[this.config.entity] || [];
      
      // Map data for Chart.js
      this.chartLabels = data.map(point => {
        const d = new Date(point.start);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      });
      this.chartData = data.map(point => point.state !== undefined ? point.state : (point.mean !== undefined ? point.mean : point.sum));
      
      this._isLoading = false;
      this.requestUpdate();

      if (this.chartData.length > 0) {
        // Wait for next render cycle so the #chart div exists
        setTimeout(() => this.renderChart(), 0);
      }
    } catch (error) {
      this._isLoading = false;
      console.error('Error fetching statistics:', error);
    }
  }

  renderChart() {
    const chartContainer = this.shadowRoot.querySelector('#chart');
    if (!chartContainer) return;

    let canvas = chartContainer.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      chartContainer.innerHTML = '';
      chartContainer.appendChild(canvas);
    }

    if (this.chart) {
      this.chart.data.labels = this.chartLabels;
      this.chart.data.datasets[0].data = this.chartData;
      this.chart.update();
    } else {
      this.chart = new Chart(canvas, {
        type: this.config.chart_type || 'bar',
        data: {
          labels: this.chartLabels,
          datasets: [{
            label: this.config.title || this.config.entity,
            data: this.chartData,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          color: this.hass.themes.darkMode ? '#fff' : '#666',
          scales: {
            y: {
              beginAtZero: true,
              ticks: { color: this.hass.themes.darkMode ? '#ccc' : '#666' }
            },
            x: {
              ticks: { color: this.hass.themes.darkMode ? '#ccc' : '#666' }
            }
          },
          plugins: {
            legend: {
              labels: { color: this.hass.themes.darkMode ? '#fff' : '#666' }
            }
          }
        }
      });
    }
  }

  render() {
    return html`
      <ha-card>
        ${this.config.show_date_picker ? html`
          <div class="card-header-date">
            <input type="date" .value=${this._currentStart ? this._currentStart.toISOString().split('T')[0] : ''} @change=${e => this.handleDateChange(e, 'start')}>
            <span> - </span>
            <input type="date" .value=${this._currentEnd ? this._currentEnd.toISOString().split('T')[0] : ''} @change=${e => this.handleDateChange(e, 'end')}>
          </div>
        ` : ''}
        <div class="card-content">
          ${this._isLoading 
            ? html`<div class="loading">Lade Daten...</div>` 
            : this.chartData.length === 0 
              ? html`<div class="loading">Keine Daten für diesen Zeitraum gefunden</div>` 
              : html`<div id="chart"></div>`}
        </div>
      </ha-card>
    `;
  }

  handleDateChange(e, type) {
    const val = e.target.value;
    if (!val) return;
    
    // Create new temporary local config to override behavior without modifying yaml permanently
    this.config = { ...this.config };
    if (type === 'start') {
      this.config.start = `${val}T00:00:00`;
      delete this.config.start_entity;
      delete this.config.period;
    } else {
      this.config.end = `${val}T23:59:59`;
      delete this.config.end_entity;
      delete this.config.period;
    }
    
    this.requestUpdate('config');
  }

  static get styles() {
    return css`
      ha-card {
        padding: 16px;
      }
      .card-header-date {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
        padding-bottom: 10px;
      }
      .card-header-date input {
        padding: 4px 8px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }
      .loading {
        text-align: center;
        padding: 20px;
        color: var(--secondary-text-color);
      }
      #chart {
        width: 100%;
        min-height: 350px;
      }
    `;
  }
}

customElements.define('fixed-period-chart', FixedPeriodChart);

// Add to Lovelace picker
window.customCards = window.customCards || [];
window.customCards.push({
  type: "fixed-period-chart",
  name: "Fixed Period Chart",
  description: "A chart displaying data for a fixed time period."
});
