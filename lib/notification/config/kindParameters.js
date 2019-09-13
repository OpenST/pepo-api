const rootPrefix = '../../..',
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

module.exports = {
  [userNotificationConstants.profileTxSendSuccessKind]: {
    mandatory: {
      userId: 1,
      lastActionTimestamp: 1,
      uuid: 1,
      headingVersion: 1,
      subjectUserId: 1,
      actorIds: 1,
      actorCount: 1,
      payload: {
        mandatory: {
          transactionId: 1,
          amount: 1
        },
        optional: {}
      }
    },
    optional: {}
  },
  [userNotificationConstants.profileTxSendFailureKind]: {
    mandatory: {
      userId: 1,
      lastActionTimestamp: 1,
      uuid: 1,
      headingVersion: 1,
      subjectUserId: 1,
      actorIds: 1,
      actorCount: 1,
      payload: {
        mandatory: {
          transactionId: 1,
          amount: 1
        },
        optional: {}
      }
    },
    optional: {}
  },
  [userNotificationConstants.profileTxReceiveSuccessKind]: {
    mandatory: {
      userId: 1,
      lastActionTimestamp: 1,
      uuid: 1,
      headingVersion: 1,
      subjectUserId: 1,
      actorIds: 1,
      actorCount: 1,
      thankYouFlag: 1,
      payload: {
        mandatory: {
          transactionId: 1,
          amount: 1
        },
        optional: {}
      }
    },
    optional: {}
  },
  [userNotificationConstants.videoTxSendSuccessKind]: {
    mandatory: {
      userId: 1,
      lastActionTimestamp: 1,
      uuid: 1,
      headingVersion: 1,
      subjectUserId: 1,
      actorIds: 1,
      actorCount: 1,
      payload: {
        mandatory: {
          transactionId: 1,
          videoId: 1,
          amount: 1
        },
        optional: {}
      }
    },
    optional: {}
  },
  [userNotificationConstants.videoTxSendFailureKind]: {
    mandatory: {
      userId: 1,
      lastActionTimestamp: 1,
      uuid: 1,
      headingVersion: 1,
      subjectUserId: 1,
      actorIds: 1,
      actorCount: 1,
      payload: {
        mandatory: {
          transactionId: 1,
          videoId: 1,
          amount: 1
        },
        optional: {}
      }
    },
    optional: {}
  },
  [userNotificationConstants.videoTxReceiveSuccessKind]: {
    mandatory: {
      userId: 1,
      lastActionTimestamp: 1,
      uuid: 1,
      headingVersion: 1,
      subjectUserId: 1,
      actorIds: 1,
      actorCount: 1,
      thankYouFlag: 1,
      payload: {
        mandatory: {
          transactionId: 1,
          videoId: 1,
          amount: 1
        },
        optional: {}
      }
    },
    optional: {}
  },
  [userNotificationConstants.videoAddKind]: {
    mandatory: {
      userId: 1,
      lastActionTimestamp: 1,
      uuid: 1,
      headingVersion: 1,
      subjectUserId: 1,
      actorIds: 1,
      actorCount: 1,
      payload: {
        mandatory: {
          videoId: 1
        },
        optional: {}
      }
    },
    optional: {}
  },
  [userNotificationConstants.contributionThanksKind]: {
    mandatory: {
      userId: 1,
      lastActionTimestamp: 1,
      uuid: 1,
      headingVersion: 1,
      subjectUserId: 1,
      actorIds: 1,
      actorCount: 1,
      payload: {
        mandatory: {
          transactionId: 1,
          thankYouText: 1
        },
        optional: {}
      }
    },
    optional: {}
  },
  [userNotificationConstants.airdropDoneKind]: {
    mandatory: {
      userId: 1,
      lastActionTimestamp: 1,
      uuid: 1,
      headingVersion: 1,
      subjectUserId: 1,
      actorIds: 1,
      actorCount: 1,
      payload: {
        mandatory: {
          transactionId: 1,
          amount: 1
        },
        optional: {}
      }
    },
    optional: {}
  }
};
