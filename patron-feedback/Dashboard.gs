// ─── DASHBOARD ────────────────────────────────────────────────────────────────

/**
 * Creates or fully refreshes the "Feedback Dashboard" tab inside the response
 * sheet.  Call this manually or wire it to the form's onSubmit trigger via
 * Triggers.gs so the dashboard stays live after every new submission.
 */
function buildDashboard() {
  var ss            = SpreadsheetApp.openById(CONFIG.RESPONSE_SHEET_ID);
  var responsesTab  = ss.getSheetByName(CONFIG.RESPONSE_TAB_NAME);

  if (!responsesTab) {
    Logger.log('ERROR: Response tab "' + CONFIG.RESPONSE_TAB_NAME + '" not found. ' +
               'Make sure the Form is linked to this spreadsheet.');
    return;
  }

  var dashSheet = _getOrCreateDashboardSheet(ss);

  var data       = _getResponseData(responsesTab);
  var categoryCounts = _countByCategory(data);
  var avgRatings     = _avgRatingByCategory(data);
  var keyComments    = _extractKeyComments(data);

  dashSheet.clearContents();
  dashSheet.clearFormats();

  var row = 1;
  row = _writeSummaryHeader(dashSheet, row, data.length);
  row = _writeCategoryTable(dashSheet, row, categoryCounts, avgRatings);
  row = _writeKeyCommentsTable(dashSheet, row, keyComments);

  _buildCategoryChart(dashSheet, responsesTab, categoryCounts);
  _buildRatingChart(dashSheet, categoryCounts, avgRatings);

  SpreadsheetApp.flush();
  Logger.log('Dashboard refreshed. ' + data.length + ' responses processed.');
}

// ─── Data helpers ──────────────────────────────────────────────────────────────

/**
 * Returns an array of response objects.
 * Expected column order from a standard Form-linked sheet:
 *   0: Timestamp
 *   1: Category
 *   2: Rating (1-5)
 *   3: Comments
 *   4: Patron Name
 */
function _getResponseData(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var raw = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  return raw
    .filter(function(r) { return r[0] && r[1]; })
    .map(function(r) {
      return {
        timestamp: r[0],
        category:  String(r[1]).trim(),
        rating:    Number(r[2]) || 0,
        comment:   String(r[3]).trim(),
        patron:    String(r[4]).trim()
      };
    });
}

function _countByCategory(data) {
  var counts = {};
  CONFIG.CATEGORIES.forEach(function(c) { counts[c] = 0; });
  data.forEach(function(r) {
    if (counts[r.category] !== undefined) counts[r.category]++;
    else counts[r.category] = (counts[r.category] || 0) + 1;
  });
  return counts;
}

function _avgRatingByCategory(data) {
  var sums   = {};
  var counts = {};
  data.forEach(function(r) {
    if (!r.rating) return;
    sums[r.category]   = (sums[r.category]   || 0) + r.rating;
    counts[r.category] = (counts[r.category] || 0) + 1;
  });
  var avgs = {};
  Object.keys(sums).forEach(function(cat) {
    avgs[cat] = Math.round((sums[cat] / counts[cat]) * 10) / 10;
  });
  return avgs;
}

function _extractKeyComments(data) {
  return data
    .filter(function(r) { return r.comment.length >= CONFIG.KEY_COMMENT_MIN_LENGTH; })
    .sort(function(a, b) { return b.comment.length - a.comment.length; })
    .slice(0, 20);
}

// ─── Sheet writing helpers ─────────────────────────────────────────────────────

function _writeSummaryHeader(sheet, row, totalResponses) {
  var headerRange = sheet.getRange(row, 1, 1, 6);
  headerRange.merge();
  headerRange.setValue('PATRON FEEDBACK DASHBOARD');
  headerRange.setFontSize(18).setFontWeight('bold').setFontColor('#FFFFFF');
  headerRange.setBackground('#1a1a2e').setHorizontalAlignment('center');
  row++;

  var dateRange = sheet.getRange(row, 1, 1, 6);
  dateRange.merge();
  dateRange.setValue(
    'Last updated: ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MMMM d, yyyy  h:mm a') +
    '   |   Total responses: ' + totalResponses
  );
  dateRange.setFontSize(10).setFontColor('#888888').setHorizontalAlignment('center');
  dateRange.setBackground('#f5f5f5');
  row += 2;
  return row;
}

function _writeCategoryTable(sheet, row, counts, avgs) {
  // Section title
  _writeSectionTitle(sheet, row, 'FEEDBACK BY CATEGORY', 6);
  row++;

  // Column headers
  var headers = ['Category', 'Responses', 'Avg Rating', 'Rating Bar', 'Share %', 'Status'];
  var hRange = sheet.getRange(row, 1, 1, headers.length);
  hRange.setValues([headers]);
  hRange.setFontWeight('bold').setBackground('#c9a84c').setFontColor('#1a1a2e');
  hRange.setHorizontalAlignment('center');
  row++;

  var total = Object.values(counts).reduce(function(a, b) { return a + b; }, 0);

  var sortedCats = Object.keys(counts).sort(function(a, b) {
    return counts[b] - counts[a];
  });

  sortedCats.forEach(function(cat, idx) {
    var count  = counts[cat];
    var avg    = avgs[cat] || 0;
    var share  = total > 0 ? Math.round((count / total) * 100) : 0;
    var bar    = _makeBar(avg, 5);
    var status = avg >= 4 ? 'Good' : avg >= 3 ? 'Fair' : avg > 0 ? 'Needs Attention' : '—';

    var r = sheet.getRange(row, 1, 1, 6);
    r.setValues([[cat, count, avg, bar, share + '%', status]]);

    var bg = idx % 2 === 0 ? '#ffffff' : '#fafafa';
    r.setBackground(bg);

    // Highlight low-rated categories
    if (avg > 0 && avg < 3) {
      sheet.getRange(row, 1).setBackground('#fce4e4');
      sheet.getRange(row, 6).setFontColor('#cc0000').setFontWeight('bold');
    } else if (avg >= 4) {
      sheet.getRange(row, 6).setFontColor('#2e7d32').setFontWeight('bold');
    }

    row++;
  });

  sheet.getRange(row - sortedCats.length - 1, 1, sortedCats.length + 1, 6)
       .setBorder(true, true, true, true, true, true);
  sheet.setColumnWidth(1, 220);
  sheet.setColumnWidth(4, 120);
  row += 2;
  return row;
}

