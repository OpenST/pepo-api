const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for admin formatter.
 *
 * @class AdminFormatter
 */
class AdminFormatter extends BaseFormatter {
  /**
   * Constructor for admin formatter.
   *
   * @param {object} params
   * @param {object} params.admin
   *
   * @param {number} params.admin.id
   * @param {string} params.admin.name
   * @param {string} params.admin.email
   * @param {string} params.admin.status
   * @param {number} params.admin.createdAt
   * @param {number} params.admin.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.admin = params.admin;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const adminKeyConfig = {
      id: { isNullAllowed: false },
      name: { isNullAllowed: false },
      email: { isNullAllowed: false },
      status: { isNullAllowed: false },
      createdAt: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.admin, adminKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      id: Number(oThis.admin.id),
      name: oThis.admin.name,
      email: oThis.admin.email,
      status: oThis.admin.status,
      created_at: Number(oThis.admin.createdAt),
      updated_at: Number(oThis.admin.updatedAt)
    });
  }
}

module.exports = AdminFormatter;
