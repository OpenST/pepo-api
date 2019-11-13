const rootPrefix = '../..',
  AddDescriptionBase = require(rootPrefix + '/lib/addDescription/Base'),
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  IncrementWeightsAndAddVideoTags = require(rootPrefix + '/lib/video/IncrementWeightsAndAddVideoTags'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag');

/**
 * Class to add reply description.
 *
 * @class AddReplyDescription
 */
class AddReplyDescription extends AddDescriptionBase {
  /**
   * Constructor to add video description.
   *
   * @param {object} params
   * @param {string} params.videoDescription: Description to insert
   * @param {number} params.videoId: Video id
   * @param {number} params.replyDetailId
   * @param {boolean} params.flushCache
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.replyDetailId = params.replyDetailId;
  }

  /**
   * Fetch reply detail.
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchDetail() {
    // Nothing to do.
  }

  /**
   * Increment weights and add video tags.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _incrementTags() {
    const oThis = this;

    await new IncrementWeightsAndAddVideoTags({
      tagIds: oThis.tagIds,
      videoId: oThis.videoId,
      kind: videoTagConstants.replyKind
    }).perform();
  }

  /**
   * Add video description if previous description was not present.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addVideoDescription() {
    const oThis = this;

    await new ReplyDetailsModel()
      .update({ description_id: oThis.textId })
      .where({ id: oThis.replyDetailId })
      .fire();
  }

  /**
   * Fetch entity id
   * @returns {Promise<number>}
   * @private
   */
  async _fetchEntityId() {
    const oThis = this;

    const Row = await new ReplyDetailsModel()
      .select('entity_id')
      .where({ id: oThis.replyDetailId })
      .fire();

    oThis.entityId = Row[0].entity_id;
  }

  /**
   * Flush cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _flushCache() {
    // Nothing to do.
  }
}

module.exports = AddReplyDescription;
