const rootPrefix = '../../..',
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

const webSignature = {
  [apiName.twitterRedirectUrl]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'dev_login',
        validatorMethods: ['validateBoolean']
      },
      {
        parameter: 'state',
        validatorMethods: ['validateString']
      }
    ],
    optional: []
  },
  [apiName.googleRedirectUrl]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'dev_login',
        validatorMethods: ['validateBoolean']
      },
      {
        parameter: 'state',
        validatorMethods: ['validateString']
      }
    ],
    optional: []
  },
  [apiName.githubRedirectUrl]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'dev_login',
        validatorMethods: ['validateBoolean']
      },
      {
        parameter: 'state',
        validatorMethods: ['validateString']
      }
    ],
    optional: []
  },
  [apiName.appleRedirectUrl]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'dev_login',
        validatorMethods: ['validateBoolean']
      },
      {
        parameter: 'state',
        validatorMethods: ['validateString']
      }
    ],
    optional: []
  },
  [apiName.getRedemptionProducts]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
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
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
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
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
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
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
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
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
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
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
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
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
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
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
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
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
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
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
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
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
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
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'authorization_code',
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
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'authorization_code',
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
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'authorization_code',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'identity_token',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'dev_login',
        validatorMethods: ['validateBoolean']
      }
    ],
    optional: [
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
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
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
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'sanitized_headers',
        validatorMethods: ['validateNonEmptyObject']
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
  [apiName.getChannels]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      }
    ],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'q',
        validatorMethods: ['validateString']
      },
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      },
      {
        parameter: 'getTopResults',
        validatorMethods: ['validateBoolean']
      }
    ]
  },
  [apiName.registerDevice]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'device_address',
        validatorMethods: ['validateEthAddress']
      },
      {
        parameter: 'api_signer_address',
        validatorMethods: ['validateEthAddress']
      }
    ],
    optional: []
  },
  [apiName.loggedInUser]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
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
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
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
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
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
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
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
  },
  [apiName.twitterDisconnect]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      }
    ],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.appleDisconnect]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      }
    ],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.googleDisconnect]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      }
    ],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.githubDisconnect]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      }
    ],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.getChannelDetails]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'channel_permalink',
        validatorMethods: ['validateName']
      }
    ],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.getJoinMeetingPayload]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'meeting_id',
        validatorMethods: ['validateAlphaNumericString']
      },
      {
        parameter: 'channel_permalink',
        validatorMethods: ['validateName']
      }
    ],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'fingerprint_id',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'guest_name',
        validatorMethods: ['validateString', 'validateName']
      }
    ]
  },
  [apiName.getChannelMeeting]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'meeting_id',
        validatorMethods: ['validateAlphaNumericString']
      },
      {
        parameter: 'channel_permalink',
        validatorMethods: ['validateName']
      }
    ],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.startChannelZoomMeeting]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'channel_permalink',
        validatorMethods: ['validateName']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.endZoomMeeting]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'channel_permalink',
        validatorMethods: ['validateName']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'meeting_id',
        validatorMethods: ['validateAlphaNumericString']
      }
    ],
    optional: []
  },
  [apiName.getChannelVideos]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'channel_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: [
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      },
      {
        parameter: paginationConstants.filterByTagIdKey,
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.getCurrentUserManagedChannel]: {
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
  }
};

module.exports = webSignature;
