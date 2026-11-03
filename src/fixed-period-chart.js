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
      type: 'custom:fixed-period-chart',
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

    // Helper to evaluate dynamic chart type
    const getDynamicChartInfo = (e) => {
      let cType = e.chart_type || this.config.chart_type || 'bar';
      let bMode = e.bar_mode || this.config.bar_mode || (e.use_min_max ? 'floating' : 'standard');
      const chartTypeEnt = e.chart_type_entity || this.config.chart_type_entity;
      if ((e.use_dynamic_chart_type || this.config.use_dynamic_chart_type) && chartTypeEnt && this.hass?.states[chartTypeEnt]) {
        const dynType = this.hass.states[chartTypeEnt].state;
        if (['line', 'bar', 'scatter'].includes(dynType)) {
          cType = dynType;
          bMode = 'standard';
        } else if (dynType === 'floating_bar') {
          cType = 'bar';
          bMode = 'floating';
        } else if (dynType === 'stacked_bar') {
          cType = 'bar';
          bMode = 'stacked';
        }
      }
      return { cType, bMode };
    };

    const durationDays = (start && end) ? (end.getTime() - start.getTime()) / (1000 * 3600 * 24) : 0;

    // Floating Bars (Min/Max) machen nur bei einer Auflösung von mind. 'day' Sinn
    const hasMinMax = this._entities && this._entities.some(e => {
      const info = getDynamicChartInfo(e);
      return info.cType === 'bar' && (info.bMode === 'floating' || (info.bMode === 'stacked' && e.use_min_max));
    });
    
    const hasStandardBar = this._entities && this._entities.some(e => {
      const info = getDynamicChartInfo(e);
      return info.cType === 'bar' && info.bMode === 'standard';
    });
    
    if (resolution === 'auto') {
      if (hasMinMax) {
        resolution = 'day';
      } else if (durationDays > 360) {
        resolution = 'month';
      } else if (durationDays > 31) {
        resolution = 'day';
      } else if (durationDays > 2) {
        resolution = hasStandardBar ? 'day' : 'hour';
      } else {
        resolution = 'hour';
      }
    } else if (hasMinMax && (resolution === '5minute' || resolution === 'hour')) {
      resolution = 'day';
    } else if (hasStandardBar) {
      if (durationDays > 360) {
        resolution = 'month';
      } else if (durationDays > 31 && (resolution === '5minute' || resolution === 'hour')) {
        resolution = 'day';
      } else if (durationDays > 3 && resolution === '5minute') {
        resolution = 'day';
      }
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
    const currentEntityStyles = JSON.stringify(entities.map(e => {
      const info = getDynamicChartInfo(e);
      return {
        cType: info.cType,
        bMode: info.bMode,
        color: e.use_dynamic_color && e.color_entity && this.hass.states[e.color_entity] ? this.hass.states[e.color_entity].state : e.color,
        bg_color: e.use_dynamic_bg_color && e.bg_color_entity && this.hass.states[e.bg_color_entity] ? this.hass.states[e.bg_color_entity].state : e.bg_color,
        width: e.use_dynamic_line_width && e.line_width_entity && this.hass.states[e.line_width_entity] ? this.hass.states[e.line_width_entity].state : e.line_width
      };
    }));

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
      const periodChanged = this._currentPeriod !== periodToUse;

      if (visualConfigChanged || startChanged || endChanged || resChanged || hashChanged || periodChanged) {
        this._currentStart = start;
        this._currentEnd = end;
        this._currentResolution = resolution;
        this._entitiesHash = currentHash;
        this._currentPeriod = periodToUse;

        const needsFetch = startChanged || endChanged || resChanged || hashChanged || periodChanged;

        if (needsFetch) {
          // Data actually changed - re-fetch from HA
          this._isLoading = true;
          this.requestUpdate();
          await this.fetchData(start, end, resolution);
        } else if (visualConfigChanged && this.chartDatasets.length > 0) {
          // Only visual config changed (chart type, colors, etc.) - just re-render
          this._lastRenderConfig = null; // force full chart rebuild
          this.renderChart();
        }
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
      if (resolution === 'auto' || !['5minute', 'hour', 'day', 'week', 'month'].includes(resolution)) {
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
          return point;
        });
      });

      const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);
      
      const durationMs = end.getTime() - start.getTime();
      const isShortPeriod = durationMs <= (48 * 60 * 60 * 1000);
      const formatShort = this.config.format_axis_short || 'HH:mm';
      const formatLong = this.config.format_axis_long || 'DD.MM. HH:mm';
      const formatTooltipShort = this.config.format_tooltip_date_short || 'HH:mm';
      const formatTooltipLong = this.config.format_tooltip_date_long || 'DD.MM.YYYY HH:mm';

      this.chartFullLabels = [];
      this.chartLabels = sortedTimestamps.map(ts => {
        const d = new Date(ts);
        const fullStr = isShortPeriod ? this._formatDate(d, formatTooltipShort) : this._formatDate(d, formatTooltipLong);
        this.chartFullLabels.push(fullStr);
        
        if (isShortPeriod) {
          return this._formatDate(d, formatShort);
        }
        return this._formatDate(d, formatLong);
      });

      this.chartDatasets = entities.map(ent => {
        if (!ent.entity || !entityData[ent.entity]) return [];
        const dataMap = new Map(entityData[ent.entity].map(d => [d.start, d]));
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
    const currentEntityStyles = entities.map(e => {
      let cType = e.chart_type || this.config.chart_type || 'bar';
      let bMode = e.bar_mode || this.config.bar_mode || (e.use_min_max ? 'floating' : 'standard');
      const chartTypeEnt = e.chart_type_entity || this.config.chart_type_entity;
      if ((e.use_dynamic_chart_type || this.config.use_dynamic_chart_type) && chartTypeEnt && this.hass.states[chartTypeEnt]) {
        const dynType = this.hass.states[chartTypeEnt].state;
        if (['line', 'bar', 'scatter'].includes(dynType)) {
          cType = dynType; bMode = 'standard';
        } else if (dynType === 'floating_bar') {
          cType = 'bar'; bMode = 'floating';
        } else if (dynType === 'stacked_bar') {
          cType = 'bar'; bMode = 'stacked';
        }
      }
      return {
        cType,
        bMode,
        color: e.use_dynamic_color && e.color_entity && this.hass.states[e.color_entity] ? this.hass.states[e.color_entity].state : e.color,
        bg_color: e.use_dynamic_bg_color && e.bg_color_entity && this.hass.states[e.bg_color_entity] ? this.hass.states[e.bg_color_entity].state : e.bg_color,
        width: e.use_dynamic_line_width && e.line_width_entity && this.hass.states[e.line_width_entity] ? this.hass.states[e.line_width_entity].state : e.line_width
      };
    });

    const configStr = JSON.stringify({ 
      v: visualConfig, 
      s: currentEntityStyles, 
      d: this.hass.themes.darkMode 
    });

    const datasets = entities.flatMap((ent, idx) => {
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

      let unit = '';
      if (this.hass.states[ent.entity] && this.hass.states[ent.entity].attributes.unit_of_measurement) {
        unit = this.hass.states[ent.entity].attributes.unit_of_measurement;
      }
      
      let cType = ent.chart_type || this.config.chart_type || 'bar';
      let bMode = ent.bar_mode || this.config.bar_mode || (ent.use_min_max ? 'floating' : 'standard');
      const chartTypeEnt = ent.chart_type_entity || this.config.chart_type_entity;
      if ((ent.use_dynamic_chart_type || this.config.use_dynamic_chart_type) && chartTypeEnt && this.hass.states[chartTypeEnt]) {
        const dynType = this.hass.states[chartTypeEnt].state;
        if (['line', 'bar', 'scatter'].includes(dynType)) {
          cType = dynType; bMode = 'standard';
        } else if (dynType === 'floating_bar') {
          cType = 'bar'; bMode = 'floating';
        } else if (dynType === 'stacked_bar') {
          cType = 'bar'; bMode = 'stacked';
        }
      }
      
      const hidePoints = ent.show_data_points === false || this.config.show_data_points === false;

      const baseDataset = {
        entity_id: ent.entity,
        entity_index: idx,
        label: ent.legend_label || ent.entity,
        unit: unit,
        tooltip_format: ent.tooltip_format,
        tooltip_decimals: ent.tooltip_decimals,
        borderWidth: line_width ? Number(line_width) : (cType === 'line' ? 2 : (cType === 'scatter' ? 0 : 1)),
        tension: ent.smoothing ? 0.4 : 0,
        pointRadius: hidePoints ? 0 : (cType === 'scatter' ? 4 : 3),
        pointHoverRadius: hidePoints ? (cType === 'scatter' ? 6 : 4) : (cType === 'scatter' ? 6 : 4),
        showLine: cType !== 'scatter',
        borderDash: ent.line_style === 'dashed' ? [5, 5] : (ent.line_style === 'dotted' ? [2, 3] : []),
        type: cType === 'scatter' ? 'line' : (cType || 'bar'),
        minBarLength: 2,
        borderSkipped: false
      };

      const rawPoints = this.chartDatasets[idx] || [];
      const useMinMax = (cType === 'bar' && (bMode === 'floating' || (bMode === 'stacked' && ent.use_min_max)));
      const calculateDelta = ent.calculate_delta || ent.stat_type === 'delta' || ent.stat_type === 'diff';
      
      let prevVal = null;
      const rawData = rawPoints.map(point => {
        if (!point) return null;
        if (useMinMax && point.min !== undefined && point.max !== undefined) {
          return [Number(point.min), Number(point.max)];
        } else if (calculateDelta) {
          const curRaw = point.state !== undefined ? point.state : (point.max !== undefined ? point.max : (point.mean !== undefined ? point.mean : point.sum));
          const numCur = (curRaw !== null && curRaw !== undefined && !isNaN(Number(curRaw))) ? Number(curRaw) : null;
          
          if (numCur === null) {
            return null;
          }
          
          let val;
          if (prevVal === null) {
            val = (point.change !== undefined && point.change !== null) ? Number(point.change) : numCur;
          } else {
            if (numCur >= prevVal) {
              val = numCur - prevVal;
            } else {
              // Counter reset to 0 (e.g. daily reset at midnight)
              val = numCur >= 0 ? numCur : 0;
            }
          }
          prevVal = numCur;
          return val !== null && !isNaN(val) ? Number(val) : null;
        } else {
          let val;
          const isTotalIncreasing = this.hass?.states?.[ent.entity]?.attributes?.state_class === 'total_increasing' || ent.stat_type === 'change' || ent.stat_type === 'diff';
          if (isTotalIncreasing && point.change !== undefined && point.change !== null) {
            val = point.change;
          } else if (ent.stat_type === 'state') {
            val = point.state !== undefined ? point.state : point.mean;
          } else if (ent.stat_type === 'mean') {
            val = point.mean !== undefined ? point.mean : point.state;
          } else if (ent.stat_type === 'sum') {
            val = point.sum !== undefined ? point.sum : point.change;
          } else {
            val = point.state !== undefined ? point.state : (point.mean !== undefined ? point.mean : point.sum);
          }
          return val !== null ? Number(val) : null;
        }
      });
      
      const isFloatingOrStacked = cType === 'bar' && (bMode === 'floating' || bMode === 'stacked');
      const maxColor = ent.color_max || 'rgba(255, 99, 132, 1)';
      const maxBgColor = ent.bg_color_max || 'rgba(255, 99, 132, 0.5)';
      const minColor = ent.color_min || 'rgba(54, 162, 235, 1)';
      const minBgColor = ent.bg_color_min || 'rgba(54, 162, 235, 0.5)';
      const stdColor = color || 'rgba(54, 162, 235, 1)';
      const stdBgColor = bg_color || color || 'rgba(54, 162, 235, 0.5)';

      if (cType === 'bar' && bMode === 'stacked' && ent.use_min_max) {
        const dataMin = rawData.map(v => Array.isArray(v) ? [0, v[0]] : null);
        const dataMax = rawData.map(v => Array.isArray(v) ? [v[0], v[1]] : null);
        return [
          {
            ...baseDataset,
            data: dataMin,
            backgroundColor: minBgColor,
            borderColor: minColor,
            fill: true,
            grouped: false
          },
          {
            ...baseDataset,
            label: (ent.legend_label || ent.entity) + ' (Max)', // Different label for tooltip
            data: dataMax,
            backgroundColor: maxBgColor,
            borderColor: maxColor,
            fill: true,
            grouped: false
          }
        ];
      }

      if (cType === 'bar' && bMode === 'stacked') {
        return [{
          ...baseDataset,
          stack: ent.stack || 'total_stack',
          data: rawData,
          backgroundColor: stdBgColor,
          borderColor: stdColor,
          fill: true
        }];
      }
      
      return [{
        ...baseDataset,
        data: rawData,
        backgroundColor: isFloatingOrStacked ? maxBgColor : stdBgColor,
        borderColor: isFloatingOrStacked ? maxColor : stdColor,
        fill: cType === 'line' ? (!!bg_color) : true
      }];
    });

    if (this.chart && this._lastRenderConfig === configStr) {
      this.chart.data.labels = this.chartLabels;
      this.chart.data.datasets = datasets;
      this.chart.update();
      return;
    }

    let canvas = chartContainer.querySelector('canvas');
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
      if (canvas) {
        canvas.remove();
        canvas = null;
      }
    }
    
    if (!canvas) {
      canvas = document.createElement('canvas');
      chartContainer.innerHTML = '';
      chartContainer.appendChild(canvas);
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

    const beginAtZero = !entities.some(e => e.begin_at_zero === false);
    const yMin = entities.find(e => e.y_min !== undefined && e.y_min !== '')?.y_min;
    const yMax = entities.find(e => e.y_max !== undefined && e.y_max !== '')?.y_max;
    const isAnyStacked = datasets.some(d => d.stack !== undefined);

    this.chart = new Chart(canvas, {
      type: datasets.length > 0 ? datasets[0].type : 'bar',
      data: {
        labels: this.chartLabels,
        datasets: datasets
      },
      options: {
        indexAxis: this.config.horizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        animation: {
          duration: 400,
          easing: this.config.animation_easing || 'easeOutQuart'
        },
        color: this.hass.themes?.darkMode ? '#fff' : '#666',
        onHover: (event, chartElement) => {
          if (event && event.native && event.native.target) {
            const hasElement = chartElement && chartElement.length > 0;
            const hasCardTap = Boolean(this.config.tap_action && this.config.tap_action !== 'none' && this.config.tap_action?.action !== 'none');
            event.native.target.style.cursor = (hasElement || hasCardTap) ? 'pointer' : 'default';
          }
        },
        onClick: (event, elements) => {
          if (elements && elements.length > 0) {
            const firstElement = elements[0];
            const dataset = this.chart.data.datasets[firstElement.datasetIndex];
            const entityId = dataset?.entity_id;
            const entityConfig = this._entities ? this._entities.find(e => e.entity === entityId) : null;
            this._handleChartElementClick(entityConfig || { entity: entityId }, dataset);
          } else {
            this._handleCardTap();
          }
        },
        scales: {
          y: {
            stacked: isAnyStacked,
            beginAtZero: beginAtZero,
            ...(yMin !== undefined && yMin !== '' ? { min: Number(yMin) } : {}),
            ...(yMax !== undefined && yMax !== '' ? { max: Number(yMax) } : {}),
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
            stacked: isAnyStacked,
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
            enabled: this.config.show_tooltip !== false,
            bodySpacing: 8,
            titleSpacing: 8,
            padding: 12,
            callbacks: {
              title: (tooltipItems) => {
                if (this.chartFullLabels && tooltipItems.length > 0) {
                  return this.chartFullLabels[tooltipItems[0].dataIndex];
                }
                return tooltipItems[0].label;
              },
              label: (tooltipItem) => {
                const dataset = tooltipItem.dataset;
                let value = tooltipItem.formattedValue;
                const rawVal = tooltipItem.raw;
                
                const decimalsConfig = dataset.tooltip_decimals !== undefined && dataset.tooltip_decimals !== '' ? dataset.tooltip_decimals : this.config.tooltip_decimals;
                
                if (Array.isArray(rawVal)) {
                  if (rawVal[0] === 0) {
                    // This is the Min part of a stacked bar
                    if (decimalsConfig !== undefined && decimalsConfig !== '') {
                      const decimals = Number(decimalsConfig);
                      value = rawVal[1].toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
                    } else {
                      value = String(rawVal[1]);
                    }
                  } else {
                    // This is the Max part of a stacked bar, or a floating bar
                    const isStacked = dataset.label && dataset.label.endsWith('(Max)');
                    if (decimalsConfig !== undefined && decimalsConfig !== '') {
                      const decimals = Number(decimalsConfig);
                      const minStr = rawVal[0].toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
                      const maxStr = rawVal[1].toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
                      value = isStacked ? maxStr : `${minStr} bis ${maxStr}`;
                    } else {
                      value = isStacked ? String(rawVal[1]) : `${rawVal[0]} bis ${rawVal[1]}`;
                    }
                  }
                } else if (typeof rawVal === 'number' && decimalsConfig !== undefined && decimalsConfig !== '') {
                  const decimals = Number(decimalsConfig);
                  value = rawVal.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
                }
                
                const name = dataset.label;
                const unit = dataset.unit || '';
                
                let format = dataset.tooltip_format || this.config.tooltip_format;
                if (!format) {
                   return `${name}: ${value} ${unit}`.trim();
                }
                
                return format
                  .replace(/{name}/g, name)
                  .replace(/{value}/g, value)
                  .replace(/{unit}/g, unit);
              },
              footer: (tooltipItems) => {
                if (!isAnyStacked || tooltipItems.length <= 1) return '';
                let sum = 0;
                let unit = '';
                let hasVal = false;
                tooltipItems.forEach(item => {
                  if (typeof item.raw === 'number') {
                    sum += item.raw;
                    hasVal = true;
                    if (!unit && item.dataset.unit) unit = item.dataset.unit;
                  }
                });
                if (!hasVal) return '';
                const decimals = this.config.tooltip_decimals !== undefined && this.config.tooltip_decimals !== '' ? Number(this.config.tooltip_decimals) : 2;
                return `Gesamt: ${sum.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${unit ? ` ${unit}` : ''}`;
              }
            }
          }
        }
      }
    });
  }

  get _calculatedTotal() {
    let totalSum = 0;
    let hasData = false;
    let unit = '';
    let decimals = this.config.tooltip_decimals !== undefined && this.config.tooltip_decimals !== '' 
      ? Number(this.config.tooltip_decimals) 
      : 1;

    const entities = this._entities;
    const entitySummaries = [];
    if (this.chartDatasets && this.chartDatasets.length > 0) {
      entities.forEach((ent, idx) => {
        let entUnit = '';
        if (this.hass?.states?.[ent.entity]?.attributes?.unit_of_measurement) {
          entUnit = this.hass.states[ent.entity].attributes.unit_of_measurement;
        }
        if (!unit && entUnit) {
          unit = entUnit;
        }
        const pts = this.chartDatasets[idx] || [];
        const calculateDelta = ent.calculate_delta || ent.stat_type === 'delta' || ent.stat_type === 'diff';
        const isTotalIncreasing = this.hass?.states?.[ent.entity]?.attributes?.state_class === 'total_increasing' || ent.stat_type === 'change';

        let prevVal = null;
        let entSum = 0;
        let entHasData = false;
        pts.forEach(point => {
          if (!point) return;
          let val = null;
          if (calculateDelta) {
            const curRaw = point.state !== undefined ? point.state : (point.max !== undefined ? point.max : (point.mean !== undefined ? point.mean : point.sum));
            const numCur = (curRaw !== null && curRaw !== undefined && !isNaN(Number(curRaw))) ? Number(curRaw) : null;
            if (numCur !== null) {
              if (prevVal === null) {
                val = (point.change !== undefined && point.change !== null) ? Number(point.change) : numCur;
              } else {
                if (numCur >= prevVal) {
                  val = numCur - prevVal;
                } else {
                  val = numCur >= 0 ? numCur : 0;
                }
              }
              prevVal = numCur;
            }
          } else if (isTotalIncreasing && point.change !== undefined && point.change !== null) {
            val = Number(point.change);
          } else if (ent.stat_type === 'sum') {
            val = Number(point.sum !== undefined ? point.sum : point.change);
          } else if (ent.stat_type === 'state') {
            val = Number(point.state !== undefined ? point.state : point.mean);
          } else {
            val = Number(point.state !== undefined ? point.state : (point.mean !== undefined ? point.mean : point.sum));
          }

          if (val !== null && !isNaN(val)) {
            entSum += val;
            entHasData = true;
          }
        });

        if (entHasData) {
          hasData = true;
          totalSum += entSum;
          const entDecimals = ent.tooltip_decimals !== undefined && ent.tooltip_decimals !== '' ? Number(ent.tooltip_decimals) : decimals;
          entitySummaries.push({
            label: ent.legend_label || ent.entity,
            value: entSum,
            formatted: entSum.toLocaleString(undefined, { minimumFractionDigits: entDecimals, maximumFractionDigits: entDecimals }),
            unit: entUnit || unit
          });
        }
      });
    }

    if (!hasData) return null;
    const formattedTotal = totalSum.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    
    let fullStr = `${formattedTotal}${unit ? ` ${unit}` : ''}`;
    const isBreakdownOnly = this.config.sum_entities === false;
    if (entitySummaries.length > 1) {
      const breakdown = entitySummaries.map(s => `${s.label}: ${s.formatted}${s.unit ? ` ${s.unit}` : ''}`).join(' • ');
      if (isBreakdownOnly) {
        fullStr = breakdown;
      } else {
        fullStr = `${formattedTotal}${unit ? ` ${unit}` : ''} (${breakdown})`;
      }
    }

    return {
      value: totalSum,
      formatted: formattedTotal,
      unit: unit,
      full: fullStr,
      isBreakdownOnly: isBreakdownOnly && entitySummaries.length > 1,
      entities: entitySummaries
    };
  }

  get _renderedTitle() {
    let title = this.config.title || '';
    if (!title) return title;
    
    if (this._currentStart && this._currentEnd && title.includes('{date_range}')) {
      const s = new Date(this._currentStart);
      const e = new Date(this._currentEnd);
      const formatStr = this.config.format_title_date || 'DD.MM.YYYY';
      
      const sStr = this._formatDate(s, formatStr);
      const eStr = this._formatDate(e, formatStr);
      
      const dateRange = (sStr === eStr) ? sStr : `${sStr} - ${eStr}`;
      title = title.replace('{date_range}', dateRange);
    }

    if (title.includes('{start_date}') && this._currentStart) {
      const formatStr = this.config.format_title_date || 'DD.MM.YYYY';
      title = title.replace('{start_date}', this._formatDate(new Date(this._currentStart), formatStr));
    }
    if (title.includes('{end_date}') && this._currentEnd) {
      const formatStr = this.config.format_title_date || 'DD.MM.YYYY';
      title = title.replace('{end_date}', this._formatDate(new Date(this._currentEnd), formatStr));
    }

    if (title.includes('{total}') || title.includes('{sum}') || title.includes('{gesamt}')) {
      const tot = this._calculatedTotal;
      const totalStr = tot ? tot.full : '';
      title = title.replace(/{total}|{sum}|{gesamt}/g, totalStr);
    }
    
    return title;
  }

  _formatDate(date, format) {
    const map = {
      'YYYY': date.getFullYear(),
      'YY': String(date.getFullYear()).slice(-2),
      'MM': String(date.getMonth() + 1).padStart(2, '0'),
      'M': date.getMonth() + 1,
      'DD': String(date.getDate()).padStart(2, '0'),
      'D': date.getDate(),
      'HH': String(date.getHours()).padStart(2, '0'),
      'H': date.getHours(),
      'mm': String(date.getMinutes()).padStart(2, '0'),
      'm': date.getMinutes(),
      'ss': String(date.getSeconds()).padStart(2, '0'),
      's': date.getSeconds()
    };
    
    const tokens = Object.keys(map).sort((a, b) => b.length - a.length);
    let result = format;
    for (const token of tokens) {
      result = result.replace(new RegExp(token, 'g'), map[token]);
    }
    return result;
  }

  _handleTitleTap(ev) {
    if (ev) ev.stopPropagation();
    if (!this.config.tap_action || this.config.tap_action === "none") return;
    this._handleCardTap();
  }

  _handleCardTap() {
    if (!this.config.tap_action || this.config.tap_action === "none") return;
    const actionConfig = typeof this.config.tap_action === "string"
      ? { action: this.config.tap_action }
      : { ...this.config.tap_action };
    if (actionConfig.action === "none") return;

    const defaultEntity = this._entities?.[0]?.entity;
    const entityId = actionConfig.entity || defaultEntity;

    const event = new CustomEvent("hass-action", {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: {
        config: {
          entity: entityId,
          tap_action: actionConfig,
        },
        action: "tap",
      },
    });
    this.dispatchEvent(event);

    if ((!actionConfig.action || actionConfig.action === "more-info") && entityId) {
      const moreInfo = new CustomEvent("hass-more-info", {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { entityId },
      });
      this.dispatchEvent(moreInfo);
    }
  }

  _handleChartElementClick(entityConfig, dataset) {
    let tapAction = entityConfig?.tap_action !== undefined ? entityConfig.tap_action : this.config.tap_action;
    if (tapAction === undefined) {
      tapAction = { action: "more-info" };
    }
    if (tapAction === "none" || (typeof tapAction === "object" && tapAction.action === "none")) {
      return;
    }

    const actionConfig = typeof tapAction === "string" ? { action: tapAction } : { ...tapAction };
    const entityId = actionConfig.entity || entityConfig?.entity || dataset?.entity_id;

    const event = new CustomEvent("hass-action", {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: {
        config: {
          entity: entityId,
          tap_action: actionConfig,
        },
        action: "tap",
      },
    });
    this.dispatchEvent(event);

    if ((!actionConfig.action || actionConfig.action === "more-info") && entityId) {
      const moreInfo = new CustomEvent("hass-more-info", {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { entityId },
      });
      this.dispatchEvent(moreInfo);
    }
  }

  render() {
    if (!this.config) return html``;
    const hasCardTap = Boolean(this.config.tap_action && this.config.tap_action !== 'none' && this.config.tap_action?.action !== 'none');

    return html`
      <ha-card style=${this._currentCardBgColor ? `background: ${this._currentCardBgColor};` : ''}>
        ${this.config.title || this.config.show_navigation || (this.config.show_total && this._calculatedTotal) ? html`
          <div class="card-header-custom">
            ${this.config.show_navigation ? html`<ha-icon-button .path=${"M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z"} @click=${() => this.navigateTime(-1)}></ha-icon-button>` : ''}
            <div class="card-title-container ${hasCardTap ? 'clickable' : ''}" @click=${(ev) => this._handleTitleTap(ev)}>
              <h1 class="card-title">${this._renderedTitle}</h1>
              ${this.config.show_total && this._calculatedTotal ? html`
                <div class="card-total-subtitle" style="font-size: 13px; font-weight: 500; opacity: 0.85; margin-top: 4px; text-align: center; line-height: 1.4;">
                  ${this._calculatedTotal.isBreakdownOnly ? '' : 'Gesamt: '}${this._calculatedTotal.full}
                </div>
              ` : ''}
            </div>
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
      .card-title-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex: 1;
        transition: opacity 0.15s ease;
      }
      .card-title-container.clickable {
        cursor: pointer;
      }
      .card-title-container.clickable:hover {
        opacity: 0.8;
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
