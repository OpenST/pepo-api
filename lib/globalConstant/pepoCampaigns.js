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
}

module.exports = new pepoCampaigns();
