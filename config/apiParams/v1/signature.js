'use strict';

const rootPrefix = '../../..',
  apiName = require(rootPrefix + '/lib/globalConstant/apiName');
const v1Signature = {
  [apiName.signup]: {
    mandatory: [
      {
        parameter: 'user_name',
        validatorMethods: ['validateAlphaNumericString']
      },
      {
        parameter: 'password',
        validatorMethods: ['validatePasswordString']
      }
    ],
    optional: []
  }
};

module.exports = v1Signature;
