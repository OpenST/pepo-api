const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic');

class Email {
  get reportIssue() {
    if (basicHelper.isProduction()) {
      return 'backend@ost.com'; // change this after new group is created.
    } else if (basicHelper.isStaging) {
      return 'backend@ost.com';
    } else if (basicHelper.isSandbox) {
      return 'backend@ost.com';
    } else {
      return 'backend@ost.com';
    }
  }
}

module.exports = new Email();
