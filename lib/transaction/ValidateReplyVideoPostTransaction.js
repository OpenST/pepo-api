const rootPrefix = '../..',
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ReplyDetailModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class for Validate Reply Video Post Transaction.
 *
 * @class ValidateReplyVideoPostTransaction
 */
class ValidateReplyVideoPostTransaction {
  /**
   * Validate Reply Video Post Transaction Constructor.
   *
   * @param params
   */
  constructor(params) {
    const oThis = this;

    oThis.replyDetailId = +params.replyDetailId;
    oThis.videoId = +params.videoId;

    oThis.replyDetail = null;
  }

  /**
   * Perform
   *
   * @returns {Promise<unknown>}
   */
  async perform() {
    const oThis = this;

    let replyDetailRsp = await oThis.fetchAndValidateReplyDetail();

    if (replyDetailRsp.isFailure()) {
      return replyDetailRsp;
    }

    return responseHelper.successWithData({});
  }

  /**
   * Get reply detail
   *
   * @returns {Promise<*|result>}
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
      return responseHelper.error({
        internal_error_identifier: 'l_t_rvpt_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { replyDetailId: oThis.replyDetailId }
      });
    }

    if (CommonValidators.isVarNullOrUndefined(oThis.videoId) || oThis.replyDetail.parentId !== oThis.videoId) {
      return responseHelper.error({
        internal_error_identifier: 'l_t_rvpt_2',
        api_error_identifier: 'something_went_wrong',
        debug_options: {
          replyDetailId: oThis.replyDetailId,
          videoId: oThis.videoId
        }
      });
    }

    return responseHelper.successWithData({});
  }
}

module.exports = ValidateReplyVideoPostTransaction;
