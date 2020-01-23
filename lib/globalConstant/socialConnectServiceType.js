const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedSocialConnectServiceTypes = null;

/**
 * Class for social connect service types constants.
 *
 * @class SocialConnectServiceType
 */
class SocialConnectServiceType {
  get appleSocialConnect() {
    return 'apple';
  }

  get githubSocialConnect() {
    return 'github';
  }

  get googleSocialConnect() {
    return 'google';
  }

  get twitterSocialConnect() {
    return 'twitter';
  }

  get socialConnectServiceTypes() {
    const oThis = this;

    return {
      '1': oThis.twitterSocialConnect,
      '2': oThis.githubSocialConnect,
      '3': oThis.googleSocialConnect,
      '4': oThis.appleSocialConnect
    };
  }

  get invertedUserDeviceKinds() {
    const oThis = this;

    invertedSocialConnectServiceTypes =
      invertedSocialConnectServiceTypes || util.invert(oThis.socialConnectServiceTypes);

    return invertedSocialConnectServiceTypes;
  }
}

module.exports = new SocialConnectServiceType();
