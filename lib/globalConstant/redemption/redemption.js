const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

/**
 * Class for redemption constants.
 *
 * @class RedemptionConstants
 */
class RedemptionConstants {
  get activeStatus() {
    return 'ACTIVE';
  }

  get inactiveStatus() {
    return 'INACTIVE';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.activeStatus,
      '2': oThis.inactiveStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }

  get pepocornPerDollar() {
    return 1;
  }

  get squareImageType() {
    return 'square';
  }

  get landscapeImageType() {
    return 'landscape';
  }

  get allowedRedemptionTypes() {
    const oThis = this;

    return {
      [oThis.squareImageType]: 1,
      [oThis.landscapeImageType]: 1
    };
  }
}

module.exports = new RedemptionConstants();
