const GoogleAuthClient = require('google-auth-library'),
  googleapis = require('googleapis');

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');

// Declare variables.
const SPREADSHEET_READ_WRITE_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

/**
 * Class to upload data in Google Sheets.
 *
 * @class Sheet
 */
class Sheet {
  /**
   * Constructor to upload data in Google Sheets.
   *
   * @constructor
   */
  constructor() {
    const oThis = this;

    oThis.client = new GoogleAuthClient.JWT(
      coreConstants.PA_GOOGLE_CLIENT_EMAIL,
      null,
      unescape(coreConstants.PA_GOOGLE_PRIVATE_KEY),
      [SPREADSHEET_READ_WRITE_SCOPE],
      null
    );
  }

  /**
   * Upload to sheets.
   *
   * @param {string} sheetName
   * @param {array} csvData: array of rows to be updated
   * @param {number/string} gid: id of the tab in the sheets to be edited
   *
   * @returns {Promise<void>}
   */
  async upload(sheetName, csvData, gid) {
    const oThis = this;

    const spreadsheetId = coreConstants.PA_GOOGLE_USAGE_REPORT_SPREADSHEET_ID,
      sheets = googleapis.google.sheets('v4');

    // Refresh auth.
    await oThis.client.authorize().catch(function(err) {
      return oThis._triggerPagerduty(err);
    });

    // Clear prior data.
    await oThis._clearSheet(spreadsheetId, gid).catch(function(err) {
      return oThis._triggerPagerduty(err);
    });

    const range = oThis._fetchRange(sheetName, csvData); // Fetch data range to update.

    const request = {
      auth: oThis.client,
      spreadsheetId: spreadsheetId,
      range: range,
      resource: { values: csvData },
      valueInputOption: 'USER_ENTERED' // Strings may be parsed to dates, numbers etc. Rest will be as typed by user.
    };

    await sheets.spreadsheets.values.update(request).catch(function(err) {
      return oThis._triggerPagerduty(err);
    });
  }

  /**
   * Clear earlier data in the sheet.
   *
   * @param {string} spreadsheetId
   * @param {number/string} gid
   *
   * @returns {Promise<*>}
   * @private
   */
  async _clearSheet(spreadsheetId, gid) {
    const oThis = this;

    const sheets = googleapis.google.sheets('v4');

    const request = {
      auth: oThis.client,
      spreadsheetId: spreadsheetId,
      requestBody: {
        requests: [
          {
            updateCells: {
              range: {
                sheetId: gid
              },
              fields: '*' // Make everything empty in the sheet
            }
          }
        ]
      }
    };

    return sheets.spreadsheets.batchUpdate(request);
  }

  /**
   * Fetch range for the data.
   *
   * @param {string} sheetName
   * @param {array} csvData
   *
   * @returns {string}
   * @private
   */
  _fetchRange(sheetName, csvData) {
    let colCount = csvData[0].length;

    const rowCount = csvData.length,
      lastId = [];

    while (colCount > 0) {
      const rem = colCount % 26;

      if (rem === 0) {
        lastId.unshift('Z');
        colCount = Math.floor(colCount / 26) - 1;
      } else {
        const character = String.fromCharCode(65 + rem - 1); // 65 in ASCII is char 'A'
        lastId.unshift(character);
        colCount = Math.floor(colCount / 26);
      }
    }

    return `${sheetName}!A1:${lastId.join('')}${rowCount}`;
  }

  /**
   * Trigger pagerduty.
   *
   * @param {object} err
   *
   * @returns {Promise<void>}
   * @private
   */
  async _triggerPagerduty(err) {
    const errorObject = responseHelper.error({
      internal_error_identifier: 'l_google_s_1',
      api_error_identifier: 'something_went_wrong',
      debug_options: { err: err }
    });

    return createErrorLogsEntry.perform(errorObject, errorLogsConstants.lowSeverity);
  }
}

module.exports = Sheet;