function _writeKeyCommentsTable(sheet, row, keyComments) {
  _writeSectionTitle(sheet, row, 'KEY COMMENTS (HIGHLIGHTED FOR REVIEW)', 4);
  row++;

  var headers = ['Patron', 'Category', 'Rating', 'Comment'];
  var hRange  = sheet.getRange(row, 1, 1, 4);
  hRange.setValues([headers]);
  hRange.setFontWeight('bold').setBackground('#c9a84c').setFontColor('#1a1a2e');
  row++;

  if (keyComments.length === 0) {
    sheet.getRange(row, 1, 1, 4).merge().setValue('No key comments yet.');
    sheet.getRange(row, 1).setFontStyle('italic').setFontColor('#aaaaaa');
    row++;
  } else {
    keyComments.forEach(function(r, idx) {
      var cells = sheet.getRange(row, 1, 1, 4);
      cells.setValues([[
        r.patron || '(anonymous)',
        r.category,
        r.rating || '—',
        r.comment
      ]]);
      cells.setBackground(idx % 2 === 0 ? '#fff8e1' : '#fffde7');
      cells.setWrap(true);
      sheet.setRowHeight(row, 60);
      row++;
    });
  }

  sheet.setColumnWidth(4, 420);
  sheet.getRange(row - keyComments.length - 1, 1, keyComments.length + 1, 4)
       .setBorder(true, true, true, true, true, true);
  return row;
}

function _writeSectionTitle(sheet, row, title, colSpan) {
  var r = sheet.getRange(row, 1, 1, colSpan);
  r.merge();
  r.setValue(title);
  r.setFontSize(12).setFontWeight('bold').setFontColor('#1a1a2e');
  r.setBackground('#e8e0d0').setPaddingTop && r.setPaddingTop(4);
}

function _makeBar(value, max) {
  var filled = Math.round((value / max) * 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled) + ' ' + value;
}

// ─── Chart helpers ─────────────────────────────────────────────────────────────

function _buildCategoryChart(dashSheet, responsesTab, counts) {
  // Remove existing charts on the dashboard
  dashSheet.getCharts().forEach(function(c) { dashSheet.removeChart(c); });

  // Build a mini data range for the chart in an off-screen area (col 8+)
  var cats   = Object.keys(counts).sort(function(a, b) { return counts[b] - counts[a]; });
  var anchor = dashSheet.getRange(1, 8);
  dashSheet.getRange(1, 8).setValue('Category');
  dashSheet.getRange(1, 9).setValue('Responses');
  cats.forEach(function(cat, i) {
    dashSheet.getRange(i + 2, 8).setValue(cat);
    dashSheet.getRange(i + 2, 9).setValue(counts[cat]);
  });

  var dataRange = dashSheet.getRange(1, 8, cats.length + 1, 2);

  var chart = dashSheet.newChart()
    .setChartType(Charts.ChartType.BAR)
    .addRange(dataRange)
    .setPosition(4, 8, 0, 0)
    .setOption('title', 'Responses by Category')
    .setOption('titleTextStyle', { bold: true, fontSize: 13 })
    .setOption('legend', { position: 'none' })
    .setOption('colors', ['#c9a84c'])
    .setOption('backgroundColor', '#ffffff')
    .setOption('width', 480)
    .setOption('height', 300)
    .build();

  dashSheet.insertChart(chart);
}

function _buildRatingChart(dashSheet, counts, avgs) {
  var cats   = Object.keys(avgs);
  if (cats.length === 0) return;

  var startCol = 12;
  dashSheet.getRange(1, startCol).setValue('Category');
  dashSheet.getRange(1, startCol + 1).setValue('Avg Rating');
  cats.forEach(function(cat, i) {
    dashSheet.getRange(i + 2, startCol).setValue(cat);
    dashSheet.getRange(i + 2, startCol + 1).setValue(avgs[cat]);
  });

  var dataRange = dashSheet.getRange(1, startCol, cats.length + 1, 2);

  var chart = dashSheet.newChart()
    .setChartType(Charts.ChartType.COLUMN)
    .addRange(dataRange)
    .setPosition(18, 8, 0, 0)
    .setOption('title', 'Average Rating by Category (1–5)')
    .setOption('titleTextStyle', { bold: true, fontSize: 13 })
    .setOption('legend', { position: 'none' })
    .setOption('colors', ['#1a1a2e'])
    .setOption('vAxis', { minValue: 0, maxValue: 5 })
    .setOption('width', 480)
    .setOption('height', 300)
    .build();

  dashSheet.insertChart(chart);
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function _getOrCreateDashboardSheet(ss) {
  var existing = ss.getSheetByName(CONFIG.DASHBOARD_TAB_NAME);
  if (existing) return existing;
  var newSheet = ss.insertSheet(CONFIG.DASHBOARD_TAB_NAME);
  ss.setActiveSheet(newSheet);
  ss.moveActiveSheet(1);  // put it first
  return newSheet;
}
