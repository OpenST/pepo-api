/*
 * Usage: node executables/oneTimers/videoTagWeightSanitize.js
 */

const rootPrefix = '../..',
  VideoTagsModel = require(rootPrefix + '/app/models/mysql/VideoTag'),
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  TagMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/Tag'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class VideoTagWeightSanitize {
  constructor() {
    const oThis = this;

    oThis.updateMap = {};
  }

  async perform() {
    const oThis = this;

    await oThis._fetchVideoTagCount();

    await oThis._updateVideoTagCount();
  }

  /**
   * Fetch video tag count
   * @returns {Promise<void>}
   * @private
   */
  async _fetchVideoTagCount() {
    const oThis = this,
      limit = 50;

    let rows = [],
      pageNo = 1;

    while (true) {
      const offset = (pageNo - 1) * limit;
      rows = await new TagModel()
        .select('id, video_weight')
        .limit(limit)
        .offset(offset)
        .fire();

      if (rows.length > 0) {
        const tagIds = [],
          tagCountMap = {};
        for (let ind = 0; ind < rows.length; ind++) {
          tagIds.push(rows[ind].id);
          tagCountMap[rows[ind].id] = rows[ind].video_weight;
        }

        const tagCounts = await new VideoTagsModel()
          .select('tag_id, count(*) as count')
          .where({ tag_id: tagIds, video_kind: videoTagConstants.invertedKinds[videoTagConstants.postKind] })
          .group_by(['tag_id'])
          .fire();

        for (let ind = 0; ind < tagCounts.length; ind++) {
          const tagId = tagCounts[ind].tag_id,
            count = tagCounts[ind].count;

          if (tagCountMap[tagId] != count) {
            oThis.updateMap[tagId] = count;
          }
        }
        pageNo += 1;
      } else {
        break;
      }
    }
  }

  /**
   * Update video tag count
   * @returns {Promise<void>}
   * @private
   */
  async _updateVideoTagCount() {
    const oThis = this;

    const tagIds = [];

    for (const tagId in oThis.updateMap) {
      tagIds.push(tagId);
      await new TagModel()
        .update({ video_weight: oThis.updateMap[tagId] })
        .where({ id: tagId })
        .fire();
    }

    await new TagMultiCache({ ids: tagIds }).clear();
  }
}

new VideoTagWeightSanitize()
  .perform()
  .then(function() {
    logger.win('All user video tags processed successfully.');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('Error: ', err);
    process.exit(1);
  });
