# Changelog

All notable changes to this project will be documented in this file.

## [0.0.5b] - 2026-08-08

### Added
- **Dynamic Chart Type Support:** Added `use_dynamic_chart_type` and `chart_type_entity` options. You can now control the chart type (e.g., switch between Line, Bar, Stacked Bar, Min/Max Bar) dynamically directly from your dashboard using an `input_select` entity without opening the editor.
- **Min/Max (Floating) and Stacked Bars:** Enhanced support for floating bars (`floating_bar`) and stacked bars (`stacked_bar`) for displaying range data (like minimum and maximum temperatures).
- **Advanced Coloring for Floating/Stacked Bars:** Background and border colors are now correctly decoupled and accurately applied to Min/Max and Stacked charts.
- **Dynamic Date in Title:** Added support for a `{date_range}` variable in the card title, allowing the title to dynamically update to show the current selected date range (e.g., "Pool Temperatur 03.08.2026 - 09.08.2026").
- **Improved Tooltips:** Enhanced tooltips for floating/stacked bars to properly format and display "Min bis Max" values, respecting `tooltip_decimals` and `tooltip_format` settings.

### Fixed
- **Visual Editor Freeze:** Fixed a critical bug where typing in the visual editor or selecting entities could cause a `TypeError` (frozen object mutation) and freeze the editor.
- **Missing Type Error:** Fixed an issue where Home Assistant would sometimes throw a "Konfigurationsfehler: Kein Typ angegeben" (No type specified) error when saving the configuration from the visual editor. The card now robustly enforces its `type` attribute during all editor updates.
- **Editor Icon Sizing:** Fixed an issue where the chart type selection icons could be rendered far too large in the visual editor.
