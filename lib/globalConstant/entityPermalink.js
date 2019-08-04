const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, invertedEntityKinds;

/**
 * Class for entity permalink constants
 *
 * @class
 */
class EntityPermalinkConstants {
  /**
   * Constructor for entity permalink.
   *
   * @constructor
   */
  constructor() {}

  get userNameEntityKind() {
    return 'USERNAME';
  }

  get entityKinds() {
    const oThis = this;

    return {
      '1': oThis.userNameEntityKind
    };
  }

  get oldEntityPermalinkStatus() {
    return 'OLD';
  }

  get currentEntityPermalinkStatus() {
    return 'CURRENT';
  }

  get status() {
    const oThis = this;

    return {
      '1': oThis.currentEntityPermalinkStatus,
      '2': oThis.oldEntityPermalinkStatus
    };
  }

  get invertedEntityKinds() {
    const oThis = this;

    if (invertedEntityKinds) {
      return invertedEntityKinds;
    }

    invertedEntityKinds = util.invert(oThis.entityKinds);

    return invertedEntityKinds;
  }

  get invertedStatuses() {
    const oThis = this;

    if (invertedStatuses) {
      return invertedStatuses;
    }

    invertedStatuses = util.invert(oThis.status);

    return invertedStatuses;
  }
}

module.exports = new EntityPermalinkConstants();
