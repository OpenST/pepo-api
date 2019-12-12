const rootPrefix = '../../..',
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

const v1Signature = {
  [apiName.logout]: {
    mandatory: [],
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
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.getInviteCode]: {
    mandatory: [
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
        parameter: 'video_id',
        validatorMethods: ['validateInteger']
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
  [apiName.getReply]: {
    mandatory: [
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
    mandatory: [],
    optional: []
  },
  [apiName.contributionBy]: {
    mandatory: [
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
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.ostTransaction]: {
    mandatory: [
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

  [apiName.getRedemptionProductUrl]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
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
  [apiName.getRedemptionWebViewProductUrl]: {
    mandatory: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
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
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },

  [apiName.twitterLogin]: {
    mandatory: [
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
      }
    ],
    optional: [
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
  [apiName.rotateTwitterAccount]: {
    mandatory: [
      {
        parameter: 'user_name',
        validatorMethods: ['validateString', 'validateUserName']
      }
    ],
    optional: []
  },
  [apiName.saveFanVideo]: {
    mandatory: [
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
  [apiName.saveProfileImage]: {
    mandatory: [
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
  [apiName.getTags]: {
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
  [apiName.mixedTopSearch]: {
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
        parameter: 'supported_entities',
        validatorMethods: ['validateStringArray']
      }
    ]
  },
  [apiName.feedsList]: {
    mandatory: [
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
  [apiName.getVideo]: {
    mandatory: [
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
    mandatory: [],
    optional: [
      {
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ]
  },
  [apiName.userSearch]: {
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
  [apiName.atMentionSearch]: {
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
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.addDeviceToken]: {
    mandatory: [
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
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },

  [apiName.getTopupById]: {
    mandatory: [
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
        parameter: 'url',
        validatorMethods: ['validateGenericUrl']
      }
    ],
    optional: []
  },
  [apiName.reportIssueForWeb]: {
    mandatory: [
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
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.deleteVideo]: {
    mandatory: [
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
  [apiName.getAllVideoListByTagId]: {
    mandatory: [
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
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.pepocornTopUpGetPepocornBalance]: {
    mandatory: [
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
        parameter: 'current_user',
        validatorMethods: ['validateNonEmptyObject']
      },
      {
        parameter: 'reply_details_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: []
  }
};

module.exports = v1Signature;
