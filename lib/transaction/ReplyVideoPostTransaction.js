const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  VideoDistinctReplyCreatorsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDistinctReplyCreators'),
  ActivateReplyLib = require(rootPrefix + '/lib/reply/Activate'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  videoDetailConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user');

/**
 * Class for reply video post transaction.
 *
 * @class ReplyVideoPostTransaction
 */
class ReplyVideoPostTransaction {
  /**
   * Constructor for reply video post transaction.
   *
   * @param {object} params
   * @param {string/number} params.replyDetailId
   * @param {string/number} params.replyCreatorUserId
   * @param {string} [params.transactionId]
   * @param {string/number} params.videoId
   * @param {string/number} params.pepoAmountInWei
   * @param {string/number} params.currentUserId
   * @param {array} [params.mentionedUserIds]
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.replyDetailId = +params.replyDetailId;
    oThis.replyCreatorUserId = +params.replyCreatorUserId;
    oThis.parentVideoId = +params.videoId;
    oThis.transactionId = params.transactionId || null;
    oThis.pepoAmountInWei = params.pepoAmountInWei;
    oThis.currentUserId = params.currentUserId;
    oThis.mentionedUserIds = params.mentionedUserIds || [];
    oThis.replyThreadFollowerUserIds = [];

    oThis.isValidTransaction = false;
    oThis.replyDetail = null;
    oThis.user = null;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<*>}
   */
  async perform() {
    const oThis = this;

    await oThis.fetchAndValidateReplyDetail();

    if (!oThis.isValidTransaction) {
      return responseHelper.successWithData({});
    }

    await oThis._fetchParentVideoDetail();

    await oThis._fetchCreatorUser();

    const updateReplyDetailResp = await oThis._updateReplyDetail();

    //This is to check in case 2 parallel requests are fired.
    if (updateReplyDetailResp.affectedRows === 0 || !UserModel.isUserApprovedCreator(oThis.user)) {
      return responseHelper.successWithData({});
    }

    await oThis._activateReply();

    return responseHelper.successWithData({});
  }

  /**
   * Validate reply details.
   *
   * @sets oThis.replyDetail, oThis.isValidTransaction
   *
   * @returns {Promise<*>}
   */
  async fetchAndValidateReplyDetail() {
    const oThis = this;

    const replyDetailCacheResp = await new ReplyDetailsByIdsCache({ ids: [oThis.replyDetailId] }).fetch();
    if (replyDetailCacheResp.isFailure()) {
      logger.error('Error while fetching reply detail data.');

      return Promise.reject(replyDetailCacheResp);
    }

    oThis.replyDetail = replyDetailCacheResp.data[oThis.replyDetailId];

    if (!CommonValidators.validateNonEmptyObject(oThis.replyDetail)) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_t_rvpt_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { replyDetailId: oThis.replyDetailId }
      });

      return createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
    }

    // This is done intentionally.
    // Even if multiple requests come for same transaction, we won't work for it multiple times.
    if (oThis.replyDetail.status !== replyDetailConstants.pendingStatus) {
      oThis.isValidTransaction = false;

      return;
    }

    if (
      CommonValidators.isVarNullOrUndefined(oThis.parentVideoId) ||
      +oThis.replyDetail.parentId !== +oThis.parentVideoId
    ) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_t_rvpt_2',
        api_error_identifier: 'something_went_wrong',
        debug_options: {
          replyDetailId: oThis.replyDetailId,
          parentVideoId: oThis.parentVideoId
        }
      });

      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

      return Promise.reject(errorObject);
    }

    oThis.replyCreatorUserId = oThis.replyDetail.creatorUserId;

    oThis.isValidTransaction = true;
  }

  /**
   * Fetch video details.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchParentVideoDetail() {
    const oThis = this;

    const videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({
      videoIds: [oThis.replyDetail.parentId]
    }).fetch();
    if (videoDetailsCacheResponse.isFailure()) {
      return Promise.reject(videoDetailsCacheResponse);
    }

    const parentVideoDetails = videoDetailsCacheResponse.data[oThis.replyDetail.parentId];

    if (parentVideoDetails.status !== videoDetailConstants.activeStatus) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_t_rvpt_4',
          api_error_identifier: 'something_went_wrong',
          debug_options: { parentVideoDetails: parentVideoDetails }
        })
      );
    }
  }

  /**
   * Fetch the user details and performs validations on the user status.
   *
   * @sets oThis.user
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchCreatorUser() {
    const oThis = this;

    const cacheRsp = await new UsersCache({ ids: [oThis.replyCreatorUserId] }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_t_rvpt_fcu_1',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['invalid_user_id'],
          debug_options: {}
        })
      );
    }

    oThis.user = cacheRsp.data[oThis.replyCreatorUserId];

    if (oThis.user.status !== userConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_t_rvpt_fcu_2',
          api_error_identifier: 'could_not_proceed',
          params_error_identifiers: ['user_inactive'],
          debug_options: {}
        })
      );
    }
  }

  /**
   * Update reply details.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateReplyDetail() {
    const oThis = this;

    const status = replyDetailConstants.unppprovedStatus;

    const updateParams = {
      status: replyDetailConstants.invertedStatuses[status]
    };

    if (oThis.transactionId) {
      updateParams.transaction_id = oThis.transactionId;
      oThis.replyDetail.transactionId = oThis.transactionId;
    }

    const replyDetailsResponse = await new ReplyDetailsModel()
      .update(updateParams)
      .where({
        status: replyDetailConstants.invertedStatuses[replyDetailConstants.pendingStatus],
        id: oThis.replyDetailId
      })
      .fire();

    if (replyDetailsResponse.affectedRows === 0) {
      return replyDetailsResponse;
    }

    oThis.replyDetail.status = status;

    await ReplyDetailsModel.flushCache({
      parentVideoIds: [oThis.replyDetail.parentId],
      replyDetailId: oThis.replyDetailId,
      userIds: [oThis.replyCreatorUserId],
      parentIds: [oThis.replyDetail.parentId],
      creatorUserId: oThis.replyCreatorUserId
    });

    if (oThis.transactionId) {
      await new VideoDistinctReplyCreatorsCache({ videoIds: [oThis.replyDetail.parentId] }).clear();
    }

    return replyDetailsResponse;
  }

  /**
   * Call activate reply lib.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _activateReply() {
    const oThis = this;
    logger.debug('CALLING ACTIVATE REPLY LIB');
    await new ActivateReplyLib({ replyDetail: oThis.replyDetail }).perform();
    logger.debug('DONW WITH CALLING ACTIVATE REPLY LIB');
  }
}

module.exports = ReplyVideoPostTransaction;
