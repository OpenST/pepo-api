/**
 * Module to define error config for API v1 errors.
 *
 * @module config/apiParams/v1/errorConfig
 */

const v1ErrorConfig = {
  invalid_app_name: {
    parameter: 'app_name',
    code: 'invalid',
    message: 'App Name is Invalid'
  },

  invalid_name: {
    parameter: 'name',
    code: 'invalid',
    message: 'Name can contain min 2 characters and max 30 characters.'
  },

  invalid_user_name: {
    parameter: 'user_name',
    code: 'invalid',
    message: 'User Name can contain alphanumeric and underscore and should be min 1 characters and max 15 characters.'
  },
  invalid_clientId: {
    parameter: 'client_id',
    code: 'invalid',
    message: 'Invalid parameter client_id.'
  },
  invalid_password: {
    parameter: 'password',
    code: 'invalid',
    message: 'Password should be min 8 characters and max 40 characters.'
  },

  invalid_first_name: {
    parameter: 'first_name',
    code: 'invalid',
    message: 'First Name can contain alphabets and spaces and should be min 2 characters and max 25 characters'
  },

  invalid_last_name: {
    parameter: 'last_name',
    code: 'invalid',
    message: 'Last Name can contain alphabets and spaces and should be min 2 characters and max 25 characters'
  },

  invalid_device_address: {
    parameter: 'device_address',
    code: 'invalid',
    message: 'Invalid Device Address'
  },

  invalid_api_signer_address: {
    parameter: 'api_signer_address',
    code: 'invalid',
    message: 'Invalid Api Signer Address'
  },

  user_not_found: {
    parameter: 'user_name',
    code: 'invalid',
    message: 'Incorrect login details.'
  },

  user_not_active: {
    parameter: 'user_name',
    code: 'invalid',
    message: 'User login has been disabled.'
  },

  user_not_blocked: {
    parameter: 'profile_user_id',
    code: 'invalid',
    message: 'User profile is not blocked.'
  },

  self_profile_cannot_blocked: {
    parameter: 'profile_user_id',
    code: 'invalid',
    message: 'Self User profile can not be blocked.'
  },

  user_already_approved: {
    parameter: 'user_id',
    code: 'invalid',
    message: 'User is already approved.'
  },

  user_already_denied_as_creator: {
    parameter: 'user_id',
    code: 'invalid',
    message: 'User is already denied as creator.'
  },

  user_inactive: {
    parameter: 'user_id',
    code: 'invalid',
    message: 'User is inactive.'
  },

  duplicate_user_name: {
    parameter: 'user_name',
    code: 'invalid',
    message: 'User Name has been used.'
  },

  invalid_token_holder_address: {
    parameter: 'token_holder_address',
    code: 'invalid',
    message: 'Invalid parameter Token Holder Address.'
  },

  invalid_status: {
    parameter: 'status',
    code: 'invalid',
    message: 'Invalid parameter status.'
  },

  invalid_pagination_identifier: {
    parameter: 'pagination_identifier',
    code: 'invalid',
    message: 'Invalid Pagination Identifier'
  },

  invalid_query: {
    parameter: 'query',
    code: 'invalid',
    message: 'Invalid Query'
  },

  invalid_http_link: {
    parameter: 'link',
    code: 'invalid',
    message: 'Link should always start with http or https.'
  },

  invalid_page_number: {
    parameter: 'page_number',
    code: 'invalid',
    message: 'Invalid Page Number'
  },

  invalid_meta: {
    parameter: 'meta',
    code: 'invalid',
    message: 'Invalid Meta'
  },

  invalid_ost_transaction: {
    parameter: 'ost_transaction',
    code: 'invalid',
    message: 'Invalid Ost Transaction'
  },

  invalid_user_id: {
    parameter: 'user_id',
    code: 'invalid',
    message: 'Invalid user id.'
  },

  invalid_resolution: {
    parameter: 'resolutions',
    code: 'invalid',
    message: 'Invalid resolutions.'
  },

  invalid_url: {
    parameter: 'url',
    code: 'invalid',
    message: 'Invalid url.'
  },

  invalid_kind: {
    parameter: 'kind',
    code: 'invalid',
    message: 'Invalid kind.'
  },

  invalid_video_id: {
    parameter: 'video_id',
    code: 'invalid',
    message: 'Invalid video id.'
  },

  invalid_reply_detail_id: {
    parameter: 'reply_detail_id',
    code: 'invalid',
    message: 'Invalid reply detail id.'
  },

  invalid_text: {
    parameter: 'text',
    code: 'invalid',
    message: 'Invalid text.'
  },

  invalid_thank_you_message: {
    parameter: 'text',
    code: 'invalid',
    message: 'Message length exceeded 255 characters.'
  },

  invalid_thank_you_flag: {
    parameter: 'thank_you_flag',
    code: 'invalid',
    message: 'Invalid thank you flag.'
  },

  invalid_last_visited_at: {
    parameter: 'last_visited_at',
    code: 'invalid',
    message: 'Invalid last visited at timestamp.'
  },

  invalid_notification_id: {
    parameter: 'notification_id',
    code: 'invalid',
    message: 'Invalid notification id.'
  },

  invalid_from_user_id: {
    parameter: 'from_user_id',
    code: 'invalid',
    message: 'Invalid from user id in transfers.'
  },

  invalid_to_user_id: {
    parameter: 'to_user_id',
    code: 'invalid',
    message: 'Invalid to user id in transfers.'
  },

  invalid_transaction_type: {
    parameter: 'meta_property',
    code: 'invalid',
    message: 'Invalid transaction type.'
  },

  invalid_twitter_user: {
    parameter: 'twitter_user',
    code: 'invalid',
    message: 'Invalid twitter user in rotate twitter account. This twitter user has rotated their twitter account.'
  },

  invalid_transfers: {
    parameter: 'transfers',
    code: 'invalid',
    message: 'Invalid transfers.'
  },

  invalid_video_url: {
    parameter: 'video_url',
    code: 'invalid',
    message: 'Invalid video url.'
  },

  invalid_image_url: {
    parameter: 'image_url',
    code: 'invalid',
    message: 'Invalid image url.'
  },

  invalid_receipt: {
    parameter: 'receipt',
    code: 'invalid',
    message: 'Invalid receipt.'
  },

  invalid_device_kind: {
    parameter: 'device_kind',
    code: 'invalid',
    message: 'Invalid device kind.'
  },

  invalid_topup_id: {
    parameter: 'topup_id',
    code: 'invalid',
    message: 'Invalid topup id.'
  },

  invalid_os: {
    parameter: 'os',
    code: 'invalid',
    message: 'Invalid os.'
  },

  already_associated_email: {
    parameter: 'email',
    code: 'invalid',
    message: 'This email address is already associated with some different account.'
  },

  same_account_email: {
    parameter: 'email',
    code: 'invalid',
    message: 'This email address is already associated with the current account.'
  },

  email_already_added: {
    parameter: 'email',
    code: 'invalid',
    message: 'This account already has an email address associated with it.'
  },

  invalid_invite_code: {
    parameter: 'invite_code',
    code: 'invalid',
    message: 'Invite code is invalid.'
  },

  missing_invite_code: {
    parameter: 'invite_code',
    code: 'missing',
    message: 'Invitation is mandatory.'
  },

  expired_invite_code: {
    parameter: 'invite_code',
    code: 'invalid',
    message: 'Invitation is expired.'
  },

  invalid_receiver_id: {
    parameter: 'receiver_user_id',
    code: 'invalid',
    message: 'Receiver user id is not associated with any user.'
  },

  invalid_product_id: {
    parameter: 'product_id',
    code: 'invalid',
    message: 'Invalid product id.'
  },

  invalid_twitter_id: {
    parameter: 'twitter_id',
    code: 'invalid',
    message: 'Invalid twitter id.'
  },

  invalid_twitter_secret: {
    parameter: 'secret',
    code: 'invalid',
    message: 'Invalid twitter secret.'
  },

  invalid_receiver_user_id: {
    parameter: 'receiver_user_id',
    code: 'invalid',
    message: 'Invalid receiver user id.'
  },

  invalid_payment_id: {
    parameter: 'payment_id',
    code: 'invalid',
    message: 'Invalid payment id.'
  },

  video_deleted: {
    parameter: 'video_id',
    code: 'invalid',
    message: 'Video has been deleted.'
  },

  reply_deleted: {
    parameter: 'reply_id',
    code: 'invalid',
    message: 'Unable to fetch the reply because it has been deleted.'
  },

  invalid_pepocorn_amount: {
    parameter: 'pepocorn_amount',
    code: 'invalid',
    message: 'Pepocorn amount is invalid.'
  },

  invalid_supported_entities: {
    parameter: 'supported_entities',
    code: 'invalid',
    message: 'Supported entities is invalid.'
  },

  invalid_per_reply_amount_in_wei: {
    parameter: 'per_reply_amount_in_wei',
    code: 'invalid',
    message: 'Please make sure the price entered is valid integer.'
  },

  invalid_video_description: {
    parameter: 'video_description',
    code: 'invalid',
    message: 'Please make sure the length of the description is 200 characters or less.'
  },

  invalid_link: {
    parameter: 'link',
    code: 'invalid',
    message: 'Please make sure the link entered is valid.'
  },

  invalid_limit: {
    parameter: 'limit',
    code: 'invalid',
    message: 'Oops! Something went wrong.'
  },

  invalid_poster_image_url: {
    parameter: 'poster_image_url',
    code: 'invalid',
    message: 'Oops! Something went wrong.'
  },

  invalid_tag_id: {
    parameter: 'tag_id',
    code: 'invalid',
    message: 'Oops! Something went wrong.'
  },

  missing_reply_detail_id: {
    parameter: 'reply_detail_id',
    code: 'missing',
    message: 'Oops! Something went wrong.'
  },

  missing_video_id: {
    parameter: 'video_id',
    code: 'missing',
    message: 'Oops! Something went wrong.'
  },

  missing_parent_id: {
    parameter: 'parent_id',
    code: 'missing',
    message: 'Oops! Something went wrong.'
  },

  missing_parent_kind: {
    parameter: 'parent_kind',
    code: 'missing',
    message: 'Oops! Something went wrong.'
  },

  invalid_topics: {
    parameter: 'topic_kind',
    code: 'invalid',
    message: 'Topic kind is invalid.'
  },

  invalid_endpoint_uuid: {
    parameter: 'endpoint_uuid',
    code: 'invalid',
    message: 'Endpoint uuid is invalid.'
  },

  invalid_channel_id: {
    parameter: 'channel_id',
    code: 'invalid',
    message: 'Channel does not exist.'
  },

  invalid_channel_user_role: {
    parameter: 'user_id',
    code: 'invalid',
    message: 'Only channel admins can start a meeting. Please make sure you are a channel administrator.'
  },

  meeting_already_exists: {
    parameter: 'channel_id',
    code: 'invalid',
    message: 'An active meeting is already going for this channel.'
  },

  channel_not_active: {
    parameter: 'channel_id',
    code: 'invalid',
    message: 'The channel has been disabled.'
  },

  missing_video_url: {
    parameter: 'video_url',
    code: 'missing',
    message: 'Oops! Something went wrong.'
  },
  // TODO feed - confirm languages - Added in sheet.
  mute_not_possible: {
    parameter: 'user_id',
    code: 'invalid',
    message: 'Please make sure you are not muting yourself.'
  },
  unmute_not_possible: {
    parameter: 'user_id',
    code: 'invalid',
    message: 'Please make sure you are not unmuting yourself.'
  },
  invalid_uuid: {
    parameter: 'uuid',
    code: 'invalid',
    message: 'Uuid is invalid.'
  }
};

module.exports = v1ErrorConfig;
