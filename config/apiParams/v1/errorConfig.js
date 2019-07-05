/**
 * Module to define error config for API v1 errors.
 *
 * @module config/apiParams/v1/errorConfig
 */

const v1ErrorConfig = {
  invalid_user_name: {
    parameter: 'user_name',
    code: 'invalid',
    message: 'User Name can contain alphanumeric, _, -, . and should be min 4 characters and max 25 characters'
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
  invalid_privacy_type: {
    parameter: 'privacy_type',
    code: 'invalid',
    message: 'Invalid Privacy Type'
  },
  invalid_user_id: {
    parameter: 'url',
    code: 'invalid',
    message: 'Invalid url.'
  },
  invalid_user_id: {
    parameter: 'user_id',
    code: 'invalid',
    message: 'Invalid user id.'
  }
};

module.exports = v1ErrorConfig;
