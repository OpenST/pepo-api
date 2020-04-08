const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  s3Wrapper = require(rootPrefix + '/lib/aws/S3Wrapper'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3');
console.log('coreConstants : ', coreConstants);
class SaveRecording {
  /**
   *
   * @param {string} params.zoomMeetingId Zoom Meeting ID
   */
  constructor(params) {
    const oThis = this;

    oThis.zoomMeetingId = params.zoomMeetingId;
    oThis.recordingFiles = [];

    /** Path of downloaded files from zoom on local machines. */
    oThis.downloadedFilesPath = [];
  }

  async perform() {
    const oThis = this;

    await oThis._validateZoomMeetingId();
    await oThis._fetchRecordingURL();
    await oThis._downloadFiles();
    await oThis._uploadToS3();
    await oThis._deleteRecordingsInZoom();
  }

  async _validateZoomMeetingId() {}

  async _fetchRecordingURL() {}

  /**
   * Set oThis.downloadedFiles
   * @returns {Promise<void>}
   * @private
   */
  async _downloadFiles() {}

  /**
   * Upload downloaded files to S3.
   */
  async _uploadToS3() {
    const oThis = this;

    oThis.S3_FILEPATH = coreConstants.S3_CHANNEL_ZOOM_RECORDING_FOLDER + '/' + oThis.zoomMeetingId;

    console.log('S3_FILEPATH : ', oThis.S3_FILEPATH);
    const putObjectPromises = [];
    for (let i = 0; i < oThis.downloadedFilesPath.length; i++) {
      const pathSplit = oThis.downloadedFilesPath[i].split('/');
      const fileNameAtS3 = oThis.S3_FILEPATH.concat('/' + pathSplit[pathSplit.length - 1]);
      // Todo: Check if file exists using S3wrapper.
      // const resp = await s3Wrapper.checkFileExists(fileNameAtS3, s3Constants.imageFileType);
      // if (resp.isFailure()) {
      putObjectPromises.push(
        s3Wrapper.putObject(coreConstants.S3_CHANNEL_ASSETS_BUCKET, fileNameAtS3, oThis.downloadedFilesPath[i])
      );
      // }
    }

    await Promise.all(putObjectPromises);
  }

  async _deleteRecordingsInZoom() {}
}

module.exports = SaveRecording;
