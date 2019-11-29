const rootPrefix = '../..';

/**
 * Class for Pepo Mobile Events.
 *
 * @class pepoMobileEvent
 */
class PepoMobileEvent {
  get videoPlayStartTopic() {
    return 'pme.p1.videoPlayStart';
  }

  get videoPlayEndTopic() {
    return 'pme.p1.videoPlayEnd';
  }

  get videoPlayStartKind() {
    return 'video_play_start';
  }

  get videoPlayEndKind() {
    return 'video_play_end';
  }
}

module.exports = new PepoMobileEvent();
