const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  SendTransactionalMail = require(rootPrefix + '/lib/email/hookCreator/SendTransactionalMail'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/emailServiceApiCallHook'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  reportEntityConstants = require(rootPrefix + '/lib/globalConstant/reportEntity'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  emailConstants = require(rootPrefix + '/lib/globalConstant/email'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  commonValidator = require(rootPrefix + '/lib/validators/Common');

class ReportForEntity extends ServiceBase {
  /**
   * @constructor
   *
   * @param params
   */
  constructor(params) {
    super();

    const oThis = this;
    oThis.currentUser = params.current_user;
    oThis.reportEntityKind = params.report_entity_kind;
    oThis.reportEntityId = params.report_entity_id;

    oThis.videoUrl = null;
    oThis.reportedUserObj = null;
    oThis.templateVars = {};
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._reportHandler();

    await oThis._sendEmail();

    return responseHelper.successWithData({});
  }

  /**
   * Report Handler.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _reportHandler() {
    const oThis = this;

    switch (oThis.reportEntityKind) {
      case reportEntityConstants.videoReportEntityKind:
        const promiseArray = [];

        promiseArray.push(oThis._fetchVideo());
        promiseArray.push(oThis._fetchVideoCreator());

        await Promise.all(promiseArray);

        oThis.templateVars = {
          report_entity_kind: oThis.reportEntityKind,
          report_entity_id: oThis.reportEntityId,
          reporter_user_name: oThis.currentUser.name,
          reporter_user_id: oThis.currentUser.id,
          reportee_user_name: oThis.reportedUserObj.name,
          reportee_user_id: oThis.reportedUserObj.id,
          video_url: encodeURIComponent(oThis.videoUrl)
        };

        break;

      case reportEntityConstants.userReportEntityKind:
        oThis.reportedUserObj = await oThis._fetchUserFor(oThis.reportEntityId);

        oThis.templateVars = {
          report_entity_kind: oThis.reportEntityKind,
          report_entity_id: oThis.reportEntityId,
          reporter_user_name: oThis.currentUser.name,
          reporter_user_id: oThis.currentUser.id,
          reportee_user_name: oThis.reportedUserObj.name,
          reportee_user_id: oThis.reportedUserObj.id
        };

        break;

      default:
        throw new Error('Unsupported report entity kind.');
    }
  }

  /**
   * Fetch video.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchVideo() {
    const oThis = this;

    const cacheRsp = await new VideoByIdCache({ ids: [oThis.reportEntityId] }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    if (
      !commonValidator.validateNonEmptyObject(cacheRsp.data[oThis.reportEntityId]) ||
      cacheRsp.data[oThis.reportEntityId].status === videoConstants.deletedStatus
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_m_rp_1',
          api_error_identifier: 'entity_not_found',
          debug_options: { videoId: oThis.reportEntityId }
        })
      );
    }

    oThis.videoUrl = cacheRsp.data[oThis.reportEntityId].resolutions.original.url;
  }

  /**
   * Fetch video creator.
   *
   * @returns {Promise<never>}
   *
   * @sets oThis.reportedUserObj
   * @private
   */
  async _fetchVideoCreator() {
    const oThis = this;

    const videoDetailsCacheRsp = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.reportEntityId] }).fetch();

    if (videoDetailsCacheRsp.isFailure()) {
      return Promise.reject(videoDetailsCacheRsp);
    }

    let videoDetails = videoDetailsCacheRsp.data[oThis.reportEntityId];

    let creatorUserId = videoDetails.creatorUserId;
    // fetch user name for creator
    oThis.reportedUserObj = await oThis._fetchUserFor(creatorUserId);
  }

  /**
   * Fetch user.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchUserFor(userId) {
    const oThis = this;

    const userMultiCacheRsp = await new UserMultiCache({ ids: [userId] }).fetch();

    if (userMultiCacheRsp.isFailure() || !userMultiCacheRsp.data) {
      return Promise.reject(userMultiCacheRsp);
    }

    // if user is not active, no point is reporting.
    if (
      !commonValidator.validateNonEmptyObject(userMultiCacheRsp.data[userId]) ||
      userMultiCacheRsp.data[userId].status === userConstants.inActiveStatus
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_m_rp_2',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            userId: userId
          }
        })
      );
    }

    // if current user is trying to report himself/herself, error out.
    if (userMultiCacheRsp.data[userId].id === oThis.currentUser.id) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_m_rp_3',
          api_error_identifier: 'resource_not_found',
          debug_options: {}
        })
      );
    }

    return userMultiCacheRsp.data[userId];
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
      templateName: emailServiceApiCallHookConstants.reportIssueTemplateName,
      templateVars: Object.assign(
        {
          pepo_api_domain: 1,
          receiverEmail: emailConstants.reportIssue
        },
        oThis.templateVars
      )
    };

    return new SendTransactionalMail(transactionalMailParams).perform();
  }
}

module.exports = ReportForEntity;
