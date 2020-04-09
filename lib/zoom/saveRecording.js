const fs = require('fs');
const request = require('request');

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  s3Wrapper = require(rootPrefix + '/lib/aws/S3Wrapper'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  ZoomLib = require(rootPrefix + '/lib/zoom/meeting'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common');

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

    try {
      await oThis._validateZoomMeetingId();
      await oThis._fetchRecordingURL();
      await oThis._downloadFiles();
      await oThis._uploadToS3();
      await oThis._deleteRecordingsInZoom();

      return responseHelper.successWithData({});
    } finally {
      logger.debug('Deleting recording files locally');
      await oThis._clearDownloadedFiles();
      logger.debug('Recording files deleted locally');
    }
  }

  async _validateZoomMeetingId() {
    const oThis = this;
    if (!CommonValidators.validateNonBlankString(oThis.zoomMeetingId)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_z_sr_v_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            zoomMeetingId: oThis.zoomMeetingId
          }
        })
      );
    }
  }

  async _fetchRecordingURL() {
    const oThis = this;

    logger.info(`Fetching recording URLs for zoom ID ${oThis.zoomMeetingId}`);
    const response = await ZoomLib.getRecording(oThis.zoomMeetingId).catch((e) => {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_z_sr_fr_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            message: `Cannot find recording in zoom for zoom id ${oThis.zoomMeetingId} : ${e.message}`,
            meetingId: oThis.meetingId
          }
        })
      );
    });

    logger.info('Recording URLs received');
    oThis.recordingFiles = response.recording_files;
  }

  /**
   * Set oThis.downloadedFiles
   * @returns {Promise<void>}
   * @private
   */
  async _downloadFiles() {
    const oThis = this;
    const downloadPromises = [];

    for (let i = 0; i < oThis.recordingFiles.length; i++) {
      downloadPromises.push(oThis._download(oThis.recordingFiles[i]));
    }

    await Promise.all(downloadPromises).catch((e) => {
      logger.error(
        `Failed downloading recording files for zoom meeting ID ${oThis.zoomMeetingId}, error: ${e.message}`
      );

      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_z_sr_df_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            message: `Cannot download recording in zoom for zoom id ${oThis.zoomMeetingId}`,
            zoomMeetingId: oThis.zoomMeetingId,
            debugMessage: e.message
          }
        })
      );
    });

    logger.log(`Recording files downloaded for zoom id ${oThis.zoomMeetingId}`);
  }

  async _download(recordingFile) {
    const oThis = this;

    return new Promise(async function(onResolve, onReject) {
      logger.info(`Downloading record for zoomMeetingId ${oThis.zoomMeetingId}`);
      logger.debug(`Recording URL ${recordingFile.download_url}`);

      const filePath = oThis.recordingLocalFilePath(recordingFile.file_type, recordingFile.recording_type);

      logger.debug(`Local recording path ${filePath}`);

      oThis.downloadedFilesPath.push(filePath);
      const writer = fs.createWriteStream(filePath);
      const options = {
        uri: recordingFile.download_url
      };
      const response = await request(options);
      const rp = response.pipe(writer);

      rp.on('finish', function() {
        logger.debug(`Download complete for file ${recordingFile.download_url}`);
        writer.close();
        onResolve();
      });
      rp.on('error', function(err) {
        logger.error(`Error downloading file ${recordingFile.download_url}`);
        logger.error(`Message ${err.message}`);
        onReject(err);
      });
    });
  }

  /**
   * Upload downloaded files to S3.
   */
  async _uploadToS3() {
    const oThis = this;

    const putObjectPromises = [];
    for (let i = 0; i < oThis.downloadedFilesPath.length; i++) {
      const fileNameAtS3 = oThis.recordingS3FilePath(oThis.downloadedFilesPath[i]);
      // Todo: Check if file exists using S3wrapper.
      // const resp = await s3Wrapper.checkFileExists(fileNameAtS3, s3Constants.imageFileType);
      // if (resp.isFailure()) {
      putObjectPromises.push(
        s3Wrapper.putObject(coreConstants.S3_CHANNEL_ASSETS_BUCKET, fileNameAtS3, oThis.downloadedFilesPath[i])
      );
      logger.debug(`Uploading file to s3 ${coreConstants.S3_CHANNEL_ASSETS_BUCKET}/${fileNameAtS3}`);
      // }
    }
    return Promise.all(putObjectPromises);
  }

  async _deleteRecordingsInZoom() {}

  async _clearDownloadedFiles() {
    const oThis = this;

    const deletePromises = [];

    for (let i = 0; i < oThis.downloadedFilesPath; i++) {
      deletePromises.push(fs.unlink(oThis.downloadedFilesPath[i]));
    }
    return Promise.all(deletePromises);
  }

  recordingLocalFilePath(fileType, recordingType) {
    const oThis = this;
    recordingType = recordingType ? `-${recordingType}` : '';

    return `${coreConstants.RECORDING_DATA_LOCAL_FOLDER}/${oThis.zoomMeetingId}${recordingType}-original.${fileType}`;
  }

  recordingS3FilePath(localFilePath) {
    const oThis = this;

    const pathSplit = localFilePath.split('/');
    return (
      coreConstants.S3_CHANNEL_ZOOM_RECORDING_FOLDER +
      '/' +
      oThis.zoomMeetingId.concat('/' + pathSplit[pathSplit.length - 1])
    );
  }
}

module.exports = SaveRecording;
