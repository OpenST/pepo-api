const rootPrefix = '../../..',
  pixelConstants = require(rootPrefix + '/lib/globalConstant/pixel');

class pixelFire {
  async perform(params) {
    const oThis = this,
      entityKind = params.entity_kind;

    const specificVars = await oThis._getSpecificVars(entityKind, params.payload);

    const pixelVars = Object.assign({}, oThis._defaultVars, specificVars);

    //fire Pixel
  }

  async _getSpecificVars(entityType, messagePayload) {
    switch (entityType) {
      case pixelConstants.registerEntityType: {
        return messagePayload;
      }
      case pixelConstants.accountUpdateEntityType: {
        return messagePayload;
      }
      default: {
        throw new Error(`Unrecognized entityKind: ${entityType}. \npayload: ${JSON.stringify(messagePayload)}`);
      }
    }
  }

  get _defaultVars() {
    return {};
  }
}

module.exports = new pixelFire();
