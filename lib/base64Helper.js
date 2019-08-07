/**
 * Class for base 64 helper.
 *
 * @class Base64Helper
 */
class Base64Helper {
  /**
   * Encode to base64 data.
   *
   * @param {object} data
   *
   * @returns {string}
   */
  encode(data) {
    const buff = new Buffer.from(data);

    return buff.toString('base64');
  }

  /**
   * Decode base64 data.
   *
   * @param {string} base64data
   *
   * @returns {string}
   */
  decode(base64data) {
    const buff = new Buffer.from(base64data, 'base64');

    return buff.toString('ascii');
  }
}

module.exports = new Base64Helper();
