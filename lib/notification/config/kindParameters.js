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
  [userNotificationConstants.replyTxSendSuccessKind]: {
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
          replyDetailId: 1,
          parentVideoId: 1,
          amount: 1
        },
        optional: {}
      }
    },
    optional: {}
  },
  [userNotificationConstants.replyTxSendFailureKind]: {
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
          replyDetailId: 1,
          parentVideoId: 1,
          amount: 1
        },
        optional: {}
      }
    },
    optional: {}
  },
  [userNotificationConstants.replyTxReceiveSuccessKind]: {
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
          replyDetailId: 1,
          parentVideoId: 1,
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
        optional: {
          channelId: 1
        }
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
  [userNotificationConstants.recoveryInitiateKind]: {
    mandatory: {
      userId: 1,
      lastActionTimestamp: 1,
      uuid: 1,
      headingVersion: 1,
      subjectUserId: 1,
      actorIds: 1,
      actorCount: 1,
      payload: {
        mandatory: {},
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
  },
  [userNotificationConstants.topupDoneKind]: {
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
  [userNotificationConstants.topupFailedKind]: {
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
  [userNotificationConstants.creditPepocornSuccessKind]: {
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
          pepocornAmount: 1,
          transactionId: 1
        },
        optional: {}
      }
    },
    optional: {}
  },
  [userNotificationConstants.creditPepocornFailureKind]: {
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
          pepocornAmount: 1,
          transactionId: 1
        },
        optional: {}
      }
    },
    optional: {}
  },
  [userNotificationConstants.userMentionKind]: {
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
        optional: {
          channelId: 1
        }
      }
    },
    optional: {}
  },
  [userNotificationConstants.replyUserMentionKind]: {
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
          replyDetailId: 1,
          parentVideoId: 1,
          videoId: 1
        },
        optional: {}
      }
    },
    optional: {}
  },
  [userNotificationConstants.youRepliedWithAmountKind]: {
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
          replyDetailId: 1,
          parentVideoId: 1,
          videoId: 1,
          amount: 1
        },
        optional: {}
      }
    },
    optional: {}
  },
  [userNotificationConstants.youRepliedWithoutAmountKind]: {
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
          replyDetailId: 1,
          parentVideoId: 1,
          videoId: 1
        },
        optional: {}
      }
    },
    optional: {}
  },
  [userNotificationConstants.replyOnYourVideoWithAmountKind]: {
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
          replyDetailId: 1,
          parentVideoId: 1,
          videoId: 1,
          amount: 1
        },
        optional: {}
      }
    },
    optional: {}
  },
  [userNotificationConstants.replyOnYourVideoWithoutAmountKind]: {
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
          replyDetailId: 1,
          parentVideoId: 1,
          videoId: 1
        },
        optional: {}
      }
    },
    optional: {}
  },
  [userNotificationConstants.replyThreadNotificationKind]: {
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
          replyDetailId: 1,
          parentVideoId: 1,
          videoId: 1
        },
        optional: {}
      }
    },
    optional: {}
  },
  [userNotificationConstants.systemNotificationKind]: {
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
          dynamicText: 1
        },
        optional: {}
      }
    },
    optional: {
      gotoParams: 1
    }
  },
  [userNotificationConstants.videoAddInChannelKind]: {
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
          videoId: 1,
          channelId: 1
        },
        optional: {}
      }
    },
    optional: {
      gotoParams: 1
    }
  }
};
