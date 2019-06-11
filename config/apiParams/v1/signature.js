'use strict';

const rootPrefix = '../../..',
  pagination = require(rootPrefix + '/lib/globalConstant/pagination'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName');
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
        parameter: pagination.paginationIdentifierKey,
        validatorMethods: ['validateString']
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
  [apiName.gifs]: {
    mandatory: [
      {
        parameter: 'query',
        validatorMethods: ['validateString']
      }
    ],
    optional: [
      {
        parameter: 'page_number',
        validatorMethods: ['validateNonZeroInteger']
      }
    ]
  }
};

module.exports = v1Signature;
