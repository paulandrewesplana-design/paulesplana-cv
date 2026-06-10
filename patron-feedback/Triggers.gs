// ─── TRIGGERS ─────────────────────────────────────────────────────────────────

/**
 * ONE-TIME SETUP: Call this function manually from the Apps Script editor
 * (Run → setupAllTriggers) to install both triggers:
 *
 *   1. Daily at 10:00 AM — scans patron sheet and sends departure emails.
 *   2. On Form Submit    — rebuilds the dashboard whenever a response arrives.
 *
 * Running this a second time is safe; it checks for duplicates first.
 */
function setupAllTriggers() {
  _ensureDailyEmailTrigger();
  _ensureFormSubmitTrigger();
  Logger.log('All triggers are in place.');
}

/**
 * Removes every project trigger.  Use only if you need a clean slate.
 */
function removeAllTriggers() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    ScriptApp.deleteTrigger(t);
  });
  Logger.log('All triggers removed.');
}

// ─── Private helpers ───────────────────────────────────────────────────────────

function _ensureDailyEmailTrigger() {
  var alreadyExists = ScriptApp.getProjectTriggers().some(function(t) {
    return t.getHandlerFunction() === 'checkDeparturesAndSendEmails';
  });
  if (alreadyExists) {
    Logger.log('Daily email trigger already exists — skipped.');
    return;
  }
  ScriptApp.newTrigger('checkDeparturesAndSendEmails')
    .timeBased()
    .everyDays(1)
    .atHour(10)          // 10 AM in the script's configured timezone (Asia/Manila)
    .create();
  Logger.log('Daily 10 AM email trigger created.');
}

function _ensureFormSubmitTrigger() {
  var alreadyExists = ScriptApp.getProjectTriggers().some(function(t) {
    return t.getHandlerFunction() === 'buildDashboard';
  });
  if (alreadyExists) {
    Logger.log('Form submit trigger already exists — skipped.');
    return;
  }

  var formId = PropertiesService.getScriptProperties().getProperty('FORM_ID');
  if (!formId) {
    Logger.log('WARNING: FORM_ID not set. Run createFeedbackForm() first, then re-run setupAllTriggers().');
    return;
  }

  ScriptApp.newTrigger('buildDashboard')
    .forForm(formId)
    .onFormSubmit()
    .create();
  Logger.log('Form onSubmit → buildDashboard trigger created.');
}
