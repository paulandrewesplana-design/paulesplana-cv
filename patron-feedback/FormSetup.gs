// ─── FORM SETUP ───────────────────────────────────────────────────────────────

/**
 * Creates (or re-uses) the patron feedback Google Form and links its responses
 * to the configured response sheet.  Run this ONCE manually before deploying
 * the email trigger.
 *
 * After running, the Form ID is stored in Script Properties and the form URL
 * is logged.  Copy the URL to verify the form looks correct.
 */
function createFeedbackForm() {
  var existingId = PropertiesService.getScriptProperties().getProperty('FORM_ID');
  if (existingId) {
    var existing = FormApp.openById(existingId);
    Logger.log('Form already exists: ' + existing.getPublishedUrl());
    return existing;
  }

  var form = FormApp.create('Guest Feedback Form');
  form.setTitle('Guest Feedback Form');
  form.setDescription(
    'Thank you for staying with us. Your feedback helps us improve every experience. ' +
    'Please take a moment to share your thoughts.'
  );
  form.setConfirmationMessage('Thank you for your feedback! We look forward to welcoming you again.');
  form.setAllowResponseEdits(false);
  form.setCollectEmail(false);

  // — Category dropdown ——————————————————————————————————————————————————————
  var categoryItem = form.addListItem();
  categoryItem.setTitle('Which area would you like to give feedback on?');
  categoryItem.setRequired(true);
  categoryItem.setChoiceValues(CONFIG.CATEGORIES);

  // — Rating scale ———————————————————————————————————————————————————————————
  var ratingItem = form.addScaleItem();
  ratingItem.setTitle('How would you rate your overall experience in this area?');
  ratingItem.setBounds(1, 5);
  ratingItem.setLabels('Poor', 'Excellent');
  ratingItem.setRequired(true);

  // — Comments text box ——————————————————————————————————————————————————————
  var commentsItem = form.addParagraphTextItem();
  commentsItem.setTitle('Please share any additional comments or suggestions.');
  commentsItem.setHelpText('The more detail you provide, the better we can improve.');
  commentsItem.setRequired(false);

  // — Hidden patron name field (pre-filled via URL params) ——————————————————
  var nameItem = form.addTextItem();
  nameItem.setTitle('Your Name');
  nameItem.setRequired(false);

  // — Link responses to the designated response sheet ————————————————————————
  var responseSheet = SpreadsheetApp.openById(CONFIG.RESPONSE_SHEET_ID);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, CONFIG.RESPONSE_SHEET_ID);

  // Persist the form ID so CONFIG.FORM_ID resolves on subsequent runs
  PropertiesService.getScriptProperties().setProperty('FORM_ID', form.getId());

  Logger.log('Form created. Published URL: ' + form.getPublishedUrl());
  Logger.log('Form ID stored: ' + form.getId());
  return form;
}

/**
 * Returns a pre-filled form URL personalised with the patron's name.
 * Google Forms supports pre-fill via entry IDs in the query string.
 */
function getPrefilledFormUrl(patronName) {
  var formId = PropertiesService.getScriptProperties().getProperty('FORM_ID');
  if (!formId) throw new Error('Form ID not found. Run createFeedbackForm() first.');

  var form = FormApp.openById(formId);
  var items = form.getItems();

  // Find the "Your Name" item
  var nameEntryId = null;
  for (var i = 0; i < items.length; i++) {
    if (items[i].getTitle() === 'Your Name') {
      nameEntryId = items[i].asTextItem().getId();
      break;
    }
  }

  var baseUrl = form.getPublishedUrl().replace('/viewform', '/viewform?usp=pp_url');
  if (nameEntryId) {
    baseUrl += '&entry.' + nameEntryId + '=' + encodeURIComponent(patronName);
  }
  return baseUrl;
}
