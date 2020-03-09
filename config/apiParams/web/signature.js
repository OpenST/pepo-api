const rootPrefix = '../../..',
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

const webSignature = {
  [apiName.twitterRedirectUrl]: {
    mandatory: [],
    optional: []
  },
  [apiName.googleRedirectUrl]: {
    mandatory: [
      {
        parameter: 'dev_login',
        validatorMethods: ['validateBoolean']
      }
    ],
    optional: []
  },
  [apiName.githubRedirectUrl]: {
    mandatory: [
      {
        parameter: 'dev_login',
        validatorMethods: ['validateBoolean']
      }
    ],
    optional: []
  },
  [apiName.appleRedirectUrl]: {
    mandatory: [
      {
        parameter: 'dev_login',
        validatorMethods: ['validateBoolean']
      }
    ],
    optional: []
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
  [apiName.doubleOptIn]: {
    mandatory: [
      {
        parameter: 't',
        validatorMethods: ['validateString']
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
  },
  [apiName.getVideo]: {
    mandatory: [
      {
        parameter: 'video_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: []
  },
  [apiName.videoShare]: {
    mandatory: [
      {
        parameter: 'video_id',
        validatorMethods: ['validateInteger']
      }
    ],
    optional: []
  },
  [apiName.reportIssue]: {
    mandatory: [
      {
        parameter: 'report_entity_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'report_entity_kind',
        validatorMethods: ['validateNonBlankString']
      }
    ],
    optional: []
  },
  [apiName.githubConnect]: {
    mandatory: [
      {
        parameter: 'authorization_code',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'dev_login',
        validatorMethods: ['validateBoolean']
      }
    ],
    optional: [
      {
        parameter: 'invite_code',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'utm_params',
        validatorMethods: ['validateObject']
      }
    ]
  },
  [apiName.googleConnect]: {
    mandatory: [
      {
        parameter: 'authorization_code',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'dev_login',
        validatorMethods: ['validateBoolean']
      }
    ],
    optional: [
      {
        parameter: 'invite_code',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'utm_params',
        validatorMethods: ['validateObject']
      }
    ]
  },
  [apiName.appleConnect]: {
    mandatory: [
      {
        parameter: 'authorization_code',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'identity_token',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'dev_login',
        validatorMethods: ['validateBoolean']
      }
    ],
    optional: [
      {
        parameter: 'email',
        validatorMethods: ['validateNullString']
      },
      {
        parameter: 'state',
        validatorMethods: ['validateNullString']
      },
      {
        parameter: 'full_name',
        validatorMethods: ['validateObject']
      },
      {
        parameter: 'invite_code',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'utm_params',
        validatorMethods: ['validateObject']
      }
    ]
  },
  [apiName.twitterLogin]: {
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
  [apiName.feedsList]: {
    mandatory: [
      {
        parameter: 'sanitized_headers',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      }
    ],
    optional: [
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.loggedInUser]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'login_service_type',
        validatorMethods: ['validateNonBlankString']
      }
    ],
    optional: []
  },
  [apiName.postSessionAuth]: {
    mandatory: [
      {
        parameter: 'payload',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.websocketDetails]: {
    mandatory: [
      {
        parameter: 'user_id',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.ostTransaction]: {
    mandatory: [
      {
        parameter: 'ost_transaction',
        validatorMethods: ['validateNonEmptyObject', 'validateOstTransactionObject']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: [
      {
        parameter: 'meta',
        validatorMethods: ['validateNonEmptyObject', 'validateOstTransactionMeta']
      },
      {
        parameter: 'is_paper_plane',
        validatorMethods: ['validateBoolean']
      }
    ]
  }
};

module.exports = webSignature;
