import { LitElement, html, css } from 'lit';
import localize from './localize';

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

  _localize(key) {
    const lang = this.hass?.locale?.language || this.hass?.language;
    return localize(key, lang);
  }

  get _entity() {
    return this._config?.entity || '';
  }

  get _period() {
    if (this._config?.period === 'custom') return 'custom';
    if (!this._config?.period && (this._config?.period_entity || this._config?.start_entity || this._config?.start)) return 'custom';
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

  get _bg_color() {
    return this._config?.bg_color || '';
  }

  get _line_width() {
    return this._config?.line_width || '';
  }

  get _card_bg_color() {
    return this._config?.card_bg_color || '';
  }

  get _legend_label() {
    return this._config?.legend_label || '';
  }

  get _smoothing() {
    return this._config?.smoothing === true; // Default false
  }

  get _show_data_points() {
    return this._config?.show_data_points !== false; // Default true
  }

  get _show_grid_x() {
    return this._config?.show_grid_x !== false; // Default true
  }

  get _show_grid_y() {
    return this._config?.show_grid_y !== false; // Default true
  }

  get _show_axis_x() {
    return this._config?.show_axis_x !== false; // Default true
  }

  get _show_axis_y() {
    return this._config?.show_axis_y !== false; // Default true
  }

  get _max_ticks_x() {
    return this._config?.max_ticks_x || '';
  }

  get _step_size_y() {
    return this._config?.step_size_y || '';
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

  get _resolution_entity() {
    return this._config?.resolution_entity || '';
  }

  get _color_entity() {
    return this._config?.color_entity || '';
  }

  get _bg_color_entity() {
    return this._config?.bg_color_entity || '';
  }

  get _card_bg_color_entity() {
    return this._config?.card_bg_color_entity || '';
  }

  get _line_width_entity() {
    return this._config?.line_width_entity || '';
  }

  render() {
    if (!this.hass || !this._config) {
      return html``;
    }

    const useDynamicLineWidth = !!this._config.use_dynamic_line_width;

    return html`
      <div class="card-config">
        
        <details class="config-section" open>
          <summary><h3>${this._localize('section.basic')}</h3></summary>
          <ha-entity-picker
            .label=${this._localize('label.entity')}
            .hass=${this.hass}
            .value=${this._entity}
            @value-changed=${(ev) => this._updateConfig('entity', ev.detail.value)}
            allow-custom-entity
          ></ha-entity-picker>

          <div class="side-by-side" style="margin-top: 16px;">
            <div>
              <span class="label">${this._localize("label.title")}</span>
              <input type="text" class="styled-input" .value=${this._title} @input=${(ev) => this._updateConfig('title', ev.target.value)}>
            </div>
            <div>
              <span class="label">${this._localize("label.legend_label")}</span>
              <input type="text" class="styled-input" .value=${this._legend_label} @input=${(ev) => this._updateConfig('legend_label', ev.target.value)}>
            </div>
          </div>
        </details>

        <details class="config-section">
          <summary><h3>${this._localize('section.time')}</h3></summary>
          <div class="side-by-side">
            <div>
              <span class="label">${this._localize("label.period")}</span>
              <select class="styled-select" @change=${(ev) => this._updateConfig('period', ev.target.value)}>
                <option value="this_year" ?selected=${this._period === 'this_year'}>${this._localize("period.this_year")}</option>
                <option value="last_year" ?selected=${this._period === 'last_year'}>${this._localize("period.last_year")}</option>
                <option value="this_month" ?selected=${this._period === 'this_month'}>${this._localize("period.this_month")}</option>
                <option value="last_month" ?selected=${this._period === 'last_month'}>${this._localize("period.last_month")}</option>
                <option value="this_week" ?selected=${this._period === 'this_week'}>${this._localize("period.this_week")}</option>
                <option value="last_week" ?selected=${this._period === 'last_week'}>${this._localize("period.last_week")}</option>
                <option value="today" ?selected=${this._period === 'today'}>${this._localize("period.today")}</option>
                <option value="yesterday" ?selected=${this._period === 'yesterday'}>${this._localize("period.yesterday")}</option>
                <option value="custom" ?selected=${this._period === 'custom'}>${this._localize("period.custom")}</option>
              </select>
            </div>

            <div>
              <span class="label">${this._localize("label.resolution")}</span>
              <select class="styled-select" @change=${(ev) => this._updateConfig('resolution', ev.target.value)}>
                <option value="day" ?selected=${this._resolution === 'day'}>${this._localize("resolution.day")}</option>
                <option value="hour" ?selected=${this._resolution === 'hour'}>${this._localize("resolution.hour")}</option>
                <option value="5minute" ?selected=${this._resolution === '5minute'}>${this._localize("resolution.5minute")}</option>
                <option value="custom" ?selected=${this._resolution === 'custom'}>${this._localize("resolution.custom")}</option>
              </select>
            </div>
          </div>

          ${this._period === 'custom' ? html`
            ${this._config.use_period_entity && this._config.use_start_end_entities ? html`
              <div style="margin-top: 16px; padding: 8px; background-color: var(--secondary-background-color); border-radius: 4px; font-size: 12px; color: var(--secondary-text-color);">
                <strong>${this._localize("note.custom_period")}</strong> 
              </div>
            ` : ''}
            <div class="side-by-side" style="margin-top: 16px;">
              <ha-formfield .label=${this._localize("label.use_period_entity")}>
                <ha-switch
                  .checked=${this._config.use_period_entity === true}
                  @change=${(ev) => this._updateConfig('use_period_entity', ev.target.checked)}
                ></ha-switch>
              </ha-formfield>
            </div>
            ${this._config.use_period_entity ? html`
              <div class="side-by-side" style="margin-top: 8px; margin-bottom: 16px;">
                <ha-entity-picker
                  .label=${this._localize("label.period_entity")}
                  .hass=${this.hass}
                  .value=${this._period_entity}
                  .includeDomains=${['input_select']}
                  @value-changed=${(ev) => this._updateConfig('period_entity', ev.detail.value)}
                  allow-custom-entity
                ></ha-entity-picker>
              </div>
            ` : ''}

            <div class="side-by-side" style="margin-top: 16px;">
              <ha-formfield .label=${this._localize("label.use_start_end_entities")}>
                <ha-switch
                  .checked=${this._config.use_start_end_entities === true}
                  @change=${(ev) => this._updateConfig('use_start_end_entities', ev.target.checked)}
                ></ha-switch>
              </ha-formfield>
            </div>
            ${this._config.use_start_end_entities ? html`
              <div class="side-by-side" style="margin-top: 8px;">
                <ha-entity-picker
                  .label=${this._localize("label.start_entity")}
                  .hass=${this.hass}
                  .value=${this._start_entity}
                  .includeDomains=${['input_datetime']}
                  @value-changed=${(ev) => this._updateConfig('start_entity', ev.detail.value)}
                  allow-custom-entity
                ></ha-entity-picker>

                <ha-entity-picker
                  .label=${this._localize("label.end_entity")}
                  .hass=${this.hass}
                  .value=${this._end_entity}
                  .includeDomains=${['input_datetime']}
                  @value-changed=${(ev) => this._updateConfig('end_entity', ev.detail.value)}
                  allow-custom-entity
                ></ha-entity-picker>
              </div>
            ` : ''}
          ` : ''}

          ${this._resolution === 'custom' ? html`
            <div class="side-by-side" style="margin-top: 16px;">
              <ha-entity-picker
                .label=${this._localize("label.resolution_entity")}
                .hass=${this.hass}
                .value=${this._resolution_entity}
                .includeDomains=${['input_select', 'input_text']}
                @value-changed=${(ev) => this._updateConfig('resolution_entity', ev.detail.value)}
                allow-custom-entity
              ></ha-entity-picker>
            </div>
          ` : ''}
        </details>

        <details class="config-section">
          <summary><h3>${this._localize('section.appearance')}</h3></summary>
          <div class="side-by-side">
            <div>
              <span class="label">${this._localize("label.chart_type")}</span>
              <select class="styled-select" @change=${(ev) => this._updateConfig('chart_type', ev.target.value)}>
                <option value="bar" ?selected=${this._chart_type === 'bar'}>${this._localize("type.bar")}</option>
                <option value="line" ?selected=${this._chart_type === 'line'}>${this._localize("type.line")}</option>
              </select>
            </div>
            <div>
              <span class="label">${this._localize("label.line_width")}</span>
              <input type="number" class="styled-input" .value=${this._line_width} @input=${(ev) => this._updateConfig('line_width', ev.target.value)} placeholder=${this._localize("label.auto")}>
            </div>
          </div>

          ${this._chart_type === 'line' ? html`
            <div class="side-by-side" style="margin-top: 16px;">
              <ha-formfield .label=${this._localize("label.smooth_lines")}>
                <ha-switch
                  .checked=${this._smoothing === true}
                  @change=${(ev) => this._updateConfig('smoothing', ev.target.checked)}
                ></ha-switch>
              </ha-formfield>
              <ha-formfield .label=${this._localize("label.show_data_points")}>
                <ha-switch
                  .checked=${this._show_data_points !== false}
                  @change=${(ev) => this._updateConfig('show_data_points', ev.target.checked)}
                ></ha-switch>
              </ha-formfield>
            </div>
          ` : ''}

          <div style="margin-top: 16px;">
            <ha-formfield .label=${this._localize("label.use_dynamic_line_width")}>
              <ha-switch
                .checked=${useDynamicLineWidth}
                @change=${(ev) => this._updateConfig('use_dynamic_line_width', ev.target.checked)}
              ></ha-switch>
            </ha-formfield>
          </div>

          ${useDynamicLineWidth ? html`
            <div class="side-by-side" style="margin-top: 16px;">
              <ha-entity-picker
                .label=${this._localize("label.line_width_entity")}
                .hass=${this.hass}
                .value=${this._line_width_entity}
                .includeDomains=${['input_number', 'number']}
                @value-changed=${(ev) => this._updateConfig('line_width_entity', ev.detail.value)}
                allow-custom-entity
              ></ha-entity-picker>
            </div>
          ` : ''}
        </details>

        <details class="config-section">
          <summary><h3>${this._localize('section.colors')}</h3></summary>
          <div class="side-by-side">
            ${this.renderColorPicker("Line/Border Color", "color")}
          </div>
          <div class="side-by-side" style="margin-top: 16px;">
            ${this.renderColorPicker(this._localize("color.fill"), "bg_color")}
          </div>
          <div class="side-by-side" style="margin-top: 16px;">
            ${this.renderColorPicker("Card Background Color", "card_bg_color")}
          </div>
        </details>

        <details class="config-section">
          <summary><h3>${this._localize('section.display')}</h3></summary>
          <div class="side-by-side">
            <ha-formfield .label=${this._localize("label.show_date_picker")}>
              <ha-switch
                .checked=${this._show_date_picker !== false}
                @change=${(ev) => this._updateConfig('show_date_picker', ev.target.checked)}
              ></ha-switch>
            </ha-formfield>
            <ha-formfield .label=${this._localize("label.show_navigation")}>
              <ha-switch
                .checked=${this._show_navigation === true}
                @change=${(ev) => this._updateConfig('show_navigation', ev.target.checked)}
              ></ha-switch>
            </ha-formfield>
          </div>

          <div class="side-by-side" style="margin-top: 16px;">
            <ha-formfield .label=${this._localize("label.show_legend")}>
              <ha-switch
                .checked=${this._show_legend !== false}
                @change=${(ev) => this._updateConfig('show_legend', ev.target.checked)}
              ></ha-switch>
            </ha-formfield>
            <ha-formfield .label=${this._localize("label.show_tooltips")}>
              <ha-switch
                .checked=${this._show_tooltip !== false}
                @change=${(ev) => this._updateConfig('show_tooltip', ev.target.checked)}
              ></ha-switch>
            </ha-formfield>
          </div>

          <div class="side-by-side" style="margin-top: 16px;">
            <ha-formfield .label=${this._localize("label.show_x_axis")}>
              <ha-switch
                .checked=${this._show_axis_x !== false}
                @change=${(ev) => this._updateConfig('show_axis_x', ev.target.checked)}
              ></ha-switch>
            </ha-formfield>
            <ha-formfield .label=${this._localize("label.show_y_axis")}>
              <ha-switch
                .checked=${this._show_axis_y !== false}
                @change=${(ev) => this._updateConfig('show_axis_y', ev.target.checked)}
              ></ha-switch>
            </ha-formfield>
          </div>

          <div class="side-by-side" style="margin-top: 16px;">
            <ha-formfield .label=${this._localize("label.show_x_grid")}>
              <ha-switch
                .checked=${this._show_grid_x !== false}
                @change=${(ev) => this._updateConfig('show_grid_x', ev.target.checked)}
              ></ha-switch>
            </ha-formfield>
            <ha-formfield .label=${this._localize("label.show_y_grid")}>
              <ha-switch
                .checked=${this._show_grid_y !== false}
                @change=${(ev) => this._updateConfig('show_grid_y', ev.target.checked)}
              ></ha-switch>
            </ha-formfield>
          </div>

          <div class="side-by-side" style="margin-top: 16px;">
            <div>
              <span class="label">${this._localize("label.max_ticks_x")}</span>
              <input type="number" class="styled-input" .value=${this._max_ticks_x} @input=${(ev) => this._updateConfig('max_ticks_x', ev.target.value)} placeholder=${this._localize("label.auto")}>
            </div>
            <div>
              <span class="label">${this._localize("label.step_size_y")}</span>
              <input type="number" class="styled-input" .value=${this._step_size_y} @input=${(ev) => this._updateConfig('step_size_y', ev.target.value)} placeholder=${this._localize("label.auto")}>
            </div>
          </div>
        </details>

      </div>
    `;
  }

  _parseColor(colorStr) {
    let hex = '#03a9f4';
    let opacity = 1;
    if (!colorStr) return { hex, opacity };

    const str = colorStr.toLowerCase().trim();
    if (str.startsWith('#')) {
      hex = str.substring(0, 7);
      if (str.length === 9) {
        opacity = parseInt(str.substring(7, 9), 16) / 255;
      }
    } else if (str.startsWith('rgba(')) {
      const parts = str.replace('rgba(', '').replace(')', '').split(',');
      if (parts.length === 4) {
        const r = parseInt(parts[0].trim());
        const g = parseInt(parts[1].trim());
        const b = parseInt(parts[2].trim());
        opacity = parseFloat(parts[3].trim());
        hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      }
    } else if (str.startsWith('rgb(')) {
      const parts = str.replace('rgb(', '').replace(')', '').split(',');
      if (parts.length === 3) {
        const r = parseInt(parts[0].trim());
        const g = parseInt(parts[1].trim());
        const b = parseInt(parts[2].trim());
        hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      }
    } else if (str === 'transparent') {
      opacity = 0;
    }
    return { hex, opacity };
  }

  renderColorPicker(label, key) {
    const colorVal = this[`_${key}`] || '';
    const parsed = this._parseColor(colorVal);
    const entityKey = key + '_entity';
    const entityVal = this[`_${entityKey}`] || '';
    const useDynamic = !!this._config?.[`use_dynamic_${key}`];
    
    return html`
      <div style="flex: 1;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span class="label" style="margin: 0;">${label}</span>
          <ha-formfield .label=${this._localize("label.dynamic")}>
            <ha-switch
              .checked=${useDynamic}
              @change=${(ev) => this._updateConfig(`use_dynamic_${key}`, ev.target.checked)}
            ></ha-switch>
          </ha-formfield>
        </div>
        
        ${useDynamic ? html`
          <ha-entity-picker
            .label=${label + " Entity"}
            .hass=${this.hass}
            .value=${entityVal}
            @value-changed=${(ev) => this._updateConfig(entityKey, ev.detail.value)}
            allow-custom-entity
          ></ha-entity-picker>
        ` : html`
          <div style="display: flex; gap: 8px; flex-direction: column;">
            <div style="display: flex; gap: 8px; align-items: center;">
              <input type="color" style="height: 36px; width: 46px; padding: 0; cursor: pointer; border: 1px solid var(--divider-color); border-radius: 4px; flex-shrink: 0;" 
                     .value=${parsed.hex} 
                     @input=${(ev) => {
                       const r = parseInt(ev.target.value.slice(1, 3), 16);
                       const g = parseInt(ev.target.value.slice(3, 5), 16);
                       const b = parseInt(ev.target.value.slice(5, 7), 16);
                       this._updateConfig(key, `rgba(${r}, ${g}, ${b}, ${parsed.opacity})`);
                     }}>
              <input type="range" min="0" max="1" step="0.01" .value=${parsed.opacity} style="flex: 1; min-width: 60px;"
                     @input=${(ev) => {
                       const r = parseInt(parsed.hex.slice(1, 3), 16);
                       const g = parseInt(parsed.hex.slice(3, 5), 16);
                       const b = parseInt(parsed.hex.slice(5, 7), 16);
                       this._updateConfig(key, `rgba(${r}, ${g}, ${b}, ${ev.target.value})`);
                     }}>
              <span style="font-size: 12px; color: var(--secondary-text-color); width: 36px; text-align: right; flex-shrink: 0;">${Math.round(parsed.opacity * 100)}%</span>
            </div>
            <input type="text" class="styled-input" .value=${colorVal} @input=${(ev) => this._updateConfig(key, ev.target.value)} placeholder=${this._localize("color.placeholder")}>
          </div>
        `}
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
      .config-section {
        border: 1px solid var(--divider-color, #e0e0e0);
        border-radius: 8px;
        padding: 16px;
        background: var(--card-background-color, #fff);
      }
      details.config-section summary {
        cursor: pointer;
        list-style: none;
        display: flex;
        align-items: center;
        outline: none;
      }
      details.config-section summary h3 {
        margin-top: 0;
        margin-bottom: 0;
        flex: 1;
        font-size: 16px;
        font-weight: 500;
        color: var(--primary-text-color);
      }
      details.config-section summary::after {
        content: "▼";
        font-size: 12px;
        color: var(--secondary-text-color);
        transition: transform 0.2s;
      }
      details[open].config-section summary::after {
        transform: rotate(180deg);
      }
      details[open].config-section summary {
        margin-bottom: 16px;
        border-bottom: 1px solid var(--divider-color, #e0e0e0);
        padding-bottom: 8px;
      }
      .config-section h3 {
        margin-top: 0;
        margin-bottom: 16px;
        font-size: 16px;
        font-weight: 500;
        color: var(--primary-text-color);
        border-bottom: 1px solid var(--divider-color, #e0e0e0);
        padding-bottom: 8px;
      }
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
      .styled-select, .styled-input {
        width: 100%;
        padding: 12px 16px;
        border-radius: 4px;
        border: 1px solid var(--divider-color, #e0e0e0);
        background-color: var(--card-background-color, #fff);
        color: var(--primary-text-color, #212121);
        font-size: 16px;
        font-family: var(--paper-font-body1_-_font-family, 'Roboto', 'Noto', sans-serif);
        transition: border-color 0.15s ease-in-out;
        box-sizing: border-box;
      }
      .styled-select {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20fill%3D%22%23757575%22%20d%3D%22M7%2010l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E");
        background-repeat: no-repeat;
        background-position: right 8px center;
        background-size: 24px;
        cursor: pointer;
      }
      .styled-select:focus, .styled-input:focus {
        outline: none;
        border-color: var(--primary-color, #03a9f4);
        border-width: 2px;
        padding: 11px 15px; /* adjust for 2px border */
      }
      .styled-select:hover, .styled-input:hover {
        background-color: rgba(var(--rgb-primary-text-color), 0.04);
      }
    `;
  }
}

customElements.define('fixed-period-chart-editor', FixedPeriodChartEditor);
