const rootPrefix = '../../../..',
  UpdateUsageDataBase = require(rootPrefix + '/app/services/admin/updateUsageData/Base'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob');

/**
 * Class to update tags used data in Google Sheets.
 *
 * @class TagsUsed
 */
class TagsUsed extends UpdateUsageDataBase {
  /**
   * Returns background job kind.
   *
   * @returns {string}
   */
  get kind() {
    return bgJobConstants.updateTagsUsedUsageTopic;
  }

  /**
   * Enqueue in rabbitMq.
   *
   * @returns {Promise<void>}
   */
  async enqueue() {
    const oThis = this;

    await bgJob.enqueue(oThis.kind, {});
  }
}

module.exports = TagsUsed;
