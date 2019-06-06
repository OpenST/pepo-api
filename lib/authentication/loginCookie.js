const rootPrefix = '../..',
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
  }

  _setParts() {
    // split the cookie value by colon
    // if parts.length != 3 then reject
    // set oThis.userId
    // set oThis.timestamp
    // set oThis.token
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
    return Promise.reject();
  }
}
