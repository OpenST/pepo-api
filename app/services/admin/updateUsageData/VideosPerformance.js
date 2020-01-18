const rootPrefix = '../../../..',
  UpdateUsageDataBase = require(rootPrefix + '/app/services/admin/updateUsageData/Base'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
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

  /**
   * Enqueue in rabbitMq.
   *
   * @returns {Promise<void>}
   */
  async enqueue() {
    const oThis = this;

    await oThis.enqueueMultipleJobs();

    const queryEndTimeStampInSeconds = 1579277944; // TODO - change this in next best of week

    // For 7 days.
    const queryStartTimeStampInSecondsForSevenDays = queryEndTimeStampInSeconds - 7 * 24 * 60 * 60;

    const sheetGid = basicHelper.isProduction() ? 829142765 : 1851904912;

    await oThis._enqueueJob({
      queryStartTimeStampInSeconds: queryStartTimeStampInSecondsForSevenDays,
      queryEndTimeStampInSeconds: queryEndTimeStampInSeconds,
      sheetName: 'Interval Video Stats Last 7 days',
      sheetGid: sheetGid,
      allVideosButOnlyTimeIntervalData: true
    });
  }
}

module.exports = VideosPerformance;
