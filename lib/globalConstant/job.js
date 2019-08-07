/**
 * Class for job constants.
 *
 * @class Job
 */
class Job {
  get allowedPublishedAfterTimes() {
    return {
      10000: 1, // 10s
      20000: 1, // 20s
      30000: 1 // 30s
    };
  }
}

module.exports = new Job();
