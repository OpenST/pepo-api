/**
 * Module for http error codes constants.
 *
 * @module lib/globalConstant/httpErrorCodes
 */

/**
 * Class for http error codes constants.
 *
 * @class HttpErrorCodes
 */
class HttpErrorCodes {
  /**
   * Get bad request error code.
   *
   * @return {Number}
   */
  get badRequestErrorCode() {
    return 400;
  }

  /**
   * Get unauthorized error code.
   *
   * @return {Number}
   */
  get unauthorizedErrorCode() {
    return 401;
  }

  /**
   * Get not found error code.
   *
   * @return {Number}
   */
  get notFoundErrorCode() {
    return 404;
  }

  /**
   * Get already exist error code.
   *
   * @return {Number}
   */
  get alreadyExistErrorCode() {
    return 409;
  }

  /**
   * Get unsupported version error code.
   *
   * @return {Number}
   */
  get unsupportedVersionErrorCode() {
    return 410;
  }

  /**
   * Get unprocessable entity error code.
   *
   * @return {Number}
   */
  get unprocessableEntityErrorCode() {
    return 422;
  }

  /**
   * Get internal server error error code.
   *
   * @return {Number}
   */
  get internalServerErrorErrorCode() {
    return 500;
  }

  /**
   * Get service unavailable error code.
   *
   * @return {Number}
   */
  get serviceUnavailableErrorCode() {
    return 503;
  }

  /**
   * Get allowed http error codes.
   *
   * @return {object}
   */
  get allowedHttpErrorCodes() {
    const oThis = this;

    return {
      [oThis.badRequestErrorCode]: 1,
      [oThis.unauthorizedErrorCode]: 1,
      [oThis.notFoundErrorCode]: 1,
      [oThis.alreadyExistErrorCode]: 0,
      [oThis.unsupportedVersionErrorCode]: 0,
      [oThis.unprocessableEntityErrorCode]: 0,
      [oThis.internalServerErrorErrorCode]: 1,
      [oThis.serviceUnavailableErrorCode]: 0
    };
  }
}

module.exports = new HttpErrorCodes();
