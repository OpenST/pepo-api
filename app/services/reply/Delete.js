const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  DeleteReplyVideoLib = require(rootPrefix + '/lib/video/delete/ReplyVideos'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  VideoDetailsByVideoIds = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  replyDetailsConstants = require(rootPrefix + '/lib/globalConstant/replyDetail');

/**
 * Class to delete reply video.
 *
 * @class DeleteReplyVideo
 */
class DeleteReplyVideo extends ServiceBase {
  /**
   * Constructor to delete video.
   *
   * @param {object} params
   * @param {number} params.reply_details_id
   * @param {object} params.current_user
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.replyDetailsId = params.reply_details_id;
    oThis.currentUser = params.current_user;
    oThis.currentUserId = oThis.currentUser.id;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchReplyDetails();

    await oThis._fetchParentDetails();

    // Unknown video or already deleted.
    if (oThis.replyDetails.status === replyDetailsConstants.deletedStatus) {
      return responseHelper.paramValidationError({
        internal_error_identifier: 'a_s_r_d_1',
        api_error_identifier: 'invalid_api_params',
        params_error_identifiers: ['invalid_reply_details_id'],
        debug_options: { replyDetailsId: oThis.replyDetailsId }
      });
    }

    // Only the reply video creator or the parent video creator can delete the reply video.
    if (
      +oThis.currentUserId !== +oThis.replyDetails.creatorUserId &&
      +oThis.currentUserId !== +oThis.parentVideoCreatorUserId
    ) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_r_d_2',
          api_error_identifier: 'unauthorized_api_request',
          params_error_identifiers: [],
          debug_options: {
            currentUserId: oThis.currentUserId,
            replyVideoCreatorUserId: oThis.replyDetails.creatorUserId,
            parentVideoCreatorUserId: oThis.parentVideoCreatorUserId
          }
        })
      );
    }

    await new DeleteReplyVideoLib({
      replyDetailsIds: [oThis.replyDetailsId],
      isUserAction: true,
      userId: oThis.currentUserId
    }).perform();

    return responseHelper.successWithData({});
  }

  /**
   * Fetch reply details.
   *
   * @sets oThis.replyDetails
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchReplyDetails() {
    const oThis = this;

    const replyDetailsCacheResponse = await new ReplyDetailsByIdsCache({ ids: [oThis.replyDetailsId] }).fetch();
    if (replyDetailsCacheResponse.isFailure()) {
      return Promise.reject(replyDetailsCacheResponse);
    }

    if (!CommonValidators.validateNonEmptyObject(replyDetailsCacheResponse.data[oThis.replyDetailsId])) {
      return responseHelper.paramValidationError({
        internal_error_identifier: 'a_s_r_d_3',
        api_error_identifier: 'invalid_api_params',
        params_error_identifiers: ['invalid_reply_details_id'],
        debug_options: { replyDetailsId: oThis.replyDetailsId }
      });
    }

    oThis.replyDetails = replyDetailsCacheResponse.data[oThis.replyDetailsId];
  }

  /**
   * Fetch parent details.
   *
   * @sets oThis.parentVideoCreatorUserId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchParentDetails() {
    const oThis = this;

    const parentVideoId = oThis.replyDetails.parentId;

    const cacheResponse = await new VideoDetailsByVideoIds({ videoIds: [parentVideoId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.parentVideoCreatorUserId = cacheResponse.data[parentVideoId].creatorUserId;
  }
}

module.exports = DeleteReplyVideo;
