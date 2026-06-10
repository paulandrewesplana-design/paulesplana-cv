// ─── CONFIGURATION ────────────────────────────────────────────────────────────
// Replace placeholder IDs with your actual Google resource IDs before deploying.

var CONFIG = {
  // Google Sheet containing patron data (Name, Email, Arrival, Departure, Room)
  PATRON_SHEET_ID: 'YOUR_PATRON_SHEET_ID',
  PATRON_TAB_NAME: 'Patrons',

  // Column indices (1-based) in the patron sheet
  PATRON_COLS: {
    NAME:       1,
    EMAIL:      2,
    ARRIVAL:    3,
    DEPARTURE:  4,
    ROOM:       5,
    EMAIL_SENT: 6   // flag column — set to TRUE after email is dispatched
  },

  // Google Sheet that collects form responses (linked automatically by the Form)
  RESPONSE_SHEET_ID: 'YOUR_RESPONSE_SHEET_ID',
  RESPONSE_TAB_NAME: 'Form Responses 1',  // default tab name created by Google Forms

  // Dashboard tab inside the response sheet
  DASHBOARD_TAB_NAME: 'Feedback Dashboard',

  // Stored after FormSetup.createFeedbackForm() runs
  FORM_ID: PropertiesService.getScriptProperties().getProperty('FORM_ID') || '',

  // Feedback categories shown in the dropdown
  CATEGORIES: ['Food & Beverage', 'Service & Staff', 'Casino Floor', 'Rooms & Amenities', 'Overall Experience'],

  // Minimum comment length (chars) to be highlighted in the dashboard
  KEY_COMMENT_MIN_LENGTH: 80,

  // Email sender name
  SENDER_NAME: 'Guest Experience Team'
};
