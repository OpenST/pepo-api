const rootPrefix = '../../..',
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

const v1Signature = {
  [apiName.logout]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      }
    ],
    optional: [
      {
        parameter: 'device_id',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.recoveryInfo]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.getInviteCode]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.replyList]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'video_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: [
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'check_reply_detail_id',
        validatorMethods: ['validateInteger']
      }
    ]
  },
  [apiName.unseenReplies]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'video_id',
        validatorMethods: ['validateInteger']
      }
    ],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.getReply]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'reply_detail_id',
        validatorMethods: ['validateInteger']
      }
    ],
    optional: []
  },
  [apiName.registerDevice]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'device_address',
        validatorMethods: ['validateEthAddress']
      },
      {
        parameter: 'api_signer_address',
        validatorMethods: ['validateEthAddress']
      }
    ],
    optional: []
  },
  [apiName.token]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      }
    ],
    optional: []
  },
  [apiName.contributionBy]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'profile_user_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: [
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      }
    ]
  },
  [apiName.contributionTo]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'profile_user_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: [
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      }
    ]
  },
  [apiName.contributionSuggestion]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'profile_user_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: [
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      }
    ]
  },
  [apiName.loggedInUser]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'login_service_type',
        validatorMethods: ['validateNonBlankString']
      }
    ],
    optional: []
  },
  [apiName.ostTransaction]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'ost_transaction',
        validatorMethods: ['validateNonEmptyObject', 'validateOstTransactionObject']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: [
      {
        parameter: 'meta',
        validatorMethods: ['validateNonEmptyObject', 'validateOstTransactionMeta']
      },
      {
        parameter: 'is_paper_plane',
        validatorMethods: ['validateBoolean']
      }
    ]
  },
  [apiName.uploadParams]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: [
      {
        parameter: 'videos',
        validatorMethods: ['validateStringArray']
      },
      {
        parameter: 'images',
        validatorMethods: ['validateStringArray']
      }
    ]
  },
  [apiName.getRedemptionWebViewProductUrl]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'login_service_type',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'pepo_device_os',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'pepo_device_os_version',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'pepo_build_number',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'pepo_app_version',
        validatorMethods: ['validateNonBlankString']
      }
    ],
    optional: []
  },

  [apiName.getSupportUrl]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },

  [apiName.twitterLogin]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'token',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'secret',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'twitter_id',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'handle',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'sanitized_headers',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: [
      {
        parameter: 'ip_address',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'invite_code',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'utm_params',
        validatorMethods: ['validateObject']
      }
    ]
  },
  [apiName.getUserProfile]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'profile_user_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: []
  },
  [apiName.rotateAccount]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'user_name',
        validatorMethods: ['validateString']
      }
    ],
    optional: []
  },
  [apiName.saveFanVideo]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'profile_user_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'video_url',
        validatorMethods: ['validateHttpBasedUrl']
      }
    ],
    optional: [
      {
        parameter: 'poster_image_url',
        validatorMethods: ['validateHttpBasedUrl']
      },
      {
        parameter: 'video_width',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'video_height',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'video_size',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'image_width',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'image_height',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'per_reply_amount_in_wei',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'image_size',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'video_description',
        validatorMethods: ['validateString', 'validateStopWords']
      },
      {
        parameter: 'link',
        validatorMethods: ['validateString', 'validateStopWords']
      } // If link is invalid, consider empty string.
    ]
  },
  [apiName.initiateReply]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'parent_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'parent_kind',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'video_url',
        validatorMethods: ['validateHttpBasedUrl']
      }
    ],
    optional: [
      {
        parameter: 'reply_detail_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'poster_image_url',
        validatorMethods: ['validateHttpBasedUrl']
      },
      {
        parameter: 'video_width',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'video_height',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'video_size',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'image_width',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'image_height',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'image_size',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'video_description',
        validatorMethods: ['validateString', 'validateStopWords']
      },
      {
        parameter: 'link',
        validatorMethods: ['validateString', 'validateStopWords']
      } // If link is invalid, consider empty string.
    ]
  },
  [apiName.validateUploadVideo]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: [
      {
        parameter: 'video_description',
        validatorMethods: ['validateVideoDescription', 'validateStopWords']
      },
      {
        parameter: 'link',
        validatorMethods: ['validateGenericUrl', 'validateStopWords']
      },
      {
        parameter: 'per_reply_amount_in_wei',
        validatorMethods: ['validateIntegerWeiValue']
      }
    ]
  },
  [apiName.validateUploadReply]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'parent_kind',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'parent_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: [
      {
        parameter: 'video_description',
        validatorMethods: ['validateVideoDescription', 'validateStopWords']
      },
      {
        parameter: 'link',
        validatorMethods: ['validateGenericUrl', 'validateStopWords']
      }
    ]
  },
  [apiName.mergeVideoSegments]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'video_urls',
        validatorMethods: ['validateStringifiedVideoUrls']
      }
    ],
    optional: []
  },
  [apiName.videoMergeJobStatus]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'video_merge_job_id',
        validatorMethods: ['validateInteger']
      }
    ],
    optional: []
  },
  [apiName.saveProfileImage]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'profile_user_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'image_url',
        validatorMethods: ['validateHttpBasedUrl']
      }
    ],
    optional: [
      {
        parameter: 'width',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'height',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'size',
        validatorMethods: ['validateInteger']
      }
    ]
  },
  [apiName.saveProfile]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'profile_user_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'name',
        validatorMethods: ['validateString', 'validateName', 'validateStopWords']
      },
      {
        parameter: 'user_name',
        validatorMethods: ['validateString', 'validateUserName', 'validateStopWords']
      }
    ],
    optional: [
      {
        parameter: 'bio',
        validatorMethods: ['validateString', 'validateStopWords']
      },
      {
        parameter: 'link',
        validatorMethods: ['validateGenericUrl', 'validateStopWords']
      }
    ]
  },
  [apiName.saveEmail]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'profile_user_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'email',
        validatorMethods: ['validateString', 'isValidEmail']
      }
    ],
    optional: []
  },
  [apiName.blockOtherUserForUser]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'profile_user_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: []
  },
  [apiName.unBlockOtherUserForUser]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'profile_user_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: []
  },
  [apiName.getChannelDetails]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'channel_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.joinChannel]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'channel_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.leaveChannel]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'channel_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.turnOffChannelNotifications]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'channel_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.turnOnChannelNotifications]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'channel_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.getTags]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      }
    ],
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
  [apiName.getChannels]: {
    mandatory: [],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
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
  [apiName.getNewChannels]: {
    mandatory: [],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'q',
        validatorMethods: ['validateString']
      },
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      }
    ]
  },
  [apiName.getAllChannels]: {
    mandatory: [],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'q',
        validatorMethods: ['validateString']
      },
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      }
    ]
  },
  [apiName.getMyChannels]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: [
      {
        parameter: 'q',
        validatorMethods: ['validateString']
      },
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      }
    ]
  },
  [apiName.mixedTopSearch]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      }
    ],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'q',
        validatorMethods: ['validateString']
      },
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      },
      {
        parameter: 'supported_entities',
        validatorMethods: ['validateStringArray']
      }
    ]
  },
  [apiName.feedsList]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'sanitized_headers',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: [
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.userVideoList]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'profile_user_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: [
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.userReplyList]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'profile_user_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: [
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      }
    ]
  },
  [apiName.getVideo]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'video_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.feedDetails]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'feed_id',
        validatorMethods: ['validateInteger']
      }
    ],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.websocketDetails]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'user_id',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.getUserNotifications]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: [
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      }
    ]
  },
  [apiName.sayThankYou]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'notification_id',
        validatorMethods: ['validateString', 'validateNotificationId']
      },
      {
        parameter: 'text',
        validatorMethods: ['validateString', 'validateStopWords']
      }
    ],
    optional: [
      {
        parameter: 'tweet_needed',
        validatorMethods: ['validateInteger']
      }
    ]
  },
  [apiName.twitterDisconnect]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      }
    ],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.appleDisconnect]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      }
    ],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.googleDisconnect]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      }
    ],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.githubDisconnect]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      }
    ],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.userSearch]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      }
    ],
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
  [apiName.atMentionSearch]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
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
        parameter: 'intent',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'parent_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ]
  },
  [apiName.getEmail]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.addDeviceToken]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'device_id',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'device_kind',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'device_token',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'user_timezone',
        validatorMethods: ['validateNonBlankString']
      }
    ]
  },

  [apiName.getTopupProducts]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'os',
        validatorMethods: ['validateString']
      }
    ],
    optional: []
  },

  [apiName.createTopup]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'response',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'os',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'user_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: []
  },

  [apiName.getPendingTopups]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },

  [apiName.getTopupById]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'payment_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: [
      {
        parameter: 'transaction_id',
        validatorMethods: ['validateString']
      }
    ]
  },

  [apiName.resetBadge]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'user_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.videoShare]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'video_id',
        validatorMethods: ['validateInteger']
      }
    ],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.replyShare]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'reply_detail_id',
        validatorMethods: ['validateInteger']
      }
    ],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.refreshTwitterConnect]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'token',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'secret',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'twitter_id',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'handle',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.tweetInfo]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'receiver_user_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.invitedUsersSearch]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: [
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      }
    ]
  },
  [apiName.fetchGoto]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'url',
        validatorMethods: ['validateGenericUrl']
      }
    ],
    optional: []
  },
  [apiName.reportIssueForWeb]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'app_name',
        validatorMethods: ['validateString']
      }
    ],
    optional: [
      {
        parameter: 'kind',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'error_data',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.activationInitiate]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.deleteVideo]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'video_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.reportIssue]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'report_entity_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'report_entity_kind',
        validatorMethods: ['validateNonBlankString']
      }
    ],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.tagDetails]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'tag_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: []
  },
  [apiName.getVideoListByTagId]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'tag_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: [
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      }
    ]
  },
  [apiName.getChannelVideos]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'channel_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: [
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      },
      {
        parameter: paginationConstants.filterByTagIdKey,
        validatorMethods: ['validateNonZeroInteger']
      }
    ]
  },

  [apiName.channelUsers]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'channel_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: [
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      }
    ]
  },

  [apiName.channelShare]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'channel_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: []
  },

  [apiName.profileShare]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'user_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: []
  },

  [apiName.getAllVideoListByTagId]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'tag_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'supported_entities',
        validatorMethods: ['validateNonEmptyStringArray']
      }
    ],
    optional: [
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      }
    ]
  },
  [apiName.pepocornTopUpValidate]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'product_id',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'pepo_amount_in_wei',
        validatorMethods: ['validateNonZeroWeiValue']
      },
      {
        parameter: 'pepo_usd_price_point',
        validatorMethods: ['validateNonNegativeNumber']
      },
      {
        parameter: 'pepocorn_amount',
        validatorMethods: ['validateNonNegativeNumber']
      }
    ],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'request_timestamp',
        validatorMethods: ['validateNonNegativeNumber']
      }
    ]
  },
  [apiName.pepocornTopUpInfo]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.pepocornTopUpGetPepocornBalance]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.deleteReplyVideo]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'reply_details_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: []
  },
  [apiName.muteUser]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'other_user_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: []
  },
  [apiName.unMuteUser]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'other_user_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: []
  },
  [apiName.githubConnect]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'access_token',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'sanitized_headers',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: [
      {
        parameter: 'ip_address',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'invite_code',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'utm_params',
        validatorMethods: ['validateObject']
      }
    ]
  },
  [apiName.googleConnect]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'access_token',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'refresh_token',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'sanitized_headers',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: [
      {
        parameter: 'ip_address',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'expires_in',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'token_type',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'id_token',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'invite_code',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'utm_params',
        validatorMethods: ['validateObject']
      }
    ]
  },
  [apiName.appleConnect]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'authorization_code',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'authorized_scopes',
        validatorMethods: ['validateArray']
      },
      {
        parameter: 'nonce',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'identity_token',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'real_user_status',
        validatorMethods: ['validateInteger']
      },
      {
        parameter: 'apple_user_id',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'sanitized_headers',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: [
      {
        parameter: 'ip_address',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'state',
        validatorMethods: ['validateNullString']
      },
      {
        parameter: 'full_name',
        validatorMethods: ['validateObject']
      },
      {
        parameter: 'invite_code',
        validatorMethods: ['validateNonBlankString']
      },
      {
        parameter: 'utm_params',
        validatorMethods: ['validateObject']
      }
    ]
  },
  [apiName.getSessionAuth]: {
    mandatory: [
      {
        parameter: 'api_source',
        validatorMethods: ['validateString']
      },
      {
        parameter: 'session_auth_payload_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  }
};

module.exports = v1Signature;
