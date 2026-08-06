const translations = {
  en: {
    "section.basic": "1. Basic Settings",
    "section.time": "2. Time & Resolution",
    "section.appearance": "3. Chart Appearance",
    "section.colors": "4. Colors",
    "section.display": "5. Display & Axes",
    
    "label.entity": "Entity (Sensor)",
    "label.entities": "Entities",
    "btn.add_entity": "+ Add Entity",
    "label.title": "Title (Optional)",
    "label.legend_label": "Legend Label (Optional)",
    
    "label.period": "Period",
    "label.resolution": "Resolution",
    
    "period.this_year": "This Year",
    "period.last_year": "Last Year",
    "period.this_month": "This Month",
    "period.last_month": "Last Month",
    "period.this_week": "This Week",
    "period.last_week": "Last Week",
    "period.today": "Today",
    "period.yesterday": "Yesterday",
    "period.custom": "Custom (Entities/Picker)",
    
    "resolution.day": "Day",
    "resolution.hour": "Hour",
    "resolution.5minute": "5 Minute",
    "resolution.custom": "Custom (Entity)",
    
    "note.conflict": "Conflict: You have selected a fixed period, so your configured custom entities are currently ignored. Change the dropdown to 'Custom' to use them.",
    "note.custom_period": "Note on Custom Period: If you specify Start/End entities, they will take precedence over the Period entity. Fill out only the ones you want to use.",
    "label.use_start_end_entities": "Use Start/End Entities",
    "label.use_period_entity": "Use Period Entity",
    
    "label.period_entity": "Period Entity (Optional)",
    "label.start_entity": "Start Entity (Optional)",
    "label.end_entity": "End Entity (Optional)",
    "label.resolution_entity": "Resolution Entity",
    
    "label.chart_type": "Chart Type",
    "label.horizontal_chart": "Horizontal Chart",
    "type.bar": "Bar",
    "type.line": "Line",
    
    "label.line_width": "Line/Border Width (e.g. 2)",
    "label.auto": "Auto",
    "label.smooth_lines": "Smooth Lines",
    "label.show_data_points": "Show Data Points",
    
    "label.dynamic": "Dynamic",
    "label.use_dynamic_line_width": "Use Dynamic Entity for Line Width",
    "label.line_width_entity": "Line Width Entity",
    
    "color.line_bar": "Line / Border Color",
    "color.fill": "Chart Fill Color",
    "color.card_bg": "Card Background",
    "color.placeholder": "e.g. rgba(255,0,0,0.2)",
    
    "label.show_navigation": "Show Navigation Arrows",
    "label.show_legend": "Show Legend",
    "label.show_tooltips": "Show Tooltips",
    "label.show_date_picker": "Show Date Picker",
    
    "label.show_x_axis": "Show X-Axis",
    "label.show_x_grid": "Show X-Grid",
    "label.max_ticks_x": "Max Ticks X-Axis (e.g. 10)",
    
    "label.show_y_axis": "Show Y-Axis",
    "label.show_y_grid": "Show Y-Grid",
    "label.step_size_y": "Step Size Y-Axis (e.g. 5)",
  },
  de: {
    "section.basic": "1. Grundeinstellungen",
    "section.time": "2. Zeit & Auflösung",
    "section.appearance": "3. Diagramm-Darstellung",
    "section.colors": "4. Farben",
    "section.display": "5. Anzeige & Achsen",
    
    "label.entity": "Entität (Sensor)",
    "label.entities": "Entitäten",
    "btn.add_entity": "+ Entität hinzufügen",
    "label.title": "Titel (Optional)",
    "label.legend_label": "Legenden-Label (Optional)",
    
    "label.period": "Zeitraum",
    "label.resolution": "Auflösung",
    
    "period.this_year": "Dieses Jahr",
    "period.last_year": "Letztes Jahr",
    "period.this_month": "Dieser Monat",
    "period.last_month": "Letzter Monat",
    "period.this_week": "Diese Woche",
    "period.last_week": "Letzte Woche",
    "period.today": "Heute",
    "period.yesterday": "Gestern",
    "period.custom": "Benutzerdefiniert (Entitäten)",
    
    "resolution.day": "Tag",
    "resolution.hour": "Stunde",
    "resolution.5minute": "5 Minuten",
    "resolution.custom": "Benutzerdefiniert (Entität)",
    
    "note.conflict": "Konflikt: Du hast einen festen Zeitraum ausgewählt, daher werden deine konfigurierten Entitäten ignoriert. Stelle das Dropdown auf 'Benutzerdefiniert', um sie zu nutzen.",
    "note.custom_period": "Hinweis zum benutzerdefinierten Zeitraum: Wenn du Start-/End-Entitäten angibst, überschreiben diese die Zeitraum-Entität. Fülle nur die aus, die du auch nutzen möchtest.",
    "label.use_start_end_entities": "Start-/End-Entitäten nutzen",
    "label.use_period_entity": "Zeitraum-Entität nutzen",
    
    "label.period_entity": "Zeitraum-Entität (Optional)",
    "label.start_entity": "Start-Entität (Optional)",
    "label.end_entity": "End-Entität (Optional)",
    "label.resolution_entity": "Auflösungs-Entität",
    
    "label.chart_type": "Diagramm-Typ",
    "label.horizontal_chart": "Horizontales Diagramm",
    "type.bar": "Balken (Bar)",
    "type.line": "Linie (Line)",
    
    "label.line_width": "Linien-/Rahmendicke (z.B. 2)",
    "label.auto": "Auto",
    "label.smooth_lines": "Weiche Linien (Smooth)",
    "label.show_data_points": "Datenpunkte anzeigen",
    
    "label.dynamic": "Dynamisch",
    "label.use_dynamic_line_width": "Dynamische Entität für Liniendicke nutzen",
    "label.line_width_entity": "Liniendicken-Entität",
    
    "color.line_bar": "Linien- / Rahmenfarbe",
    "color.fill": "Füllfarbe",
    "color.card_bg": "Karten-Hintergrund",
    "color.placeholder": "z.B. rgba(255,0,0,0.2)",
    
    "label.show_navigation": "Navigations-Pfeile anzeigen",
    "label.show_legend": "Legende anzeigen",
    "label.show_tooltips": "Tooltips anzeigen",
    "label.show_date_picker": "Datumsauswahl anzeigen",
    
    "label.show_x_axis": "X-Achse anzeigen",
    "label.show_x_grid": "X-Raster (Grid) anzeigen",
    "label.max_ticks_x": "Max. Ticks X-Achse (z.B. 10)",
    
    "label.show_y_axis": "Y-Achse anzeigen",
    "label.show_y_grid": "Y-Raster (Grid) anzeigen",
    "label.step_size_y": "Schrittgröße Y-Achse (z.B. 5)",
  }
};

export default function localize(string, language = 'en') {
  const lang = language.split('-')[0] || 'en';
  
  let translated;
  if (translations[lang] && translations[lang][string]) {
    translated = translations[lang][string];
  } else if (translations['en'][string]) {
    translated = translations['en'][string];
  } else {
    translated = string;
  }
  
  return translated;
}
