/**
 * Module for error log constants.
 *
 * @module lib/globalConstant/errorLogs
 */

/**
 * Class for error log constants.
 *
 * @class ErrorLogs
 */
class ErrorLogs {
  /**
   * Get high severity string.
   *
   * @return {String}
   */
  get highSeverity() {
    return 'high';
  }

  /**
   * Get medium severity string.
   *
   * @return {String}
   */
  get mediumSeverity() {
    return 'medium';
  }

  /**
   * Get low severity string.
   *
   * @return {String}
   */
  get lowSeverity() {
    return 'low';
  }

  /**
   * Get created status string.
   *
   * @return {String}
   */
  get createdStatus() {
    return 'created';
  }

  /**
   * Get processed status string.
   *
   * @return {String}
   */
  get processedStatus() {
    return 'processed';
  }

  /**
   * Get failed status string.
   *
   * @return {String}
   */
  get failedStatus() {
    return 'failed';
  }

  /**
   * Get failed status string.
   *
   * @return {String}
   */
  get completelyFailedStatus() {
    return 'completelyFailed';
  }

  /**
   * Get query limits for severities.
   *
   * @return {*}
   */
  get queryLimits() {
    const oThis = this;
    return {
      [oThis.highSeverity]: 100,
      [oThis.mediumSeverity]: 100,
      [oThis.lowSeverity]: 100
    };
  }

  /**
   * Get all severities.
   *
   * @return {*[]}
   */
  get severities() {
    const oThis = this;
    return [oThis.highSeverity, oThis.mediumSeverity, oThis.lowSeverity];
  }
}

module.exports = new ErrorLogs();
