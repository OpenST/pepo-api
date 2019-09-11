const rootPrefix = '../../..',
  pageNameConstant = require(rootPrefix + '/lib/globalConstant/pageName'),
  imageVarConstant = require(rootPrefix + '/lib/globalConstant/imageVar'),
  headingVarConstant = require(rootPrefix + '/lib/globalConstant/headingVar'),
  notificationHookConstant = require(rootPrefix + '/lib/globalConstant/notificationHook');

module.exports = {
  [notificationHookConstant.profileTxSendSuccessKind]: {
    heading: {
      title: `You gave {{${headingVarConstant.subjectName}}}.`,
      body: `You gave {{${headingVarConstant.subjectName}}}.`,
      templateVars: [headingVarConstant.subjectName]
    },
    android: {
      collapse_key: ['title'],
      notification: {
        tag: ['title']
      }
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
  [notificationHookConstant.profileTxReceiveSuccessKind]: {
    heading: {
      title: `You received X pepos today from {{${headingVarConstant.actorName}}} people`,
      templateVars: [headingVarConstant.actorName]
    },
    supportingEntities: {
      userIds: [['actorIds'], ['subjectUserId']],
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
  [notificationHookConstant.videoTxReceiveSuccessKind]: {
    heading: {
      title: `{{${headingVarConstant.actorName}}} supported you.`,
      templateVars: [headingVarConstant.actorName]
    },
    supportingEntities: {
      userIds: [['actorIds'], ['subjectUserId']],
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
  [notificationHookConstant.contributionThanksKind]: {
    heading: {
      title: `{{${headingVarConstant.actorName}}} appreciates your support. \n " {{${
        headingVarConstant.thankYouText
      }}} "`,
      templateVars: [headingVarConstant.actorName, headingVarConstant.thankYouText]
    },
    supportingEntities: {
      userIds: [['actorIds'], ['subjectUserId']],
      videoIds: [],
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
  [notificationHookConstant.airdropDoneKind]: {
    heading: {
      title: `Let's get started. We've airdropped {{${headingVarConstant.amount}}} pepo coins in your wallet.`,
      templateVars: [headingVarConstant.amount]
    },
    supportingEntities: {
      userIds: [['actorIds'], ['subjectUserId']],
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
      title: `Your Top-up transaction of {{${headingVarConstant.amount}}} pepo coins is failed.`,
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
  [notificationHookConstant.paperPlaneTransactionKind]: {
    heading: {
      title: `{{${headingVarConstant.actorName}}} supported you with {{${headingVarConstant.amount}}} pepos.`,
      templateVars: [headingVarConstant.actorName, headingVarConstant.amount]
    },
    supportingEntities: {
      userIds: [['actorIds'], ['subjectUserId']],
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
  [notificationHookConstant.recoveryInitiateKind]: {
    heading: {
      title: `Recovery of your wallet has been initiated.`,
      templateVars: []
    },
    supportingEntities: {
      userIds: [['actorIds'], ['subjectUserId']],
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
  }
};
