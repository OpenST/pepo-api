const rootPrefix = '../..',
  cronProcessConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses');

const cronSignature = {
  [cronProcessConstants.hookProcesser]: {
    mandatory: [
      {
        parameter: 'abcd',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'sequenceNumber',
        validatorMethods: ['validateInteger']
      }
    ],
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
