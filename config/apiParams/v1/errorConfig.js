/**
 * Module to define error config for API v1 errors.
 *
 * @module config/apiParams/v1/errorConfig
 */

const v1ErrorConfig = {
  invalid_email: {
    parameter: 'email',
    code: 'invalid',
    message: 'Invalid parameter email.'
  },
  invalid_password: {
    parameter: 'password',
    code: 'invalid',
    message: 'Invalid parameter password.'
  }
};

module.exports = v1ErrorConfig;
