const rootPrefix = '../../..',
  pixelConstants = require(rootPrefix + '/lib/globalConstant/pixel');

module.exports = {
  [pixelConstants.getPixelIdentifierKey(pixelConstants.userEntityType, pixelConstants.creatorApprovedEntityAction)]: {
    mandatory: ['entity_type', 'entity_action', 'page_type', 'page_name', 'approved_user_id', 'user_id']
  }
};
