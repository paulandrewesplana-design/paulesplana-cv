// ─── EMAIL WORKFLOW ────────────────────────────────────────────────────────────

/**
 * Entry point called by the daily 10 AM time-based trigger.
 * Scans the patron sheet for rows whose departure date matches today,
 * then sends a personalised feedback email if one hasn't been sent yet.
 */
function checkDeparturesAndSendEmails() {
  var sheet = SpreadsheetApp
    .openById(CONFIG.PATRON_SHEET_ID)
    .getSheetByName(CONFIG.PATRON_TAB_NAME);

  if (!sheet) {
    Logger.log('ERROR: Patron sheet tab "' + CONFIG.PATRON_TAB_NAME + '" not found.');
    return;
  }

  var today    = _todayString();
  var lastRow  = sheet.getLastRow();
  var cols     = CONFIG.PATRON_COLS;

  if (lastRow < 2) {
    Logger.log('No patron rows found.');
    return;
  }

  var data = sheet.getRange(2, 1, lastRow - 1, cols.EMAIL_SENT).getValues();

  data.forEach(function(row, i) {
    var name       = row[cols.NAME - 1];
    var email      = row[cols.EMAIL - 1];
    var departure  = _formatDate(row[cols.DEPARTURE - 1]);
    var emailSent  = row[cols.EMAIL_SENT - 1];

    if (!name || !email || !departure) return;
    if (String(emailSent).toUpperCase() === 'TRUE') return;
    if (departure !== today) return;

    try {
      _sendFeedbackEmail(name, email);
      // Mark the row so we never double-send
      sheet.getRange(i + 2, cols.EMAIL_SENT).setValue(true);
      Logger.log('Email sent to ' + email + ' (' + name + ')');
    } catch (err) {
      Logger.log('ERROR sending to ' + email + ': ' + err.message);
    }
  });
}

// ─── Private helpers ───────────────────────────────────────────────────────────

function _sendFeedbackEmail(name, email) {
  var formUrl  = getPrefilledFormUrl(name);
  var subject  = 'We value your feedback — ' + name.split(' ')[0] + ', how was your stay?';
  var htmlBody = _buildEmailHtml(name, formUrl);
  var textBody = _buildEmailText(name, formUrl);

  GmailApp.sendEmail(email, subject, textBody, {
    htmlBody:  htmlBody,
    name:      CONFIG.SENDER_NAME,
    noReply:   false
  });
}

function _buildEmailHtml(name, formUrl) {
  var firstName = name.split(' ')[0];
  return [
    '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">',
    '  <div style="background:#1a1a2e;padding:32px 40px;text-align:center;">',
    '    <h1 style="color:#c9a84c;margin:0;font-size:22px;letter-spacing:2px;">GUEST EXPERIENCE</h1>',
    '  </div>',
    '  <div style="padding:40px;">',
    '    <p style="font-size:16px;">Dear ' + _escapeHtml(firstName) + ',</p>',
    '    <p>Thank you for choosing us. We hope your stay was exceptional.</p>',
    '    <p>Your feedback is invaluable in helping us maintain the highest standards across every area — ',
    '    from our casino floor and dining to our rooms and personal service.</p>',
    '    <p style="text-align:center;margin:32px 0;">',
    '      <a href="' + formUrl + '" ',
    '         style="background:#c9a84c;color:#1a1a2e;padding:14px 32px;text-decoration:none;',
    '                font-weight:bold;border-radius:4px;font-size:15px;display:inline-block;">',
    '        Share Your Feedback',
    '      </a>',
    '    </p>',
    '    <p style="font-size:13px;color:#888;">The survey takes less than 2 minutes to complete.</p>',
    '    <p>We look forward to welcoming you back soon.</p>',
    '    <p>Warm regards,<br><strong>' + _escapeHtml(CONFIG.SENDER_NAME) + '</strong></p>',
    '  </div>',
    '  <div style="background:#f5f5f5;padding:16px 40px;font-size:11px;color:#aaa;text-align:center;">',
    '    If the button above does not work, copy and paste this link:<br>',
    '    <a href="' + formUrl + '" style="color:#888;">' + formUrl + '</a>',
    '  </div>',
    '</div>'
  ].join('\n');
}

function _buildEmailText(name, formUrl) {
  var firstName = name.split(' ')[0];
  return [
    'Dear ' + firstName + ',',
    '',
    'Thank you for choosing us. We hope your stay was exceptional.',
    '',
    'Your feedback helps us improve every aspect of the guest experience.',
    'Please take a moment to share your thoughts using the link below:',
    '',
    formUrl,
    '',
    'The survey takes less than 2 minutes.',
    '',
    'Warm regards,',
    CONFIG.SENDER_NAME
  ].join('\n');
}

function _todayString() {
  var now = new Date();
  return Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function _formatDate(value) {
  if (!value) return '';
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  // Handle string dates like "06/10/2026" or "2026-06-10"
  var d = new Date(value);
  if (!isNaN(d.getTime())) {
    return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(value);
}

function _escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
