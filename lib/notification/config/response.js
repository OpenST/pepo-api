const rootPrefix = '../../..',
  pageNameConstant = require(rootPrefix + '/lib/globalConstant/pageName'),
  imageVarConstant = require(rootPrefix + '/lib/globalConstant/imageVar'),
  headingVarConstant = require(rootPrefix + '/lib/globalConstant/headingVar'),
  userNotificationConstant = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

module.exports = {
  [userNotificationConstant.profileTxSendSuccessKind]: {
    default: {
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
    notificationCentre: {
      headings: {
        '1': {
          title: `You gave {{${headingVarConstant.subjectName}}}.`,
          templateVars: [headingVarConstant.subjectName]
        }
      },
      payload: {
        amount: ['payload', 'amount']
      }
    },
    pushNotification: {
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
      }
    }
  },
  [userNotificationConstant.profileTxSendFailureKind]: {
    notificationCentre: {
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
    pushNotification: {
      heading: {
        title: `You gave {{${headingVarConstant.subjectName}}}. Transfer Failed.`,
        templateVars: [headingVarConstant.subjectName]
      }
    }
  },
  [userNotificationConstant.profileTxReceiveSuccessKind]: {
    default: {
      goto: {
        pn: pageNameConstant.contributedByPageName,
        v: {
          [pageNameConstant.profileUserIdParam]: ['subjectUserId']
        }
      },
      image: imageVarConstant.subjectImage,
      supportingEntities: {
        userIds: [['subjectUserId'], ['actorIds']],
        videoIds: []
      }
    },
    notificationCentre: {
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
    pushNotification: {
      heading: {
        title: `You received X pepos today from {{${headingVarConstant.actorName}}} people`,
        templateVars: [headingVarConstant.actorName]
      },
      android: {
        collapse_key: ['title'],
        notification: {
          tag: ['title']
        }
      }
    }
  },
  [userNotificationConstant.videoTxSendSuccessKind]: {
    notificationCentre: {
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
    pushNotification: {
      heading: {
        title: `You gave {{${headingVarConstant.subjectName}}}.`,
        templateVars: [headingVarConstant.subjectName]
      }
    }
  },
  [userNotificationConstant.videoTxSendFailureKind]: {
    notificationCentre: {
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
    pushNotification: {
      heading: {
        title: `You gave {{${headingVarConstant.subjectName}}}. Transfer Failed.`,
        templateVars: [headingVarConstant.subjectName]
      }
    }
  },
  [userNotificationConstant.videoTxReceiveSuccessKind]: {
    notificationCentre: {
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
    pushNotification: {
      heading: {
        title: `{{${headingVarConstant.actorName}}} supported you.`,
        templateVars: [headingVarConstant.actorName]
      }
    }
  },
  [userNotificationConstant.contributionThanksKind]: {
    notificationCentre: {
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
      supportingEntities: {
        userIds: [['actorIds']],
        videoIds: []
      },
      goto: {
        pn: pageNameConstant.profilePageName,
        v: {
          [pageNameConstant.profileUserIdParam]: ['actorIds', 0]
        }
      }
    },
    pushNotification: {
      heading: {
        title: `{{${headingVarConstant.actorName}}} appreciates your support.`,
        templateVars: [headingVarConstant.actorName]
      }
    }
  },
  [userNotificationConstant.videoAddKind]: {
    notificationCentre: {
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
    },
    pushNotification: {
      heading: {
        title: `Watch {{${headingVarConstant.actorNamePossessive}}} new video.`,
        templateVars: [headingVarConstant.actorNamePossessive]
      }
    }
  }
};
