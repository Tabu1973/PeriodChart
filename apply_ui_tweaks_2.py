import sys
import re

def rewrite_editor():
    with open('src/fixed-period-chart-editor.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add 'scatter' to chart_type dropdown
    old_chart_type = '''                    <option value="bar">\</option>
                    <option value="line">\</option>
                  </select>'''
    new_chart_type = '''                    <option value="bar">\</option>
                    <option value="line">\</option>
                    <option value="scatter">\</option>
                  </select>'''
    content = content.replace(old_chart_type, new_chart_type)

    # 2. Add animation easing dropdown to global settings, before Colors
    old_global = '''            <div style="flex: 1;">
              <span class="label">\</span>'''
    new_global = '''            <div style="flex: 1;">
              <span class="label">\</span>
              <select class="styled-select" .value=\ @change=\>
                <option value="linear">Linear</option>
                <option value="easeOutQuart">Standard (easeOutQuart)</option>
                <option value="easeOutBounce">Bounce</option>
                <option value="easeOutElastic">Elastic</option>
                <option value="easeInOutSine">Smooth (easeInOutSine)</option>
              </select>
            </div>
            
            <div style="flex: 1;">
              <span class="label">\</span>'''
    content = content.replace(old_global, new_global)
    
    # 3. Label opacity slider in renderEntityColorPicker
    old_opacity1 = '''                <input type="range" min="0" max="1" step="0.01" .value=\ style="flex: 1; min-width: 60px;"'''
    new_opacity1 = '''                <div style="display: flex; flex-direction: column; flex: 1;">
                  <span style="font-size: 10px; color: var(--secondary-text-color); margin-bottom: 2px;">\</span>
                  <input type="range" min="0" max="1" step="0.01" .value=\ style="width: 100%; min-width: 60px;"'''
    
    old_opacity2 = '''this._updateEntityConfig(index, key, gba(\, \, \, \));
                       }}>
                <span style="font-size: 12px; color: var(--secondary-text-color); width: 36px; text-align: right; flex-shrink: 0;">\%</span>'''
    new_opacity2 = '''this._updateEntityConfig(index, key, gba(\, \, \, \));
                       }}>
                </div>
                <span style="font-size: 12px; color: var(--secondary-text-color); width: 36px; text-align: right; flex-shrink: 0;">\%</span>'''
    
    content = content.replace(old_opacity1, new_opacity1)
    content = content.replace(old_opacity2, new_opacity2)
    
    # Do the same for renderColorPicker (global colors)
    old_opacity3 = '''this._updateConfig(key, gba(\, \, \, \));
                     }}>
              <span style="font-size: 12px; color: var(--secondary-text-color); width: 36px; text-align: right; flex-shrink: 0;">\%</span>'''
    new_opacity3 = '''this._updateConfig(key, gba(\, \, \, \));
                     }}>
              </div>
              <span style="font-size: 12px; color: var(--secondary-text-color); width: 36px; text-align: right; flex-shrink: 0;">\%</span>'''
    content = content.replace(old_opacity3, new_opacity3)

    with open('src/fixed-period-chart-editor.js', 'w', encoding='utf-8') as f:
        f.write(content)


def rewrite_chart():
    with open('src/fixed-period-chart.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Update chart points for scatter
    old_datasets = '''        borderWidth: line_width ? Number(line_width) : (ent.chart_type === 'line' ? 2 : 1),
        tension: ent.smoothing ? 0.4 : 0,
        fill: ent.chart_type === 'line' ? (!!bg_color) : true, 
        pointRadius: ent.show_data_points === false ? 0 : 3,
        pointHoverRadius: ent.show_data_points === false ? 5 : 4,
        type: ent.chart_type || 'bar'
      };'''
    new_datasets = '''        borderWidth: line_width ? Number(line_width) : (ent.chart_type === 'line' ? 2 : (ent.chart_type === 'scatter' ? 0 : 1)),
        tension: ent.smoothing ? 0.4 : 0,
        fill: ent.chart_type === 'line' ? (!!bg_color) : true, 
        pointRadius: ent.show_data_points === false ? 0 : (ent.chart_type === 'scatter' ? 4 : 3),
        pointHoverRadius: ent.show_data_points === false ? 5 : (ent.chart_type === 'scatter' ? 6 : 4),
        showLine: ent.chart_type !== 'scatter',
        type: ent.chart_type === 'scatter' ? 'line' : (ent.chart_type || 'bar')
      };'''
    content = content.replace(old_datasets, new_datasets)

    # 2. Update animation options
    old_animation = '''        animation: {
          duration: 400
        },'''
    new_animation = '''        animation: {
          duration: 400,
          easing: this.config.animation_easing || 'easeOutQuart'
        },'''
    content = content.replace(old_animation, new_animation)

    with open('src/fixed-period-chart.js', 'w', encoding='utf-8') as f:
        f.write(content)

def rewrite_localize():
    with open('src/localize.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Add translations
    old_en = '''    "type.bar": "Bar Chart",
    "type.line": "Line Chart",'''
    new_en = '''    "type.bar": "Bar Chart",
    "type.line": "Line Chart",
    "type.scatter": "Points (Scatter)",
    "label.transparency": "Opacity",
    "label.animation_easing": "Animation Easing",'''
    content = content.replace(old_en, new_en)

    old_de = '''    "type.bar": "Balkendiagramm",
    "type.line": "Liniendiagramm",'''
    new_de = '''    "type.bar": "Balkendiagramm",
    "type.line": "Liniendiagramm",
    "type.scatter": "Punkte (Scatter)",
    "label.transparency": "Transparenz",
    "label.animation_easing": "Animations-Effekt",'''
    content = content.replace(old_de, new_de)

    with open('src/localize.js', 'w', encoding='utf-8') as f:
        f.write(content)


rewrite_editor()
rewrite_chart()
rewrite_localize()
print("Rewrite complete!")
