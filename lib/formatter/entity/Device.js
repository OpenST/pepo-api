/**
 * Formatter for device entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/Device
 */

const rootPrefix = '../../..',
  resultType = require(rootPrefix + '/lib/globalConstant/resultType'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for device formatter.
 *
 * @class
 */
class DeviceFormatter {
  /**
   * Constructor for user formatter.
   *
   * @param {Object} params
   * @param {Object} params.device
   *
   * @param {String} params.device.user_id
   * @param {String} params.device.address
   * @param {String} params.device.linked_address
   * @param {String} params.device.api_signer_address
   * @param {String} params.device.status
   * @param {String} params.device.updated_timestamp
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.params = params;
  }

  /**
   * Perform
   *
   * @return {{}}
   */
  perform() {
    const oThis = this;

    const device = oThis.params.device;

    const formattedData = {
      ost_user_id: device.user_id,
      address: device.address,
      linked_address: device.linked_address || null,
      api_signer_address: device.api_signer_address,
      status: device.status.toUpperCase(),
      updated_timestamp: Number(device.updated_timestamp)
    };

    return responseHelper.successWithData(formattedData);
  }
}

module.exports = DeviceFormatter;
