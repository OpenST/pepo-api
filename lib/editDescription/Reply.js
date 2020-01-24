const rootPrefix = '../..',
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  EditDescriptionBase = require(rootPrefix + '/lib/editDescription/Base'),
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  IncrementWeightsAndAddVideoTags = require(rootPrefix + '/lib/video/IncrementWeightsAndAddVideoTags'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag'),
  replyDetailsConstants = require(rootPrefix + '/lib/globalConstant/replyDetail');

/**
 * Class to edit reply description.
 *
 * @class EditReplyDescription
 */
class EditReplyDescription extends EditDescriptionBase {
  /**
   * Constructor to edit reply description.
   *
   * @param {object} params
   * @param {array} params.videoDescription: Video description.
   * @param {array} params.videoId: Video id to edited.
   * @param {number} params.replyDetailId: Reply Detail Id
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.replyDetailId = params.replyDetailId;
  }

  /**
   * Fetch the reply details and the creator user id and performs validations on the reply status.
   *
   * @sets oThis.replyDetail, oThis.creatorUserId, oThis.textId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchDetails() {
    const oThis = this;

    const replyDetailsByIdsCacheResponse = await new ReplyDetailsByIdsCache({ ids: [oThis.replyDetailId] }).fetch();
    if (replyDetailsByIdsCacheResponse.isFailure()) {
      return Promise.reject(replyDetailsByIdsCacheResponse);
    }

    oThis.replyDetail = replyDetailsByIdsCacheResponse.data[oThis.replyDetailId];
    oThis.creatorUserId = oThis.replyDetail.creatorUserId;
    oThis.textId = oThis.replyDetail.descriptionId || null;

    if (!oThis.creatorUserId || oThis.replyDetail.status === replyDetailsConstants.deletedStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_ed_r_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_reply_detail_id'],
          debug_options: { replyDetail: oThis.replyDetail }
        })
      );
    }
  }

  /**
   * Modify tag and related entities.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _modifyTagAndRelatedEntities() {
    const oThis = this;

    // NOTE: In case of edit description, reply status should be active in order to modify tag weights.
    // This is because tag weights are incremented only when reply status is being changed to active.
    if (oThis.replyDetail.status === replyDetailsConstants.activeStatus) {
      const promiseArray = [oThis._decrementVideoTagsWeightForExistingDescription(), oThis._filterTags()];

      // Note: No New Notifications.

      await Promise.all(promiseArray);

      await oThis._incrementWeightsAndAddVideoTags();
    } else {
      await oThis._filterTags();
    }
  }

  /**
   * Fetch creator user.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchCreatorUser() {
    // Do nothing.
  }

  /**
   * Get video tag kind.
   *
   * @returns {string}
   * @private
   */
  _videoKind() {
    return videoTagConstants.replyKind;
  }

  /**
   * Increment weights of new tags and add video tags.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _incrementWeightsAndAddVideoTags() {
    const oThis = this;

    return new IncrementWeightsAndAddVideoTags({
      tagIds: oThis.tagIds,
      videoId: oThis.videoId,
      kind: oThis._videoKind()
    }).perform();
  }

  /**
   * Update reply details model.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateDetailsModel(descriptionId, videoId) {
    const oThis = this;

    await new ReplyDetailsModel()
      .update({ description_id: descriptionId })
      .where({
        entity_id: videoId,
        entity_kind: replyDetailsConstants.invertedEntityKinds[replyDetailsConstants.videoEntityKind]
      })
      .fire();

    oThis.replyDetail.descriptionId = descriptionId;
  }

  /**
   * Flush cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _flushCache() {
    const oThis = this;

    // NOTE - userId was not passed to the flush cache as we don't want to flush the user replies cache.
    const promisesArray = [
      ReplyDetailsModel.flushCache({
        replyDetailId: oThis.replyDetailId
      })
    ];

    const textIdsToFlush = [];

    if (oThis.replyDetail.descriptionId) {
      textIdsToFlush.push(oThis.replyDetail.descriptionId);
    }

    if (oThis.textId) {
      textIdsToFlush.push(oThis.textId);
    }

    if (textIdsToFlush.length > 0) {
      promisesArray.push(TextModel.flushCache({ ids: textIdsToFlush }));
    }

    await Promise.all(promisesArray);
  }
}

module.exports = EditReplyDescription;
