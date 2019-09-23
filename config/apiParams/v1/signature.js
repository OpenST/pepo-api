const rootPrefix = '../../..',
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

const v1Signature = {
  [apiName.logout]: {
    mandatory: [],
    optional: [
      {
        parameter: 'device_id',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.recoveryInfo]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.getInviteCode]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.registerDevice]: {
    mandatory: [
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
  [apiName.token]: {
    mandatory: [],
    optional: []
  },
  [apiName.contributionBy]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'profile_user_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: [
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      }
    ]
  },
  [apiName.contributionTo]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'profile_user_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: [
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      }
    ]
  },
  [apiName.contributionSuggestion]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'profile_user_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: [
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      }
    ]
  },
  [apiName.loggedInUser]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.gifsSearch]: {
    mandatory: [
      {
        parameter: 'query',
        validatorMethods: ['validateString']
      }
    ],
    optional: [
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString']
      }
    ]
  },
  [apiName.gifsTrending]: {
    mandatory: [],
    optional: [
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString']
      }
    ]
  },
  [apiName.gifsCategories]: {
    mandatory: [],
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
  },
  [apiName.uploadParams]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: [
      {
        parameter: 'videos',
        validatorMethods: ['validateStringArray']
      },
      {
        parameter: 'images',
        validatorMethods: ['validateStringArray']
      }
    ]
  },

  [apiName.getRedemptionProductUrl]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },

  [apiName.getSupportUrl]: {
    mandatory: [
      {
        parameter: 'current_user',
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

  [apiName.twitterLogin]: {
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
    optional: [
      {
        parameter: 'invite_code',
        validatorMethods: ['validateNonBlankString']
      }
    ]
  },
  [apiName.getUserProfile]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'profile_user_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: []
  },
  [apiName.rotateTwitterAccount]: {
    mandatory: [
      {
        parameter: 'user_name',
        validatorMethods: ['validateString', 'validateUserName']
      }
    ],
    optional: []
  },
  [apiName.saveFanVideo]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'profile_user_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'video_url',
        validatorMethods: ['validateHttpBasedUrl']
      }
    ],
    optional: [
      {
        parameter: 'poster_image_url',
        validatorMethods: ['validateHttpBasedUrl']
      },
      {
        parameter: 'video_width',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'video_height',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'video_size',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'image_width',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'image_height',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'image_size',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'video_description',
        validatorMethods: ['validateString', 'validateStopWords']
      },
      {
        parameter: 'link',
        validatorMethods: ['validateString', 'validateStopWords']
      } // If link is invalid, consider empty string.
    ]
  },
  [apiName.saveProfileImage]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'profile_user_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'image_url',
        validatorMethods: ['validateHttpBasedUrl']
      }
    ],
    optional: [
      {
        parameter: 'width',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'height',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'size',
        validatorMethods: ['validateInteger']
      }
    ]
  },
  [apiName.saveProfile]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'profile_user_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'name',
        validatorMethods: ['validateString', 'validateName', 'validateStopWords']
      },
      {
        parameter: 'user_name',
        validatorMethods: ['validateString', 'validateUserName', 'validateStopWords']
      }
    ],
    optional: [
      {
        parameter: 'bio',
        validatorMethods: ['validateString', 'validateStopWords']
      },
      {
        parameter: 'link',
        validatorMethods: ['validateGenericUrl', 'validateStopWords']
      }
    ]
  },
  [apiName.saveEmail]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'profile_user_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'email',
        validatorMethods: ['validateString', 'isValidEmail']
      }
    ],
    optional: []
  },
  [apiName.getTags]: {
    mandatory: [
      {
        parameter: 'q',
        validatorMethods: ['validateString']
      }
    ],
    optional: [
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      }
    ]
  },
  [apiName.feedsList]: {
    mandatory: [],
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
  [apiName.userVideoList]: {
    mandatory: [
      {
        parameter: 'profile_user_id',
        validatorMethods: ['validateNonZeroInteger']
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
  [apiName.getVideo]: {
    mandatory: [
      {
        parameter: 'video_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.feedDetails]: {
    mandatory: [
      {
        parameter: 'feed_id',
        validatorMethods: ['validateInteger']
      }
    ],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
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
  [apiName.getUserNotifications]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: [
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      }
    ]
  },
  [apiName.sayThankYou]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'notification_id',
        validatorMethods: ['validateString', 'validateNotificationId']
      },
      {
        parameter: 'text',
        validatorMethods: ['validateString', 'validateStopWords']
      }
    ],
    optional: [
      {
        parameter: 'tweet_needed',
        validatorMethods: ['validateInteger']
      }
    ]
  },
  [apiName.twitterDisconnect]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: [
      {
        parameter: 'device_id',
        validatorMethods: ['validateString']
      }
    ]
  },
  [apiName.userSearch]: {
    mandatory: [
      {
        parameter: 'q',
        validatorMethods: ['validateString']
      }
    ],
    optional: [
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      }
    ]
  },
  [apiName.getEmail]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.addDeviceToken]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'user_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'device_id',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'device_kind',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'device_token',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'user_timezone',
        validatorMethods: ['validateNonBlankString']
      }
    ]
  },

  [apiName.getTopupProducts]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'os',
        validatorMethods: ['validateString']
      }
    ],
    optional: []
  },

  [apiName.createTopup]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'response',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'os',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'user_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: []
  },

  [apiName.getPendingTopups]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },

  [apiName.getTopupById]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'payment_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: [
      {
        parameter: 'transaction_id',
        validatorMethods: ['validateString']
      }
    ]
  },

  [apiName.resetBadge]: {
    mandatory: [
      {
        parameter: 'user_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.share]: {
    mandatory: [
      {
        parameter: 'video_id',
        validatorMethods: ['validateInteger']
      }
    ],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.refreshTwitterConnect]: {
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
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.tweetInfo]: {
    mandatory: [
      {
        parameter: 'receiver_user_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.invitedUsersSearch]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: [
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      }
    ]
  },
  [apiName.fetchGoto]: {
    mandatory: [],
    optional: [
      {
        parameter: 'url',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'gotoKind',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'gotoValue',
        validatorMethods: ['validateString']
      }
    ]
  },
  [apiName.reportIssue]: {
    mandatory: [
      {
        parameter: 'app_name',
        validatorMethods: ['validateString']
      }
    ],
    optional: [
      {
        parameter: 'kind',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'error_data',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.activationInitiate]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  }
};

module.exports = v1Signature;
