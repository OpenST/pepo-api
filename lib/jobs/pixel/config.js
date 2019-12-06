const rootPrefix = '../../..',
  pixelConstants = require(rootPrefix + '/lib/globalConstant/pixel');

module.exports = {
  [pixelConstants.getPixelIdentifierKey(pixelConstants.userEntityType, pixelConstants.creatorApprovedEntityAction)]: {
    mandatory: [],
    optional: []
  }
};
