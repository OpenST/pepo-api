const rootPrefix = '../../..',
  pageNameConstant = require(rootPrefix + '/lib/globalConstant/pageName'),
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
      params: { userId: ['actorIds', 0] }
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
      params: { userId: ['actorIds', 0] }
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
        body: `{{${headingVarConstant.actorNamePossessive}}} added a new video.`,
        templateVars: [headingVarConstant.actorNamePossessive]
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
  }
};
