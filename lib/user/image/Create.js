const rootPrefix = '../../..',
  ImageModel = require(rootPrefix + '/app/models/mysql/Image');

class CreateImage {
  /**
   * @constructor
   *
   * @param params
   * @param {object} params.resolutions - text to insert
   * @param {string} params.kind - image kind. Get it from image constants
   * @param {string} params.status - status of resize
   */
  constructor(params) {
    const oThis = this;

    oThis.resolutions = params.resolutions;
    oThis.kind = params.kind;
    oThis.status = params.status;
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async perform() {
    const oThis = this;

    let insertRsp = await new ImageModel({}).insertImage({
      resolutions: oThis.resolutions,
      kind: oThis.kind,
      status: oThis.status
    });

    return insertRsp;
  }
}

module.exports = CreateImage;
