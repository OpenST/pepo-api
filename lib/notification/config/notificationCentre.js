const rootPrefix = '../../..',
  imageVarConstant = require(rootPrefix + '/lib/globalConstant/imageVar'),
  headingVarConstant = require(rootPrefix + '/lib/globalConstant/headingVar'),
  gotoConstants = require(rootPrefix + '/lib/globalConstant/goto'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

module.exports = {
  [userNotificationConstants.profileTxSendSuccessKind]: {
    headings: {
      '1': {
        body: `You gave {{${headingVarConstant.subjectName}}}.`,
        templateVars: [headingVarConstant.subjectName]
      }
    },
    payload: {
      amount: ['payload', 'amount']
    },
    goto: {
      kind: gotoConstants.profileGotoKind,
      params: { userId: ['subjectUserId'] }
    },
    image: imageVarConstant.subjectImage,
    supportingEntities: {
      userIds: [['subjectUserId']],
      videoIds: []
    }
  },
  [userNotificationConstants.profileTxSendFailureKind]: {
    headings: {
      '1': {
        body: `You gave {{${headingVarConstant.subjectName}}}. Transfer Failed.`,
        templateVars: [headingVarConstant.subjectName]
      }
    },
    image: imageVarConstant.subjectImage,
    payload: {
      amount: ['payload', 'amount']
    },
    supportingEntities: {
      userIds: [['subjectUserId']],
      videoIds: []
    },
    goto: {
      kind: gotoConstants.profileGotoKind,
      params: { userId: ['subjectUserId'] }
    }
  },
  [userNotificationConstants.profileTxReceiveSuccessKind]: {
    headings: {
      '1': {
        body: `{{${headingVarConstant.actorName}}} supported you with`,
        templateVars: [headingVarConstant.actorName]
      }
    },
    image: imageVarConstant.actorImage,
    payload: {
      amount: ['payload', 'amount'],
      thankYouFlag: ['thankYouFlag'],
      thankYouUserId: ['actorIds', 0]
    },
    supportingEntities: {
      userIds: [['actorIds']],
      videoIds: []
    },
    goto: {
      kind: gotoConstants.profileGotoKind,
      params: { userId: ['subjectUserId'] }
    }
  },
  [userNotificationConstants.videoTxSendSuccessKind]: {
    headings: {
      '1': {
        body: `You gave {{${headingVarConstant.subjectName}}}.`,
        templateVars: [headingVarConstant.subjectName]
      }
    },
    image: imageVarConstant.subjectImage,
    payload: {
      amount: ['payload', 'amount']
    },
    supportingEntities: {
      userIds: [['subjectUserId']],
      videoIds: []
    },
    goto: {
      kind: gotoConstants.profileGotoKind,
      params: { userId: ['subjectUserId'] }
    }
  },
  [userNotificationConstants.videoTxSendFailureKind]: {
    headings: {
      '1': {
        body: `You gave {{${headingVarConstant.subjectName}}}. Transfer Failed.`,
        templateVars: [headingVarConstant.subjectName]
      }
    },
    image: imageVarConstant.subjectImage,
    payload: {
      amount: ['payload', 'amount']
    },
    supportingEntities: {
      userIds: [['subjectUserId']],
      videoIds: []
    },
    goto: {
      kind: gotoConstants.profileGotoKind,
      params: { userId: ['subjectUserId'] }
    }
  },
  [userNotificationConstants.videoTxReceiveSuccessKind]: {
    headings: {
      '1': {
        body: `{{${headingVarConstant.actorName}}} supported you with`,
        templateVars: [headingVarConstant.actorName]
      }
    },
    image: imageVarConstant.actorImage,
    payload: {
      amount: ['payload', 'amount'],
      thankYouFlag: ['thankYouFlag'],
      thankYouUserId: ['actorIds', 0]
    },
    supportingEntities: {
      userIds: [['actorIds']],
      videoIds: []
    },
    goto: {
      kind: gotoConstants.profileGotoKind,
      params: { userId: ['subjectUserId'] }
    }
  },
  [userNotificationConstants.contributionThanksKind]: {
    headings: {
      '1': {
        body: `{{${headingVarConstant.actorName}}} sent you a message`,
        templateVars: [headingVarConstant.actorName]
      }
    },
    image: imageVarConstant.actorImage,
    payload: {
      thankYouText: ['payload', 'thankYouText']
    },
    goto: {
      kind: gotoConstants.profileGotoKind,
      params: { userId: ['actorIds', 0] }
    },
    supportingEntities: {
      userIds: [['actorIds']],
      videoIds: []
    }
  },
  [userNotificationConstants.airdropDoneKind]: {
    headings: {
      '1': {
        body: `Welcome to Pepo! You just received {{${headingVarConstant.payloadAmount}}} free Pepo Coins.`,
        templateVars: [headingVarConstant.payloadAmount]
      }
    },
    image: imageVarConstant.subjectImage,
    payload: {
      amount: ['payload', 'amount']
    },
    supportingEntities: {
      userIds: [['subjectUserId']],
      videoIds: []
    },
    goto: {
      kind: gotoConstants.feedGotoKind,
      params: {}
    }
  },
  [userNotificationConstants.topupDoneKind]: {
    headings: {
      '1': {
        body: `Your account is recharged with `,
        templateVars: []
      }
    },
    image: imageVarConstant.subjectImage,
    payload: {
      amount: ['payload', 'amount']
    },
    supportingEntities: {
      userIds: [['subjectUserId']],
      videoIds: []
    },
    goto: {
      kind: gotoConstants.feedGotoKind,
      params: {}
    }
  },
  [userNotificationConstants.topupFailedKind]: {
    headings: {
      '1': {
        body: `Your Top-up transaction of {{${headingVarConstant.payloadAmount}}} pepo coins is failed.`,
        templateVars: [headingVarConstant.payloadAmount]
      }
    },
    image: imageVarConstant.subjectImage,
    payload: {
      amount: ['payload', 'amount']
    },
    supportingEntities: {
      userIds: [['subjectUserId']],
      videoIds: []
    },
    goto: {
      kind: gotoConstants.feedGotoKind,
      params: {}
    }
  },
  [userNotificationConstants.videoAddKind]: {
    headings: {
      '1': {
        body: `{{${headingVarConstant.actorName}}} added a new video.`,
        templateVars: [headingVarConstant.actorName]
      }
    },
    image: imageVarConstant.actorImage,
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
  [userNotificationConstants.recoveryInitiateKind]: {
    headings: {
      '1': {
        body: `Looks like there is a wallet recovery attempt from a new device. If this wasn't you, contact us on support@pepo.com to abort this recovery attempt.`,
        templateVars: []
      }
    },
    image: null,
    payload: {},
    supportingEntities: {
      userIds: [],
      videoIds: []
    },
    goto: {}
  },
  [userNotificationConstants.creditPepocornSuccessKind]: {
    headings: {
      '1': {
        body: `You purchased {{${headingVarConstant.payloadPepocornAmount}}} Unicorns.`,
        templateVars: [headingVarConstant.payloadPepocornAmount]
      },
      '2': {
        body: `You purchased {{${headingVarConstant.payloadPepocornAmount}}} Unicorn.`,
        templateVars: [headingVarConstant.payloadPepocornAmount]
      }
    },
    image: imageVarConstant.subjectImage,
    payload: {
      pepocornAmount: ['payload', 'pepocornAmount']
    },
    supportingEntities: {
      userIds: [['subjectUserId']],
      videoIds: []
    },
    goto: {
      kind: gotoConstants.storeGotoKind,
      params: {}
    }
  },
  [userNotificationConstants.creditPepocornFailureKind]: {
    headings: {
      '1': {
        body: `Your purchase of {{${headingVarConstant.payloadPepocornAmount}}} Unicorns has failed.`,
        templateVars: [headingVarConstant.payloadPepocornAmount]
      },
      '2': {
        body: `Your purchase of {{${headingVarConstant.payloadPepocornAmount}}} Unicorn has failed.`,
        templateVars: [headingVarConstant.payloadPepocornAmount]
      }
    },
    image: imageVarConstant.subjectImage,
    payload: {
      pepocornAmount: ['payload', 'pepocornAmount']
    },
    supportingEntities: {
      userIds: [['subjectUserId']],
      videoIds: []
    },
    goto: {
      kind: gotoConstants.storeGotoKind,
      params: {}
    }
  },
  [userNotificationConstants.userMentionKind]: {
    headings: {
      '1': {
        body: `{{${headingVarConstant.actorName}}} mentioned you in a video.`,
        templateVars: [headingVarConstant.actorName]
      }
    },
    image: imageVarConstant.actorImage,
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
  [userNotificationConstants.replyUserMentionKind]: {
    headings: {
      '1': {
        body: `{{${headingVarConstant.actorName}}} mentioned you in a reply to {{${
          headingVarConstant.subjectNamePossessive
        }}} video.`,
        templateVars: [headingVarConstant.actorName, headingVarConstant.subjectNamePossessive]
      },
      '2': {
        body: `{{${headingVarConstant.actorName}}} mentioned you in a reply to your video.`,
        templateVars: [headingVarConstant.actorName]
      }
    },
    image: imageVarConstant.actorImage,
    payload: {
      replyDetailId: ['payload', 'replyDetailId'],
      videoId: ['payload', 'videoId']
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
  [userNotificationConstants.replySenderWithAmountKind]: {
    headings: {
      '1': {
        body: `You replied to {{${headingVarConstant.subjectNamePossessive}}} video.`,
        templateVars: [headingVarConstant.subjectNamePossessive]
      }
    },
    image: imageVarConstant.subjectImage,
    payload: {
      replyDetailId: ['payload', 'replyDetailId'],
      videoId: ['payload', 'videoId'],
      amount: ['payload', 'amount']
    },
    supportingEntities: {
      userIds: [['subjectUserId'], ['actorIds']],
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
  [userNotificationConstants.replySenderWithoutAmountKind]: {
    headings: {
      '1': {
        body: `You replied to {{${headingVarConstant.subjectNamePossessive}}} video.`,
        templateVars: [headingVarConstant.subjectNamePossessive]
      }
    },
    image: imageVarConstant.subjectImage,
    payload: {
      replyDetailId: ['payload', 'replyDetailId'],
      videoId: ['payload', 'videoId']
    },
    supportingEntities: {
      userIds: [['subjectUserId'], ['actorIds']],
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
  [userNotificationConstants.replyReceiverWithAmountKind]: {
    headings: {
      '1': {
        body: `{{${headingVarConstant.actorName}}} replied to your video.`,
        templateVars: [headingVarConstant.actorName, headingVarConstant.payloadAmount]
      }
    },
    image: imageVarConstant.actorImage,
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
  [userNotificationConstants.replyReceiverWithoutAmountKind]: {
    headings: {
      '1': {
        body: `{{${headingVarConstant.actorName}}} replied to your video.`,
        templateVars: [headingVarConstant.actorName]
      }
    },
    image: imageVarConstant.actorImage,
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
  [userNotificationConstants.replyThreadNotificationKind]: {
    headings: {
      '1': {
        body: `{{${headingVarConstant.actorName}}} replied to a video you followed.`,
        templateVars: [headingVarConstant.actorName]
      }
    },
    image: imageVarConstant.actorImage,
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
  [userNotificationConstants.systemNotificationKind]: {
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
