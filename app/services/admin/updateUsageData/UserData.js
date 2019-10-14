const rootPrefix = '../../../..',
  UpdateUsageDataBase = require(rootPrefix + '/app/services/admin/updateUsageData/Base'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
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

    // For lifetime data.
    const promisesArray = [
      bgJob.enqueue(oThis.kind, { queryStartTimeStampInSeconds: null, queryEndTimeStampInSeconds: null })
    ];

    const queryEndTimeStampInSeconds = Math.round(Date.now() / 1000);

    // For 7 days.
    const queryStartTimeStampInSecondsForSevenDays = queryEndTimeStampInSeconds - 7 * 24 * 60 * 60;
    // For 24 hours.
    const queryStartTimeStampInSecondsForTwentyFourHours = queryEndTimeStampInSeconds - 24 * 60 * 60;

    promisesArray.push(
      bgJob.enqueue(oThis.kind, {
        queryStartTimeStampInSeconds: queryStartTimeStampInSecondsForSevenDays,
        queryEndTimeStampInSeconds: queryEndTimeStampInSeconds
      })
    );

    promisesArray.push(
      bgJob.enqueue(oThis.kind, {
        queryStartTimeStampInSeconds: queryStartTimeStampInSecondsForTwentyFourHours,
        queryEndTimeStampInSeconds: queryEndTimeStampInSeconds
      })
    );

    await Promise.all(promisesArray);
  }
}

module.exports = UserData;
