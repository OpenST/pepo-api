/**
 * Module to define error config for API admin errors.
 *
 * @module config/apiParams/admin/errorConfig
 */

const adminErrorConfig = {
  invalid_user_name: {
    parameter: 'user_name',
    code: 'invalid',
    message: 'User Name can contain alphanumeric and underscore and should be min 1 characters and max 15 characters'
  },
  invalid_password: {
    parameter: 'password',
    code: 'invalid',
    message: 'Password should be min 8 characters and max 40 characters'
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
  invalid_filter: {
    parameter: 'filter',
    code: 'invalid',
    message: 'Invalid Filter.'
  },
  user_inactive: {
    parameter: 'user_id',
    code: 'invalid',
    message: 'User is inactive.'
  },
  email_not_double_optin: {
    parameter: 'email',
    code: 'invalid',
    message: 'This email address is not double opt in.'
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
  invalid_link: {
    parameter: 'link',
    code: 'invalid',
    message: 'Invalid link.'
  },
  invalid_text: {
    parameter: 'text',
    code: 'invalid',
    message: 'Invalid text.'
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
  invalid_sort_by: {
    parameter: 'sort_by',
    code: 'invalid',
    message: 'Invalid sort by.'
  },
  invalid_entity_kind: {
    parameter: 'entity_kind',
    code: 'invalid',
    message: 'Invalid entity kind.'
  },
  invalid_entity_ids: {
    parameter: 'entity_ids',
    code: 'invalid',
    message: 'Invalid entity ids.'
  },
  invalid_entity_id: {
    parameter: 'entity_id',
    code: 'invalid',
    message: 'Invalid entity id.'
  }
};

module.exports = adminErrorConfig;
