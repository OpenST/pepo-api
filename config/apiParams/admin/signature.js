const rootPrefix = '../../..',
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

const adminSignature = {
  [apiName.adminUserSearch]: {
    mandatory: [],
    optional: [
      {
        parameter: 'q',
        validatorMethods: ['validateString']
      },
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      },
      {
        parameter: 'sort_by',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'filter',
        validatorMethods: ['validateString']
      }
    ]
  },
  [apiName.adminUserApprove]: {
    mandatory: [
      {
        parameter: 'user_ids',
        validatorMethods: ['validateIntegerArray']
      },
      {
        parameter: 'current_admin',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.muteUser]: {
    mandatory: [
      {
        parameter: 'user_id',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'current_admin',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.unMuteUser]: {
    mandatory: [
      {
        parameter: 'user_id',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'current_admin',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.adminUserDeny]: {
    mandatory: [
      {
        parameter: 'user_ids',
        validatorMethods: ['validateIntegerArray']
      },
      {
        parameter: 'current_admin',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.adminUserBlock]: {
    mandatory: [
      {
        parameter: 'user_ids',
        validatorMethods: ['validateIntegerArray']
      },
      {
        parameter: 'current_admin',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.adminDeleteVideo]: {
    mandatory: [
      {
        parameter: 'video_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'current_admin',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.adminDeleteReplyVideo]: {
    mandatory: [
      {
        parameter: 'reply_details_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'current_admin',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.adminUpdateVideoLink]: {
    mandatory: [
      {
        parameter: 'video_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'current_admin',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'link',
        validatorMethods: ['validateString', 'validateStopWords']
      }
    ],
    optional: []
  },
  [apiName.adminUpdateReplyLink]: {
    mandatory: [
      {
        parameter: 'reply_detail_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'current_admin',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'link',
        validatorMethods: ['validateString', 'validateStopWords']
      }
    ],
    optional: []
  },
  [apiName.replyList]: {
    mandatory: [
      {
        parameter: 'current_admin',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'video_id',
        validatorMethods: ['validateInteger']
      }
    ],
    optional: []
  },
  [apiName.adminUpdateVideoDescription]: {
    mandatory: [
      {
        parameter: 'video_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'current_admin',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'video_description',
        validatorMethods: ['validateVideoDescription', 'validateStopWords']
      }
    ],
    optional: []
  },
  [apiName.adminUpdateReplyDescription]: {
    mandatory: [
      {
        parameter: 'reply_detail_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'current_admin',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'video_description',
        validatorMethods: ['validateVideoDescription', 'validateStopWords']
      }
    ],
    optional: []
  },
  [apiName.adminLogin]: {
    mandatory: [
      {
        parameter: 'email',
        validatorMethods: ['isValidEmail']
      },
      {
        parameter: 'password',
        validatorMethods: ['validatePassword']
      }
    ],
    optional: []
  },
  [apiName.loggedInAdmin]: {
    mandatory: [
      {
        parameter: 'current_admin',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.adminWhitelistUser]: {
    mandatory: [
      {
        parameter: 'invite_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: []
  },
  [apiName.adminApproveUser]: {
    mandatory: [
      {
        parameter: 'invite_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: []
  },
  [apiName.launchInviteSearch]: {
    mandatory: [],
    optional: [
      {
        parameter: 'q',
        validatorMethods: ['validateString']
      },
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      },
      {
        parameter: 'sort_by',
        validatorMethods: ['validateString']
      }
    ]
  },
  [apiName.userVideoList]: {
    mandatory: [
      {
        parameter: 'profile_user_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'is_admin',
        validatorMethods: ['validateBoolean']
      }
    ],
    optional: [
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      }
    ]
  },
  [apiName.adminUserProfile]: {
    mandatory: [
      {
        parameter: 'profile_user_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: []
  },
  [apiName.adminUpdateUserDataUsage]: {
    mandatory: [],
    optional: []
  },
  [apiName.adminUpdateVideosPerformanceUsage]: {
    mandatory: [],
    optional: []
  },
  [apiName.adminUpdateTagsUsedUsage]: {
    mandatory: [],
    optional: []
  },
  [apiName.adminGetTags]: {
    mandatory: [],
    optional: [
      {
        parameter: 'q',
        validatorMethods: ['validateString']
      },
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      },
      {
        parameter: 'getTopResults',
        validatorMethods: ['validateBoolean']
      }
    ]
  },
  [apiName.getVideo]: {
    mandatory: [
      {
        parameter: 'video_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'is_admin',
        validatorMethods: ['validateBoolean']
      }
    ]
  }
};

module.exports = adminSignature;
