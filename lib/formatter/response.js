/**
 * Standard response formatter
 *
 * @module lib/formatter/response
 */
const OSTBase = require('@ostdotcom/base'),
  responseHelper = new OSTBase.responseHelper({
    module_name: 'pepoApi'
  });

const rootPrefix = '../..',
  httpErrorCodes = require(rootPrefix + '/lib/globalConstant/httpErrorCodes');

responseHelper.renderApiResponse = function(result, res, errorConfig) {
  errorConfig = errorConfig || {};

  const formattedResponse = result.toHash(errorConfig);

  let status = result.success ? 200 : result._fetchHttpCode(errorConfig.api_error_config || {});

  if (parseInt(status) !== 200 && httpErrorCodes.allowedHttpErrorCodes[status] !== 1) {
    status = httpErrorCodes.internalServerErrorErrorCode;
  }

  return res.status(status).json(formattedResponse);
};

module.exports = responseHelper;
