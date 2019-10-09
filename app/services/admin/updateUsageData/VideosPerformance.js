const rootPrefix = '../../../..',
  UpdateUsageDataBase = require(rootPrefix + '/app/services/admin/updateUsageData/Base'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob');

/**
 * Class to update videos performance data in Google Sheets.
 *
 * @class VideosPerformance
 */
class VideosPerformance extends UpdateUsageDataBase {
  /**
   * Returns background job kind.
   *
   * @returns {string}
   */
  get kind() {
    return bgJobConstants.updateVideosPerformanceUsageTopic;
  }
}

module.exports = VideosPerformance;
