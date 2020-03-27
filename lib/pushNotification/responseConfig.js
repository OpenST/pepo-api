const rootPrefix = '../..',
  headingVarConstant = require(rootPrefix + '/lib/globalConstant/headingVar'),
  gotoConstants = require(rootPrefix + '/lib/globalConstant/goto'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/big/notificationHook');

module.exports = {
  [notificationHookConstants.contributionThanksKind]: {
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
  [notificationHookConstants.paperPlaneTransactionKind]: {
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
  [notificationHookConstants.recoveryInitiateKind]: {
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
  [notificationHookConstants.aggregatedTxReceiveSuccessKind]: {
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
  [notificationHookConstants.userMentionInChannelKind]: {
    headings: {
      '1': {
        title: '',
        body: `{{${headingVarConstant.actorName}}} mentioned you in a video in {{${headingVarConstant.channelName}}}`,
        templateVars: [headingVarConstant.actorName, headingVarConstant.channelName]
      }
    },
    payload: {
      videoId: ['payload', 'videoId'],
      channelId: ['payload', 'channelId']
    },
    supportingEntities: {
      userIds: [['actorIds']],
      videoIds: [['payload', 'videoId']],
      channelIds: [['payload', 'channelId']]
    },
    goto: {
      kind: gotoConstants.videoGotoKind,
      params: { videoId: ['payload', 'videoId'] }
    }
  },
  [notificationHookConstants.userMentionKind]: {
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
  [notificationHookConstants.replyUserMentionKind]: {
    headings: {
      '1': {
        title: '',
        body: `{{${headingVarConstant.actorName}}} mentioned you in a reply to {{${
          headingVarConstant.subjectNamePossessive
        }}} video.`,
        templateVars: [headingVarConstant.actorName, headingVarConstant.subjectNamePossessive]
      },
      '2': {
        title: '',
        body: `{{${headingVarConstant.actorName}}} mentioned you in a reply to your video.`,
        templateVars: [headingVarConstant.actorName]
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
  [notificationHookConstants.replyOnYourVideoWithAmountKind]: {
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
  [notificationHookConstants.replyOnYourVideoWithoutAmountKind]: {
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
  [notificationHookConstants.replyThreadNotificationKind]: {
    headings: {
      '1': {
        body: `{{${headingVarConstant.actorName}}} replied to {{${headingVarConstant.subjectNamePossessive}}} video.`,
        templateVars: [headingVarConstant.actorName, headingVarConstant.subjectNamePossessive]
      },
      '2': {
        body: `There is a new reply to {{${headingVarConstant.subjectNamePossessive}}} video.`,
        templateVars: [headingVarConstant.subjectNamePossessive]
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
  [notificationHookConstants.systemNotificationKind]: {
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
  },
  [notificationHookConstants.videoAddInChannelKind]: {
    headings: {
      '1': {
        body: `{{${headingVarConstant.channelName}}} has a new video from {{${headingVarConstant.actorName}}}.`,
        templateVars: [headingVarConstant.channelName, headingVarConstant.actorName]
      }
    },
    payload: {
      channelId: ['payload', 'channelId'],
      videoId: ['payload', 'videoId']
    },
    supportingEntities: {
      userIds: [['actorIds']],
      videoIds: [['payload', 'videoId']],
      channelIds: [['payload', 'channelId']]
    },
    goto: {
      kind: gotoConstants.videoGotoKind,
      params: { videoId: ['payload', 'videoId'] }
    }
  },
  [notificationHookConstants.videoAddSupportersAndChannelMembersKind]: {
    headings: {
      '1': {
        body: `{{${headingVarConstant.actorName}}} posted a new video in {{${headingVarConstant.channelName}}}.`,
        templateVars: [headingVarConstant.actorName, headingVarConstant.channelName]
      }
    },
    payload: {
      channelId: ['payload', 'channelId'],
      videoId: ['payload', 'videoId']
    },
    supportingEntities: {
      userIds: [['actorIds']],
      videoIds: [['payload', 'videoId']],
      channelIds: [['payload', 'channelId']]
    },
    goto: {
      kind: gotoConstants.videoGotoKind,
      params: { videoId: ['payload', 'videoId'] }
    }
  },
  [notificationHookConstants.sessionAuthKind]: {
    headings: {
      '1': {
        body: `Authorize your device`,
        templateVars: []
      }
    },
    image: null,
    payload: {
      sessionAuthPayloadId: ['payload', 'sessionAuthPayloadId']
    },
    supportingEntities: {
      userIds: [['subjectUserId']],
      videoIds: []
    },
    goto: {
      kind: gotoConstants.sessionAuthGotoKind,
      params: { sessionAuthPayloadId: ['payload', 'sessionAuthPayloadId'] }
    }
  },
  [notificationHookConstants.channelGoLiveNotificationKind]: {
    headings: {
      '1': {
        body: `Live Event! {{${headingVarConstant.channelName}}} -- go to Pepo.com on your desktop to join in!`,
        templateVars: [headingVarConstant.channelName]
      }
    },
    image: null,
    payload: {
      channelId: ['payload', 'channelId']
    },
    supportingEntities: {
      userIds: [['actorIds']],
      videoIds: [],
      replyDetailIds: [],
      channelIds: [['payload', 'channelId']]
    },
    goto: {
      kind: gotoConstants.feedGotoKind,
      params: {}
    }
  }
};
