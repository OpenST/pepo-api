/*
 * Script to migrate data in texts to populate text includes
 *
 * Usage - node executables/oneTimers/populateIncludesFromTexts.js
 */

const rootPrefix = '../..',
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  TextIncludeModel = require(rootPrefix + '/app/models/cassandra/TextInclude'),
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  textIncludeConstants = require(rootPrefix + '/lib/globalConstant/cassandra/textInclude'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const BATCH_SIZE = 50;

class PopulateIncludesFromTexts {
  constructor() {
    const oThis = this;

    oThis.textIdToTagIdsMap = {};
    oThis.includesData = {};
  }

  /**
   * Perform
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._getTagIds();

    await oThis._insertInTextIncludes();
  }

  /**
   * Get tag ids
   * @returns {Promise<void>}
   * @private
   */
  async _getTagIds() {
    const oThis = this;

    let pageNo = 1;
    let Rows = ['dummy'];

    while (Rows.length > 0) {
      const offset = (pageNo - 1) * BATCH_SIZE;
      Rows = await new TextModel()
        .select('id, tag_ids')
        .limit(BATCH_SIZE)
        .offset(offset)
        .fire();

      pageNo += 1;

      for (let ind = 0; ind < Rows.length; ind++) {
        const formattedData = new TextModel().formatDbData(Rows[ind]);

        if (!formattedData.tagIds || formattedData.tagIds.length == 0) {
          continue;
        }

        const tagRows = await new TagModel()
          .select('id, name')
          .where({ id: formattedData.tagIds })
          .fire();

        const entityIdentifiers = [];
        const replaceableTexts = [];
        for (let it = 0; it < tagRows.length; it++) {
          const formattedTagRow = new TagModel()._formatDbData(tagRows[it]);

          entityIdentifiers.push(
            textIncludeConstants.createEntityIdentifier(
              textIncludeConstants.shortToLongNamesMapForEntityKind[textIncludeConstants.tagEntityKind],
              formattedTagRow.id
            )
          );

          replaceableTexts.push('#' + formattedTagRow.name);
        }

        oThis.includesData[formattedData.id] = oThis.includesData[formattedData.id] || {};
        oThis.includesData[formattedData.id].entityIdentifiers = entityIdentifiers;
        oThis.includesData[formattedData.id].replaceableTexts = replaceableTexts;
      }
    }
  }

  /**
   * Insert in text includes
   * @returns {Promise<void>}
   * @private
   */
  async _insertInTextIncludes() {
    const oThis = this;

    for (const textId in oThis.includesData) {
      const data = oThis.includesData[textId];

      await new TextIncludeModel().deleteTags(textId, data.entityIdentifiers);

      await TextIncludeModel.flushCache({ textIds: [textId] });

      await new TextIncludeModel().insertInTextIncludes(textId, data.entityIdentifiers, data.replaceableTexts);
    }
  }
}

module.exports = PopulateIncludesFromTexts;

new PopulateIncludesFromTexts()
  .perform()
  .then(function() {
    logger.win('=====Text includes successfully populated from texts=======');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error(err);
    process.exit(0);
  });
