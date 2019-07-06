const rootPrefix = '../..',
  cronProcessConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses');

const cronSignature = {
  [cronProcessConstants.emailServiceApiCallHookProcessor]: {
    mandatory: [],
    optional: []
  },
  [cronProcessConstants.cronProcessesMonitor]: {
    mandatory: [
      {
        parameter: 'ncbhjc',
        validatorMethods: ['validateString']
      }
    ],
    optional: []
  }
};

module.exports = cronSignature;
