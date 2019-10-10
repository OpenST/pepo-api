const GoogleAuthClient = require('google-auth-library'),
  googleapis = require('googleapis'),
  SPREADSHEET_READ_WRITE_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class Sheet {
  /**
   * @constructor
   *
   * @param params
   */
  constructor(params) {
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
   * Upload to sheets
   *
   * @param sheetName
   * @param csvData - array of rows to be updated
   * @param gid - id of the tab in the sheets to be edited
   *
   * @returns {Promise}
   */
  async upload(sheetName, csvData, gid) {
    const oThis = this,
      spreadsheetId = coreConstants.PA_GOOGLE_USAGE_REPORT_SPREADSHEET_ID,
      sheets = googleapis.google.sheets('v4');

    // Refresh auth
    await oThis.client.authorize().catch(function(err) {
      return oThis._triggerPagerduty(err);
    });

    // Clear prior data
    await oThis._clearSheet(spreadsheetId, gid).catch(function(err) {
      return oThis._triggerPagerduty(err);
    });

    const range = oThis._fetchRange(sheetName, csvData); // Fetch data range to update

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
   * Clear earlier data in the sheet
   *
   * @param spreadsheetId
   * @param gid
   * @returns {Promise}
   * @private
   */
  async _clearSheet(spreadsheetId, gid) {
    const oThis = this,
      sheets = googleapis.google.sheets('v4');

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
   * Fetch range for the data
   *
   * @param sheetName
   * @param csvData
   * @private
   */
  _fetchRange(sheetName, csvData) {
    const oThis = this;

    let colCount = csvData[0].length,
      rowCount = csvData.length,
      lastId = [];

    while (colCount > 0) {
      let rem = colCount % 26;

      if (rem == 0) {
        lastId.unshift('Z');
        colCount = Math.floor(colCount / 26) - 1;
      } else {
        const character = String.fromCharCode(65 + rem - 1); // 65 in ASCII is char 'A'
        lastId.unshift(character);
        colCount = Math.floor(colCount / 26);
      }
    }

    return `${sheetName}!A1:${lastId}${rowCount}`;
  }

  /**
   * Trigger pagerduty
   *
   * @param err
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
