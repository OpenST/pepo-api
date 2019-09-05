const rootPrefix = '../../..',
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

const v1Signature = {
  [apiName.preLaunchLogout]: {
    mandatory: [],
    optional: []
  },
  [apiName.preLaunchAccountGet]: {
    mandatory: [
      {
        parameter: 'current_pre_launch_invite',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
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
  },
  [apiName.preLaunchInviteSubscribeEmail]: {
    mandatory: [
      {
        parameter: 'current_pre_launch_invite',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'email',
        validatorMethods: ['validateString']
      }
    ],
    optional: []
  },
  [apiName.doubleOptIn]: {
    mandatory: [
      {
        parameter: 't',
        validatorMethods: ['validateString']
      }
    ],
    optional: []
  }
};

module.exports = v1Signature;
