const rootPrefix = '../../..',
  UrlModel = require(rootPrefix + '/app/models/mysql/Url'),
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  EditReplyLink = require(rootPrefix + '/lib/editLink/Reply'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  EditDescriptionLib = require(rootPrefix + '/lib/editDescription/Reply'),
  AddReplyDescription = require(rootPrefix + '/lib/addDescription/Reply'),
  ValidateReplyService = require(rootPrefix + '/app/services/reply/Validate'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  videoLib = require(rootPrefix + '/lib/videoLib'),
  urlConstants = require(rootPrefix + '/lib/globalConstant/url'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail');

/**
 * Class to initiate reply.
 *
 * @class InitiateReply
 */
class InitiateReply extends ServiceBase {
  /**
   * Constructor to initiate reply.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {number} params.parent_kind: parent post kind
   * @param {number} params.parent_id: parent video id
   * @param {number} params.reply_detail_id: if reply is editing
   * @param {string} params.video_url: s3 video url
   * @param {string} params.poster_image_url: s3 poster image url
   * @param {number} params.video_width: video width
   * @param {number} params.video_height {number}: video height
   * @param {number} params.video_size: video size
   * @param {number} params.image_width: image width
   * @param {number} params.image_height: image height
   * @param {number} params.image_size: image size
   * @param {string} [params.video_description]: Video description
   * @param {string} [params.link]: Link
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.replyDetailId = params.reply_detail_id || null;

    oThis.currentUser = params.current_user;
    oThis.parentKind = params.parent_kind;
    oThis.parentId = params.parent_id;
    oThis.videoUrl = params.video_url;
    oThis.posterImageUrl = params.poster_image_url;
    oThis.videoWidth = params.video_width;
    oThis.videoHeight = params.video_height;
    oThis.videoSize = params.video_size;
    oThis.imageWidth = params.image_width;
    oThis.imageHeight = params.image_height;
    oThis.imageSize = params.image_size;
    oThis.videoDescription = params.video_description;
    oThis.link = params.link;

    oThis.videoId = null;
    oThis.addVideoParams = {};
  }

  /**
   * Async perform.
   *
   * @sets oThis.videoId, oThis.replyDetailId
   *
   * @return {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitize();

    if (oThis.replyDetailId) {
      console.log('oThis.replyDetailId ========', oThis.replyDetailId);

      await oThis._getReplyDetails();

      if (oThis.replyDetail.creatorUserId !== oThis.currentUser.id) {
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 's_r_i_1',
            api_error_identifier: 'unauthorized_api_request',
            debug_options: { replyDetail: oThis.replyDetail, currentUserId: oThis.currentUser.id }
          })
        );
      }

      if (oThis.replyDetail.status === replyDetailConstants.pendingStatus) {
        await oThis._editReplyDescription();

        await new EditReplyLink({
          replyDetailId: oThis.replyDetail.id,
          link: oThis.link
        }).perform();
      }
    } else {
      await oThis._addLink();

      const resp = await oThis._validateAndSaveReply();

      oThis.videoId = resp.videoId;
      oThis.replyDetailId = resp.replyDetailId;

      await oThis._addReplyDescription();
    }

    return responseHelper.successWithData({
      [entityType.videoReplyList]: [
        {
          id: oThis.replyDetailId,
          userId: oThis.currentUser.id,
          replyDetailId: oThis.replyDetailId,
          updatedAt: Math.round(new Date() / 1000)
        }
      ]
    });
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.parentKind, oThis.link
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitize() {
    const oThis = this;

    oThis.parentKind = oThis.parentKind.toUpperCase();

    const validateReplyResp = await new ValidateReplyService({
      current_user: oThis.currentUser,
      video_description: oThis.videoDescription,
      link: oThis.link,
      parent_kind: oThis.parentKind,
      parent_id: oThis.parentId
    }).perform();

    if (validateReplyResp.isFailure()) {
      return Promise.reject(validateReplyResp);
    }

    if (!CommonValidator.validateGenericUrl(oThis.link)) {
      oThis.link = null;
    }

    if (oThis.link) {
      oThis.link = oThis.link.toLowerCase();
    }
  }

  /**
   * Get reply details.
   *
   * @sets oThis.replyDetail
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getReplyDetails() {
    const oThis = this;
    const replyDetailCacheResp = await new ReplyDetailsByIdsCache({ ids: [oThis.replyDetailId] }).fetch();

    if (replyDetailCacheResp.isFailure()) {
      logger.error('Error while fetching reply detail data for reply_detail_id:', oThis.replyDetailId);

      return Promise.reject(replyDetailCacheResp);
    }

    oThis.replyDetail = replyDetailCacheResp.data[oThis.replyDetailId];
  }

  /**
   * Edit reply description.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _editReplyDescription() {
    const oThis = this;

    const editDescriptionResp = await new EditDescriptionLib({
      videoId: oThis.replyDetail.entityId,
      videoDescription: oThis.videoDescription,
      replyDetailId: oThis.replyDetailId
    }).perform();

    if (editDescriptionResp.isFailure()) {
      return Promise.reject(editDescriptionResp);
    }
  }

  /**
   * Add link in urls table.
   *
   * @sets oThis.linkIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addLink() {
    const oThis = this;

    if (oThis.link) {
      // If new url is added then insert in 2 tables.
      const insertRsp = await new UrlModel({}).insertUrl({
        url: oThis.link,
        kind: urlConstants.socialUrlKind
      });

      oThis.linkIds = [insertRsp.insertId];
    }
  }

  /**
   * Validate and save reply in reply details and related tables.
   *
   * @sets oThis.addVideoParams
   *
   * @returns {Promise<result>}
   * @private
   */
  async _validateAndSaveReply() {
    const oThis = this;

    oThis.addVideoParams = {
      userId: oThis.currentUser.id,
      videoUrl: oThis.videoUrl,
      size: oThis.videoSize,
      width: oThis.videoWidth,
      height: oThis.videoHeight,
      posterImageUrl: oThis.posterImageUrl,
      posterImageSize: oThis.imageSize,
      posterImageWidth: oThis.imageWidth,
      posterImageHeight: oThis.imageHeight,
      isExternalUrl: false,
      videoKind: videoConstants.replyVideoKind,
      linkIds: oThis.linkIds,
      status: replyDetailConstants.pendingStatus,
      entityKind: replyDetailConstants.videoEntityKind,
      parentKind: oThis.parentKind,
      parentId: oThis.parentId
    };

    const resp = await videoLib.validateAndSave(oThis.addVideoParams);

    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    return resp.data;
  }

  /**
   * Add reply description in text table and update text id in reply details.
   *
   * @sets oThis.descriptionId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addReplyDescription() {
    const oThis = this;

    const replyDescriptionResp = await new AddReplyDescription({
      videoDescription: oThis.videoDescription,
      videoId: oThis.videoId,
      replyDetailId: oThis.replyDetailId,
      currentUserId: oThis.currentUser.id
    }).perform();

    if (replyDescriptionResp.isFailure()) {
      return Promise.reject(replyDescriptionResp);
    }

    oThis.descriptionId = replyDescriptionResp.data.descriptionId;
  }
}

module.exports = InitiateReply;
