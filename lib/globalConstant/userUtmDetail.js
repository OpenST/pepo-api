const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

/**
 * Class for user utm detail constants.
 *
 * @class
 */

let invertedKinds = null;

class UserUtmDetailConstants {
  /**
   * Constructor for user utm detail constants.
   *
   * @constructor
   */
  constructor() {}

  get signUpKind() {
    return 'signUp';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.signUpKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    if (invertedKinds) {
      return invertedKinds;
    }

    invertedKinds = util.invert(oThis.kinds);

    return invertedKinds;
  }

  /**
   * Cookie to set for utm params
   *
   * @param params
   * @returns {string}
   */
  utmCookieToSet(params) {
    const oThis = this;

    let cookieVal = [];
    if (params['utm_campaign'] && params['utm_campaign'].toLowerCase() != 'default') {
      cookieVal.push('uc', params['utm_campaign']);
    }
    if (params['utm_medium'] && params['utm_medium'].toLowerCase() != 'default') {
      cookieVal.push('um', params['utm_medium']);
    }
    if (params['utm_source'] && params['utm_source'].toLowerCase() != 'default') {
      cookieVal.push('us', params['utm_source']);
    }

    return cookieVal.join(':');
  }

  /**
   * Parse Utm Cookie
   *
   * @param cookieVal
   */
  parseUtmCookie(cookieVal) {
    const oThis = this;

    let utmParams = {};
    if (cookieVal) {
      let arr = cookieVal.split(':');
      for (let ind = 0; ind < arr.length; ind++) {
        if (ind % 2 == 0) {
          if (arr[ind] == 'uc') {
            utmParams.utmCampaign = arr[ind + 1];
          } else if (arr[ind] == 'um') {
            utmParams.utmMedium = arr[ind + 1];
          } else if (arr[ind] == 'us') {
            utmParams.utmSource = arr[ind + 1];
          }
        }
      }
    }

    return utmParams;
  }
}

module.exports = new UserUtmDetailConstants();
