const rootPrefix = '../..',
  ReplyArangoModel = require(rootPrefix + '/app/models/arango/Reply'),
  VideoArangoModel = require(rootPrefix + '/app/models/arango/Video');

/**
 * Class to add replies in social graph.
 *
 * @class AddReplyToGraph
 */
class AddReplyToGraph {
  /**
   * Constructor to decrease weights and remove video tags.
   *
   * @param {object} params
   * @param {number} params.creatorUserId: User Id Who created Reply
   * @param {number} params.parentVideoId: Parent Video id
   * @param {number} params.createdAt: reply Creation Date
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.creatorUserId = params.creatorUserId;
    oThis.parentVideoId = params.parentVideoId;
    oThis.createdAt = params.createdAt;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._updateVideoVertice();

    await oThis._addReplyEdge();
  }

  /**
   * Update video vertice in Social Graph.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateVideoVertice() {
    const oThis = this;

    const insertParams = {
      id: oThis.parentVideoId,
      updatedAt: oThis.createdAt
    };

    await new VideoArangoModel().updateTimestampForEntry(insertParams);
  }

  /**
   * Add reply edge in Social Graph.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addReplyEdge() {
    const oThis = this;

    const insertParams = {
      creatorUserId: oThis.creatorUserId,
      parentVideoId: oThis.parentVideoId,
      postedAt: oThis.createdAt
    };

    await new ReplyArangoModel().createUpdateEntry(insertParams);
  }
}

module.exports = AddReplyToGraph;
