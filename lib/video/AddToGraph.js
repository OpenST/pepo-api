const rootPrefix = '../..',
  PostArangoModel = require(rootPrefix + '/app/models/arango/Post'),
  VideoArangoModel = require(rootPrefix + '/app/models/arango/Video');

/**
 * Class to add posts in social graph.
 *
 * @class AddToGraph
 */
class AddToGraph {
  /**
   * Constructor to decrease weights and remove video tags.
   *
   * @param {object} params
   * @param {number} params.creatorUserId: User Id Who created Video
   * @param {number} params.videoId: Video id
   * @param {number} params.createdAt: video Creation Date
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.creatorUserId = params.creatorUserId;
    oThis.videoId = params.videoId;
    oThis.createdAt = params.createdAt;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._addVideoVertice();

    await oThis._addPostEdge();
  }

  /**
   * Add video vertice in Social Graph.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addVideoVertice() {
    const oThis = this;

    const insertParams = {
      id: oThis.videoId,
      createdAt: oThis.createdAt
    };

    await new VideoArangoModel().createEntry(insertParams);
  }

  /**
   * Add post edge in Social Graph.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addPostEdge() {
    const oThis = this;

    const insertParams = {
      creatorUserId: oThis.creatorUserId,
      videoId: oThis.videoId,
      postedAt: oThis.createdAt
    };

    await new PostArangoModel().createEntry(insertParams);
  }
}

module.exports = AddToGraph;
