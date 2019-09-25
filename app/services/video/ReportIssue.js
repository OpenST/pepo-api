const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  SendTransactionalMail = require(rootPrefix + '/lib/email/hookCreator/SendTransactionalMail'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/emailServiceApiCallHook'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  emailConstants = require(rootPrefix + '/lib/globalConstant/email'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  commonValidator = require(rootPrefix + '/lib/validators/Common');

class ReportIssueForVideo extends ServiceBase {
  /**
   * @constructor
   *
   * @param params
   */
  constructor(params) {
    super();

    const oThis = this;
    oThis.videoId = params.video_id;
    oThis.currentUser = params.current_user;

    oThis.videoUrl = null;
    oThis.creatorUserId = null;
    oThis.creatorUserName = null;
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    const promiseArray = [];

    promiseArray.push(oThis._fetchVideo());
    promiseArray.push(oThis._fetchVideoCreator());

    await Promise.all(promiseArray);

    await oThis._sendEmail();

    return responseHelper.successWithData({});
  }

  /**
   * Fetch video.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchVideo() {
    const oThis = this;

    const cacheRsp = await new VideoByIdCache({ ids: [oThis.videoId] }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    if (
      !commonValidator.validateNonEmptyObject(cacheRsp.data[oThis.videoId]) ||
      cacheRsp.data[oThis.videoId].status === videoConstants.deletedStatus
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_v_rp_1',
          api_error_identifier: 'entity_not_found',
          debug_options: { videoId: oThis.videoId }
        })
      );
    }

    oThis.videoUrl = cacheRsp.data[oThis.videoId].resolutions.original.url;
  }

  /**
   * Fetch video creator.
   *
   * @returns {Promise<never>}
   *
   * @sets oThis.creatorUserId, oThis.creatorUserName
   * @private
   */
  async _fetchVideoCreator() {
    const oThis = this;

    const videoDetailsCacheRsp = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();

    if (videoDetailsCacheRsp.isFailure()) {
      return Promise.reject(videoDetailsCacheRsp);
    }

    let videoDetails = videoDetailsCacheRsp.data[oThis.videoId];

    oThis.creatorUserId = videoDetails.creatorUserId;

    let userObj = {};

    // Video is of current user, so no need for query
    if (oThis.creatorUserId === oThis.currentUser.id) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_v_ri_fvc_1',
          api_error_identifier: 'resource_not_found',
          debug_options: { videoId: oThis.videoId }
        })
      );
    } else {
      const userMultiCacheRsp = await new UserMultiCache({ ids: [oThis.creatorUserId] }).fetch();

      if (userMultiCacheRsp.isFailure()) {
        return Promise.reject(userMultiCacheRsp);
      }

      userObj = userMultiCacheRsp.data[oThis.creatorUserId];
    }

    oThis.creatorUserName = userObj.name;
  }

  /**
   * Send email for report video.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _sendEmail() {
    const oThis = this;

    const transactionalMailParams = {
      receiverEntityId: 0,
      receiverEntityKind: emailServiceApiCallHookConstants.hookParamsInternalEmailEntityKind,
      templateName: emailServiceApiCallHookConstants.reportIssueForVideoTemplateName,
      templateVars: {
        receiverEmail: emailConstants.reportIssue,
        reporter_user_name: oThis.currentUser.name,
        reporter_user_id: oThis.currentUser.id,
        creator_user_name: oThis.creatorUserName,
        creator_user_id: oThis.creatorUserId,
        video_url: oThis.videoUrl,
        video_id: oThis.videoId,
        pepo_api_domain: 1
      }
    };

    return new SendTransactionalMail(transactionalMailParams).perform();
  }
}

module.exports = ReportIssueForVideo;
