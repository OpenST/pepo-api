const rootPrefix = '../../..',
  userNotificationConstant = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification'),
  notificationPageNameConstant = require(rootPrefix + '/lib/globalConstant/notificationPageName'),
  imageVarConstant = require(rootPrefix + '/lib/globalConstant/imageVar'),
  headingVarConstant = require(rootPrefix + '/lib/globalConstant/headingVar');

module.exports = {
  [userNotificationConstant.profileTxSendSuccessKind]: {
    notification: {
      headings: {
        '1': {
          title: `You gave {{${headingVarConstant.subjectUsername}}}.`,
          templateVars: [headingVarConstant.subjectUsername]
        }
      },
      image: imageVarConstant.subjectImage,
      payload: ['amount'],
      supportingEntities: {
        userIds: ['subjectUserId'],
        videoIds: []
      }
    },
    goto: {
      pn: notificationPageNameConstant.profilePageName,
      v: {
        [notificationPageNameConstant.profileUserIdEntity]: 'subjectUserId'
      }
    }
  },
  [userNotificationConstant.profileTxReceiveSuccessKind]: {
    notification: {
      headings: {
        '1': {
          title: `{{${headingVarConstant.actorUsername}}} supported you.`,
          templateVars: [headingVarConstant.actorUsername]
        }
      },
      image: imageVarConstant.actorImage,
      payload: ['amount', 'thankYouFlag'],
      supportingEntities: {
        userIds: ['actorIds'],
        videoIds: []
      }
    },
    goto: {
      pn: notificationPageNameConstant.supporterPageName,
      v: {
        [notificationPageNameConstant.supporterUserIdEntity]: 'actorId'
      }
    }
  },
  [userNotificationConstant.videoAddKind]: {
    notification: {
      headings: {
        '1': {
          title: `Watch {{${headingVarConstant.actorUsername}}} new video.`,
          templateVars: [headingVarConstant.actorUsername]
        }
      },
      image: imageVarConstant.actorImage,
      payload: ['videoId'],
      supportingEntities: {
        userIds: ['actorIds'],
        videoIds: ['videoId']
      }
    },
    goto: {
      pn: notificationPageNameConstant.videoPageName,
      v: {
        [notificationPageNameConstant.videoIdEntity]: 'videoId'
      }
    }
  },
  [userNotificationConstant.videoTxSendSuccessKind]: {
    notification: {
      headings: {
        '1': {
          title: `You gave {{${headingVarConstant.subjectUsername}}}.`,
          templateVars: [headingVarConstant.subjectUsername]
        }
      },
      image: imageVarConstant.subjectImage,
      payload: ['amount'],
      supportingEntities: {
        userIds: ['subjectUserId'],
        videoIds: []
      }
    },
    goto: {
      pn: notificationPageNameConstant.profilePageName,
      v: {
        [notificationPageNameConstant.videoIdEntity]: 'subjectUserId'
      }
    }
  },
  [userNotificationConstant.videoTxReceiveSuccessKind]: {
    notification: {
      headings: {
        '1': {
          title: `{{${headingVarConstant.actorUsername}}} supported you.`,
          templateVars: [headingVarConstant.actorUsername]
        }
      },
      image: imageVarConstant.actorImage,
      payload: ['amount', 'thankYouFlag'],
      supportingEntities: {
        userIds: ['actorIds'],
        videoIds: []
      }
    },
    goto: {
      pn: notificationPageNameConstant.supporterPageName,
      v: {
        [notificationPageNameConstant.supporterUserIdEntity]: 'actorId'
      }
    }
  },
  [userNotificationConstant.contributionThanksKind]: {
    notification: {
      headings: {
        '1': {
          title: `{{${headingVarConstant.actorUsername}}} appreciates your support.`,
          templateVars: [headingVarConstant.actorUsername]
        }
      },
      image: imageVarConstant.actorImage,
      payload: ['thankYouText'],
      supportingEntities: {
        userIds: ['actorIds'],
        videoIds: []
      }
    },
    goto: {
      pn: notificationPageNameConstant.profilePageName,
      v: {
        [notificationPageNameConstant.profileUserIdEntity]: 'actorId'
      }
    }
  }
};
