const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic');

/**
 * Class for email constants.
 *
 * @class Email
 */
class Email {
  get reportIssue() {
    if (basicHelper.isProduction()) {
      return 'pepo.report@ost.com';
    } else if (basicHelper.isStaging()) {
      return 'backend@ost.com';
    } else if (basicHelper.isSandbox()) {
      return 'backend@ost.com';
    }

    return 'backend@ost.com';
  }

  get redemptionRequest() {
    if (basicHelper.isProduction()) {
      return 'pepo.redemptions@ost.com';
    } else if (basicHelper.isStaging()) {
      return 'backend@ost.com';
    } else if (basicHelper.isSandbox()) {
      return 'backend@ost.com';
    }

    return 'backend@ost.com';
  }
}

module.exports = new Email();
