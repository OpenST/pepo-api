const rootPrefix = '../..',
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/big/cronProcesses');

const cronSignature = {
  [cronProcessesConstants.emailServiceApiCallHookProcessor]: {
    mandatory: [
      {
        parameter: 'sequenceNumber',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: []
  },
  [cronProcessesConstants.cronProcessesMonitor]: {
    mandatory: [],
    optional: []
  },
  [cronProcessesConstants.bgJobProcessor]: {
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
  [cronProcessesConstants.notificationJobProcessor]: {
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
  [cronProcessesConstants.webhookJobPreProcessor]: {
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
  [cronProcessesConstants.pixelJobProcessor]: {
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
  [cronProcessesConstants.pepoMobileEventJobProcessor]: {
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
  [cronProcessesConstants.socketJobProcessor]: {
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
  [cronProcessesConstants.pushNotificationHookProcessor]: {
    mandatory: [
      {
        parameter: 'sequenceNumber',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: []
  },
  [cronProcessesConstants.pushNotificationAggregator]: {
    mandatory: [],
    optional: []
  },
  [cronProcessesConstants.webhookProcessor]: {
    mandatory: [],
    optional: []
  },
  [cronProcessesConstants.userSocketConnArchival]: {
    mandatory: [],
    optional: []
  },
  [cronProcessesConstants.retryPendingReceiptValidation]: {
    mandatory: [],
    optional: []
  },
  [cronProcessesConstants.cdnCacheInvalidationProcessor]: {
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
  [cronProcessesConstants.reValidateAllReceipts]: {
    mandatory: [],
    optional: []
  },
  [cronProcessesConstants.monitorOstEventHooks]: {
    mandatory: [],
    optional: []
  },
  [cronProcessesConstants.populatePopularityCriteria]: {
    mandatory: [],
    optional: []
  },
  [cronProcessesConstants.populateUserData]: {
    mandatory: [],
    optional: []
  }
};

module.exports = cronSignature;
