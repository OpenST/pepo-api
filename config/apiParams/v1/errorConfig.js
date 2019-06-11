/**
 * Module to define error config for API v1 errors.
 *
 * @module config/apiParams/v1/errorConfig
 */

const v1ErrorConfig = {
  invalid_user_name: {
    parameter: 'user_name',
    code: 'invalid',
    message: 'Invalid parameter User Name.'
  },
  invalid_password: {
    parameter: 'password',
    code: 'invalid',
    message: 'Invalid parameter Password.'
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
  invalid_limit: {
    parameter: 'limit',
    code: 'invalid',
    message:
      'A limit of 10 objects in an api request has been put in place to ensure the performance and reliability. Parameter limit possibly exceeds the threshold. Please verify and re-submit'
  }
};

module.exports = v1ErrorConfig;
