# Changelog

All notable changes to this project will be documented in this file.

## [0.0.8b] - 2026-11-03

### Added
- **Tap Actions:** Added interactive click/tap support (`tap_action`) on chart elements (bars/points) and the card title. Clicking an element defaults to opening the entity's `more-info` dialog.
- **Entity Tap Action Settings:** Added configurable `tap_action` for each individual entity (supports `default` / `more-info`, `toggle`, `navigate`, `url`, `perform-action`, `none`).
- **Global Tap Action Settings:** Added global `tap_action` for the card header/title with hover styling and pointer cursor.
- **Visual Editor Controls:** Added intuitive dropdowns and dynamic input fields in the visual card editor for both global and entity tap actions.
- **Localization:** Added full English and German translations for all tap action options and labels.

## [0.0.7b] - 2026-08-10

### Changed
- **Visual Editor:** Significant design improvements and polish for the visual editor, including a new native drag & drop implementation for entity sorting.

## [0.0.6b] - 2026-08-09

### Added
- **Y-Axis Configuration:** Added the ability to configure the Y-axis scaling per entity directly from the visual editor. You can now toggle `beginAtZero` to allow the chart to zoom in on smaller fluctuations (like air pressure) and set fixed `y_min` and `y_max` values.

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
