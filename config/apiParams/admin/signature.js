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
  [apiName.adminChannelSearch]: {
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
        parameter: 'current_admin',
        validatorMethods: ['validateNonEmptyObject']
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
  [apiName.adminSendEmailForResubmission]: {
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
  [apiName.adminUserBlockInChannel]: {
    mandatory: [
      {
        parameter: 'user_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'current_admin',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'channel_id',
        validatorMethods: ['validateNonZeroInteger']
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
  [apiName.adminUserDelete]: {
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
        validatorMethods: ['validateGenericUrl', 'validateStopWords']
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
        validatorMethods: ['validateGenericUrl', 'validateStopWords']
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
  [apiName.adminUpdateChannelDataUsage]: {
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
  },
  [apiName.updateCuratedEntity]: {
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
        parameter: 'position',
        validatorMethods: ['validateString']
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
  },
  [apiName.getChannelsCuratedEntityList]: {
    mandatory: [
      {
        parameter: 'entity_kind',
        validatorMethods: ['validateString']
      }
    ],
    optional: []
  },
  [apiName.adminEditChannel]: {
    mandatory: [
      {
        parameter: 'is_edit',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'permalink',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_admin',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: [
      {
        parameter: 'name',
        validatorMethods: ['validateChannelName']
      },
      {
        parameter: 'description',
        validatorMethods: ['validateChannelDescription', 'validateStopWords']
      },
      {
        parameter: 'tagline',
        validatorMethods: ['validateChannelTagline', 'validateStopWords']
      },
      {
        parameter: 'tags',
        validatorMethods: ['validateCommaDelimitedStrings']
      },
      {
        parameter: 'admins',
        validatorMethods: ['validateCommaDelimitedStrings']
      },
      {
        parameter: 'original_image_url',
        validatorMethods: ['validateHttpBasedUrl']
      },
      {
        parameter: 'original_image_file_size',
        validatorMethods: ['validateInteger']
      }
    ]
  },
  [apiName.presignedUrl]: {
    mandatory: [],
    optional: []
  }
};

module.exports = adminSignature;
