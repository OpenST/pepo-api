/**
 * Class to handle bit wise operations.
 *
 * @class BitHelper
 */
class BitHelper {
  getBit(number, bitPosition) {
    return (number & (1 << bitPosition)) === 0 ? 0 : 1;
  }

  setBit(number, bitPosition) {
    return number | (1 << bitPosition);
  }

  unsetBit(number, bitPosition) {
    const mask = ~(1 << bitPosition);

    return number & mask;
  }
}

module.exports = new BitHelper();
