const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
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
    oThis.isReplyOnVideo = true;
  }

  /**
   * Fetch the reply details and the creator user id and performs validations on the reply status.
   *
   * @sets oThis.replyDetail, oThis.creatorUserId, oThis.texId
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
    oThis.texId = oThis.replyDetail.descriptionId || null;

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
        entity_kind: replyDetailsConstants.videoEntityKind
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

    const promisesArray = [
      ReplyDetailsModel.flushCache({
        replyDetailId: oThis.replyDetailId,
        entityIds: [oThis.videoId],
        entityKind: replyDetailsConstants.videoEntityKind
      })
    ];

    const textIdsToFlush = [];

    if (oThis.replyDetail.descriptionId) {
      textIdsToFlush.push(oThis.replyDetail.descriptionId);
    }

    if (oThis.texId) {
      textIdsToFlush.push(oThis.texId);
    }

    if (textIdsToFlush.length > 0) {
      promisesArray.push(TextModel.flushCache({ ids: textIdsToFlush }));
    }

    await Promise.all(promisesArray);
  }
}

module.exports = EditReplyDescription;
