'use strict';
/**
 * Global constants for result types
 *
 * @module lib/globalConstant/resultType
 */

/**
 *
 * @class
 */
class ResultType {
  /**
   * Constructor
   *
   * @constructor
   */
  constructor() {}

  get user() {
    return 'user';
  }

  get loggedInUser() {
    return 'logged_in_user';
  }
}

module.exports = new ResultType();
