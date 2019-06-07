'use strict';
/**
 * Global constants for result types
 *
 * @module lib/globalConstant/entityType
 */

/**
 *
 * @class
 */
class EntityType {
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

  get recoveryInfo() {
    return 'recovery_info';
  }

  get device() {
    return 'device';
  }
}

module.exports = new EntityType();
