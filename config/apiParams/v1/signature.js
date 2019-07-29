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
  [apiName.recoveryInfo]: {
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
  [apiName.userActivity]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'user_id',
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
        parameter: 'video_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ]
  },
  [apiName.publicActivity]: {
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
        validatorMethods: ['validateNonBlankGenericUrl']
      }
    ],
    optional: [
      {
        parameter: 'poster_image_url',
        validatorMethods: ['validateNonBlankGenericUrl']
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
      }
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
        validatorMethods: ['validateNonBlankGenericUrl']
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
  }
};

module.exports = v1Signature;
