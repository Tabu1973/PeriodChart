import { LitElement, html, css } from 'lit';
import Chart from 'chart.js/auto';
import './fixed-period-chart-editor.js';

class FixedPeriodChart extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      chartData: { type: Array },
      _isLoading: { type: Boolean, state: true },
      _timeOffset: { type: Number, state: true },
    };
  }

  constructor() {
    super();
    this.chartData = [];
    this.chartLabels = [];
    this.chart = null;
    this._isLoading = false;
    this._timeOffset = 0;
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('You need to define an entity');
    }
    this.config = config;
  }

  static getConfigElement() {
    return document.createElement('fixed-period-chart-editor');
  }

  static getStubConfig() {
    return {
      entity: '',
      period: 'this_year',
      resolution: 'day',
      chart_type: 'bar',
      show_date_picker: false
    };
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
    let period = this.config.period;

    if (this.config.period_entity && this.hass.states[this.config.period_entity]) {
      period = this.hass.states[this.config.period_entity].state;
    }

    if (period) {
      const now = new Date();
      if (period === 'this_year') {
        start = new Date(now.getFullYear() + this._timeOffset, 0, 1);
        end = new Date(now.getFullYear() + this._timeOffset, 11, 31, 23, 59, 59);
      } else if (period === 'last_year') {
        start = new Date(now.getFullYear() - 1 + this._timeOffset, 0, 1);
        end = new Date(now.getFullYear() - 1 + this._timeOffset, 11, 31, 23, 59, 59);
      } else if (period === 'this_month') {
        start = new Date(now.getFullYear(), now.getMonth() + this._timeOffset, 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1 + this._timeOffset, 0, 23, 59, 59);
      } else if (period === 'last_month') {
        start = new Date(now.getFullYear(), now.getMonth() - 1 + this._timeOffset, 1);
        end = new Date(now.getFullYear(), now.getMonth() + this._timeOffset, 0, 23, 59, 59);
      } else if (period === 'today') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + this._timeOffset);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + this._timeOffset, 23, 59, 59);
      }
    } else if (this.config.start_entity && this.config.end_entity) {
      const startState = this.hass.states[this.config.start_entity];
      const endState = this.hass.states[this.config.end_entity];
      if (startState && endState && startState.state !== 'unknown' && endState.state !== 'unknown') {
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
            label: this.config.entity,
            data: this.chartData,
            backgroundColor: this.config.color || 'rgba(54, 162, 235, 0.5)',
            borderColor: this.config.color || 'rgba(54, 162, 235, 1)',
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
              display: this.config.show_legend !== false,
              labels: { color: this.hass.themes.darkMode ? '#fff' : '#666' }
            },
            tooltip: {
              enabled: this.config.show_tooltip !== false
            }
          }
        }
      });
    }
  }

  render() {
    return html`
      <ha-card>
        ${this.config.title || this.config.show_navigation ? html`
          <div class="card-header-custom">
            ${this.config.show_navigation ? html`<ha-icon-button .path=${"M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z"} @click=${() => this.navigateTime(-1)}></ha-icon-button>` : ''}
            <h1 class="card-title">${this.config.title || ''}</h1>
            ${this.config.show_navigation ? html`<ha-icon-button .path=${"M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"} @click=${() => this.navigateTime(1)}></ha-icon-button>` : ''}
          </div>
        ` : ''}
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

  navigateTime(dir) {
    this._timeOffset += dir;
    this.updateDatesAndFetch();
  }

  handleDateChange(e, type) {
    const val = e.target.value;
    if (!val) return;
    
    // Create new temporary local config to override behavior without modifying yaml permanently
    this.config = { ...this.config };
    if (type === 'start') {
      this.config.start = `${val}T00:00:00`;
      delete this.config.start_entity;
      delete this.config.period_entity;
      delete this.config.period;
    } else {
      this.config.end = `${val}T23:59:59`;
      delete this.config.end_entity;
      delete this.config.period_entity;
      delete this.config.period;
    }
    
    this._timeOffset = 0;
    this.requestUpdate('config');
  }

  static get styles() {
    return css`
      ha-card {
        padding: 16px;
      }
      .card-header-custom {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 12px;
      }
      .card-title {
        font-size: var(--ha-card-header-font-size, 24px);
        margin: 0;
        font-weight: 400;
        color: var(--ha-card-header-color, --primary-text-color);
        text-align: center;
        flex-grow: 1;
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
