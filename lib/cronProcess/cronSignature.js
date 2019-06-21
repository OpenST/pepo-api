const rootPrefix = '../..',
  cronProcessConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName');

const cronSignature = {
  [cronProcessConstants.hookProcesser]: {
    mandatory: [
      {
        parameter: 'user_name',
        validatorMethods: ['validateString', 'validateUserName']
      }
    ],
    optional: []
  },
  [apiName.cronProcessesMonitor]: {
    mandatory: [
      {
        parameter: 'user_name',
        validatorMethods: ['validateString', 'validateUserName']
      }
    ],
    optional: []
  }
};

module.exports = cronSignature;
