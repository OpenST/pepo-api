const rootPrefix = '../..',
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  tagConstants = require(rootPrefix + '/lib/globalConstant/tag'),
  VideoTagsModel = require(rootPrefix + '/app/models/mysql/VideoTag');

class TagsUsed {
  constructor() {
    const oThis = this;

    oThis.extractedData = [];
  }

  async perform() {
    const oThis = this;

    await oThis._fetchTagsDataAndPrepareHash();
  }

  async _fetchTagsDataAndPrepareHash() {
    const oThis = this;

    let moreDataPresent = true,
      limit = 10,
      page = 0,
      offset = 0;

    while (moreDataPresent) {
      let dbRows = await new TagModel()
        .select(['name', 'weight'])
        .where(['status = ?', tagConstants.invertedStatuses[tagConstants.activeStatus]])
        .limit(limit)
        .offset(offset)
        .fire();

      page++;
      offset = page * limit;

      if (dbRows.length === 0) {
        moreDataPresent = false;
      } else {
        for (let i = 0; i < dbRows.length; i++) {
          let csRowDataArray = [];
          csRowDataArray.push(dbRows[i].name);
          csRowDataArray.push(Number(dbRows[i].weight));
          oThis.extractedData.push(csRowDataArray);
        }
      }
    }

    console.log('-oThis.extractedData---', oThis.extractedData);
  }
}

module.exports = TagsUsed;
