/**
 * Usage: node executables/oneTimers/populateCuratedEntitiesTable.js
 *
 * @module executables/oneTimers/populateCuratedEntitiesTable
 */

const rootPrefix = '../..',
  CuratedEntityModel = require(rootPrefix + '/app/models/mysql/CuratedEntity'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  curatedEntitiesConstants = require(rootPrefix + '/lib/globalConstant/curatedEntities');

/**
 * Class for populate curated entities.
 *
 * @class PopulateCuratedEntitesTable
 */
class PopulateCuratedEntitesTable {
  /**
   * Perform.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    return oThis.fetchCuratedEntitiesForEnvAndSeedTable();
  }

  async fetchCuratedEntitiesForEnvAndSeedTable() {
    const oThis = this;

    let tagIds = [],
      userIds = [];

    const curatedTagIdsString = process.env.PA_CURATED_TAG_IDS;
    const curatedUserIdsString = process.env.PA_USER_SEARCH_CURATED_USER_IDS;

    if (curatedTagIdsString.length > 0) {
      tagIds = JSON.parse(curatedTagIdsString);
    }

    if (curatedUserIdsString.length > 0) {
      userIds = JSON.parse(curatedUserIdsString);
    }

    let insertArray = [];

    console.log('tagIds----', tagIds);
    console.log('userIds----', userIds);

    for (let ind = 0; ind < userIds.length; ind++) {
      let userId = userIds[ind],
        pos = ind + 1;

      const entityKindInt = curatedEntitiesConstants.invertedEntityKinds[curatedEntitiesConstants.userEntityKind];
      insertArray.push([userId, entityKindInt, pos]);
    }

    for (let ind = 0; ind < tagIds.length; ind++) {
      let tagId = tagIds[ind],
        pos = ind + 1;

      const entityKindInt = curatedEntitiesConstants.invertedEntityKinds[curatedEntitiesConstants.tagsEntityKind];
      insertArray.push([tagId, entityKindInt, pos]);
    }

    console.log('insertArray---------', insertArray);

    await new CuratedEntityModel().insertEntities(insertArray);

    await CuratedEntityModel.flushCache({ entityKind: curatedEntitiesConstants.tagsEntityKind });
    await CuratedEntityModel.flushCache({ entityKind: curatedEntitiesConstants.userEntityKind });
  }
}

new PopulateCuratedEntitesTable()
  .perform()
  .then(function() {
    process.exit(0);
  })
  .catch(function(err) {
    logger.error(JSON.stringify(err));
    process.exit(1);
  });
