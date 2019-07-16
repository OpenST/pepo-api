let sigIntStatus = 0;

/**
 * Class for for sigInt constants.
 *
 * @class
 */
class sigInt {
  /**
   * Constructor for sigInt constants.
   *
   * @constructor
   */
  constructor() {}

  // Statuses start.
  get getSigIntStatus() {
    return sigIntStatus;
  }

  get setSigIntStatus() {
    sigIntStatus = 1;
  }

  // Statuses end.
}

module.exports = new sigInt();
