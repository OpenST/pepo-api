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

  get videoPlayStartKind() {
    return 'video-play-start';
  }
}

module.exports = new PepoMobileEvent();
