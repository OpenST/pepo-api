const rootPrefix = '../..',
  pageNameConstant = require(rootPrefix + '/lib/globalConstant/pageName'),
  headingVarConstant = require(rootPrefix + '/lib/globalConstant/headingVar'),
  notificationHookConstant = require(rootPrefix + '/lib/globalConstant/notificationHook');

module.exports = {
  [notificationHookConstant.contributionThanksKind]: {
    heading: {
      title: `{{${headingVarConstant.actorName}}} appreciates your support. \n " {{${
        headingVarConstant.thankYouText
      }}} "`,
      templateVars: [headingVarConstant.actorName, headingVarConstant.thankYouText]
    },
    supportingEntities: {
      userIds: [['actorIds'], ['subjectUserId']],
      videoIds: []
    },
    payload: {
      thankYouText: ['payload', 'thankYouText']
    },
    android: {
      collapse_key: ['title'],
      notification: {
        tag: ['title']
      }
    },
    goto: {
      pn: pageNameConstant.notificationCentrePageName,
      v: {}
    }
  },
  [notificationHookConstant.topupDoneKind]: {
    heading: {
      title: `Your Top-up transaction of {{${headingVarConstant.amount}}} pepo coins is complete.`,
      templateVars: [headingVarConstant.amount]
    },
    supportingEntities: {
      userIds: [],
      videoIds: [],
      amount: ['payload', 'amount']
    },
    android: {
      collapse_key: ['title'],
      notification: {
        tag: ['title']
      }
    },
    goto: {
      pn: pageNameConstant.feedPageName,
      v: {}
    }
  },
  [notificationHookConstant.topupFailedKind]: {
    heading: {
      title: `Your Top-up transaction of {{${headingVarConstant.payloadAmount}}} pepo coins is failed.`,
      templateVars: [headingVarConstant.payloadAmount]
    },
    supportingEntities: {
      userIds: [],
      videoIds: [],
      amount: ['payload', 'amount']
    },
    android: {
      collapse_key: ['title'],
      notification: {
        tag: ['title']
      }
    },
    goto: {
      pn: pageNameConstant.feedPageName,
      v: {}
    }
  },
  [notificationHookConstant.paperPlaneTransactionKind]: {
    heading: {
      title: `{{${headingVarConstant.actorName}}} supported you with {{${headingVarConstant.payloadAmount}}} pepos.`,
      templateVars: [headingVarConstant.actorName, headingVarConstant.payloadAmount]
    },
    supportingEntities: {
      userIds: [['actorIds'], ['subjectUserId']],
      videoIds: []
    },
    payload: {
      amount: ['payload', 'amount']
    },
    android: {
      collapse_key: ['title'],
      notification: {
        tag: ['title']
      }
    },
    goto: {
      pn: pageNameConstant.notificationCentrePageName,
      v: {}
    }
  },
  [notificationHookConstant.recoveryInitiateKind]: {
    heading: {
      title: `Recovery of your wallet has been initiated.`,
      templateVars: []
    },
    supportingEntities: {
      userIds: [],
      videoIds: []
    },
    android: {
      collapse_key: ['title'],
      notification: {
        tag: ['title']
      }
    },
    goto: {
      pn: pageNameConstant.notificationCentrePageName,
      v: {}
    }
  },
  [notificationHookConstant.aggregatedTxReceiveSuccessKind]: {
    heading: {
      title: `You received {{${headingVarConstant.amount}}} pepos today from {{${
        headingVarConstant.actorName
      }}} people`,
      templateVars: [headingVarConstant.amount, headingVarConstant.actorName]
    },
    supportingEntities: {
      userIds: [],
      videoIds: []
    },
    payload: {
      amount: ['payload', 'amount']
    },
    android: {
      collapse_key: ['title'],
      notification: {
        tag: ['title']
      }
    },
    goto: {
      pn: pageNameConstant.notificationCentrePageName,
      v: {}
    }
  }
};
