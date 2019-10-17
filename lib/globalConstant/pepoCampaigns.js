/**
 * Class for pepo campaigns constants.
 *
 * @class PepoCampaigns
 */
class PepoCampaigns {
  get pepoCampaignsAPIVersion() {
    return 'v2';
  }

  get requestTimeout() {
    return 5000;
  }

  get doubleOptInStatusUserSetting() {
    return 'double_opt_in_status';
  }

  get subscribeStatusUserSetting() {
    return 'subscribe_status';
  }

  get verifiedValue() {
    return 'verified';
  }

  get subscribedValue() {
    return 'subscribed';
  }
}

module.exports = new PepoCampaigns();
