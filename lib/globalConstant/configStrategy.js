const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

// Declare constants.
let kinds, invertedKinds, statuses, invertedStatuses;

/**
 * Class for config strategy constants.
 *
 * @class ConfigStrategy
 */
class ConfigStrategy {
  // Config strategy kinds start.
  get memcached() {
    return 'memcached';
  }

  get bgJobRabbitmq() {
    return 'bgJobRabbitmq';
  }

  get notificationRabbitmq() {
    return 'notificationRabbitmq';
  }

  get webhookPreProcessorRabbitmq() {
    return 'webhookPreProcessorRabbitmq';
  }

  get pepoMobileEventRabbitmq() {
    return 'pepoMobileEventRabbitmq';
  }

  get socketRabbitmq() {
    return 'socketRabbitmq';
  }

  get pixelRabbitmq() {
    return 'pixelRabbitmq';
  }

  get cassandra() {
    return 'cassandra';
  }

  get firebase() {
    return 'firebase';
  }

  get constants() {
    return 'constants';
  }

  get websocket() {
    return 'websocket';
  }

  // Config strategy kinds end.

  // Config strategy statuses start.
  get activeStatus() {
    return 'active';
  }

  get inActiveStatus() {
    return 'inactive';
  }

  // Config strategy statuses end.

  get kinds() {
    const oThis = this;

    if (kinds) {
      return kinds;
    }

    kinds = {
      '1': oThis.memcached,
      '2': oThis.bgJobRabbitmq,
      '3': oThis.websocket,
      '4': oThis.notificationRabbitmq,
      '5': oThis.socketRabbitmq,
      '6': oThis.constants,
      '7': oThis.cassandra,
      '8': oThis.firebase,
      '10': oThis.pepoMobileEventRabbitmq,
      '11': oThis.pixelRabbitmq,
      '13': oThis.webhookPreProcessorRabbitmq
    };

    return kinds;
  }

  get invertedKinds() {
    const oThis = this;

    invertedKinds = invertedKinds || util.invert(oThis.kinds);

    return invertedKinds;
  }

  get statuses() {
    const oThis = this;

    if (statuses) {
      return statuses;
    }

    statuses = {
      '1': oThis.activeStatus,
      '2': oThis.inActiveStatus
    };

    return statuses;
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }

  // TODO - @Tejas - let's discuss on this.
  get mandatoryKinds() {
    const oThis = this;

    // Returns a map with key as 1 to indicate whether the kind is mandatory or not.
    return {
      [oThis.memcached]: 1,
      [oThis.bgJobRabbitmq]: 1,
      [oThis.notificationRabbitmq]: 1,
      [oThis.pepoMobileEventRabbitmq]: 1,
      [oThis.pixelRabbitmq]: 1,
      [oThis.socketRabbitmq]: 1,
      [oThis.websocket]: 1,
      [oThis.cassandra]: 1,
      [oThis.firebase]: 1,
      [oThis.webhookPreProcessorRabbitmq]: 1
    };
  }
}

module.exports = new ConfigStrategy();
