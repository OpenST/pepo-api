const rootPrefix = '../../..',
  pageNameConstant = require(rootPrefix + '/lib/globalConstant/pageName'),
  imageVarConstant = require(rootPrefix + '/lib/globalConstant/imageVar'),
  headingVarConstant = require(rootPrefix + '/lib/globalConstant/headingVar'),
  userNotificationConstant = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

module.exports = {
  [userNotificationConstant.profileTxSendSuccessKind]: {
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
  [userNotificationConstant.profileTxReceiveSuccessKind]: {
    heading: {
      title: `You received X pepos today from {{${headingVarConstant.actorName}}} people`,
      templateVars: [headingVarConstant.actorName]
    },
    supportingEntities: {
      userIds: [['actorIds']],
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
  [userNotificationConstant.videoTxReceiveSuccessKind]: {
    heading: {
      title: `{{${headingVarConstant.actorName}}} supported you.`,
      templateVars: [headingVarConstant.actorName]
    },
    supportingEntities: {
      userIds: [['actorIds']],
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
  [userNotificationConstant.contributionThanksKind]: {
    heading: {
      title: `{{${headingVarConstant.actorName}}} appreciates your support.`,
      templateVars: [headingVarConstant.actorName]
    },
    supportingEntities: {
      userIds: [['actorIds']],
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
  [userNotificationConstant.airdropDoneKind]: {
    heading: {
      title: `Let's get started. We've airdropped {{${headingVarConstant.amount}}} pepo coins in your wallet.`,
      templateVars: [headingVarConstant.amount]
    },
    supportingEntities: {
      userIds: [['actorIds']],
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
  }
};
