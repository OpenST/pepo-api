const rootPrefix = '../../..',
  pageNameConstant = require(rootPrefix + '/lib/globalConstant/pageName'),
  imageVarConstant = require(rootPrefix + '/lib/globalConstant/imageVar'),
  headingVarConstant = require(rootPrefix + '/lib/globalConstant/headingVar'),
  userNotificationConstant = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

module.exports = {
  [userNotificationConstant.profileTxSendSuccessKind]: {
    headings: {
      '1': {
        title: `You gave {{${headingVarConstant.subjectName}}}.`,
        templateVars: [headingVarConstant.subjectName]
      }
    },
    payload: {
      amount: ['payload', 'amount']
    },
    goto: {
      pn: pageNameConstant.profilePageName,
      v: {
        [pageNameConstant.profileUserIdParam]: ['subjectUserId']
      }
    },
    image: imageVarConstant.subjectImage,
    supportingEntities: {
      userIds: [['subjectUserId']],
      videoIds: []
    }
  },
  [userNotificationConstant.profileTxSendFailureKind]: {
    headings: {
      '1': {
        title: `You gave {{${headingVarConstant.subjectName}}}. Transfer Failed.`,
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
      pn: pageNameConstant.profilePageName,
      v: {
        [pageNameConstant.profileUserIdParam]: ['subjectUserId']
      }
    }
  },
  [userNotificationConstant.profileTxReceiveSuccessKind]: {
    headings: {
      '1': {
        title: `{{${headingVarConstant.actorName}}} supported you.`,
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
      pn: pageNameConstant.contributedByPageName,
      v: {
        [pageNameConstant.profileUserIdParam]: ['subjectUserId']
      }
    }
  },
  [userNotificationConstant.videoTxSendSuccessKind]: {
    headings: {
      '1': {
        title: `You gave {{${headingVarConstant.subjectName}}}.`,
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
      pn: pageNameConstant.profilePageName,
      v: {
        [pageNameConstant.profileUserIdParam]: ['subjectUserId']
      }
    }
  },
  [userNotificationConstant.videoTxSendFailureKind]: {
    headings: {
      '1': {
        title: `You gave {{${headingVarConstant.subjectName}}}. Transfer Failed.`,
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
      pn: pageNameConstant.profilePageName,
      v: {
        [pageNameConstant.profileUserIdParam]: ['subjectUserId']
      }
    }
  },
  [userNotificationConstant.videoTxReceiveSuccessKind]: {
    headings: {
      '1': {
        title: `{{${headingVarConstant.actorName}}} supported you.`,
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
      pn: pageNameConstant.contributedByPageName,
      v: {
        [pageNameConstant.profileUserIdParam]: ['subjectUserId']
      }
    }
  },
  [userNotificationConstant.contributionThanksKind]: {
    headings: {
      '1': {
        title: `{{${headingVarConstant.actorName}}} appreciates your support.`,
        templateVars: [headingVarConstant.actorName]
      }
    },
    image: imageVarConstant.actorImage,
    payload: {
      thankYouText: ['payload', 'thankYouText']
    },
    goto: {
      pn: pageNameConstant.profilePageName,
      v: {
        [pageNameConstant.profileUserIdParam]: ['actorIds', 0]
      }
    },
    supportingEntities: {
      userIds: [['actorIds']],
      videoIds: []
    }
  },
  [userNotificationConstant.airdropDoneKind]: {
    headings: {
      '1': {
        title: `Let's get started. We've airdropped {{${headingVarConstant.amount}}} pepo coins in your wallet.`,
        templateVars: [headingVarConstant.amount]
      }
    },
    image: imageVarConstant.actorImage,
    payload: {
      amount: ['payload', 'amount']
    },
    supportingEntities: {
      userIds: [['actorIds'], ['subjectUserId']],
      videoIds: [],
      amount: ['payload', 'amount']
    },
    goto: {
      pn: pageNameConstant.feedPageName,
      v: {}
    }
  },
  [userNotificationConstant.videoAddKind]: {
    headings: {
      '1': {
        title: `Watch {{${headingVarConstant.actorNamePossessive}}} new video.`,
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
      pn: pageNameConstant.videoPageName,
      v: {
        [pageNameConstant.videoIdParam]: ['payload', 'videoId']
      }
    }
  }
};
