const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base');

// Declare constants.
const ORIGIN_IMAGE_WIDTH = 1500;
const ORIGIN_IMAGE_HEIGHT = 642;
const SHARE_IMAGE_WIDTH = 1500;
const SHARE_IMAGE_HEIGHT = 750;

/**
 * Class to edit channel.
 *
 * @class EditChannel
 */
class EditChannel extends ServiceBase {
  /**
   * Constructor to edit channel.
   *
   * @param {object} params
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.isEdit = params.isEdit;
    oThis.name = params.name;
    oThis.description = params.description;
    oThis.tagLine = params.tagLine;
    oThis.permalink = params.permalink;
    oThis.admins = params.admins;
    oThis.originalImage = params.originalImage;
    oThis.shareImage = params.shareImage;
  }

  async _asyncPerform() {
    const oThis = this;
  }
}

module.exports = EditChannel;
