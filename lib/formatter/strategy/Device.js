const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for device formatter.
 *
 * @class DeviceFormatter
 */
class DeviceFormatter extends BaseFormatter {
  /**
   * Constructor for device formatter.
   *
   * @param {object} params
   * @param {object} params.device
   *
   * @param {string} params.device.user_id
   * @param {string} params.device.address
   * @param {string} params.device.linked_address
   * @param {string} params.device.api_signer_address
   * @param {string} params.device.status
   * @param {string} params.device.updated_timestamp
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.device = params.device;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const deviceKeyConfig = {
      user_id: { isNullAllowed: false },
      address: { isNullAllowed: false },
      linked_address: { isNullAllowed: true },
      api_signer_address: { isNullAllowed: false },
      status: { isNullAllowed: false },
      updated_timestamp: { isNullAllowed: false }
    };

    return oThis._validateParameters(oThis.device, deviceKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {object}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      ost_user_id: oThis.device.user_id,
      address: oThis.device.address,
      linked_address: oThis.device.linked_address || '',
      api_signer_address: oThis.device.api_signer_address,
      status: oThis.device.status.toUpperCase(),
      updated_timestamp: Number(oThis.device.updated_timestamp)
    });
  }
}

module.exports = DeviceFormatter;
