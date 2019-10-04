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
}

module.exports = new PepoMobileEvent();
