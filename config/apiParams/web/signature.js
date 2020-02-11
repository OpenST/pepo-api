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
        parameter: 'invite',
        validatorMethods: ['validateString']
      }
    ]
  },

  [apiName.getRedemptionProducts]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },

  [apiName.validateSupportUrl]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
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
  },
  [apiName.preLaunchInviteRotateTwitterAccount]: {
    mandatory: [
      {
        parameter: 'twitter_handle',
        validatorMethods: ['validateString']
      }
    ],
    optional: []
  },
  [apiName.preLaunchInviteCreator]: {
    mandatory: [
      {
        parameter: 'current_pre_launch_invite',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.requestRedemption]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'product_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'price_point',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'pepo_amount_in_wei',
        validatorMethods: ['validateNonZeroWeiValue']
      }
    ],
    optional: []
  },
  [apiName.initiateRedemptionRequest]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'product_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'dollar_amount',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: []
  },
  [apiName.redemptionPepocornBalance]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.channelShare]: {
    mandatory: [
      {
        parameter: 'channel_permalink',
        validatorMethods: ['validateName']
      }
    ],
    optional: []
  },
  [apiName.profileShare]: {
    mandatory: [
      {
        parameter: 'username',
        validatorMethods: ['validateName']
      }
    ],
    optional: []
  }
};

module.exports = v1Signature;
