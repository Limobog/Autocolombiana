/**
 * Configuracion del sitio Minicross Colombia 2026
 *
 * PANEL: /panel-minicross-gestion-2026.html
 * Clave: minicross2026
 */
export const CONFIG = {
  adminPassword: 'minicross2026',

  apiUrl:
    'https://script.google.com/macros/s/AKfycbxH5PfCIGk8aKrbP8H7DR0PIMLZrpW9Uj0tzeP1W-g_m9G7JWY-h2jP6CnwwFaNAp1K/exec' as string,

  /**
   * Enlace directo a la Google Sheet donde el Apps Script guarda los datos.
   * Debe coincidir con SPREADSHEET_ID en docs/google-apps-script.gs.
   */
  spreadsheetUrl:
    'https://docs.google.com/spreadsheets/d/1kAlC3MP2DqH5KXkQQLVZF0SbHV6X8DY3nAyLxO81654/edit' as string,

  storageKeys: {
    registrations: 'minicross_registrations_v1',
    events: 'minicross_events_v1',
    adminSession: 'minicross_admin_session',
  },
  maxFileSizeMB: 5,
};