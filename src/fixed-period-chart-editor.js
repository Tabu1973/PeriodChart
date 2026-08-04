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

  get _title() {
    return this._config?.title || '';
  }

  get _color() {
    return this._config?.color || '';
  }

  get _show_legend() {
    return this._config?.show_legend !== false; // Default true
  }

  get _show_tooltip() {
    return this._config?.show_tooltip !== false; // Default true
  }

  get _show_navigation() {
    return this._config?.show_navigation === true; // Default false
  }

  get _period_entity() {
    return this._config?.period_entity || '';
  }

  get _start_entity() {
    return this._config?.start_entity || '';
  }

  get _end_entity() {
    return this._config?.end_entity || '';
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
            <select class="styled-select" @change=${(ev) => this._updateConfig('period', ev.target.value)}>
              <option value="this_year" ?selected=${this._period === 'this_year'}>This Year</option>
              <option value="last_year" ?selected=${this._period === 'last_year'}>Last Year</option>
              <option value="this_month" ?selected=${this._period === 'this_month'}>This Month</option>
              <option value="last_month" ?selected=${this._period === 'last_month'}>Last Month</option>
              <option value="today" ?selected=${this._period === 'today'}>Today</option>
            </select>
          </div>

          <div>
            <span class="label">Resolution</span>
            <select class="styled-select" @change=${(ev) => this._updateConfig('resolution', ev.target.value)}>
              <option value="day" ?selected=${this._resolution === 'day'}>Day</option>
              <option value="hour" ?selected=${this._resolution === 'hour'}>Hour</option>
              <option value="5minute" ?selected=${this._resolution === '5minute'}>5 Minute</option>
            </select>
          </div>
        </div>

        <div class="side-by-side">
          <ha-textfield
            label="Title (Optional)"
            .value=${this._title}
            @change=${(ev) => this._updateConfig('title', ev.target.value)}
          ></ha-textfield>

          <ha-textfield
            label="Color (Hex or Name)"
            .value=${this._color}
            @change=${(ev) => this._updateConfig('color', ev.target.value)}
          ></ha-textfield>
        </div>

        <div class="side-by-side">
          <ha-entity-picker
            .label=${"Period Entity (Optional)"}
            .hass=${this.hass}
            .value=${this._period_entity}
            .includeDomains=${['input_select']}
            @value-changed=${(ev) => this._updateConfig('period_entity', ev.detail.value)}
            allow-custom-entity
          ></ha-entity-picker>
        </div>

        <div class="side-by-side">
          <ha-entity-picker
            .label=${"Start Entity (Optional)"}
            .hass=${this.hass}
            .value=${this._start_entity}
            .includeDomains=${['input_datetime']}
            @value-changed=${(ev) => this._updateConfig('start_entity', ev.detail.value)}
            allow-custom-entity
          ></ha-entity-picker>

          <ha-entity-picker
            .label=${"End Entity (Optional)"}
            .hass=${this.hass}
            .value=${this._end_entity}
            .includeDomains=${['input_datetime']}
            @value-changed=${(ev) => this._updateConfig('end_entity', ev.detail.value)}
            allow-custom-entity
          ></ha-entity-picker>
        </div>

        <div class="side-by-side">
          <div>
            <span class="label">Chart Type</span>
            <select class="styled-select" @change=${(ev) => this._updateConfig('chart_type', ev.target.value)}>
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

        <div class="side-by-side">
          <ha-formfield .label=${"Show Legend"}>
            <ha-switch
              .checked=${this._show_legend !== false}
              @change=${(ev) => this._updateConfig('show_legend', ev.target.checked)}
            ></ha-switch>
          </ha-formfield>

          <ha-formfield .label=${"Show Tooltips"}>
            <ha-switch
              .checked=${this._show_tooltip !== false}
              @change=${(ev) => this._updateConfig('show_tooltip', ev.target.checked)}
            ></ha-switch>
          </ha-formfield>

          <ha-formfield .label=${"Show Navigation Arrows"}>
            <ha-switch
              .checked=${this._show_navigation === true}
              @change=${(ev) => this._updateConfig('show_navigation', ev.target.checked)}
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
      .label {
        display: block;
        color: var(--secondary-text-color);
        font-size: 12px;
        margin-bottom: 8px;
      }
      .styled-select {
        width: 100%;
        padding: 12px 16px;
        border-radius: 4px;
        border: 1px solid var(--divider-color, #e0e0e0);
        background-color: var(--card-background-color, #fff);
        color: var(--primary-text-color, #212121);
        font-size: 16px;
        font-family: var(--paper-font-body1_-_font-family, 'Roboto', 'Noto', sans-serif);
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20fill%3D%22%23757575%22%20d%3D%22M7%2010l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E");
        background-repeat: no-repeat;
        background-position: right 8px center;
        background-size: 24px;
        transition: border-color 0.15s ease-in-out;
        cursor: pointer;
      }
      .styled-select:focus {
        outline: none;
        border-color: var(--primary-color, #03a9f4);
        border-width: 2px;
        padding: 11px 15px; /* adjust for 2px border */
      }
      .styled-select:hover {
        background-color: rgba(var(--rgb-primary-text-color), 0.04);
      }
    `;
  }
}

customElements.define('fixed-period-chart-editor', FixedPeriodChartEditor);
