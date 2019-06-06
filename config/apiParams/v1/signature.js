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
  }
};

module.exports = v1Signature;
