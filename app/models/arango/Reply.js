const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/arango/Base'),
  UserArangoModel = require(rootPrefix + '/app/models/arango/User'),
  VideoArangoModel = require(rootPrefix + '/app/models/arango/Video'),
  replyArangoConstants = require(rootPrefix + '/lib/globalConstant/arango/reply');

/**
 * Class for reply model.
 *
 * @class ReplyModel
 */
class ReplyModel extends ModelBase {
  /**
   * Constructor for reply model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({});

    const oThis = this;

    oThis.collectionName = 'replies';
    oThis.fromCollectionName = new UserArangoModel().collectionName;
    oThis.toCollectionName = new VideoArangoModel().collectionName;
  }

  /**
   * Add/Update edge In replies collection in arango db
   *
   * @param {object} insertParams
   * @param {string} insertParams.creatorUserId
   * @param {string} insertParams.parentVideoId
   * @param {number} insertParams.postedAt
   *
   * @returns {Promise<*>}
   */
  async createUpdateEntry(insertParams) {
    const oThis = this;
    //this entry is not deleted unless the parent video is deleted or user is deleted.

    const query =
      'FOR u in @@collectionName ' +
      'FILTER u._from == @from and u._to == @to ' +
      'UPSERT  {_from: @from, _to:@to} ' +
      `INSERT {_from:@from, _to:@to, posted_at: @postedAt} ` +
      `UPDATE {posted_at: @postedAt} INTO @@collectionName`;

    const vars = {
      collectionName: oThis.collectionName,
      from: `${oThis.fromCollectionName}/${insertParams.creatorUserId}`,
      to: `${oThis.toCollectionName}/${insertParams.parentVideoId}`,
      postedAt: insertParams.postedAt
    };

    return oThis.query(query, vars);
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {string} dbRow.id
   * @param {string} dbRow._from
   * @param {string} dbRow._to
   * @param {number} dbRow.posted_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      creatorUserId: dbRow._from ? dbRow._from.split('/')[1] : undefined,
      parentVideoId: dbRow._to ? dbRow._to.split('/')[1] : undefined,
      postedAt: dbRow.posted_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }
}

module.exports = ReplyModel;
