const rootPrefix = '../../..',
  UrlModel = require(rootPrefix + '/app/models/mysql/Url'),
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  AddReplyDescription = require(rootPrefix + '/lib/addDescription/Reply'),
  ValidateReplyService = require(rootPrefix + '/app/services/reply/Validate'),
  videoLib = require(rootPrefix + '/lib/videoLib'),
  urlConstants = require(rootPrefix + '/lib/globalConstant/url'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
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

    oThis.currentUser = params.current_user;
    oThis.parentKind = params.parent_kind;
    oThis.parentId = params.parent_id;
    oThis.replyDetailId = params.reply_detail_id;
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
    oThis.replyDetailId = null;
    oThis.addVideoParams = {};
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitize();

    if (oThis.replyDetailId) {
      // await oThis._getReplyDetails();
      // await oThis._editDescription();
      // await oThis._editLink();
    } else {
      await oThis._addLink();

      const resp = await oThis._validateAndSaveReply();

      oThis.videoId = resp.videoId;
      oThis.replyDetailId = resp.replyDetailId;

      await oThis._addReplyDescription();
    }

    return responseHelper.successWithData({
      replyDetail: {
        id: oThis.replyDetailId,
        creatorUserId: oThis.addVideoParams.userId,
        entityKind: oThis.addVideoParams.entityKind,
        entityId: oThis.videoId,
        descriptionId: oThis.descriptionId,
        linkIds: oThis.addVideoParams.linkIds,
        parentId: oThis.addVideoParams.parentId,
        parentKind: oThis.addVideoParams.parentKind
      }
    });
  }

  /**
   * Validate and sanitize.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitize() {
    const oThis = this;

    oThis.parentKind = oThis.parentKind.toUpperCase();

    let validateReplyResp = await new ValidateReplyService({
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
   * Add link in urls table.
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
   * @returns {Promise<Result>}
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

    return resp;
  }

  /**
   * Add reply description in text table and update text id in reply details.
   *
   * @param params
   * @returns {Promise<void>}
   * @private
   */
  async _addReplyDescription(params) {
    const oThis = this;

    await new AddReplyDescription({
      videoDescription: oThis.videoDescription,
      videoId: oThis.videoId,
      replyDetailId: oThis.replyDetailId
    }).perform();
  }
}

module.exports = InitiateReply;
