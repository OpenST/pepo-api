/**
 * Class for job constants.
 *
 * @class Job
 */
class Job {
  get allowedPublishedAfterTimes() {
    return {
      5000: 1, // 5 s.
      10000: 1, // 10s
      20000: 1, // 20s
      30000: 1, // 30s
      180000: 1 // 3mins
    };
  }
}

module.exports = new Job();
