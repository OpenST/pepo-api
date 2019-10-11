const crypto = require('crypto'),
  queryString = require('qs');

const rootPrefix = '../../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

/**
 * Class to create signature for Pepo Campaigns.
 *
 * @class CreateSignature
 */
class CreateSignature {
  /**
   * Return current date in RFC 3339 format.
   *
   * @param {date} date
   *
   * @return {string}
   */
  static rfc3339(date) {
    function pad(number) {
      return number < 10 ? '0' + number : number;
    }

    function timezoneOffset(offset) {
      if (offset === 0) {
        return 'Z';
      }
      const sign = offset > 0 ? '-' : '+';
      offset = Math.abs(offset);

      return sign + pad(Math.floor(offset / 60)) + ':' + pad(offset % 60);
    }

    return (
      date.getFullYear() +
      '-' +
      pad(date.getMonth() + 1) +
      '-' +
      pad(date.getDate()) +
      'T' +
      pad(date.getHours()) +
      ':' +
      pad(date.getMinutes()) +
      ':' +
      pad(date.getSeconds()) +
      timezoneOffset(date.getTimezoneOffset())
    );
  }

  /**
   * Get base params.
   *
   * @param {string} endpoint
   * @param {object} queryParams
   *
   * @return {{requestTime: string, signature: *}}
   */
  static baseParams(endpoint, queryParams) {
    const requestTime = CreateSignature.rfc3339(new Date());

    queryParams['request-time'] = requestTime;

    const stringToSign = `${endpoint}?${CreateSignature.formatQueryParams(queryParams)}`;

    const signature = CreateSignature.generateSignature(stringToSign);

    return {
      requestTime,
      signature
    };
  }

  static formatQueryParams(queryParams) {
    return queryString
      .stringify(queryParams, {
        arrayFormat: 'brackets',
        sort: function(elementOne, elementTwo) {
          return elementOne.localeCompare(elementTwo);
        }
      })
      .replace(/%20/g, '+');
  }

  /**
   * Generate signature.
   *
   * @param {string} stringToSign
   *
   * @return {string}
   */
  static generateSignature(stringToSign) {
    const pepoCampaignsSecretKey = coreConstants.PEPO_CAMPAIGN_CLIENT_SECRET;

    return crypto
      .createHmac('sha256', pepoCampaignsSecretKey)
      .update(stringToSign)
      .digest('hex');
  }
}

module.exports = CreateSignature;
