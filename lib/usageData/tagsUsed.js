const rootPrefix = '../..',
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  UserTagModel = require(rootPrefix + '/app/models/mysql/UserTag'),
  VideoTagsModel = require(rootPrefix + '/app/models/mysql/VideoTag'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class TagsUsed {
  constructor() {
    const oThis = this;

    oThis.extractedData = {};
  }

  /**
   * Perform
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchTagsDataFromTagsTable();

    await oThis._processOutput();
  }

  /**
   * Fetch tags data from tags table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTagsDataFromTagsTable() {
    const oThis = this;

    let moreDataPresent = true,
      limit = 50,
      page = 0,
      offset = 0;

    while (moreDataPresent) {
      let batchData = {},
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
        for (let i = 0; i < dbRows.length; i++) {
          batchData[dbRows[i].id] = {
            name: dbRows[i].name,
            weight: Number(dbRows[i].weight),
            videoTagsCount: 0,
            userTagsCount: 0
          };
        }
        let dataWithVideoTags = await oThis._fetchTagsCountInVideoTagsTable(batchData),
          dataWithUserTags = await oThis._fetchTagsCountFromUserTagsTable(dataWithVideoTags);

        Object.assign(oThis.extractedData, dataWithUserTags);
        await basicHelper.sleep(1000);
      }
    }
  }

  /**
   * Fetch tags count from videos table.
   *
   * @param idToDetailsMap
   * @returns {Promise<*>}
   * @private
   */
  async _fetchTagsCountInVideoTagsTable(idToDetailsMap) {
    const oThis = this;

    let tagIdsArray = Object.keys(idToDetailsMap),
      queryResponse = await new VideoTagsModel()
        .select('tag_id, count(*) as count')
        .where(['tag_id IN (?)', tagIdsArray])
        .group_by(['tag_id'])
        .fire();

    for (let i = 0; i < queryResponse.length; i++) {
      idToDetailsMap[queryResponse[i].tag_id].videoTagsCount = Number(queryResponse[i].count);
    }

    return idToDetailsMap;
  }

  /**
   * Fetch tags count from user tags table.
   *
   * @param idToDetailsMap
   * @returns {Promise<*>}
   * @private
   */
  async _fetchTagsCountFromUserTagsTable(idToDetailsMap) {
    const oThis = this;

    let tagIdsArray = Object.keys(idToDetailsMap),
      queryResponse = await new UserTagModel()
        .select('tag_id, count(*) as count')
        .where(['tag_id IN (?)', tagIdsArray])
        .group_by(['tag_id'])
        .fire();

    for (let i = 0; i < queryResponse.length; i++) {
      idToDetailsMap[queryResponse[i].tag_id].userTagsCount = Number(queryResponse[i].count);
    }

    return idToDetailsMap;
  }

  /**
   * Process output.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _processOutput() {
    const oThis = this;

    let csvContent = 'Tag name, #used in bio, #used in video\n';
    for (let id in oThis.extractedData) {
      csvContent +=
        oThis.extractedData[id].name +
        ',' +
        oThis.extractedData[id].userTagsCount +
        ',' +
        oThis.extractedData[id].videoTagsCount +
        ',\n';
    }
    logger.log(csvContent);
  }
}

new TagsUsed()
  .perform()
  .then(function(rsp) {
    console.log('=====Script Finished===');
    process.exit(0);
  })
  .catch(function(err) {
    console.log('Error occurred', err);
  });
