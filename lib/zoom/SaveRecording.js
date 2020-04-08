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
    let oThis = this;

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

  async _uploadToS3() {}

  async _deleteRecordingsInZoom() {}
}

module.exports = SaveRecording;
