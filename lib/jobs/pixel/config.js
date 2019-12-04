const rootPrefix = '../../..',
  pixelConstants = require(rootPrefix + '/lib/globalConstant/pixel');

module.exports = {
  [pixelConstants.registerEntityType]: {
    mandatory: ['user_id', 'mobile_app_version', 'account_created'],
    optional: []
  },
  [pixelConstants.accountUpdateEntityType]: {
    mandatory: [],
    optional: []
  }
};
