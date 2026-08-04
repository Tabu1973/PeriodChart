# Fixed Period Chart

A Home Assistant lovelace custom card that displays a chart (via Chart.js) for a fixed period (this year, last year, this month, etc.). Uses Home Assistant's Long-Term Statistics.

## Installation via HACS

1. Go to HACS -> Frontend
2. Click the 3 dots in the top right corner and choose "Custom repositories"
3. Add the URL of this repository and select category "Lovelace"
4. Install "Fixed Period Chart"
5. Add the resource `/hacsfiles/hacs-fixed-period-chart/fixed-period-chart.js` (HACS should do this automatically)

## Configuration

```yaml
type: custom:fixed-period-chart
entity: sensor.my_sensor
period: this_year
show_date_picker: true
resolution: day
```

### Options
- `entity`: Sensor entity ID that has long-term statistics
- `period`: `this_year`, `last_year`, `this_month`, `last_month`, `today`
- `resolution`: `5minute`, `hour`, `day` (Default: `day`)
- `show_date_picker`: `true` or `false`
- `start_entity` / `end_entity`: Advanced usage to bind start and end date to Home Assistant `input_datetime` helpers instead of a fixed period.
