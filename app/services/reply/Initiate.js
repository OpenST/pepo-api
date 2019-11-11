const rootPrefix = '../../..',
  UrlModel = require(rootPrefix + '/app/models/mysql/Url'),
  AddReplyDescription = require(rootPrefix + '/lib/addDescription/Reply'),
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  urlConstants = require(rootPrefix + '/lib/globalConstant/url'),
  videoLib = require(rootPrefix + '/lib/videoLib'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  ValidateReplyService = require(rootPrefix + '/app/services/reply/Validate');

/**
 * Class to delete video by user.
 *
 * @class ValidateUploadVideoParams
 */
class ValidateUploadVideoParams extends ServiceBase {
  /**
   * Constructor to delete video by user.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {number} params.profile_user_id
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
   * @param {boolean} params.isExternalUrl: video source is other than s3 upload
   * @param {string} [params.video_description]: Video description
   * @param {string} [params.link]: Link
   * @param {string/number} [params.per_reply_amount_in_wei]: Per reply amount in wei.
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
      await oThis._getReplyDetails();
      await oThis._editDescription();
      await oThis._editLink();
    } else {
      await oThis._addLink();

      let resp = await oThis._validateAndSaveReply();
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

  async _validateAndSanitize() {
    const oThis = this;

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

  async _addReplyDescription(params) {
    const oThis = this;

    await new AddReplyDescription({
      videoDescription: oThis.videoDescription,
      videoId: oThis.videoId,
      replyDetailId: oThis.replyDetailId
    }).perform();
  }

  /**
   * Add link in urls table.
   *
   * @returns {Promise<*>}
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

    return null;
  }
}

module.exports = ValidateUploadVideoParams;
