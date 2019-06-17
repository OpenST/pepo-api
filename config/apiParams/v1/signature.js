const rootPrefix = '../../..',
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

const v1Signature = {
  [apiName.signUp]: {
    mandatory: [
      {
        parameter: 'user_name',
        validatorMethods: [
          'validateString',
          'validateAlphaNumericCommonSpecialCharString',
          'validateMaxLengthMediumString'
        ]
      },
      {
        parameter: 'first_name',
        validatorMethods: ['validateString', 'validateMaxLengthMediumString']
      },
      {
        parameter: 'last_name',
        validatorMethods: ['validateString', 'validateMaxLengthMediumString']
      },
      {
        parameter: 'password',
        validatorMethods: ['validateString', 'validateMaxLengthMediumString']
      }
    ],
    optional: []
  },
  [apiName.login]: {
    mandatory: [
      {
        parameter: 'user_name',
        validatorMethods: [
          'validateString',
          'validateAlphaNumericCommonSpecialCharString',
          'validateMaxLengthMediumString'
        ]
      },
      {
        parameter: 'password',
        validatorMethods: ['validateString', 'validateMaxLengthMediumString']
      }
    ],
    optional: []
  },
  [apiName.recoveryInfo]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateObject']
      }
    ],
    optional: []
  },
  [apiName.registerDevice]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateObject']
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
  [apiName.users]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateObject']
      }
    ],
    optional: [
      {
        parameter: 'limit',
        validatorMethods: ['validateNonZeroInteger']
      },
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
        validatorMethods: ['validateObject']
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
        parameter: 'page_number',
        validatorMethods: ['validateNonZeroInteger']
      }
    ]
  },
  [apiName.userFeed]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateObject']
      },
      {
        parameter: 'user_id',
        validatorMethods: ['validateInteger']
      }
    ],
    optional: [
      {
        parameter: 'limit',
        validatorMethods: ['validateNonZeroInteger']
      },
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
        validatorMethods: ['validateObject']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateObject']
      },
      {
        parameter: 'privacy_type',
        validatorMethods: ['validateString', 'validateFeedPrivacyType']
      }
    ],
    optional: [
      {
        parameter: 'meta',
        validatorMethods: ['validateObject', 'validateOstTransactionMeta']
      }
    ]
  },
  [apiName.publicFeed]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateObject']
      }
    ],
    optional: [
      {
        parameter: 'limit',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString']
      }
    ]
  }
};

module.exports = v1Signature;
