const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text');

let invertedShareKinds;

/**
 * Class for for share entity constants.
 *
 * @class ShareEntity
 */
class ShareEntity {
  // Share url start.
  get inviteShareUrl() {
    return coreConstants.PA_DOMAIN + '/?invite=';
  }
  // Share url end.

  // Share kinds start.
  get videoShareKind() {
    return 'VIDEO';
  }

  get inviteShareKind() {
    return 'INVITE';
  }
  // Share kinds end.

  getInviteShareEntity(url) {
    return {
      message: `Pepo is where the crypto community comes together, with short video updates and tokens of appreciation. It is so fast, so easy to use, you\'ll re-imagine what\'s possible with crypto. ${url}`,
      title: 'Pepo', // Optional.
      subject: 'Meet the people shaping the crypto movement.' // Optional.
    };
  }

  /**
   * Get share language for video share.
   *
   * @param {object} params
   * @param {string} params.creatorUserName
   * @param {string} params.url
   * @param {string} params.videoDescription
   *
   * @returns {{message: string, title: string, subject: string, url: *}}
   */
  getVideoShareEntity(params) {
    let message = `🌶️ Watch ${
      params.creatorUserName
    }'s latest video on Pepo - meet the people shaping the crypto movement ${params.url}`;

    if (params.videoDescription) {
      let truncatedVideoDescription =
        params.videoDescription.length > textConstants.truncatedVideoDescriptionLimit
          ? params.videoDescription.toString().substring(0, textConstants.truncatedVideoDescriptionLimit) + '...'
          : params.videoDescription;

      message = `🌶️ Watch ${
        params.creatorUserName
      }'s latest video on Pepo - ${truncatedVideoDescription} - meet the people shaping the crypto movement ${
        params.url
      }`;
    }
    return {
      message: message.replace(/&amp;/g, '&'),
      title: 'Latest videos on Pepo', // Optional.
      subject: 'Meet the people shaping the crypto movement.', // Optional.
      url: params.url
    };
  }
  /**
   * Get share language for pepo-app share.
   *
   * @param {object} params
   * @param {string} params.creatorUserName
   * @param {string} params.url
   *
   * @returns {{message: string, title: string, subject: string, url: *}}
   */ getVideoShareEntityForCuratedVideos(params) {
    return {
      message: `Check out ${
        params.creatorUserName
      }'s video update on Pepo - meet the people shaping the crypto movement ${params.url}`.replace(/&amp;/g, '&'),
      title: 'Pepo',
      subject: 'Meet the people shaping the crypto movement.',
      url: params.url
    };
  }
}
module.exports = new ShareEntity();
