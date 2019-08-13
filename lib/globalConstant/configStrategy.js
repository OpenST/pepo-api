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

  get socketRabbitmq() {
    return 'socketRabbitmq';
  }

  get cassandra() {
    return 'cassandra';
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
      '7': oThis.cassandra
    };

    return kinds;
  }

  get invertedKinds() {
    const oThis = this;

    if (invertedKinds) {
      return invertedKinds;
    }

    invertedKinds = util.invert(oThis.kinds);

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

    if (invertedStatuses) {
      return invertedStatuses;
    }

    invertedStatuses = util.invert(oThis.statuses);

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
      [oThis.socketRabbitmq]: 1,
      [oThis.websocket]: 1,
      [oThis.cassandra]: 1
    };
  }
}

module.exports = new ConfigStrategy();
