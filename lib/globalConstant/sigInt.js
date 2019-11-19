let sigIntStatus = 0;

/**
 * Class for for sigInt constants.
 *
 * @class SigInt
 */
class SigInt {
  // Statuses start.
  get getSigIntStatus() {
    return sigIntStatus;
  }

  get setSigIntStatus() {
    sigIntStatus = 1;
  }
  // Statuses end.
}

module.exports = new SigInt();
