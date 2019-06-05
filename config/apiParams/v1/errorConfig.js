/**
 * Module to define error config for API v1 errors.
 *
 * @module config/apiParams/v1/errorConfig
 */

const v1ErrorConfig = {
  invalid_email: {
    parameter: 'user_name',
    code: 'invalid',
    message: 'Invalid parameter User Name.'
  },
  invalid_password: {
    parameter: 'password',
    code: 'invalid',
    message: 'Invalid parameter Password.'
  }
};

module.exports = v1ErrorConfig;
