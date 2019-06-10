'use strict';

const rootPrefix = '../../..',
  apiName = require(rootPrefix + '/lib/globalConstant/apiName');
const v1Signature = {
  [apiName.signUp]: {
    mandatory: [
      {
        parameter: 'user_name',
        validatorMethods: [
          'validateString',
          'validateAlphaNumericCommonSpecailCharString',
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
          'validateAlphaNumericCommonSpecailCharString',
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
  }
};

module.exports = v1Signature;
