const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base');

const ORIGIN_IMAGE_WIDTH = 1500;
const ORIGIN_IMAGE_HEIGHT = 642;
const SHARE_IMAGE_WIDTH = 1500;
const SHARE_IMAGE_HEIGHT = 750;
class EditChannel extends ServiceBase {
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
}

module.exports = EditChannel;
