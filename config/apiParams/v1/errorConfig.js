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
  }
};

module.exports = v1ErrorConfig;
