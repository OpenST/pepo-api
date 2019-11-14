const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  SendTransactionalMail = require(rootPrefix + '/lib/email/hookCreator/SendTransactionalMail'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  emailConstants = require(rootPrefix + '/lib/globalConstant/email'),
  reportEntityConstants = require(rootPrefix + '/lib/globalConstant/reportEntity'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/emailServiceApiCallHook');

/**
 * Class to report for an entity.
 *
 * @class ReportForEntity
 */
class ReportForEntity extends ServiceBase {
  /**
   * Constructor to report for an entity.
   *
   * @param {object} params
   * @param {object} [params.current_user]
   * @param {string} params.report_entity_kind
   * @param {string} params.report_entity_id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUser = params.current_user || {};
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
   * Report handler.
   *
   * @sets oThis.templateVars
   *
   * @returns {Promise<void>}
   * @private
   */
  async _reportHandler() {
    const oThis = this;

    switch (oThis.reportEntityKind) {
      case reportEntityConstants.videoReportEntityKind: {
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
          video_url: encodeURIComponent(oThis.videoUrl),
          user_admin_url_prefix: basicHelper.userProfilePrefixUrl()
        };

        break;
      }
      case reportEntityConstants.replyReportEntityKind: {
        const promiseArray = [];

        await oThis._fetchReply();

        oThis.templateVars = {
          report_entity_kind: oThis.reportEntityKind,
          report_entity_id: oThis.reportEntityId,
          reporter_user_name: oThis.currentUser.name,
          reporter_user_id: oThis.currentUser.id,
          reportee_user_name: oThis.reportedUserObj.name,
          reportee_user_id: oThis.reportedUserObj.id,
          video_url: encodeURIComponent(oThis.videoUrl),
          user_admin_url_prefix: basicHelper.userProfilePrefixUrl()
        };

        break;
      }
      case reportEntityConstants.userReportEntityKind: {
        oThis.reportedUserObj = await oThis._fetchUserFor(oThis.reportEntityId);

        oThis.templateVars = {
          report_entity_kind: oThis.reportEntityKind,
          report_entity_id: oThis.reportEntityId,
          reporter_user_name: oThis.currentUser.name,
          reporter_user_id: oThis.currentUser.id,
          reportee_user_name: oThis.reportedUserObj.name,
          reportee_user_id: oThis.reportedUserObj.id,
          user_admin_url_prefix: basicHelper.userProfilePrefixUrl()
        };

        break;
      }
      default: {
        throw new Error('Unsupported report entity kind.');
      }
    }
  }

  /**
   * Fetch video.
   *
   * @sets oThis.videoUrl
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
      !CommonValidator.validateNonEmptyObject(cacheRsp.data[oThis.reportEntityId]) ||
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
   * @sets oThis.reportedUserObj
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchVideoCreator() {
    const oThis = this;

    const videoDetailsCacheRsp = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.reportEntityId] }).fetch();

    if (videoDetailsCacheRsp.isFailure()) {
      return Promise.reject(videoDetailsCacheRsp);
    }

    const videoDetails = videoDetailsCacheRsp.data[oThis.reportEntityId];

    const creatorUserId = videoDetails.creatorUserId;
    // Fetch user name for creator.
    oThis.reportedUserObj = await oThis._fetchUserFor(creatorUserId);
  }

  /**
   * Fetch reply.
   *
   * @sets oThis.videoUrl
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchReply() {
    const oThis = this;

    const replyDetailCacheResp = await new ReplyDetailsByIdsCache({ ids: [oThis.reportEntityId] }).fetch();
    if (replyDetailCacheResp.isFailure()) {
      logger.error('Error while fetching reply detail data.');

      return Promise.reject(replyDetailCacheResp);
    }

    const replyDetail = replyDetailCacheResp.data[oThis.reportEntityId];

    if (
      !CommonValidator.validateNonEmptyObject(replyDetail) ||
      replyDetail.status === replyDetailConstants.deletedStatus
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_m_rp_4',
          api_error_identifier: 'entity_not_found',
          debug_options: { replyDetailId: oThis.reportEntityId }
        })
      );
    }

    oThis.reportedUserObj = await oThis._fetchUserFor(replyDetail.creatorUserId);

    let videoId = replyDetail.entityId;
    const cacheRsp = await new VideoByIdCache({ ids: [videoId] }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    if (
      !CommonValidator.validateNonEmptyObject(cacheRsp.data[videoId]) ||
      cacheRsp.data[videoId].status === videoConstants.deletedStatus
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_m_rp_5',
          api_error_identifier: 'entity_not_found',
          debug_options: { videoId: videoId }
        })
      );
    }

    oThis.videoUrl = cacheRsp.data[videoId].resolutions.original.url;
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

    // If user is not active, no point in reporting.
    if (
      !CommonValidator.validateNonEmptyObject(userMultiCacheRsp.data[userId]) ||
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

    // If current user is trying to report himself/herself, error out.
    if (
      CommonValidator.validateNonEmptyObject(oThis.currentUser) &&
      userMultiCacheRsp.data[userId].id === oThis.currentUser.id
    ) {
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
