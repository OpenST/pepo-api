const rootPrefix = '../..';

class pixelFire {
  perform(params) {
    const oThis = this,
      entityKind = params.entity_kind;

    const specificVars = oThis._getSpecificVars(entityKind, params.payload);

    const pixelVars = Object.assign({}, oThis._defaultVars, specificVars);

    //fire Pixel
  }

  async _getSpecificVars(entityKind, messagePayload) {
    switch (entityKind) {
      case pepoMobileEventConstants.videoPlayStartTopic: {
        return messagePayload;
      }
      case pepoMobileEventConstants.videoPlayEndTopic: {
        return messagePayload;
      }
      default: {
        throw new Error(`Unrecognized entityKind: ${entityKind}. \npayload: ${JSON.stringify(messagePayload)}`);
      }
    }
  }

  get _defaultVars() {
    return {};
  }
}

module.exports = new pixelFire();
