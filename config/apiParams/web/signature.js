const rootPrefix = '../../..',
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

const v1Signature = {
  [apiName.twitterRequestToken]: {
    mandatory: [],
    optional: [
      {
        parameter: 'i',
        validatorMethods: ['validateString']
      }
    ]
  },
  [apiName.preLaunchInviteVerify]: {
    mandatory: [
      {
        parameter: 'oauth_token',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'oauth_verifier',
        validatorMethods: ['validateNonBlankString']
      }
    ],
    optional: [
      {
        parameter: 'i',
        validatorMethods: ['validateString']
      }
    ]
  }
};

module.exports = v1Signature;
