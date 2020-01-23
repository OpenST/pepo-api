const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Base class for usage data update.
 *
 * @class UsageDataBase
 */
class UsageDataBase extends ServiceBase {
  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis.enqueue();

    return responseHelper.successWithData({});
  }

  /**
   * Returns background job kind.
   */
  get kind() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Enqueue in rabbitMq.
   *
   * @returns {Promise<void>}
   */
  async enqueue() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Enqueue multiple jobs.
   *
   * @returns {Promise<void>}
   */
  async enqueueMultipleJobs() {
    const oThis = this;

    // For lifetime data.
    const promisesArray = [
      oThis._enqueueJob({ queryStartTimeStampInSeconds: null, queryEndTimeStampInSeconds: null })
    ];

    const queryEndTimeStampInSeconds = Math.floor(Date.now() / 1000);

    // For 7 days.
    const queryStartTimeStampInSecondsForSevenDays = queryEndTimeStampInSeconds - 7 * 24 * 60 * 60;
    // For 24 hours.
    const queryStartTimeStampInSecondsForTwentyFourHours = queryEndTimeStampInSeconds - 24 * 60 * 60;

    promisesArray.push(
      oThis._enqueueJob({
        queryStartTimeStampInSeconds: queryStartTimeStampInSecondsForSevenDays,
        queryEndTimeStampInSeconds: queryEndTimeStampInSeconds
      })
    );

    promisesArray.push(
      oThis._enqueueJob({
        queryStartTimeStampInSeconds: queryStartTimeStampInSecondsForTwentyFourHours,
        queryEndTimeStampInSeconds: queryEndTimeStampInSeconds
      })
    );

    await Promise.all(promisesArray);
  }

  /**
   * Enqueue job
   *
   * @param params
   * @private
   */
  _enqueueJob(params) {
    const oThis = this;

    return bgJob.enqueue(oThis.kind, params)
  }
}

module.exports = UsageDataBase;
