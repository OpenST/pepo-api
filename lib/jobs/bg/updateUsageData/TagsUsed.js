const rootPrefix = '../../../..',
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  UserTagModel = require(rootPrefix + '/app/models/mysql/UserTag'),
  GoogleSheetsUploadData = require(rootPrefix + '/lib/google/Sheet'),
  VideoTagsModel = require(rootPrefix + '/app/models/mysql/VideoTag'),
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

    const limit = 50;

    let moreDataPresent = true,
      page = 0,
      offset = 0;

    while (moreDataPresent) {
      const batchData = {},
        dbRows = await new TagModel()
          .select(['id', 'name', 'weight'])
          .limit(limit)
          .offset(offset)
          .fire();

      page++;
      offset = page * limit;

      if (dbRows.length === 0) {
        moreDataPresent = false;
      } else {
        for (let index = 0; index < dbRows.length; index++) {
          batchData[dbRows[index].id] = {
            name: dbRows[index].name,
            weight: Number(dbRows[index].weight),
            videoTagsCount: 0,
            userTagsCount: 0
          };
        }
        const dataWithVideoTags = await oThis.fetchTagsCountInVideoTagsTable(batchData),
          dataWithUserTags = await oThis.fetchTagsCountFromUserTagsTable(dataWithVideoTags);

        Object.assign(oThis.extractedData, dataWithUserTags);
        await basicHelper.sleep(1000);
      }
    }
  }

  /**
   * Fetch tags count from videos table.
   *
   * @param {object} idToDetailsMap
   *
   * @returns {Promise<*>}
   */
  async fetchTagsCountInVideoTagsTable(idToDetailsMap) {
    const tagIdsArray = Object.keys(idToDetailsMap);

    const queryResponse = await new VideoTagsModel()
      .select('tag_id, count(*) as count')
      .where(['tag_id IN (?)', tagIdsArray])
      .group_by(['tag_id'])
      .fire();

    for (let index = 0; index < queryResponse.length; index++) {
      idToDetailsMap[queryResponse[index].tag_id].videoTagsCount = Number(queryResponse[index].count);
    }

    return idToDetailsMap;
  }

  /**
   * Fetch tags count from user tags table.
   *
   * @param {object} idToDetailsMap
   *
   * @returns {Promise<*>}
   */
  async fetchTagsCountFromUserTagsTable(idToDetailsMap) {
    const tagIdsArray = Object.keys(idToDetailsMap);

    const queryResponse = await new UserTagModel()
      .select('tag_id, count(*) as count')
      .where(['tag_id IN (?)', tagIdsArray])
      .group_by(['tag_id'])
      .fire();

    for (let index = 0; index < queryResponse.length; index++) {
      idToDetailsMap[queryResponse[index].tag_id].userTagsCount = Number(queryResponse[index].count);
    }

    return idToDetailsMap;
  }

  /**
   * Upload data to Google Sheets.
   *
   * @returns {Promise<void>}
   */
  async uploadData() {
    const oThis = this;

    const dataToUpload = [];
    const rowKeys = ['Tag name', '#used in bio', '#used in video'];
    dataToUpload.push(rowKeys);

    for (const id in oThis.extractedData) {
      const row = [
        oThis.extractedData[id].name,
        oThis.extractedData[id].userTagsCount,
        oThis.extractedData[id].videoTagsCount
      ];
      dataToUpload.push(row);
    }

    return new GoogleSheetsUploadData().update(
      pepoUsageSheetNamesConstants.tagsUsedSheetName,
      dataToUpload,
      pepoUsageSheetNamesConstants.usageReportNamesToGroupIdsMap[pepoUsageSheetNamesConstants.tagsUsedSheetName]
    );
  }
}

module.exports = TagsUsed;
