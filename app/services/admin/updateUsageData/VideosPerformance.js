const rootPrefix = '../../../..',
  UpdateUsageDataBase = require(rootPrefix + '/app/services/admin/updateUsageData/Base'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
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

    // For lifetime data.
    const promisesArray = [
      bgJob.enqueue(oThis.kind, { queryStartTimeStampInSeconds: null, queryEndTimeStampInSeconds: null })
    ];

    const queryStartTimeStampInSeconds = Math.round(Date.now() / 1000);

    // For 7 days.
    const queryEndTimeStampInSecondsForSevenDays = queryStartTimeStampInSeconds - 7 * 24 * 60 * 60;
    // For 24 hours.
    const queryEndTimeStampInSecondsForTwentyFourHours = queryStartTimeStampInSeconds - 24 * 60 * 60;

    promisesArray.push(
      bgJob.enqueue(oThis.kind, {
        queryStartTimeStampInSeconds: queryStartTimeStampInSeconds,
        queryEndTimeStampInSeconds: queryEndTimeStampInSecondsForSevenDays
      })
    );

    promisesArray.push(
      bgJob.enqueue(oThis.kind, {
        queryStartTimeStampInSeconds: queryStartTimeStampInSeconds,
        queryEndTimeStampInSeconds: queryEndTimeStampInSecondsForTwentyFourHours
      })
    );

    await Promise.all(promisesArray);
  }
}

module.exports = VideosPerformance;
