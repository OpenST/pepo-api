const rootPrefix = '../..',
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  AddDescriptionBase = require(rootPrefix + '/lib/addDescription/Base'),
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  IncrementWeightsAndAddVideoTags = require(rootPrefix + '/lib/video/IncrementWeightsAndAddVideoTags'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail');

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
   * @param {number} params.isUserCreator
   * @param {number} params.currentUserId
   * @param {boolean} params.flushCache
   * @param {number} params.replyDetailId
   *
   * @augments AddDescriptionBase
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
   * @returns {Promise<void>}
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
   * Fetch entity id.
   *
   * @sets oThis.entityId
   *
   * @returns {Promise<number>}
   * @private
   */
  async _fetchEntityId() {
    const oThis = this;

    const cacheResp = await new ReplyDetailsByIdsCache({ ids: [oThis.replyDetailId] }).fetch();
    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    if (!CommonValidators.validateNonEmptyObject(cacheResp.data[oThis.replyDetailId])) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_ad_r_1',
          api_error_identifier: 'entity_not_found',
          debug_options: `replyDetailId: ${oThis.replyDetailId}`
        })
      );
    }

    oThis.entityId = cacheResp.data[oThis.replyDetailId].entityId;
    oThis.parentVideoId = cacheResp.data[oThis.replyDetailId].parentId;
  }

  /**
   * Flush cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _flushCache() {
    const oThis = this;

    const promisesArray = [
      ReplyDetailsModel.flushCache({
        replyDetailId: oThis.replyDetailId,
        parentVideoIds: [oThis.parentVideoId],
        entityIds: [oThis.entityId],
        entityKind: replyDetailConstants.videoEntityKind
      })
    ];

    if (oThis.textId) {
      promisesArray.push(TextModel.flushCache({ ids: [oThis.textId] }));
    }

    await Promise.all(promisesArray);
  }
}

module.exports = AddReplyDescription;
