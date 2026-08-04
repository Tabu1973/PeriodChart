import { LitElement, html, css } from 'lit';

const fireEvent = (node, type, detail, options) => {
  options = options || {};
  detail = detail === null || detail === undefined ? {} : detail;
  const event = new Event(type, {
    bubbles: options.bubbles === undefined ? true : options.bubbles,
    cancelable: Boolean(options.cancelable),
    composed: options.composed === undefined ? true : options.composed
  });
  event.detail = detail;
  node.dispatchEvent(event);
  return event;
};

class FixedPeriodChartEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      _config: { type: Object }
    };
  }

  setConfig(config) {
    this._config = config;
  }

  get _entity() {
    return this._config?.entity || '';
  }

  get _period() {
    return this._config?.period || 'this_year';
  }

  get _resolution() {
    return this._config?.resolution || 'day';
  }

  get _chart_type() {
    return this._config?.chart_type || 'bar';
  }

  get _show_date_picker() {
    return this._config?.show_date_picker !== false; // Default true if not defined
  }

  render() {
    if (!this.hass || !this._config) {
      return html``;
    }

    return html`
      <div class="card-config">
        <ha-entity-picker
          .label=${"Entity (Sensor)"}
          .hass=${this.hass}
          .value=${this._entity}
          @value-changed=${(ev) => this._updateConfig('entity', ev.detail.value)}
          allow-custom-entity
        ></ha-entity-picker>

        <div class="side-by-side">
          <div>
            <span class="label">Period</span>
            <select @change=${(ev) => this._updateConfig('period', ev.target.value)}>
              <option value="this_year" ?selected=${this._period === 'this_year'}>This Year</option>
              <option value="last_year" ?selected=${this._period === 'last_year'}>Last Year</option>
              <option value="this_month" ?selected=${this._period === 'this_month'}>This Month</option>
              <option value="last_month" ?selected=${this._period === 'last_month'}>Last Month</option>
              <option value="today" ?selected=${this._period === 'today'}>Today</option>
            </select>
          </div>

          <div>
            <span class="label">Resolution</span>
            <select @change=${(ev) => this._updateConfig('resolution', ev.target.value)}>
              <option value="day" ?selected=${this._resolution === 'day'}>Day</option>
              <option value="hour" ?selected=${this._resolution === 'hour'}>Hour</option>
              <option value="5minute" ?selected=${this._resolution === '5minute'}>5 Minute</option>
            </select>
          </div>
        </div>

        <div class="side-by-side">
          <div>
            <span class="label">Chart Type</span>
            <select @change=${(ev) => this._updateConfig('chart_type', ev.target.value)}>
              <option value="bar" ?selected=${this._chart_type === 'bar'}>Bar</option>
              <option value="line" ?selected=${this._chart_type === 'line'}>Line</option>
            </select>
          </div>

          <ha-formfield .label=${"Show Date Picker"}>
            <ha-switch
              .checked=${this._show_date_picker !== false}
              @change=${(ev) => this._updateConfig('show_date_picker', ev.target.checked)}
            ></ha-switch>
          </ha-formfield>
        </div>
      </div>
    `;
  }

  _updateConfig(key, value) {
    if (!this._config || !this.hass) {
      return;
    }
    
    // For properties that start with underscore
    if (this[`_${key}`] === value) {
      return;
    }

    if (value === '' || value === undefined) {
      const tmpConfig = { ...this._config };
      delete tmpConfig[key];
      this._config = tmpConfig;
    } else {
      this._config = {
        ...this._config,
        [key]: value
      };
    }
    
    fireEvent(this, 'config-changed', { config: this._config });
  }

  static get styles() {
    return css`
      .card-config {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      ha-entity-picker {
        width: 100%;
      }
      .side-by-side {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .side-by-side > * {
        flex: 1;
      }
      select {
        width: 100%;
        padding: 10px;
        border-radius: 4px;
        border: 1px solid var(--divider-color, #ccc);
        background-color: var(--card-background-color, #fff);
        color: var(--primary-text-color, #000);
        font-size: 16px;
        font-family: inherit;
        outline: none;
      }
      select:focus {
        border-color: var(--primary-color, #03a9f4);
      }
      .label {
        font-size: 12px;
        color: var(--secondary-text-color, #888);
        margin-bottom: 4px;
        display: block;
      }
    `;
  }
}

customElements.define('fixed-period-chart-editor', FixedPeriodChartEditor);
