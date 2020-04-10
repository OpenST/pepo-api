const fs = require('fs');
const request = require('request');

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  s3Wrapper = require(rootPrefix + '/lib/aws/S3Wrapper'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  ZoomLib = require(rootPrefix + '/lib/zoom/meeting'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');

/**
 * This class fetches recordings from zoom and upload them to s3.
 */
class SaveRecording {
  /**
   * @param {string} params.zoomMeetingId Zoom Meeting ID
   */
  constructor(params) {
    const oThis = this;

    oThis.zoomMeetingId = params.zoomMeetingId;
    oThis.recordingFiles = [];

    /** Path of downloaded files from zoom on local machines. */
    oThis.downloadedFilesPath = [];
  }

  /**
   * Perform save recording operation.
   *
   * @returns {Promise<*|result>}
   */
  async perform() {
    const oThis = this;

    return oThis._asyncPerform().catch(async (e) => {
      logger.debug('Deleting recording files locally if any');
      // await oThis._clearDownloadedFiles();
      logger.debug('Recording files deleted locally');
      return Promise.reject(e);
    });
  }

  async _asyncPerform() {
    const oThis = this;

    await oThis._validateZoomMeetingId();
    await oThis._fetchRecordingURL();
    await oThis._downloadFiles();
    await oThis._uploadToS3();
    await oThis._deleteRecordingsInZoom();
    return responseHelper.successWithData({});
  }

  async _validateZoomMeetingId() {
    const oThis = this;

    // Converted to string
    oThis.zoomMeetingId = oThis.zoomMeetingId ? oThis.zoomMeetingId.toString() : oThis.zoomMeetingId;
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

  /**
   * Fetch all recording file url from zoom by zoom meeting id.
   * @returns {Promise<void>}
   * @private
   */
  async _fetchRecordingURL() {
    const oThis = this;

    logger.info(`Fetching recording URLs for zoom ID ${oThis.zoomMeetingId}`);
    const response = await ZoomLib.getRecording(oThis.zoomMeetingId).catch(async function(e) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_z_sr_fr_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: {
          message: `Cannot find recording in zoom for zoom id ${oThis.zoomMeetingId}`,
          APIResponse: e.message,
          meetingId: oThis.zoomMeetingId
        }
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.mediumSeverity);
      return Promise.reject(errorObject);
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

    return Promise.all(downloadPromises)
      .then(function() {
        logger.log(`All download completed ${oThis.zoomMeetingId}`);
      })
      .catch(async function(e) {
        logger.error(
          `Failed downloading recording files for zoom meeting ID ${oThis.zoomMeetingId}, error: ${e.message}`
        );

        const errorObject = responseHelper.error({
          internal_error_identifier: 'l_z_sr_df_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            message: `Cannot download recording in zoom for zoom id ${oThis.zoomMeetingId}`,
            zoomMeetingId: oThis.zoomMeetingId,
            debugMessage: e.message
          }
        });
        await createErrorLogsEntry.perform(errorObject, errorLogsConstants.mediumSeverity);
        return Promise.reject(errorObject);
      });
  }

  async _download(recordingFile) {
    const oThis = this;

    return new Promise(async function(onResolve, onReject) {
      logger.info(`Downloading record for zoomMeetingId ${oThis.zoomMeetingId}`);
      logger.debug(`Recording URL ${recordingFile.download_url}`);

      const filePath = oThis.recordingLocalFilePath(recordingFile.file_type, recordingFile.recording_type);

      logger.debug(`Local recording path ${filePath}`);

      const writer = fs.createWriteStream(filePath);
      const options = {
        uri: recordingFile.download_url
      };
      const response = request(options);
      const rp = await response.pipe(writer);

      rp.on('finish', function() {
        logger.debug(`Download complete for file ${recordingFile.download_url}`);
        oThis.downloadedFilesPath.push(filePath);
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
      putObjectPromises.push(
        s3Wrapper.putObject(coreConstants.S3_CHANNEL_ASSETS_BUCKET, fileNameAtS3, oThis.downloadedFilesPath[i])
      );
      logger.debug(`Uploading file to s3 ${coreConstants.S3_CHANNEL_ASSETS_BUCKET}/${fileNameAtS3}`);
    }

    return Promise.all(putObjectPromises).catch(async function(e) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_z_sr_uts_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: {
          message: `Meeting recording upload to s3 failed zoom id ${oThis.zoomMeetingId}`,
          zoomMeetingId: oThis.zoomMeetingId,
          debugMessage: e.message
        }
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.mediumSeverity);
      return Promise.reject(errorObject);
    });
  }

  /**
   * Delete recording file from zoom.
   * @returns {Promise<void>}
   * @private
   */
  async _deleteRecordingsInZoom() {
    const oThis = this;
    logger.debug(`Deleting recordings for zoom id ${oThis.zoomMeetingId}`);
    oThis.filesForDeletion = oThis.filesToBeDeleted(oThis.recordingFiles);

    const deletedRecordingPromises = [];
    for (let i = 0; i < oThis.filesForDeletion.length; i++) {
      logger.debug(
        `Deleting zoom file ${oThis.filesForDeletion[i].download_url} having id ${oThis.filesForDeletion[i].id}`
      );

      const deleteRequest = ZoomLib.deleteRecordingFile(oThis.zoomMeetingId, oThis.filesForDeletion[i].id).catch(
        async function(e) {
          console.log('error object : ', e);
          logger.error(`Failed deleting recording files with id ${oThis.filesForDeletion[i].id} , error: ${e.message}`);

          const errorObject = responseHelper.error({
            internal_error_identifier: 'l_z_sr_dr_2',
            api_error_identifier: 'something_went_wrong',
            debug_options: {
              message: `Cannot delete recording in zoom for zoom id ${oThis.zoomMeetingId}`,
              recordingFileId: oThis.filesForDeletion[i].id,
              zoomMeetingId: oThis.zoomMeetingId,
              debugMessage: e.message
            }
          });
          await createErrorLogsEntry.perform(errorObject, errorLogsConstants.mediumSeverity);
          return Promise.reject(errorObject);
        }
      );

      deletedRecordingPromises.push(deleteRequest);
    }

    await Promise.all(deletedRecordingPromises).catch(async function(e) {
      logger.error(`Failed deleting recording files for zoom meeting ID ${oThis.zoomMeetingId} , error: ${e.message}`);

      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_z_sr_dr_2',
        api_error_identifier: 'something_went_wrong',
        debug_options: {
          message: `Cannot delete recording in zoom for zoom id ${oThis.zoomMeetingId}`,
          zoomMeetingId: oThis.zoomMeetingId,
          debugMessage: e.message
        }
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.mediumSeverity);
      return Promise.reject(errorObject);
    });
  }

  /**
   * Only files with id will be deleted from zoom.
   * @param recordingFiles
   * @returns {*}
   */
  filesToBeDeleted(recordingFiles) {
    return recordingFiles.filter(function(file) {
      return Object.prototype.hasOwnProperty.call(file, 'id');
    });
  }

  /**
   * Delete recording files from local.
   * @returns {Promise<any[]>}
   * @private
   */
  async _clearDownloadedFiles() {
    const oThis = this;

    const deletePromises = [];

    for (let i = 0; i < oThis.downloadedFilesPath.length; i++) {
      logger.debug(`Deleting file ${oThis.downloadedFilesPath[i]}`);
      deletePromises.push(
        new Promise(async function(onResolve, onReject) {
          fs.unlink(oThis.downloadedFilesPath[i], function(e) {
            if (e) {
              onReject(e);
            }
            onResolve();
          });
        })
      );
    }

    return Promise.all(deletePromises);
  }

  /**
   * Path of recording file on local file system.
   * @param fileType FileType from zoom.
   * @param recordingType Recording type from zoom.
   * @returns {string}
   */
  recordingLocalFilePath(fileType, recordingType) {
    const oThis = this;
    recordingType = recordingType ? `-${recordingType}` : '';

    return `${coreConstants.RECORDING_DATA_LOCAL_FOLDER}/${oThis.zoomMeetingId}${recordingType}-original.${fileType}`;
  }

  /**
   * Path of recording file on s3.
   * @param localFilePath
   * @returns {string}
   */
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
