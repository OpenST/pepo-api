const rootPrefix = '../..',
  GoogleAuthClient = require('google-auth-library'),
  googleapis = require('googleapis'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

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

    await oThis.client.authorize();

    let sheets = sheetsApi('v4');

    return sheets.spreadsheets.values.get({ auth: oThis.client, spreadsheetId: spreadsheetId, range: 'upload!A1:D2' });
  }

  async _fetchRange(csvData) {
    const oThis = this;

    let colCount = csvData[0].length,
      rowCount = csvData.length;

    while (colCount > 0) {
      let rem = colCount % 26;
    }

    return `${sheetName}!A1:${lastId}${colCount}`;
  }
}

module.exports = Sheet;
