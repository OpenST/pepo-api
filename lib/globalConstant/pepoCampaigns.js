/**
 * Constants for pepo campaigns.
 *
 * @module lib/globalConstant/pepoCampaigns
 */
const rootPrefix = '../..';

// Declare constants.

class pepoCampaigns {
  get pepoCampaignsAPIVersion() {
    return 'v2';
  }

  get requestTimeout() {
    return 5000;
  }

  // User Setting : Keys

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

module.exports = new pepoCampaigns();
