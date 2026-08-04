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
          .configValue=${"entity"}
          @value-changed=${this._valueChanged}
          allow-custom-entity
        ></ha-entity-picker>

        <div class="side-by-side">
          <ha-select
            label="Period"
            .configValue=${"period"}
            .value=${this._period}
            @closed=${this._valueChanged}
          >
            <mwc-list-item value="this_year">This Year</mwc-list-item>
            <mwc-list-item value="last_year">Last Year</mwc-list-item>
            <mwc-list-item value="this_month">This Month</mwc-list-item>
            <mwc-list-item value="last_month">Last Month</mwc-list-item>
            <mwc-list-item value="today">Today</mwc-list-item>
          </ha-select>

          <ha-select
            label="Resolution"
            .configValue=${"resolution"}
            .value=${this._resolution}
            @closed=${this._valueChanged}
          >
            <mwc-list-item value="day">Day</mwc-list-item>
            <mwc-list-item value="hour">Hour</mwc-list-item>
            <mwc-list-item value="5minute">5 Minute</mwc-list-item>
          </ha-select>
        </div>

        <div class="side-by-side">
          <ha-select
            label="Chart Type"
            .configValue=${"chart_type"}
            .value=${this._chart_type}
            @closed=${this._valueChanged}
          >
            <mwc-list-item value="bar">Bar</mwc-list-item>
            <mwc-list-item value="line">Line</mwc-list-item>
          </ha-select>

          <ha-formfield .label=${"Show Date Picker"}>
            <ha-switch
              .checked=${this._show_date_picker !== false}
              .configValue=${"show_date_picker"}
              @change=${this._valueChanged}
            ></ha-switch>
          </ha-formfield>
        </div>
      </div>
    `;
  }

  _valueChanged(ev) {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    if (this[`_${target.configValue}`] === target.value) {
      return;
    }
    
    let newValue = target.value;
    if (target.configValue === 'show_date_picker') {
      newValue = target.checked;
    }

    if (target.configValue) {
      if (newValue === '') {
        const tmpConfig = { ...this._config };
        delete tmpConfig[target.configValue];
        this._config = tmpConfig;
      } else {
        this._config = {
          ...this._config,
          [target.configValue]: newValue
        };
      }
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
    `;
  }
}

customElements.define('fixed-period-chart-editor', FixedPeriodChartEditor);
