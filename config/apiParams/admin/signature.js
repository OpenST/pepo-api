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
  [apiName.insertCuratedEntity]: {
    mandatory: [
      {
        parameter: 'entity_kind',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'entity_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'current_admin',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.deleteCuratedEntity]: {
    mandatory: [
      {
        parameter: 'entity_kind',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'entity_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'current_admin',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.reorderCuratedEntity]: {
    mandatory: [
      {
        parameter: 'entity_kind',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'entity_ids',
        validatorMethods: ['validateNonBlankStringArray']
      },
      {
        parameter: 'current_admin',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.getUsersCuratedEntityList]: {
    mandatory: [
      {
        parameter: 'entity_kind',
        validatorMethods: ['validateString']
      }
    ],
    optional: []
  },
  [apiName.getTagsCuratedEntityList]: {
    mandatory: [
      {
        parameter: 'entity_kind',
        validatorMethods: ['validateString']
      }
    ],
    optional: []
  }
};

module.exports = adminSignature;
