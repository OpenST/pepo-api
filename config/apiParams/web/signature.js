const rootPrefix = '../../..',
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

const v1Signature = {
  [apiName.preLaunchInviteLogin]: {
    mandatory: [
      {
        parameter: 'token',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'secret',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'twitter_id',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'handle',
        validatorMethods: ['validateNonBlankString']
      }
    ],
    optional: []
  }
};

module.exports = v1Signature;
