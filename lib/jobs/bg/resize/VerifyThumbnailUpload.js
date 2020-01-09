const rootPrefix = '../../../..',
  VideoModel = require(rootPrefix + '/app/models/mysql/Video'),
  ImageModel = require(rootPrefix + '/app/models/mysql/Image'),
  imageLib = require(rootPrefix + '/lib/imageLib'),
  s3Wrapper = require(rootPrefix + '/lib/aws/S3Wrapper'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image');

/**
 * Class to verify thumbnail is uploaded.
 *
 * @class VerifyThumbnailUpload
 */
class VerifyThumbnailUpload {
  /**
   * Constructor to verify thumbnail is uploaded.
   *
   * @param {object} params
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.videoId = params.videoId;
    oThis.userId = params.userId;
    oThis.thumbnailS3Url = params.thumbnailS3Url;
    oThis.trialCount = params.trialCount || 0;
  }

  /**
   * Perform.
   *
   * @returns {Promise<*>}
   */
  async perform() {
    const oThis = this;

    // Check whether media is resized.
    await oThis._checkThumbnailUploaded();
  }

  /**
   * Check whether media has resized for all sizes.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _checkThumbnailUploaded() {
    const oThis = this,
      fileName = oThis.thumbnailS3Url.split('/').pop();

    let resp = await s3Wrapper.checkFileExists(fileName, s3Constants.imageFileType);

    if (resp.isFailure()) {
      await oThis._enqueueVerification();
    } else {
      //Insert in images table and associate the image id in video table.
      await oThis._insertInImagesTable();
      await oThis._updateInVideosTable();
    }
  }

  /**
   * Enqueue upload verification.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueVerification() {
    const oThis = this;

    if (oThis.trialCount > 10) {
      return;
    }
    //enqueue the same message after some time
    const publishAfter = 10000; //10 sec
    await bgJob.enqueue(
      bgJobConstants.verifyThumbnailUploadJobTopic,
      {
        userId: oThis.userId,
        videoId: oThis.videoId,
        thumbnailS3Url: oThis.thumbnailS3Url,
        trialCount: oThis.trialCount + 1
      },
      { publishAfter: publishAfter }
    );
  }

  /**
   * Insert in images table.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _insertInImagesTable() {
    const oThis = this;

    const insertResponse = await imageLib.validateAndSave({
      imageUrl: oThis.thumbnailS3Url,
      isExternalUrl: false,
      userId: oThis.userId,
      kind: imageConstants.posterImageKind,
      enqueueResizer: true
    });

    if (insertResponse.isSuccess()) {
      oThis.imageId = insertResponse.data.insertId;
      await ImageModel.flushCache({ id: oThis.imageId });
    } else {
      return Promise.reject(insertResponse);
    }
  }

  /**
   * Update video's poster_image_id in videos table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateInVideosTable() {
    const oThis = this;

    await new VideoModel()
      .update(['poster_image_id = ?', oThis.imageId])
      .where(['id = ?', oThis.videoId])
      .fire();

    await VideoModel.flushCache({ id: oThis.videoId });
  }
}

module.exports = VerifyThumbnailUpload;
