const rootPrefix = '../..',
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  AddDescriptionBase = require(rootPrefix + '/lib/addDescription/Base'),
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

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
    // Nothing to do. As tags are incremented from reply video post transaction lib.
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
   * @sets oThis.entityId, oThis.parentVideoId
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
   * Enqueue for Webhook Preprocessor.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueWebhookPreprocessor() {
    const oThis = this;
    // Do Nothing
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
        parentVideoIds: [oThis.parentVideoId]
      })
    ];

    if (oThis.textId) {
      promisesArray.push(TextModel.flushCache({ ids: [oThis.textId] }));
    }

    await Promise.all(promisesArray);
  }
}

module.exports = AddReplyDescription;
