/**
 * Class for zoom Events.
 *
 * @class ZoomRecording
 */
class ZoomRecording {
  // Zoom Recording types start.

  get sharedScreenWithSpeakerType() {
    return 'MP4-shared_screen_with_speaker_view';
  }

  get audioType() {
    return 'M4A-audio_only';
  }

  get chatType() {
    return 'CHAT-chat_file';
  }

  get timelineType() {
    return 'TIMELINE';
  }

  get transcriptType() {
    return 'TRANSCRIPT-audio_transcript';
  }

  // Zoom Recording types stop.
}

module.exports = new ZoomRecording();
