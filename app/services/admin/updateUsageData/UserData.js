const rootPrefix = '../../../..',
  UpdateUsageDataBase = require(rootPrefix + '/app/services/admin/updateUsageData/Base'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob');

/**
 * Class to update user data in Google Sheets.
 *
 * @class UserData
 */
class UserData extends UpdateUsageDataBase {
  /**
   * Returns background job kind.
   *
   * @returns {string}
   */
  get kind() {
    return bgJobConstants.updateUserDataUsageTopic;
  }

  /**
   * Enqueue in rabbitMq.
   *
   * @returns {Promise<void>}
   */
  async enqueue() {
    const oThis = this;

    await oThis.enqueueMultipleJobs();
  }
}

module.exports = UserData;
