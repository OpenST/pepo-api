const rootPrefix = '..',
  ApiParamsValidator = require(rootPrefix + '/lib/validators/ApiParams'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for routes helper.
 *
 * @class RoutesHelper
 */
class RoutesHelper {
  /**
   * Perform.
   *
   * @param req
   * @param res
   * @param next
   * @param serviceGetter : in case of getting from ic, this is the getter name. else it is relative path in app root folder
   * @param errorCode
   * @param afterValidationCallback
   * @param onServiceSuccess
   * @param onServiceFailure
   *
   * @return {Promise<*>}
   */
  static perform(
    req,
    res,
    next,
    serviceGetter,
    errorCode,
    afterValidationCallback,
    onServiceSuccess,
    onServiceFailure
  ) {
    const oThis = this,
      errorConfig = basicHelper.fetchErrorConfig(req.decodedParams.apiVersion);

    return oThis
      .asyncPerform(req, res, next, serviceGetter, afterValidationCallback, onServiceSuccess, onServiceFailure)
      .catch(async function(error) {
        let errorObject = error;

        if (responseHelper.isCustomResult(error)) {
          responseHelper.renderApiResponse(error, res, errorConfig);
        } else {
          errorObject = responseHelper.error({
            internal_error_identifier: `unhandled_catch_response:r_h:${errorCode}`,
            api_error_identifier: 'unhandled_catch_response',
            debug_options: { error: error.toString(), stack: error.stack }
          });
          logger.error(errorCode, 'Something went wrong', error);

          responseHelper.renderApiResponse(errorObject, res, errorConfig);
        }
      });
  }

  /**
   * Async perform.
   *
   * @param req
   * @param res
   * @param next
   * @param serviceGetter
   * @param afterValidationCallback
   * @param onServiceSuccess
   * @param onServiceFailure
   *
   * @return {Promise<*>}
   */
  static async asyncPerform(
    req,
    res,
    next,
    serviceGetter,
    afterValidationCallback,
    onServiceSuccess,
    onServiceFailure
  ) {
    req.decodedParams = req.decodedParams || {};

    const errorConfig = basicHelper.fetchErrorConfig(req.decodedParams.apiVersion);

    const apiParamsValidatorRsp = await new ApiParamsValidator({
      api_name: req.decodedParams.apiName,
      api_version: req.decodedParams.apiVersion,
      api_params: req.decodedParams
    }).perform();

    req.serviceParams = apiParamsValidatorRsp.data.sanitisedApiParams;

    if (afterValidationCallback) {
      req.serviceParams = await afterValidationCallback(req.serviceParams);
    }

    const handleResponse = async function(response) {
      if (response.isSuccess() && onServiceSuccess) {
        // If required, this function could reformat data as per API version requirements.
        // NOTE: This method should modify response.data
        response.data.sanitizedRequestHeaders = sanitizer.sanitizeParams(req.headers);
        await onServiceSuccess(response);
      }

      if (response.isFailure() && onServiceFailure) {
        await onServiceFailure(response);
      }

      responseHelper.renderApiResponse(response, res, errorConfig);
    };

    const Service = require(rootPrefix + '/app/services' + serviceGetter);

    return new Service(req.serviceParams).perform().then(handleResponse);
  }
}

module.exports = RoutesHelper;
