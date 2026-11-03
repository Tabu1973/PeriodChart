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
      _config: { type: Object },
      _expandedEntity: { type: Number, state: true }
    };
  }

  constructor() {
    super();
    this._expandedEntity = -1;
  }

  setConfig(config) {
    // Migration: If we have an old config with a single entity, convert to entities array.
    if (config && !config.entities && config.entity) {
      const newConfig = { ...config, entities: [{
        entity: config.entity,
        legend_label: config.legend_label,
        color: config.color,
        color_entity: config.color_entity,
        use_dynamic_color: config.use_dynamic_color,
        bg_color: config.bg_color,
        bg_color_entity: config.bg_color_entity,
        use_dynamic_bg_color: config.use_dynamic_bg_color,
        chart_type: config.chart_type,
        line_width: config.line_width,
        line_width_entity: config.line_width_entity,
        use_dynamic_line_width: config.use_dynamic_line_width,
        smoothing: config.smoothing,
        show_data_points: config.show_data_points
      }]};
      
      // Remove migrated single-entity properties
      delete newConfig.entity;
      delete newConfig.legend_label;
      delete newConfig.color;
      delete newConfig.color_entity;
      delete newConfig.use_dynamic_color;
      delete newConfig.bg_color;
      delete newConfig.bg_color_entity;
      delete newConfig.use_dynamic_bg_color;
      delete newConfig.chart_type;
      delete newConfig.line_width;
      delete newConfig.line_width_entity;
      delete newConfig.use_dynamic_line_width;
      delete newConfig.smoothing;
      delete newConfig.show_data_points;
      
      this._config = { type: 'custom:fixed-period-chart', ...newConfig };
      fireEvent(this, 'config-changed', { config: this._config });
    } else {
      this._config = { type: 'custom:fixed-period-chart', ...config };
    }
  }

  _localize(key) {
    const lang = this.hass?.locale?.language || this.hass?.language;
    return localize(key, lang);
  }

  get _entities() {
    return this._config?.entities || [];
  }

  get _period() {
    if (this._config?.period === 'custom') return 'custom';
    if (!this._config?.period && (this._config?.period_entity || this._config?.start_entity || this._config?.start)) return 'custom';
    return this._config?.period || 'this_year';
  }

  get _resolution() {
    return this._config?.resolution || 'day';
  }

  get _show_date_picker() {
    return this._config?.show_date_picker !== false;
  }

  get _title() {
    return this._config?.title || '';
  }

  get _bg_color() {
    return this._config?.bg_color || '';
  }

  get _card_bg_color() {
    return this._config?.card_bg_color || '';
  }

  get _show_grid_x() {
    return this._config?.show_grid_x !== false;
  }

  get _show_grid_y() {
    return this._config?.show_grid_y !== false;
  }

  get _show_axis_x() {
    return this._config?.show_axis_x !== false;
  }

  get _show_axis_y() {
    return this._config?.show_axis_y !== false;
  }

  get _max_ticks_x() {
    return this._config?.max_ticks_x || '';
  }

  get _step_size_y() {
    return this._config?.step_size_y || '';
  }

  get _show_legend() {
    return this._config?.show_legend !== false;
  }

  get _show_tooltip() {
    return this._config?.show_tooltip !== false;
  }

  get _show_navigation() {
    return this._config?.show_navigation === true;
  }

  get _horizontal() {
    return this._config?.horizontal === true;
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

  get _bg_color_entity() {
    return this._config?.bg_color_entity || '';
  }

  get _card_bg_color_entity() {
    return this._config?.card_bg_color_entity || '';
  }

  _addEntity() {
    const entities = [...this._entities];
    entities.push({ entity: '' });
    this._updateConfig('entities', entities);
    this._expandedEntity = entities.length - 1;
  }

  _removeEntity(index) {
    const newEntities = [...this._entities];
    newEntities.splice(index, 1);
    this._updateConfig('entities', newEntities);
    if (this._expandedEntity === index) {
      this._expandedEntity = -1;
    } else if (this._expandedEntity > index) {
      this._expandedEntity--;
    }
  }

  _dragStart(ev, index) {
    this._draggedIndex = index;
    this._targetIndex = index;
    ev.dataTransfer.effectAllowed = 'move';
    
    const draggedEl = ev.currentTarget;
    const rect = draggedEl.getBoundingClientRect();
    
    const headerEl = draggedEl.querySelector('.entity-header');
    if (headerEl && ev.dataTransfer.setDragImage) {
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      ev.dataTransfer.setDragImage(headerEl, x, y);
    }
    
    this._placeholder = document.createElement('div');
    this._placeholder.className = 'drag-placeholder';
    this._placeholder.style.height = rect.height + 'px';
    this._placeholder.style.border = '2px dashed var(--primary-color)';
    this._placeholder.style.borderRadius = '4px';
    this._placeholder.style.marginBottom = '8px';
    this._placeholder.style.backgroundColor = 'rgba(var(--rgb-primary-text-color), 0.05)';
    this._placeholder.style.boxSizing = 'border-box';
    this._placeholder.style.pointerEvents = 'none';

    setTimeout(() => {
      draggedEl.style.display = 'none';
      if (draggedEl.parentNode) {
        draggedEl.parentNode.insertBefore(this._placeholder, draggedEl.nextSibling);
      }
    }, 50);

    if (this.shadowRoot) {
      const container = this.shadowRoot.querySelector('.entities-config');
      if (container) container.classList.add('is-dragging');
    }
  }

  _dragOver(ev, dropIndex) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'move';
    
    if (this._draggedIndex === null || !this._placeholder) return;
    
    const target = ev.currentTarget;
    const rect = target.getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    
    if (ev.clientY < mid) {
      target.parentNode.insertBefore(this._placeholder, target);
      this._targetIndex = dropIndex;
    } else {
      target.parentNode.insertBefore(this._placeholder, target.nextSibling);
      this._targetIndex = dropIndex + 1;
    }
  }

  _dragEnd(ev) {
    if (ev && ev.currentTarget) {
      ev.currentTarget.style.display = '';
    }
    this._draggedIndex = null;
    this._targetIndex = null;
    if (this._placeholder && this._placeholder.parentNode) {
      this._placeholder.parentNode.removeChild(this._placeholder);
    }
    this._placeholder = null;

    if (this.shadowRoot) {
      const container = this.shadowRoot.querySelector('.entities-config');
      if (container) container.classList.remove('is-dragging');
    }
  }

  _drop(ev) {
    ev.preventDefault();
    
    if (this._draggedIndex === null || this._targetIndex === null) {
      this._dragEnd(ev);
      return;
    }
    
    let newEntities = [...this._entities];
    const draggedItem = newEntities.splice(this._draggedIndex, 1)[0];
    
    let finalIndex = this._targetIndex;
    if (this._draggedIndex < this._targetIndex) {
       finalIndex--;
    }
    
    newEntities.splice(finalIndex, 0, draggedItem);
    
    if (this._expandedEntity === this._draggedIndex) {
        this._expandedEntity = finalIndex;
    } else if (this._expandedEntity > this._draggedIndex && this._expandedEntity <= finalIndex) {
        this._expandedEntity--;
    } else if (this._expandedEntity < this._draggedIndex && this._expandedEntity >= finalIndex) {
        this._expandedEntity++;
    }

    this._updateConfig('entities', newEntities);
    this._dragEnd(ev);
  }

  _toggleEntity(index) {
    if (this._expandedEntity === index) {
      this._expandedEntity = -1;
    } else {
      this._expandedEntity = index;
    }
  }

  _updateEntityConfig(index, key, value) {
    const entities = [...this._entities];
    
    // Check if the value actually changed to prevent infinite loops in the editor
    const normCurrent = entities[index][key] !== undefined ? entities[index][key] : '';
    const normValue = value !== undefined ? value : '';
    
    if (normCurrent === normValue) {
      return;
    }
    
    console.log(`[FixedPeriodChartEditor] _updateEntityConfig FIRED! index=${index}, key=${key}, oldValue=${normCurrent}, newValue=${normValue}`);
    
    if (value === '' || value === undefined) {
      delete entities[index][key];
    } else {
      entities[index] = { ...entities[index], [key]: value };
    }
    this._updateConfig('entities', entities);
  }

  render() {
    if (!this.hass || !this._config) {
      return html``;
    }

    return html`
      <div class="card-config">
        
        <div style="margin-bottom: 24px; background: var(--secondary-background-color); padding: 16px; border-radius: 8px; border: 1px solid var(--divider-color);">
          <h3 style="margin-top: 0; margin-bottom: 16px;">${this._localize("label.entities_header")}</h3>
          <div class="entities-list entities-config" @dragover=${(e) => e.preventDefault()} @drop=${this._drop}>
            ${this._entities.map((ent, index) => this._renderEntity(ent, index))}
          </div>
          <button class="add-entity-btn" style="margin-top: 8px;" @click=${this._addEntity}>${this._localize("btn.add_entity")}</button>
        </div>

        <details class="config-section" open>
          <summary><h3>${this._localize('section.basic')}</h3></summary>
          
          <div class="side-by-side" style="margin-top: 24px;">
            <div style="width: 100%;">
              ${this._renderTitleInput(`${this._localize("label.title")} (Standard)`, 'title')}
            </div>
          </div>

          <div class="side-by-side" style="margin-top: 16px;">
            <div style="flex: 1;">
              <span class="label">${this._localize("label.global_tap_action")}</span>
              <select class="styled-select" @change=${(ev) => this._globalTapActionTypeChanged(ev)}>
                <option value="none" ?selected=${!this._config.tap_action || this._config.tap_action === 'none' || this._config.tap_action?.action === 'none'}>${this._localize("action.none")}</option>
                <option value="more-info" ?selected=${this._config.tap_action === 'more-info' || this._config.tap_action?.action === 'more-info'}>${this._localize("action.more_info")}</option>
                <option value="navigate" ?selected=${this._config.tap_action === 'navigate' || this._config.tap_action?.action === 'navigate'}>${this._localize("action.navigate")}</option>
                <option value="url" ?selected=${this._config.tap_action === 'url' || this._config.tap_action?.action === 'url'}>${this._localize("action.url")}</option>
              </select>
            </div>
            ${(this._config.tap_action === 'navigate' || this._config.tap_action?.action === 'navigate') ? html`
              <div style="flex: 1;">
                <span class="label">${this._localize("label.navigation_path")}</span>
                <input type="text" class="styled-input" placeholder="/lovelace/home" .value=${this._config.tap_action?.navigation_path || ''} @input=${(ev) => this._globalTapActionPropChanged(ev, 'navigation_path')}>
              </div>
            ` : (this._config.tap_action === 'url' || this._config.tap_action?.action === 'url') ? html`
              <div style="flex: 1;">
                <span class="label">${this._localize("label.url_path")}</span>
                <input type="text" class="styled-input" placeholder="https://..." .value=${this._config.tap_action?.url_path || ''} @input=${(ev) => this._globalTapActionPropChanged(ev, 'url_path')}>
              </div>
            ` : ''}
          </div>
          
          <div style="margin-top: 16px; border-bottom: 1px dashed var(--divider-color, #e0e0e0); padding-bottom: 12px;">
            <span class="label" style="font-weight: bold; margin-bottom: 4px; display: block;">${this._localize("label.tooltip_format")}</span>
            <span class="label" style="font-size: 12px; opacity: 0.8; margin-bottom: 8px; display: block;">${this._localize("desc.tooltip_format")}</span>
            <input type="text" id="title-input-tooltip_format" class="styled-input" .value=${this._config.tooltip_format || ''} @input=${(ev) => this._updateConfig('tooltip_format', ev.target.value)} placeholder="{name}: {value} {unit}">
            <div class="template-chips" style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 8px;">
              <button class="chip-btn" @click=${(ev) => this._insertTemplate(ev, 'tooltip_format', '{name}')}>${this._localize("btn.add_name")}</button>
              <button class="chip-btn" @click=${(ev) => this._insertTemplate(ev, 'tooltip_format', '{value}')}>${this._localize("btn.add_value")}</button>
              <button class="chip-btn" @click=${(ev) => this._insertTemplate(ev, 'tooltip_format', '{unit}')}>${this._localize("btn.add_unit")}</button>
            </div>
            
            <div style="margin-top: 12px; display: flex; align-items: center; gap: 8px;">
              <span class="label">${this._localize("label.tooltip_decimals_global")}</span>
              <input type="number" class="styled-input" style="width: 80px;" min="0" max="5" .value=${this._config.tooltip_decimals !== undefined ? this._config.tooltip_decimals : ''} @input=${(ev) => this._updateConfig('tooltip_decimals', ev.target.value)} placeholder=${this._localize("label.auto")}>
            </div>

            <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">
              <div>
                <span class="label" style="font-size: 11px;">${this._localize("label.format_tooltip_date_short")}</span>
                <input type="text" class="styled-input" .value=${this._config.format_tooltip_date_short || ''} @input=${(ev) => this._updateConfig('format_tooltip_date_short', ev.target.value)} placeholder="HH:mm">
              </div>
              <div>
                <span class="label" style="font-size: 11px;">${this._localize("label.format_tooltip_date_long")}</span>
                <input type="text" class="styled-input" .value=${this._config.format_tooltip_date_long || ''} @input=${(ev) => this._updateConfig('format_tooltip_date_long', ev.target.value)} placeholder="DD.MM.YYYY HH:mm">
              </div>
            </div>
          </div>
        </details>

        <details class="config-section">
          <summary><h3>${this._localize('section.time')} (Global)</h3></summary>
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
            ${this._period !== 'custom' && (this._config.use_period_entity || this._config.use_start_end_entities) ? html`
              <div style="margin-top: 8px; padding: 8px; background-color: var(--warning-color, #ff9800); border-radius: 4px; font-size: 12px; color: #fff;">
                ${this._localize("note.conflict")}
              </div>
            ` : ''}
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
            <div style="margin-top: 16px; padding: 8px; background-color: var(--secondary-background-color); border-radius: 4px; font-size: 12px; color: var(--secondary-text-color);">
                <strong>${this._localize("note.custom_period")}</strong> 
              </div>
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
          <summary><h3>${this._localize('section.appearance')} (Global)</h3></summary>
          <div class="side-by-side" style="margin-top: 16px;">
            <ha-formfield .label=${this._localize("label.horizontal_chart")}>
              <ha-switch
                .checked=${this._horizontal}
                @change=${(ev) => this._updateConfig('horizontal', ev.target.checked)}
              ></ha-switch>
            </ha-formfield>
          </div>
        </details>

        <details class="config-section">
          <summary><h3>${this._localize('section.colors')} (Global)</h3></summary>
          <div class="side-by-side" style="margin-top: 16px;">
            ${this.renderColorPicker(this._localize("color.card_bg_color"), "card_bg_color")}
          </div>
        </details>

        <details class="config-section">
          <summary><h3>${this._localize('section.display')} (Global)</h3></summary>
          <div class="side-by-side">
            <ha-formfield .label=${this._localize("label.show_navigation")}>
              <ha-switch
                .checked=${this._show_navigation}
                @change=${(ev) => this._updateConfig('show_navigation', ev.target.checked)}
              ></ha-switch>
            </ha-formfield>
            <ha-formfield .label=${this._localize("label.show_legend")}>
              <ha-switch
                .checked=${this._show_legend}
                @change=${(ev) => this._updateConfig('show_legend', ev.target.checked)}
              ></ha-switch>
            </ha-formfield>
          </div>
          
          <div class="side-by-side" style="margin-top: 16px;">
            <ha-formfield .label=${this._localize("label.show_total")}>
              <ha-switch
                .checked=${this._config.show_total === true}
                @change=${(ev) => this._updateConfig('show_total', ev.target.checked)}
              ></ha-switch>
            </ha-formfield>
          </div>
          
          <div class="side-by-side" style="margin-top: 16px;">
            <ha-formfield .label=${this._localize("label.show_date_picker")}>
              <ha-switch
                .checked=${this._show_date_picker}
                @change=${(ev) => this._updateConfig('show_date_picker', ev.target.checked)}
              ></ha-switch>
            </ha-formfield>
            <ha-formfield .label=${this._localize("label.show_tooltips")}>
              <ha-switch
                .checked=${this._show_tooltip}
                @change=${(ev) => this._updateConfig('show_tooltip', ev.target.checked)}
              ></ha-switch>
            </ha-formfield>
          </div>

          <div class="side-by-side" style="margin-top: 16px;">
            <ha-formfield .label=${this._localize("label.show_x_axis")}>
              <ha-switch
                .checked=${this._show_axis_x}
                @change=${(ev) => this._updateConfig('show_axis_x', ev.target.checked)}
              ></ha-switch>
            </ha-formfield>
            <ha-formfield .label=${this._localize("label.show_y_axis")}>
              <ha-switch
                .checked=${this._show_axis_y}
                @change=${(ev) => this._updateConfig('show_axis_y', ev.target.checked)}
              ></ha-switch>
            </ha-formfield>
          </div>

          <div class="side-by-side" style="margin-top: 16px;">
            <div style="width: 100%;">
              <span class="label" style="font-weight: bold; margin-bottom: 4px; display: block;">${this._localize("label.custom_date_format")}</span>
              <span class="label" style="font-size: 12px; opacity: 0.8; margin-bottom: 8px; display: block;">${this._localize("desc.custom_date_format")}</span>
              
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div>
                  <span class="label" style="font-size: 11px;">${this._localize("label.format_axis_short")}</span>
                  <input type="text" class="styled-input" .value=${this._config.format_axis_short || ''} @input=${(ev) => this._updateConfig('format_axis_short', ev.target.value)} placeholder="HH:mm">
                </div>
                <div>
                  <span class="label" style="font-size: 11px;">${this._localize("label.format_axis_long")}</span>
                  <input type="text" class="styled-input" .value=${this._config.format_axis_long || ''} @input=${(ev) => this._updateConfig('format_axis_long', ev.target.value)} placeholder="DD.MM. HH:mm">
                </div>
                <div>
                  <span class="label" style="font-size: 11px;">${this._localize("label.format_title_date")}</span>
                  <input type="text" class="styled-input" .value=${this._config.format_title_date || ''} @input=${(ev) => this._updateConfig('format_title_date', ev.target.value)} placeholder="DD.MM.YYYY">
                </div>
              </div>
            </div>
          </div>

          <div class="side-by-side" style="margin-top: 16px;">
            <div>
              <span class="label">${this._localize("label.animation_easing")}</span>
              <select class="styled-select" @change=${(ev) => this._updateConfig('animation_easing', ev.target.value)}>
                <option value="easeOutQuart" ?selected=${this._config.animation_easing === 'easeOutQuart' || !this._config.animation_easing}>${this._localize("easing.easeOutQuart")}</option>
                <option value="linear" ?selected=${this._config.animation_easing === 'linear'}>${this._localize("easing.linear")}</option>
                <option value="easeInOutElastic" ?selected=${this._config.animation_easing === 'easeInOutElastic'}>${this._localize("easing.easeInOutElastic")}</option>
                <option value="easeOutBounce" ?selected=${this._config.animation_easing === 'easeOutBounce'}>${this._localize("easing.easeOutBounce")}</option>
                <option value="easeInOutBack" ?selected=${this._config.animation_easing === 'easeInOutBack'}>${this._localize("easing.easeInOutBack")}</option>
              </select>
            </div>
          </div>

          <div class="side-by-side" style="margin-top: 16px;">
            <ha-formfield .label=${this._localize("label.show_x_grid")}>
              <ha-switch
                .checked=${this._show_grid_x}
                @change=${(ev) => this._updateConfig('show_grid_x', ev.target.checked)}
              ></ha-switch>
            </ha-formfield>
            <ha-formfield .label=${this._localize("label.show_y_grid")}>
              <ha-switch
                .checked=${this._show_grid_y}
                @change=${(ev) => this._updateConfig('show_grid_y', ev.target.checked)}
              ></ha-switch>
            </ha-formfield>
          </div>

          <div class="side-by-side" style="margin-top: 16px;">
            <div style="flex: 1;">
              <span class="label">${this._localize("label.max_ticks_x")}</span>
              <input type="number" class="styled-input" .value=${this._config.max_ticks_x || ''} @input=${(ev) => this._updateConfig("max_ticks_x", ev.target.value)}>
            </div>
            <div style="flex: 1;">
              <span class="label">${this._localize("label.x_axis_rotation") || "X-Axis Rotation (e.g. 45)"}</span>
              <input type="number" class="styled-input" .value=${this._config.x_axis_rotation || ''} @input=${(ev) => this._updateConfig("x_axis_rotation", ev.target.value)}>
            </div>
          </div>
          <div class="side-by-side" style="margin-top: 16px;">
            <div>
              <span class="label">${this._localize("label.step_size_y")}</span>
              <input type="number" class="styled-input" .value=${this._step_size_y} @input=${(ev) => this._updateConfig('step_size_y', ev.target.value)} placeholder=${this._localize("label.auto")}>
            </div>
          </div>
        </details>

      </div>
    `;
  }

  _renderTitleInput(label, key, placeholder = '') {
    const val = key === 'title' ? this._title : (this._config?.[key] || '');
    return html`
      <div style="margin-top: 12px; border-bottom: 1px dashed var(--divider-color, #e0e0e0); padding-bottom: 12px;">
        <span class="label">${label}</span>
        <input type="text" id="title-input-${key}" class="styled-input" .value=${val} @input=${(ev) => this._updateConfig(key, ev.target.value)} placeholder=${placeholder}>
        <div class="template-chips" style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 8px;">
          <button class="chip-btn" @click=${(ev) => this._insertTemplate(ev, key, '{start_date}')}>${this._localize("btn.add_start_date")}</button>
          <button class="chip-btn" @click=${(ev) => this._insertTemplate(ev, key, '{end_date}')}>${this._localize("btn.add_end_date")}</button>
          <button class="chip-btn" @click=${(ev) => this._insertTemplate(ev, key, '{date_range}')}>${this._localize("btn.add_date_range")}</button>
          <button class="chip-btn" @click=${(ev) => this._insertTemplate(ev, key, '{total}')}>${this._localize("btn.add_total")}</button>
          <button class="chip-btn" @click=${(ev) => this._insertTemplate(ev, key, '{start_time}')}>${this._localize("btn.add_start_time")}</button>
          <button class="chip-btn" @click=${(ev) => this._insertTemplate(ev, key, '{end_time}')}>${this._localize("btn.add_end_time")}</button>
        </div>
      </div>
    `;
  }

  _renderEntity(ent, index) {
    const isExpanded = this._expandedEntity === index;
    const chartType = ent.chart_type || 'bar';
    const useDynamicLineWidth = !!ent.use_dynamic_line_width;

    return html`
      <details class="entity-row" ?open=${isExpanded}
        draggable="true"
        @dragstart=${(ev) => this._dragStart(ev, index)}
        @dragover=${(ev) => this._dragOver(ev, index)}
        @dragend=${this._dragEnd}
      >
        <summary class="entity-header" style="cursor: pointer; font-weight: bold; justify-content: space-between;" @click=${(ev) => {
          ev.preventDefault();
          this._toggleEntity(index);
        }}>
          <div class="handle" style="cursor: move; padding: 4px; margin-right: 8px; color: var(--secondary-text-color);" @click=${(ev) => ev.stopPropagation()}>
            <ha-icon icon="mdi:drag"></ha-icon>
          </div>
          <span style="flex: 1; padding: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${ent.legend_label || ent.entity || `${this._localize("label.entity")} ${index + 1}`}</span>
          <div style="display: flex; gap: 4px; flex-shrink: 0;" @click=${(ev) => ev.stopPropagation()}>
            <button class="icon-btn remove-btn" @click=${(ev) => { ev.preventDefault(); this._removeEntity(index); }} title="${this._localize('btn.delete') || 'Entität löschen'}">
              <ha-icon icon="mdi:delete"></ha-icon>
            </button>
          </div>
        </summary>
        <div class="entity-content">
          <ha-entity-picker
            .hass=${this.hass}
            .value=${ent.entity}
            @value-changed=${(ev) => this._updateEntityConfig(index, 'entity', ev.detail.value)}
            allow-custom-entity
            style="margin-bottom: 16px;"
          ></ha-entity-picker>
            <div class="side-by-side" style="margin-top: 8px;">
              <div>
                <span class="label">${this._localize("label.legend_label")}</span>
                <input type="text" class="styled-input" .value=${ent.legend_label || ''} @input=${(ev) => this._updateEntityConfig(index, 'legend_label', ev.target.value)}>
              </div>
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span class="label" style="margin: 0;">${this._localize("label.chart_type")}</span>
                  <ha-formfield .label=${this._localize("label.dynamic")}>
                    <ha-switch
                      .checked=${!!ent.use_dynamic_chart_type}
                      @change=${(ev) => this._updateEntityConfig(index, 'use_dynamic_chart_type', ev.target.checked)}
                    ></ha-switch>
                  </ha-formfield>
                </div>
                
                ${ent.use_dynamic_chart_type ? html`
                  <ha-entity-picker
                    .label=${this._localize("label.chart_type_entity_input")}
                    .hass=${this.hass}
                    .value=${ent.chart_type_entity || ''}
                    @value-changed=${(ev) => this._updateEntityConfig(index, 'chart_type_entity', ev.detail.value)}
                    allow-custom-entity
                  ></ha-entity-picker>
                ` : html`
                  <select class="styled-select" @change=${(ev) => this._updateEntityConfig(index, 'chart_type', ev.target.value)}>
                    <option value="bar" ?selected=${chartType === 'bar'}>${this._localize("type.bar")}</option>
                    <option value="line" ?selected=${chartType === 'line'}>${this._localize("type.line")}</option>
                    <option value="scatter" ?selected=${chartType === 'scatter'}>${this._localize("type.scatter")}</option>
                  </select>
                `}
              </div>
            </div>

            ${chartType === 'bar' || ent.use_dynamic_chart_type ? html`
              <div class="side-by-side" style="margin-top: 16px;">
                <div style="flex: 1;">
                  <span class="label">${this._localize("label.bar_mode")}</span>
                  <select class="styled-select" @change=${(ev) => {
                    this._updateEntityConfig(index, 'bar_mode', ev.target.value);
                    if (ent.use_min_max !== undefined) {
                      const newConfig = [...this._entities];
                      delete newConfig[index].use_min_max;
                      this._updateConfig('entities', newConfig);
                    }
                  }}>
                    <option value="standard" ?selected=${!ent.bar_mode && !ent.use_min_max}>${this._localize("bar_mode.standard")}</option>
                    <option value="floating" ?selected=${ent.bar_mode === 'floating' || ent.use_min_max}>${this._localize("bar_mode.floating")}</option>
                    <option value="stacked" ?selected=${ent.bar_mode === 'stacked'}>${this._localize("bar_mode.stacked")}</option>
                  </select>
                </div>
              </div>
            ` : ''}

            <div class="side-by-side" style="margin-top: 16px;">
              <ha-formfield .label=${this._localize("label.calculate_delta")}>
                <ha-switch
                  .checked=${ent.calculate_delta === true || ent.stat_type === 'delta' || ent.stat_type === 'diff'}
                  @change=${(ev) => this._updateEntityConfig(index, 'calculate_delta', ev.target.checked)}
                ></ha-switch>
              </ha-formfield>
            </div>

            <div style="margin-top: 16px; display: flex; flex-direction: column; gap: 16px;">
              ${(chartType === 'line' || chartType === 'scatter' || (chartType === 'bar' && (!ent.bar_mode || ent.bar_mode === 'standard' && !ent.use_min_max)) || ent.use_dynamic_chart_type) ? html`
                <span class="label" style="font-weight: bold; margin-bottom: -8px;">${this._localize("label.colors_standard")}</span>
                ${this.renderEntityColorPicker(this._localize("color.line_bar") || this._localize("color.line_bar"), "color", ent, index)}
                ${this.renderEntityColorPicker(this._localize("color.background") || this._localize("color.background"), "bg_color", ent, index)}
              ` : ''}
              
              ${(ent.bar_mode === 'stacked' || ent.bar_mode === 'floating' || ent.use_min_max || ent.use_dynamic_chart_type) ? html`
                <div style="margin-top: 8px; border-top: 1px dashed var(--divider-color, #e0e0e0); padding-top: 12px; display: flex; flex-direction: column; gap: 16px;">
                  <span class="label" style="font-weight: bold; margin-bottom: 0;">${this._localize("label.colors_max")}</span>
                  ${this.renderEntityColorPicker(this._localize("color.line_bar_max"), "color_max", ent, index)}
                  ${this.renderEntityColorPicker(this._localize("color.bg_color_max"), "bg_color_max", ent, index)}
                  
                  <span class="label" style="font-weight: bold; margin-bottom: 0; margin-top: 8px;">${this._localize("label.colors_min")}</span>
                  ${this.renderEntityColorPicker(this._localize("color.line_bar_min"), "color_min", ent, index)}
                  ${this.renderEntityColorPicker(this._localize("color.bg_color_min"), "bg_color_min", ent, index)}
                </div>
              ` : ''}
            </div>
            
            <div style="margin-top: 16px; border-top: 1px dashed var(--divider-color, #e0e0e0); padding-top: 12px; display: flex; flex-direction: column; gap: 16px;">
              <span class="label" style="font-weight: bold; margin-bottom: 0;">${this._localize("label.y_axis_scaling")}</span>
              
              <div class="side-by-side">
                <ha-formfield .label=${this._localize("label.begin_at_zero")}>
                  <ha-switch
                    .checked=${ent.begin_at_zero !== false}
                    @change=${(ev) => this._updateEntityConfig(index, 'begin_at_zero', ev.target.checked)}
                  ></ha-switch>
                </ha-formfield>
              </div>
              
              <div class="side-by-side">
                <div style="flex: 1;">
                  <span class="label">${this._localize("label.y_min")}</span>
                  <input type="number" class="styled-input" .value=${ent.y_min !== undefined ? ent.y_min : ''} @input=${(ev) => this._updateEntityConfig(index, 'y_min', ev.target.value)} placeholder=${this._localize("label.auto")}>
                </div>
                <div style="flex: 1;">
                  <span class="label">${this._localize("label.y_max")}</span>
                  <input type="number" class="styled-input" .value=${ent.y_max !== undefined ? ent.y_max : ''} @input=${(ev) => this._updateEntityConfig(index, 'y_max', ev.target.value)} placeholder=${this._localize("label.auto")}>
                </div>
              </div>
            </div>

            <div style="margin-top: 16px; border-top: 1px dashed var(--divider-color, #e0e0e0); padding-top: 12px;">
              <span class="label" style="font-weight: bold; margin-bottom: 4px; display: block;">${this._localize("label.individual_tooltip")}</span>
              <span class="label" style="font-size: 12px; opacity: 0.8; margin-bottom: 8px; display: block;">${this._localize("desc.individual_tooltip")}</span>
              <input type="text" class="styled-input" .value=${ent.tooltip_format || ''} @input=${(ev) => this._updateEntityConfig(index, 'tooltip_format', ev.target.value)} placeholder="{name}: {value} {unit}">
              <div class="template-chips" style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 8px;">
                <button class="chip-btn" @click=${(ev) => this._insertTemplateEntity(ev, index, 'tooltip_format', '{name}')}>${this._localize("btn.add_name")}</button>
                <button class="chip-btn" @click=${(ev) => this._insertTemplateEntity(ev, index, 'tooltip_format', '{value}')}>${this._localize("btn.add_value")}</button>
                <button class="chip-btn" @click=${(ev) => this._insertTemplateEntity(ev, index, 'tooltip_format', '{unit}')}>${this._localize("btn.add_unit")}</button>
              </div>
              <div style="margin-top: 12px; display: flex; align-items: center; gap: 8px;">
                <span class="label">${this._localize("label.tooltip_decimals")}</span>
                <input type="number" class="styled-input" style="width: 80px;" min="0" max="5" .value=${ent.tooltip_decimals !== undefined ? ent.tooltip_decimals : ''} @input=${(ev) => this._updateEntityConfig(index, 'tooltip_decimals', ev.target.value)} placeholder=${this._localize("label.auto")}>
              </div>
            </div>

            <div class="side-by-side" style="margin-top: 16px;">
              <div>
                <span class="label">${this._localize("label.line_width")}</span>
                <input type="number" class="styled-input" .value=${ent.line_width || ''} @input=${(ev) => this._updateEntityConfig(index, 'line_width', ev.target.value)} placeholder=${this._localize("label.auto")}>
              </div>
              <div style="display: flex; align-items: center; margin-top: 20px;">
                <ha-formfield .label=${this._localize("label.use_dynamic_line_width")}>
                  <ha-switch
                    .checked=${useDynamicLineWidth}
                    @change=${(ev) => this._updateEntityConfig(index, 'use_dynamic_line_width', ev.target.checked)}
                  ></ha-switch>
                </ha-formfield>
              </div>
            </div>

            ${useDynamicLineWidth ? html`
              <div class="side-by-side" style="margin-top: 16px;">
                <ha-entity-picker
                  .label=${this._localize("label.line_width_entity")}
                  .hass=${this.hass}
                  .value=${ent.line_width_entity || ''}
                  .includeDomains=${['input_number', 'number']}
                  @value-changed=${(ev) => this._updateEntityConfig(index, 'line_width_entity', ev.detail.value)}
                  allow-custom-entity
                ></ha-entity-picker>
              </div>
            ` : ''}

            ${chartType === 'line' || ent.use_dynamic_chart_type ? html`
              <div class="side-by-side" style="margin-top: 16px;">
                <ha-formfield .label=${this._localize("label.smooth_lines")}>
                  <ha-switch
                    .checked=${ent.smoothing === true}
                    @change=${(ev) => this._updateEntityConfig(index, 'smoothing', ev.target.checked)}
                  ></ha-switch>
                </ha-formfield>
                <ha-formfield .label=${this._localize("label.show_data_points")}>
                  <ha-switch
                    .checked=${ent.show_data_points !== false}
                    @change=${(ev) => this._updateEntityConfig(index, 'show_data_points', ev.target.checked)}
                  ></ha-switch>
                </ha-formfield>
              </div>
              <div class="side-by-side" style="margin-top: 16px;">
                <div>
                  <span class="label">${this._localize("label.line_style")}</span>
                  <select class="styled-select" @change=${(ev) => this._updateEntityConfig(index, 'line_style', ev.target.value)}>
                    <option value="solid" ?selected=${!ent.line_style || ent.line_style === 'solid'}>${this._localize("line_style.solid")}</option>
                    <option value="dashed" ?selected=${ent.line_style === 'dashed'}>${this._localize("line_style.dashed")}</option>
                    <option value="dotted" ?selected=${ent.line_style === 'dotted'}>${this._localize("line_style.dotted")}</option>
                  </select>
                </div>
              </div>
            ` : ''}

            <div class="side-by-side" style="margin-top: 16px; border-top: 1px dashed var(--divider-color, #e0e0e0); padding-top: 12px;">
              <div style="flex: 1;">
                <span class="label">${this._localize("label.tap_action")}</span>
                <select class="styled-select" @change=${(ev) => this._entityTapActionTypeChanged(ev, index)}>
                  <option value="default" ?selected=${!ent.tap_action || ent.tap_action === 'default'}>${this._localize("action.default")}</option>
                  <option value="more-info" ?selected=${ent.tap_action === 'more-info' || ent.tap_action?.action === 'more-info'}>${this._localize("action.more_info")}</option>
                  <option value="toggle" ?selected=${ent.tap_action === 'toggle' || ent.tap_action?.action === 'toggle'}>${this._localize("action.toggle")}</option>
                  <option value="navigate" ?selected=${ent.tap_action === 'navigate' || ent.tap_action?.action === 'navigate'}>${this._localize("action.navigate")}</option>
                  <option value="url" ?selected=${ent.tap_action === 'url' || ent.tap_action?.action === 'url'}>${this._localize("action.url")}</option>
                  <option value="perform-action" ?selected=${ent.tap_action === 'perform-action' || ent.tap_action === 'call-service' || ent.tap_action?.action === 'perform-action' || ent.tap_action?.action === 'call-service'}>${this._localize("action.perform_action")}</option>
                  <option value="none" ?selected=${ent.tap_action === 'none' || ent.tap_action?.action === 'none'}>${this._localize("action.none")}</option>
                </select>
              </div>
              ${(ent.tap_action === 'navigate' || ent.tap_action?.action === 'navigate') ? html`
                <div style="flex: 1;">
                  <span class="label">${this._localize("label.navigation_path")}</span>
                  <input type="text" class="styled-input" placeholder="/lovelace/home" .value=${ent.tap_action?.navigation_path || ''} @input=${(ev) => this._entityTapActionPropChanged(ev, index, 'navigation_path')}>
                </div>
              ` : (ent.tap_action === 'url' || ent.tap_action?.action === 'url') ? html`
                <div style="flex: 1;">
                  <span class="label">${this._localize("label.url_path")}</span>
                  <input type="text" class="styled-input" placeholder="https://..." .value=${ent.tap_action?.url_path || ''} @input=${(ev) => this._entityTapActionPropChanged(ev, index, 'url_path')}>
                </div>
              ` : (ent.tap_action === 'perform-action' || ent.tap_action === 'call-service' || ent.tap_action?.action === 'perform-action' || ent.tap_action?.action === 'call-service') ? html`
                <div style="flex: 1;">
                  <span class="label">${this._localize("label.perform_action_name")}</span>
                  <input type="text" class="styled-input" placeholder="homeassistant.toggle" .value=${ent.tap_action?.perform_action || ent.tap_action?.service || ''} @input=${(ev) => this._entityTapActionPropChanged(ev, index, 'perform_action')}>
                </div>
              ` : ''}
            </div>
          </div>
      </details>
    `;
  }

  _globalTapActionTypeChanged(ev) {
    const val = ev.target.value;
    let newConfig = { ...this._config };
    if (val === 'none') {
      newConfig.tap_action = { action: 'none' };
    } else if (val === 'navigate') {
      const existing = typeof newConfig.tap_action === 'object' ? newConfig.tap_action.navigation_path : '';
      newConfig.tap_action = { action: 'navigate', navigation_path: existing || '' };
    } else if (val === 'url') {
      const existing = typeof newConfig.tap_action === 'object' ? newConfig.tap_action.url_path : '';
      newConfig.tap_action = { action: 'url', url_path: existing || '' };
    } else if (val === 'more-info') {
      newConfig.tap_action = { action: 'more-info' };
    }
    this._updateConfig('tap_action', newConfig.tap_action);
  }

  _globalTapActionPropChanged(ev, prop) {
    const val = ev.target.value;
    let tapAction = typeof this._config.tap_action === 'object' ? { ...this._config.tap_action } : { action: this._config.tap_action || 'navigate' };
    tapAction[prop] = val;
    this._updateConfig('tap_action', tapAction);
  }

  _entityTapActionTypeChanged(ev, index) {
    const val = ev.target.value;
    const newEntities = [...this._entities];
    const ent = { ...newEntities[index] };
    if (val === 'default') {
      delete ent.tap_action;
    } else if (val === 'more-info') {
      ent.tap_action = { action: 'more-info' };
    } else if (val === 'toggle') {
      ent.tap_action = { action: 'toggle' };
    } else if (val === 'navigate') {
      const existing = typeof ent.tap_action === 'object' ? ent.tap_action.navigation_path : '';
      ent.tap_action = { action: 'navigate', navigation_path: existing || '' };
    } else if (val === 'url') {
      const existing = typeof ent.tap_action === 'object' ? ent.tap_action.url_path : '';
      ent.tap_action = { action: 'url', url_path: existing || '' };
    } else if (val === 'perform-action') {
      const existing = typeof ent.tap_action === 'object' ? (ent.tap_action.perform_action || ent.tap_action.service) : '';
      ent.tap_action = { action: 'perform-action', perform_action: existing || '' };
    } else if (val === 'none') {
      ent.tap_action = { action: 'none' };
    }
    newEntities[index] = ent;
    this._updateConfig('entities', newEntities);
  }

  _entityTapActionPropChanged(ev, index, prop) {
    const val = ev.target.value;
    const newEntities = [...this._entities];
    const ent = { ...newEntities[index] };
    let tapAction = typeof ent.tap_action === 'object' ? { ...ent.tap_action } : { action: ent.tap_action || 'navigate' };
    tapAction[prop] = val;
    ent.tap_action = tapAction;
    newEntities[index] = ent;
    this._updateConfig('entities', newEntities);
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

  renderEntityColorPicker(label, key, ent, index) {
    const colorVal = ent[key] || '';
    const parsed = this._parseColor(colorVal);
    const entityKey = key + '_entity';
    const entityVal = ent[entityKey] || '';
    const useDynamic = !!ent[`use_dynamic_${key}`];
    
    return html`
      <div style="flex: 1;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span class="label" style="margin: 0;">${label}</span>
          <ha-formfield .label=${this._localize("label.dynamic")}>
            <ha-switch
              .checked=${useDynamic}
              @change=${(ev) => this._updateEntityConfig(index, `use_dynamic_${key}`, ev.target.checked)}
            ></ha-switch>
          </ha-formfield>
        </div>
        
        ${useDynamic ? html`
          <ha-entity-picker
            .label=${label + " Entity"}
            .hass=${this.hass}
            .value=${entityVal}
            @value-changed=${(ev) => this._updateEntityConfig(index, entityKey, ev.detail.value)}
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
                       this._updateEntityConfig(index, key, `rgba(${r}, ${g}, ${b}, ${parsed.opacity})`);
                     }}>
              <span class="label" style="margin: 0;">${this._localize("label.transparency")}</span>
              <input type="range" min="0" max="1" step="0.01" .value=${parsed.opacity} style="flex: 1; min-width: 60px;"
                     @input=${(ev) => {
                       const r = parseInt(parsed.hex.slice(1, 3), 16);
                       const g = parseInt(parsed.hex.slice(3, 5), 16);
                       const b = parseInt(parsed.hex.slice(5, 7), 16);
                       this._updateEntityConfig(index, key, `rgba(${r}, ${g}, ${b}, ${ev.target.value})`);
                     }}>
              <span style="font-size: 12px; color: var(--secondary-text-color); width: 36px; text-align: right; flex-shrink: 0;">${Math.round(parsed.opacity * 100)}%</span>
            </div>
            <input type="text" class="styled-input" .value=${colorVal} @input=${(ev) => this._updateEntityConfig(index, key, ev.target.value)} placeholder=${this._localize("color.placeholder")}>
          </div>
        `}
      </div>
    `;
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
              <span class="label" style="margin: 0;">${this._localize("label.transparency")}</span>
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
    
    const normCurrent = this._config[key] !== undefined ? this._config[key] : '';
    const normValue = value !== undefined ? value : '';
    
    if (normCurrent === normValue || (key.startsWith('_') && this[`_${key}`] === value)) {
      return;
    }

    console.log(`[FixedPeriodChartEditor] _updateConfig FIRED! key=${key}, oldValue=${normCurrent}, newValue=${normValue}`);

    if (value === '' || value === undefined) {
      const tmpConfig = { ...this._config };
      delete tmpConfig[key];
      this._config = { type: 'custom:fixed-period-chart', ...tmpConfig };
    } else {
      this._config = {
        type: 'custom:fixed-period-chart',
        ...this._config,
        [key]: value
      };
    }
    
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _insertTemplate(ev, key, template) {
    ev.preventDefault();
    ev.stopPropagation();
    
    const input = this.shadowRoot.querySelector(`#title-input-${key}`);
    const currentVal = (this._config && this._config[key]) ? this._config[key] : (key === 'title' ? this._title : '');
    
    if (!input) {
      this._updateConfig(key, currentVal + template);
      return;
    }
    
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const val = input.value || '';
    const newVal = val.slice(0, start) + template + val.slice(end);
    
    this._updateConfig(key, newVal);
    
    setTimeout(() => {
      if (input && typeof input.setSelectionRange === 'function') {
        input.focus();
        input.setSelectionRange(start + template.length, start + template.length);
      }
    }, 10);
  }

  _insertTemplateEntity(ev, index, key, template) {
    ev.preventDefault();
    ev.stopPropagation();
    
    // Wir machen das hier einfach, indem wir es an den aktuellen Wert anhängen, da wir keine eindeutigen IDs für alle Entitäts-Inputs haben
    const ent = this._entities[index];
    const currentVal = ent[key] || '';
    const newVal = currentVal + template;
    
    this._updateEntityConfig(index, key, newVal);
  }

  static get styles() {
    return css`
      .entity-row {
        border: 1px solid var(--divider-color, #e0e0e0);
        border-radius: 4px;
        margin-bottom: 8px;
        background: var(--card-background-color, #fff);
        overflow: hidden;
      }
      .entity-header {
        display: flex;
        align-items: center;
        padding: 8px;
        gap: 8px;
        background: rgba(var(--rgb-primary-text-color), 0.02);
      }
      .entity-content {
        padding: 16px;
        border-top: 1px solid var(--divider-color, #e0e0e0);
      }
      .icon-btn {
        cursor: pointer;
        background: var(--primary-color, #03a9f4);
        color: var(--text-primary-color, white);
        border: none;
        padding: 6px 10px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .icon-btn:hover {
        opacity: 0.8;
      }
      /* remove-btn now inherits from icon-btn to be blue like dynamic-bar-card */
      .chip-btn {
        background: var(--secondary-background-color, #e5e5e5);
        border: 1px solid var(--divider-color, #e0e0e0);
        border-radius: 12px;
        padding: 2px 8px;
        font-size: 11px;
        cursor: pointer;
        color: var(--primary-text-color);
      }
      .chip-btn:hover {
        background: rgba(var(--rgb-primary-text-color), 0.1);
      }
      .add-entity-btn {
        background: none;
        border: 1px dashed var(--primary-color);
        color: var(--primary-color);
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        width: 100%;
        margin-top: 8px;
        font-weight: 500;
        transition: background 0.2s;
      }
      .add-entity-btn:hover {
        background: rgba(var(--rgb-primary-color), 0.1);
      }
      .config-section {
        border: 1px solid var(--divider-color, #e0e0e0);
        border-radius: 8px;
        padding: 16px;
        background: var(--secondary-background-color);
        margin-bottom: 24px;
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
      .entity-row[open] .entity-header {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
      }
      .entities-config.is-dragging .entity-row * {
        pointer-events: none;
      }
    `;
  }
}

customElements.define('fixed-period-chart-editor', FixedPeriodChartEditor);
