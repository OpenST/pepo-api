const rootPrefix = '../../../..',
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  GoogleSheetsUploadData = require(rootPrefix + '/lib/google/Sheet'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  pepoUsageSheetNamesConstants = require(rootPrefix + '/lib/globalConstant/pepoUsageSheetNames');

/**
 * Class to populate tags used data sheet in Google Sheets.
 *
 * @class TagsUsed
 */
class TagsUsed {
  /**
   * Constructor to populate tags used data sheet in Google Sheets.
   *
   * @constructor
   */
  constructor() {
    const oThis = this;

    oThis.extractedData = {};
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis.fetchTagsDataFromTagsTable();

    await oThis.uploadData();
  }

  /**
   * Fetch tags data from tags table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async fetchTagsDataFromTagsTable() {
    const oThis = this;

    const limit = 100;

    let moreDataPresent = true,
      page = 0,
      offset = 0;

    while (moreDataPresent) {
      const batchData = {},
        dbRows = await new TagModel()
          .select(['id', 'user_bio_weight', 'video_weight', 'reply_weight', 'name'])
          .limit(limit)
          .offset(offset)
          .order_by('id asc')
          .fire();

      page++;
      offset = page * limit;

      if (dbRows.length === 0) {
        moreDataPresent = false;
      } else {
        for (let index = 0; index < dbRows.length; index++) {
          batchData[dbRows[index].id] = {
            name: dbRows[index].name,
            videoTagsCount: dbRows[index].video_weight,
            replyTagsCount: dbRows[index].reply_weight,
            userTagsCount: dbRows[index].user_bio_weight
          };
        }

        Object.assign(oThis.extractedData, batchData);
      }
    }
  }

  /**
   * Upload data to Google Sheets.
   *
   * @returns {Promise<void>}
   */
  async uploadData() {
    const oThis = this;

    const dataToUpload = [];
    const rowKeys = ['Tag name', '#used in bio', '#used in video', '#used in reply'];
    dataToUpload.push(rowKeys);

    for (const id in oThis.extractedData) {
      const row = [
        oThis.extractedData[id].name,
        oThis.extractedData[id].userTagsCount,
        oThis.extractedData[id].videoTagsCount,
        oThis.extractedData[id].replyTagsCount
      ];
      dataToUpload.push(row);
    }

    return new GoogleSheetsUploadData().upload(
      pepoUsageSheetNamesConstants.tagsUsedSheetName,
      dataToUpload,
      pepoUsageSheetNamesConstants.usageReportNamesToGroupIdsMap[pepoUsageSheetNamesConstants.tagsUsedSheetName]
    );
  }
}

module.exports = TagsUsed;
