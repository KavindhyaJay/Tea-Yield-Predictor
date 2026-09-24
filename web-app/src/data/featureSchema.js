/**
 * Input schema for the prediction form.
 *
 * The field `key` values are what get POSTed to the FastAPI backend, so they
 * are the single place to rename once the final CatBoost feature names are
 * confirmed. The `label` values are taken verbatim from Figure 13 of the thesis
 * and should not be reworded.
 *
 * width: 'full' -> field spans the form width, 'half' -> two per row.
 */
export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const featureSections = [
  {
    title: 'Field',
    fields: [
      // options are loaded from the backend (GET /api/fields)
      { key: 'field_key', label: 'Field Key', type: 'select', options: [], width: 'full' },
    ],
  },
  {
    title: 'Temporal',
    fields: [
      { key: 'month', label: 'Month', type: 'select', options: MONTHS, width: 'half' },
      { key: 'year', label: 'Year', type: 'number', step: '1', width: 'half' },
    ],
  },
  {
    title: 'Historical Production',
    fields: [
      {
        key: 'last12_yph_nitrogen',
        label: 'Last 12 Months YPH - Nitrogen (kg/ha)',
        type: 'number',
        step: '0.01',
        width: 'full',
      },
      {
        key: 'nitrogen_per_hect_month',
        label: 'Nitrogen per Hect - Month (kg/ha)',
        type: 'number',
        step: '0.01',
        width: 'full',
      },
    ],
  },
  // {
  //   title: 'Harvesting',
  //   fields: [
  //     {
  //       key: 'plucking_average_month',
  //       label: 'Plucking Average - Month (kg/ha)',
  //       type: 'number',
  //       step: '0.01',
  //       width: 'full',
  //     },
  //     {
  //       key: 'gl_ha_rd_month',
  //       label: 'GL/Ha/Rd - Month (kg)',
  //       type: 'number',
  //       step: '0.01',
  //       width: 'full',
  //     },
  //     {
  //       key: 'lph_month',
  //       label: 'LPH - Month',
  //       type: 'number',
  //       step: '0.01',
  //       width: 'full',
  //     },
  //     {
  //       key: 'plucking_round_months',
  //       label: 'Plucking Round - Months',
  //       type: 'number',
  //       step: '0.1',
  //       width: 'full',
  //     },
  //   ],
  // },
  {
    title: 'Meteorological',
    fields: [
      { key: 'rainfall', label: 'Rainfall (mm)', type: 'number', step: '0.1', width: 'half' },
      { key: 'airtemp_max', label: 'AirTemp_Max (°C)', type: 'number', step: '0.1', width: 'half' },
      { key: 'sunshine', label: 'Sunshine (hours)', type: 'number', step: '0.1', width: 'half' },
      { key: 'rh_morning', label: 'RH_Morning (%)', type: 'number', step: '1', width: 'half' },
      { key: 'wetdays', label: 'WetDays (days)', type: 'number', step: '1', width: 'full' },
    ],
  },
  {
    title: 'Field & Plantation',
    fields: [
      { key: 'extent', label: 'Extent (ha)', type: 'number', step: '0.1', width: 'half' },
      {
        key: 'age_as_at_310324',
        label: 'Age as at 31/03/24 (years)',
        type: 'number',
        step: '1',
        width: 'half',
      },
    ],
  },
]

/** Default values shown in the form — the same sample record used in Figure 13. */
export const defaultInputs = {
  field_key: '',
  last12_yph_nitrogen: 1250,
  nitrogen_per_hect_month: 35,
  plucking_average_month: 780,
  gl_ha_rd_month: 42.5,
  lph_month: 1250,
  plucking_round_months: 14,
  rainfall: 245.0,
  airtemp_max: 28.6,
  sunshine: 7.8,
  rh_morning: 92,
  wetdays: 12,
  extent: 24.6,
  age_as_at_310324: 18,
  month: 'June',
  year: 2026,
}
