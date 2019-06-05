'use strict';

const rootPrefix = '../../..',
  apiName = require(rootPrefix + '/lib/globalConstant/apiName');
const v1Signature = {
  [apiName.signup]: {
    mandatory: [
      {
        parameter: 'email',
        validatorMethod: 'validatePasswordString'
      },
      {
        parameter: 'password',
        validatorMethod: 'validatePasswordString'
      }
    ],
    optional: []
  }
};

module.exports = v1Signature;
