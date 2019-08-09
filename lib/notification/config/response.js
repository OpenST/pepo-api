const rootPrefix = '../../..',
  userNotificationConstant = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification'),
  pageNameConstant = require(rootPrefix + '/lib/globalConstant/pageName'),
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
      pn: pageNameConstant.profilePageName,
      v: {
        [pageNameConstant.profileUserIdParam]: 'subjectUserId'
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
      pn: pageNameConstant.contributedByPageName,
      v: {
        [pageNameConstant.contributedByParam]: 'actorId'
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
      pn: pageNameConstant.videoPageName,
      v: {
        [pageNameConstant.videoIdParam]: 'videoId'
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
      pn: pageNameConstant.profilePageName,
      v: {
        [pageNameConstant.videoIdParam]: 'subjectUserId'
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
      pn: pageNameConstant.contributedByPageName,
      v: {
        [pageNameConstant.contributedByParam]: 'actorId'
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
      pn: pageNameConstant.profilePageName,
      v: {
        [pageNameConstant.profileUserIdParam]: 'actorId'
      }
    }
  }
};
