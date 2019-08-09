const rootPrefix = '../../..',
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

module.exports = {
  [userNotificationConstants.profileTxSendSuccessKind]: {
    mandatory: {
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
  }
};
