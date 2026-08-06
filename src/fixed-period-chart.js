import { LitElement, html, css } from 'lit';
import Chart from 'chart.js/auto';
import './fixed-period-chart-editor.js';

class FixedPeriodChart extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      chartDatasets: { type: Array },
      _isLoading: { type: Boolean, state: true },
      _timeOffset: { type: Number, state: true },
    };
  }

  constructor() {
    super();
    this._instanceId = Math.random().toString(36).substring(7);
    this.chartDatasets = [];
    this.chartLabels = [];
    this.chart = null;
    this._isLoading = false;
    this._timeOffset = 0;
    this._currentEntityStyles = '';
  }

  get _entities() {
    if (this.config?.entities && Array.isArray(this.config.entities)) {
      return this.config.entities;
    }
    if (this.config?.entity) {
      return [{
        entity: this.config.entity,
        legend_label: this.config.legend_label,
        color: this.config.color,
        color_entity: this.config.color_entity,
        use_dynamic_color: this.config.use_dynamic_color,
        chart_type: this.config.chart_type,
        line_width: this.config.line_width,
        line_width_entity: this.config.line_width_entity,
        use_dynamic_line_width: this.config.use_dynamic_line_width,
        smoothing: this.config.smoothing,
        show_data_points: this.config.show_data_points
      }];
    }
    return [];
  }

  setConfig(config) {
    this.config = config;
  }

  static getConfigElement() {
    return document.createElement('fixed-period-chart-editor');
  }

  static getStubConfig() {
    return {
      entities: [{ entity: '' }],
      period: 'this_year',
      resolution: 'day',
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
    
    const isCustom = this.config.period === 'custom' || (!this.config.period && (this.config.period_entity || this.config.start_entity || this.config.start));
    let periodToUse = this.config.period || 'this_year';
    
    if (isCustom) {
      if (this.config.use_start_end_entities && this.config.start_entity && this.config.end_entity) {
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
      } else {
        periodToUse = 'this_year';
        if (this.config.use_period_entity && this.config.period_entity && this.hass.states[this.config.period_entity]) {
          periodToUse = this.hass.states[this.config.period_entity].state;
        }
      }
    }

    if (!start && !end && periodToUse && periodToUse !== 'custom') {
      const now = new Date();
      if (periodToUse === 'this_year') {
        start = new Date(now.getFullYear() + this._timeOffset, 0, 1);
        end = new Date(now.getFullYear() + this._timeOffset, 11, 31, 23, 59, 59);
      } else if (periodToUse === 'last_year') {
        start = new Date(now.getFullYear() - 1 + this._timeOffset, 0, 1);
        end = new Date(now.getFullYear() - 1 + this._timeOffset, 11, 31, 23, 59, 59);
      } else if (periodToUse === 'this_month') {
        start = new Date(now.getFullYear(), now.getMonth() + this._timeOffset, 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1 + this._timeOffset, 0, 23, 59, 59);
      } else if (periodToUse === 'last_month') {
        start = new Date(now.getFullYear(), now.getMonth() - 1 + this._timeOffset, 1);
        end = new Date(now.getFullYear(), now.getMonth() + this._timeOffset, 0, 23, 59, 59);
      } else if (periodToUse === 'this_week') {
        const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1 + (this._timeOffset * 7));
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 7 + (this._timeOffset * 7), 23, 59, 59);
      } else if (periodToUse === 'last_week') {
        const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek - 6 + (this._timeOffset * 7));
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + (this._timeOffset * 7), 23, 59, 59);
      } else if (periodToUse === 'today') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + this._timeOffset);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + this._timeOffset, 23, 59, 59);
      } else if (periodToUse === 'yesterday') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1 + this._timeOffset);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1 + this._timeOffset, 23, 59, 59);
      }
    }

    let resolution = this.config.resolution || 'day';
    if (this.config.resolution_entity && this.hass.states[this.config.resolution_entity]) {
      resolution = this.hass.states[this.config.resolution_entity].state;
    }

    let visualConfigChanged = false;
    
    let card_bg_color = this.config.card_bg_color;
    if (this.config.use_dynamic_card_bg_color && this.config.card_bg_color_entity && this.hass.states[this.config.card_bg_color_entity]) {
      card_bg_color = this.hass.states[this.config.card_bg_color_entity].state;
    }
    if (this._currentCardBgColor !== card_bg_color) {
      this._currentCardBgColor = card_bg_color;
      visualConfigChanged = true;
    }
    
    // Evaluate if entity styles changed
    const entities = this._entities;
    const currentEntityStyles = JSON.stringify(entities.map(e => ({
      color: e.use_dynamic_color && e.color_entity && this.hass.states[e.color_entity] ? this.hass.states[e.color_entity].state : e.color,
      bg_color: e.use_dynamic_bg_color && e.bg_color_entity && this.hass.states[e.bg_color_entity] ? this.hass.states[e.bg_color_entity].state : e.bg_color,
      width: e.use_dynamic_line_width && e.line_width_entity && this.hass.states[e.line_width_entity] ? this.hass.states[e.line_width_entity].state : e.line_width
    })));

    if (this._currentEntityStyles !== currentEntityStyles) {
      this._currentEntityStyles = currentEntityStyles;
      visualConfigChanged = true;
    }

    if (start && end) {
      const startChanged = this._currentStart?.getTime() !== start.getTime();
      const endChanged = this._currentEnd?.getTime() !== end.getTime();
      const resChanged = this._currentResolution !== resolution;
      
      const currentHash = JSON.stringify(entities.map(e => e.entity));
      const hashChanged = this._entitiesHash !== currentHash;

      if (startChanged || endChanged || resChanged || hashChanged) {
        console.log(`[FixedPeriodChart][${this._instanceId}] Fetching because: startChanged=${startChanged}, endChanged=${endChanged}, resChanged=${resChanged}, hashChanged=${hashChanged}. OldHash: ${this._entitiesHash}, NewHash: ${currentHash}`);
        this._currentStart = start;
        this._currentEnd = end;
        this._currentResolution = resolution;
        this._entitiesHash = currentHash;
        await this.fetchData(start, end, resolution);
      } else if (visualConfigChanged && this.chartDatasets.length > 0) {
        this.renderChart();
      }
    }
  }

  async fetchData(start, end, resolution) {
    try {
      this._isLoading = true;
      this.requestUpdate(); 
      
      const entities = this._entities;
      const validEntities = entities.map(e => e.entity).filter(e => e);
      if (validEntities.length === 0) {
        this._isLoading = false;
        this.requestUpdate();
        return;
      }

      console.log(`[FixedPeriodChart] Fetching data from ${start.toISOString()} to ${end.toISOString()} for ${validEntities.length} entities`);
      
      const daysSinceStart = (new Date().getTime() - start.getTime()) / (1000 * 3600 * 24);
      if (resolution === '5minute' && daysSinceStart > 7) {
        resolution = 'hour';
      }

      const response = await this.hass.callWS({
        type: 'recorder/statistics_during_period',
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        statistic_ids: validEntities,
        period: resolution
      });

      const allTimestamps = new Set();
      const entityData = {};

      validEntities.forEach(entityId => {
        const data = response[entityId] || [];
        entityData[entityId] = data.map(point => {
          allTimestamps.add(point.start);
          return {
            start: point.start,
            value: point.state !== undefined ? point.state : (point.mean !== undefined ? point.mean : point.sum)
          };
        });
      });

      const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);
      
      this.chartLabels = sortedTimestamps.map(ts => {
        const d = new Date(ts);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      });

      this.chartDatasets = entities.map(ent => {
        if (!ent.entity || !entityData[ent.entity]) return [];
        const dataMap = new Map(entityData[ent.entity].map(d => [d.start, d.value]));
        return sortedTimestamps.map(ts => dataMap.has(ts) ? dataMap.get(ts) : null);
      });
      
      this._isLoading = false;
      this.requestUpdate();

      if (this.chartDatasets.length > 0) {
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

    const visualConfig = { ...this.config };
    delete visualConfig.start;
    delete visualConfig.end;
    
    // Evaluate if entity styles changed
    const entities = this._entities;
    const currentEntityStyles = entities.map(e => ({
      color: e.use_dynamic_color && e.color_entity && this.hass.states[e.color_entity] ? this.hass.states[e.color_entity].state : e.color,
      bg_color: e.use_dynamic_bg_color && e.bg_color_entity && this.hass.states[e.bg_color_entity] ? this.hass.states[e.bg_color_entity].state : e.bg_color,
      width: e.use_dynamic_line_width && e.line_width_entity && this.hass.states[e.line_width_entity] ? this.hass.states[e.line_width_entity].state : e.line_width
    }));

    const configStr = JSON.stringify({ 
      v: visualConfig, 
      s: currentEntityStyles, 
      d: this.hass.themes.darkMode 
    });

    const datasets = entities.map((ent, idx) => {
      let color = ent.color;
      if (ent.use_dynamic_color && ent.color_entity && this.hass.states[ent.color_entity]) {
        color = this.hass.states[ent.color_entity].state;
      }
      
      let bg_color = ent.bg_color;
      if (ent.use_dynamic_bg_color && ent.bg_color_entity && this.hass.states[ent.bg_color_entity]) {
        bg_color = this.hass.states[ent.bg_color_entity].state;
      }

      let line_width = ent.line_width;
      if (ent.use_dynamic_line_width && ent.line_width_entity && this.hass.states[ent.line_width_entity]) {
        line_width = this.hass.states[ent.line_width_entity].state;
      }

      return {
        label: ent.legend_label || ent.entity,
        data: this.chartDatasets[idx] || [],
        backgroundColor: bg_color || color || 'rgba(54, 162, 235, 0.5)',
        borderColor: color || 'rgba(54, 162, 235, 1)',
        borderWidth: line_width ? Number(line_width) : (ent.chart_type === 'line' ? 2 : (ent.chart_type === 'scatter' ? 0 : 1)),
        tension: ent.smoothing ? 0.4 : 0,
        fill: ent.chart_type === 'line' ? (!!bg_color) : true, 
        pointRadius: ent.show_data_points === false ? 0 : (ent.chart_type === 'scatter' ? 4 : 3),
        pointHoverRadius: ent.show_data_points === false ? 5 : (ent.chart_type === 'scatter' ? 6 : 4),
        showLine: ent.chart_type !== 'scatter',
        borderDash: ent.line_style === 'dashed' ? [5, 5] : (ent.line_style === 'dotted' ? [2, 3] : []),
        type: ent.chart_type === 'scatter' ? 'line' : (ent.chart_type || 'bar')
      };
    });

    if (this.chart && this._lastRenderConfig === configStr) {
      this.chart.data.labels = this.chartLabels;
      this.chart.data.datasets = datasets;
      this.chart.update();
      return;
    }

    let canvas = chartContainer.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      chartContainer.innerHTML = '';
      chartContainer.appendChild(canvas);
    }

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    this._lastRenderConfig = configStr;

    let categoryScale = {
      display: this.config.show_x_axis !== false,
      grid: { display: this.config.show_x_grid !== false },
      ticks: { maxTicksLimit: this.config.max_ticks_x ? Number(this.config.max_ticks_x) : undefined }
    };
    let valueScale = {
      display: this.config.show_y_axis !== false,
      grid: { display: this.config.show_y_grid !== false },
      ticks: {
        stepSize: this.config.step_size_y ? Number(this.config.step_size_y) : undefined
      }
    };
    let chartScales = this.config.horizontal ? { x: valueScale, y: categoryScale } : { x: categoryScale, y: valueScale };

    this.chart = new Chart(canvas, {
      data: {
        labels: this.chartLabels,
        datasets: datasets
      },
      options: {
        indexAxis: this.config.horizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 400,
          easing: this.config.animation_easing || 'easeOutQuart'
        },
        color: this.hass.themes.darkMode ? '#fff' : '#666',
        scales: {
          y: {
            beginAtZero: true,
            display: this.config.show_axis_y !== false,
            grid: {
              display: this.config.show_grid_y !== false,
              color: this.hass.themes.darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
            },
            ticks: { 
              color: this.hass.themes.darkMode ? '#ccc' : '#666',
              ...(this.config.step_size_y ? { stepSize: Number(this.config.step_size_y) } : {})
            }
          },
          x: {
            display: this.config.show_axis_x !== false,
            grid: {
              display: this.config.show_grid_x !== false,
              color: this.hass.themes.darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
            },
            ticks: { 
              color: this.hass.themes.darkMode ? '#ccc' : '#666',
              ...(this.config.max_ticks_x ? { maxTicksLimit: Number(this.config.max_ticks_x) } : {}),
              ...(this.config.x_axis_rotation !== undefined && this.config.x_axis_rotation !== '' ? {
                maxRotation: Number(this.config.x_axis_rotation),
                minRotation: Number(this.config.x_axis_rotation)
              } : {})
            }
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

  render() {
    if (!this.config) return html``;

    return html`
      <ha-card style=${this._currentCardBgColor ? `background: ${this._currentCardBgColor};` : ''}>
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
          ${this._isLoading && this.chartDatasets.length === 0
            ? html`<div class="loading">Lade Daten...</div>` 
            : this.chartDatasets.length === 0 
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

window.customCards = window.customCards || [];
window.customCards.push({
  type: "fixed-period-chart",
  name: "Fixed Period Chart",
  description: "A chart displaying historical data for a fixed time period for one or multiple entities."
});
