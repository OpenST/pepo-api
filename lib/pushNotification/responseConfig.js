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
        body: `{{${headingVarConstant.actorName}}} mentioned you in a video.`,
        templateVars: [headingVarConstant.actorName]
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
  [notificationHookConstant.replyUserMentionKind]: {
    headings: {
      '1': {
        title: '',
        body: `{{${headingVarConstant.actorName}}} mentioned you in a reply to {{${
          headingVarConstant.subjectNamePossessive
        }}} video.`,
        templateVars: [headingVarConstant.actorName, headingVarConstant.subjectNamePossessive]
      }
    },
    payload: {
      replyDetailId: ['payload', 'replyDetailId']
    },
    supportingEntities: {
      userIds: [['actorIds'], ['subjectUserId']],
      videoIds: [['payload', 'videoId']]
    },
    goto: {
      kind: gotoConstants.replyGotoKind,
      params: {
        replyDetailId: ['payload', 'replyDetailId'],
        parentVideoId: ['payload', 'parentVideoId']
      }
    }
  },
  [notificationHookConstant.replyReceiverWithAmountKind]: {
    headings: {
      '1': {
        body: `{{${headingVarConstant.actorName}}} replied to your video.`,
        templateVars: [headingVarConstant.actorName]
      }
    },
    payload: {
      replyDetailId: ['payload', 'replyDetailId'],
      videoId: ['payload', 'videoId'],
      amount: ['payload', 'amount']
    },
    supportingEntities: {
      userIds: [['actorIds']],
      videoIds: [['payload', 'videoId']]
    },
    goto: {
      kind: gotoConstants.replyGotoKind,
      params: {
        replyDetailId: ['payload', 'replyDetailId'],
        parentVideoId: ['payload', 'parentVideoId']
      }
    }
  },
  [notificationHookConstant.replyReceiverWithoutAmountKind]: {
    headings: {
      '1': {
        body: `{{${headingVarConstant.actorName}}} replied to your video.`,
        templateVars: [headingVarConstant.actorName]
      }
    },
    payload: {
      replyDetailId: ['payload', 'replyDetailId'],
      videoId: ['payload', 'videoId']
    },
    supportingEntities: {
      userIds: [['actorIds']],
      videoIds: [['payload', 'videoId']]
    },
    goto: {
      kind: gotoConstants.replyGotoKind,
      params: {
        replyDetailId: ['payload', 'replyDetailId'],
        parentVideoId: ['payload', 'parentVideoId']
      }
    }
  },
  [notificationHookConstant.replyThreadNotificationKind]: {
    headings: {
      '1': {
        body: `{{${headingVarConstant.actorName}}} replied to {{${headingVarConstant.subjectNamePossessive}}} video.`,
        templateVars: [headingVarConstant.actorName, headingVarConstant.subjectNamePossessive]
      }
    },
    payload: {
      replyDetailId: ['payload', 'replyDetailId'],
      videoId: ['payload', 'videoId']
    },
    supportingEntities: {
      userIds: [['actorIds'], ['subjectUserId']],
      videoIds: [['payload', 'videoId']],
      replyDetailIds: [['payload', 'replyDetailId']]
    },
    goto: {
      kind: gotoConstants.replyGotoKind,
      params: {
        replyDetailId: ['payload', 'replyDetailId'],
        parentVideoId: ['payload', 'parentVideoId']
      }
    }
  },
  [notificationHookConstant.systemNotificationKind]: {
    headings: {
      '1': {
        body: `{{${headingVarConstant.dynamicText}}}`,
        templateVars: [headingVarConstant.dynamicText]
      }
    },
    image: null,
    payload: {
      dynamicText: ['payload', 'dynamicText']
    },
    supportingEntities: {
      userIds: [['subjectUserId']],
      videoIds: []
    },
    goto: {}
  }
};
