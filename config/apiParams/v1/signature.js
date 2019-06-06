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
  }
};

module.exports = v1Signature;
