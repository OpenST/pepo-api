const rootPrefix = '../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  commonValidator = require(rootPrefix + 'lib/validators/Common'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/SecureUserById');

class AuthLoginCookie {
  constructor(cookieValue) {
    const oThis = this;

    oThis.cookieValue = cookieValue;
  }

  async perform() {
    const oThis = this;

    await oThis._validate();

    await oThis._setParts();

    await oThis._validateUser();

    await oThis._validateToken();

    return responseHelper.successWithData({
      // send currentUser entity
    });
  }

  _validate() {
    // validate that cookie is a string
    const oThis = this;
    if (!commonValidator.validateString(oThis.cookieValue)) {
      oThis._unauthorizedResponse('l_a_lc_v_1');
    }
  }

  _setParts() {
    // split the cookie value by colon
    // if parts.length != 3 then reject
    // set oThis.userId
    // set oThis.timestamp
    // set oThis.token
    const oThis = this;
    let cookieValueParts = oThis.cookieValue.split(':');
    if (cookieValueParts.length != 3) {
      oThis._unauthorizedResponse('l_a_lc_sp_1');
    } else {
      oThis.userId = cookieValueParts[0];
      oThis.timestamp = cookieValueParts[1];
      oThis.token = cookieValueParts[2];
    }
  }

  async _validateUser() {
    const oThis = this;

    let cacheResponse = await new SecureUserCache({ userId: oThis.userId }).fetch();
    if (cacheResponse.isFailure()) oThis.currentUser = secureUserObj;
    // fetch user using userId - cache hit on secure user cache
    // validate that the status is active
  }

  _validateToken() {}

  _unauthorizedResponse(code) {
    return Promise.reject(
      responseHelper.error({
        internal_error_identifier: code,
        api_error_identifier: 'unauthorized_api_request'
      })
    );
  }
}
