const rootPrefix = '../..',
  headingVarConstant = require(rootPrefix + '/lib/globalConstant/headingVar'),
  gotoConstants = require(rootPrefix + '/lib/globalConstant/goto'),
  notificationHookConstant = require(rootPrefix + '/lib/globalConstant/notificationHook');

module.exports = {
  [notificationHookConstant.contributionThanksKind]: {
    headings: {
      '1': {
        title: '',
        body: `{{${headingVarConstant.actorName}}} sent you a message. \n " {{${headingVarConstant.thankYouText}}} "`,
        templateVars: [headingVarConstant.actorName, headingVarConstant.thankYouText]
      }
    },
    supportingEntities: {
      userIds: [['actorIds']],
      videoIds: []
    },
    payload: {
      thankYouText: ['payload', 'thankYouText']
    },
    android: {
      collapse_key: ['body'],
      notification: {
        tag: ['body'],
        sound: 'default'
      }
    },
    goto: {
      kind: gotoConstants.notificationCentreGotoKind,
      params: {}
    }
  },
  [notificationHookConstant.paperPlaneTransactionKind]: {
    headings: {
      '1': {
        title: '',
        body: `{{${headingVarConstant.actorName}}} supported you with {{${headingVarConstant.payloadAmount}}} pepos.`,
        templateVars: [headingVarConstant.actorName, headingVarConstant.payloadAmount]
      },
      '2': {
        title: '',
        body: `{{${headingVarConstant.actorName}}} supported you with {{${headingVarConstant.payloadAmount}}} pepo.`,
        templateVars: [headingVarConstant.actorName, headingVarConstant.payloadAmount]
      }
    },
    supportingEntities: {
      userIds: [['actorIds']],
      videoIds: []
    },
    payload: {
      amount: ['payload', 'amount']
    },
    android: {
      collapse_key: ['body'],
      notification: {
        tag: ['body'],
        sound: 'default'
      }
    },
    goto: {
      kind: gotoConstants.notificationCentreGotoKind,
      params: {}
    }
  },
  [notificationHookConstant.recoveryInitiateKind]: {
    headings: {
      '1': {
        title: 'Security Alert',
        body:
          'A recovery attempt was initiated on your account.If this was not you please go to Profile > Settings >Abort Recovery.',
        templateVars: []
      }
    },
    payload: {},
    supportingEntities: {
      userIds: [],
      videoIds: []
    },
    android: {
      collapse_key: ['body'],
      notification: {
        tag: ['body'],
        sound: 'default'
      }
    },
    goto: {
      kind: gotoConstants.notificationCentreGotoKind,
      params: {}
    }
  },
  [notificationHookConstant.aggregatedTxReceiveSuccessKind]: {
    headings: {
      '1': {
        title: '',
        body: `You received {{${headingVarConstant.payloadAmountInEth}}} pepo coins today from {{${
          headingVarConstant.aggregatedActorCount
        }}} people`,
        templateVars: [headingVarConstant.payloadAmountInEth, headingVarConstant.aggregatedActorCount]
      },
      '2': {
        title: '',
        body: `You received {{${headingVarConstant.payloadAmountInEth}}} pepo coins today from {{${
          headingVarConstant.aggregatedActorCount
        }}} person`,
        templateVars: [headingVarConstant.payloadAmountInEth, headingVarConstant.aggregatedActorCount]
      },
      '3': {
        title: '',
        body: `You received {{${headingVarConstant.payloadAmountInEth}}} pepo coin today from {{${
          headingVarConstant.aggregatedActorCount
        }}} person`,
        templateVars: [headingVarConstant.payloadAmountInEth, headingVarConstant.aggregatedActorCount]
      },
      '4': {
        title: '',
        body: `You received {{${headingVarConstant.payloadAmountInEth}}} pepo coin today from {{${
          headingVarConstant.aggregatedActorCount
        }}} people`,
        templateVars: [headingVarConstant.payloadAmountInEth, headingVarConstant.aggregatedActorCount]
      }
    },
    payload: {
      amountInEth: ['payload', 'amountInEth']
    },
    supportingEntities: {
      userIds: [['actorIds']],
      videoIds: []
    },
    android: {
      collapse_key: ['body'],
      notification: {
        tag: ['body'],
        sound: 'default'
      }
    },
    goto: {
      kind: gotoConstants.notificationCentreGotoKind,
      params: {}
    }
  },
  [notificationHookConstant.userMentionKind]: {
    headings: {
      '1': {
        title: '',
        body: `{{${headingVarConstant.actorNamePossessive}}} mentioned you in a video.`,
        templateVars: [headingVarConstant.actorNamePossessive]
      }
    },
    payload: {
      videoId: ['payload', 'videoId']
    },
    supportingEntities: {
      userIds: [['actorIds']],
      videoIds: [['payload', 'videoId']]
    },
    goto: {
      kind: gotoConstants.videoGotoKind,
      params: { videoId: ['payload', 'videoId'] }
    }
  },
  [notificationHookConstant.replySenderWithAmountKind]: {
    headings: {
      '1': {
        title: '',
        body: `You replied to {{${headingVarConstant.actorNamePossessive}}} video. {{${
          headingVarConstant.payloadAmount
        }}}`,
        templateVars: [headingVarConstant.actorNamePossessive, headingVarConstant.payloadAmount]
      }
    },
    payload: {
      replyDetailId: ['payload', 'replyDetailId'],
      amount: ['payload', 'amount']
    },
    supportingEntities: {
      userIds: [['actorIds']],
      replyDetailIds: [['payload', 'replyDetailId']]
    },
    goto: {
      kind: gotoConstants.videoGotoKind,
      params: { replyDetailId: ['payload', 'replyDetailId'] }
    }
  },
  [notificationHookConstant.replySenderWithoutAmountKind]: {
    headings: {
      '1': {
        title: '',
        body: `You replied to {{${headingVarConstant.actorNamePossessive}}} video.`,
        templateVars: [headingVarConstant.actorNamePossessive]
      }
    },
    payload: {
      replyDetailId: ['payload', 'replyDetailId']
    },
    supportingEntities: {
      userIds: [['actorIds']],
      replyDetailIds: [['payload', 'replyDetailId']]
    },
    goto: {
      kind: gotoConstants.videoGotoKind,
      params: { replyDetailId: ['payload', 'replyDetailId'] }
    }
  }
};
