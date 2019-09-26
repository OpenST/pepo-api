const rootPrefix = '../..',
  pageNameConstant = require(rootPrefix + '/lib/globalConstant/pageName'),
  headingVarConstant = require(rootPrefix + '/lib/globalConstant/headingVar'),
  gotoConstants = require(rootPrefix + '/lib/globalConstant/goto'),
  notificationHookConstant = require(rootPrefix + '/lib/globalConstant/notificationHook');

module.exports = {
  [notificationHookConstant.contributionThanksKind]: {
    heading: {
      title: `{{${headingVarConstant.actorName}}} sent you a message. \n " {{${headingVarConstant.thankYouText}}} "`,
      templateVars: [headingVarConstant.actorName, headingVarConstant.thankYouText]
    },
    supportingEntities: {
      userIds: [['actorIds']],
      videoIds: []
    },
    payload: {
      thankYouText: ['payload', 'thankYouText']
    },
    android: {
      collapse_key: ['title'],
      notification: {
        tag: ['title'],
        sound: 'default'
      }
    },
    goto: {
      kind: gotoConstants.notificationCentreGotoKind,
      params: {}
    }
  },
  [notificationHookConstant.paperPlaneTransactionKind]: {
    heading: {
      title: `{{${headingVarConstant.actorName}}} supported you with {{${headingVarConstant.payloadAmount}}}`,
      templateVars: [headingVarConstant.actorName, headingVarConstant.payloadAmount]
    },
    supportingEntities: {
      userIds: [['actorIds']],
      videoIds: []
    },
    payload: {
      amount: ['payload', 'amount']
    },
    android: {
      collapse_key: ['title'],
      notification: {
        tag: ['title'],
        sound: 'default'
      }
    },
    goto: {
      kind: gotoConstants.notificationCentreGotoKind,
      params: {}
    }
  },
  [notificationHookConstant.recoveryInitiateKind]: {
    heading: {
      title:
        'A recovery attempt was initiated on your account.If this was not you please go to Profile > Settings >Abort Recovery.',
      templateVars: []
    },
    payload: {},
    supportingEntities: {
      userIds: [],
      videoIds: []
    },
    android: {
      collapse_key: ['title'],
      notification: {
        tag: ['title'],
        sound: 'default'
      }
    },
    goto: {
      kind: gotoConstants.notificationCentreGotoKind,
      params: {}
    }
  },
  [notificationHookConstant.aggregatedTxReceiveSuccessKind]: {
    heading: {
      title: `You received {{${headingVarConstant.payloadAmountInEth}}} pepo coins today from {{${
        headingVarConstant.aggregatedActorCount
      }}} people`,
      templateVars: [headingVarConstant.payloadAmountInEth, headingVarConstant.aggregatedActorCount]
    },
    payload: {
      amountInEth: ['payload', 'amountInEth']
    },
    supportingEntities: {
      userIds: [['actorIds']],
      videoIds: []
    },
    android: {
      collapse_key: ['title'],
      notification: {
        tag: ['title'],
        sound: 'default'
      }
    },
    goto: {
      kind: gotoConstants.notificationCentreGotoKind,
      params: {}
    }
  }
};
