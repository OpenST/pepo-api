const rootPrefix = '../..',
  GoogleAuthClient = require('google-auth-library'),
  googleapis = require('googleapis'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

let creds = require(rootPrefix + '/creds.json');

class Sheet {
  constructor(params) {
    const oThis = this;

    oThis.client = new GoogleAuthClient.JWT(
      coreConstants.PA_GOOGLE_CLIENT_EMAIL,
      null,
      JSON.parse(coreConstants.PA_GOOGLE_PRIVATE_KEY),
      ['https://www.googleapis.com/auth/spreadsheets'],
      null
    );
  }

  /**
   * Upload to sheets
   *
   * @param sheetName
   * @param csvData
   * @returns {Promise}
   */
  async upload(sheetName, csvData) {
    const oThis = this,
      spreadsheetId = coreConstants.PA_USAGE_REPORT_SPREADSHEET_ID,
      sheetsApi = googleapis.google.sheets;

    let auth = await oThis.client.authorize();

    let sheets = sheetsApi({ version: 'v4', auth });

    return sheets.spreadsheets.values.get({ spreadsheetId: spreadsheetId, range: 'upload!A1:D2' });
  }
}

module.exports = Sheet;
