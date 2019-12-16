const rootPrefix = '../..',
  cronProcessConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses');

const cronSignature = {
  [cronProcessConstants.emailServiceApiCallHookProcessor]: {
    mandatory: [
      {
        parameter: 'sequenceNumber',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: []
  },
  [cronProcessConstants.cronProcessesMonitor]: {
    mandatory: [],
    optional: []
  },
  [cronProcessConstants.bgJobProcessor]: {
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
  },
  [cronProcessConstants.notificationJobProcessor]: {
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
  },
  [cronProcessConstants.pepoMobileEventJobProcessor]: {
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
  },
  [cronProcessConstants.socketJobProcessor]: {
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
  },
  [cronProcessConstants.pushNotificationHookProcessor]: {
    mandatory: [
      {
        parameter: 'sequenceNumber',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: []
  },
  [cronProcessConstants.pushNotificationAggregator]: {
    mandatory: [],
    optional: []
  },
  [cronProcessConstants.userSocketConnArchival]: {
    mandatory: [],
    optional: []
  },
  [cronProcessConstants.retryPendingReceiptValidation]: {
    mandatory: [],
    optional: []
  },
  [cronProcessConstants.cdnCacheInvalidationProcessor]: {
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
  },
  [cronProcessConstants.reValidateAllReceipts]: {
    mandatory: [],
    optional: []
  },
  [cronProcessConstants.monitorOstEventHooks]: {
    mandatory: [],
    optional: []
  }
};

module.exports = cronSignature;
