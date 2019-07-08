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
  },
  [cronProcessConstants.bgJobRabbitmq]: {
    mandatory: [
      {
        parameter: 'topics',
        validatorMethods: ['validateArray']
      },
      {
        parameter: 'queues',
        validatorMethods: ['validateArray']
      },
      {
        parameter: 'prefetchCount',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: []
  }
};

module.exports = cronSignature;
