const rootPrefix = '../../..',
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

const v1Signature = {
  [apiName.signUp]: {
    mandatory: [
      {
        parameter: 'user_name',
        validatorMethods: ['validateString', 'validateUserName']
      },
      {
        parameter: 'first_name',
        validatorMethods: ['validateString', 'validateName']
      },
      {
        parameter: 'last_name',
        validatorMethods: ['validateString', 'validateName']
      },
      {
        parameter: 'password',
        validatorMethods: ['validateString', 'validatePassword']
      }
    ],
    optional: []
  },
  [apiName.login]: {
    mandatory: [
      {
        parameter: 'user_name',
        validatorMethods: ['validateString', 'validateUserName']
      },
      {
        parameter: 'password',
        validatorMethods: ['validateString', 'validatePassword']
      }
    ],
    optional: []
  },
  [apiName.logout]: {
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
  [apiName.recoveryInfo]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.sendDoubleOptIn]: {
    mandatory: [
      {
        parameter: 'pre_launch_invite_obj',
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
    optional: []
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
        validatorMethods: ['validateString']
      },
      {
        parameter: 'link',
        validatorMethods: ['validateString']
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
        validatorMethods: ['validateString', 'validateName']
      },
      {
        parameter: 'user_name',
        validatorMethods: ['validateString', 'validateUserName']
      }
    ],
    optional: [
      {
        parameter: 'bio',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'link',
        validatorMethods: ['validateGenericUrl']
      }
    ]
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
        validatorMethods: ['validateString']
      }
    ]
  },
  [apiName.twitterDisconnect]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
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
  [apiName.adminUserSearch]: {
    mandatory: [],
    optional: [
      {
        parameter: 'includeVideos',
        validatorMethods: ['validateBoolean']
      },
      {
        parameter: 'q',
        validatorMethods: ['validateString']
      },
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      }
    ]
  },
  [apiName.adminUserApprove]: {
    mandatory: [
      {
        parameter: 'user_ids',
        validatorMethods: ['validateArray']
      }
    ],
    optional: []
  },
  [apiName.adminDeleteVideo]: {
    mandatory: [
      {
        parameter: 'video_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'current_admin',
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
  }
};

module.exports = v1Signature;
