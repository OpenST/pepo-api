const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/arango/Base'),
  UserArangoModel = require(rootPrefix + '/app/models/arango/User'),
  VideoArangoModel = require(rootPrefix + '/app/models/arango/Video'),
  postArangoConstants = require(rootPrefix + '/lib/globalConstant/arango/post');

/**
 * Class for post model.
 *
 * @class PostModel
 */
class PostModel extends ModelBase {
  /**
   * Constructor for post model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({});

    const oThis = this;

    oThis.collectionName = 'posts';
    oThis.fromCollectionName = new UserArangoModel().collectionName;
    oThis.toCollectionName = new VideoArangoModel().collectionName;
  }

  /**
   * Add a edge In posts collection in arango db
   *
   * @param {object} insertParams
   * @param {string} insertParams.creatorUserId
   * @param {string} insertParams.videoId
   * @param {number} insertParams.postedAt
   *
   * @returns {Promise<*>}
   */
  async createEntry(insertParams) {
    const oThis = this;

    const query = 'INSERT {_from:@from, _to:@to, posted_at: @postedAt} INTO @@collectionName';
    const vars = {
      collectionName: oThis.collectionName,
      from: `${oThis.fromCollectionName}/${insertParams.creatorUserId}`,
      to: `${oThis.toCollectionName}/${insertParams.videoId}`,
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
      videoId: dbRow._to ? dbRow._to.split('/')[1] : undefined,
      postedAt: dbRow.posted_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }
}

module.exports = PostModel;
