const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text');

/**
 * Class for for share entity constants.
 *
 * @class ShareEntity
 */
class ShareEntity {
  // Share url start.
  get inviteShareUrl() {
    return `${coreConstants.PA_INVITE_DOMAIN}/`;
  }
  // Share url end.

  // Share kinds start.
  get videoShareKind() {
    return 'VIDEO';
  }

  get replyShareKind() {
    return 'REPLY';
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
   * @param {string} params.creatorName
   * @param {string} params.handle - twitter handle
   * @param {string} params.url
   * @param {string} params.videoDescription
   * @param {boolean} params.isSelfVideoShare
   *
   * @returns {{message: string, title: string, subject: string, url: *}}
   */
  getVideoShareEntity(params) {
    let message = null;

    const userTwitterHandle = params.handle ? `@${params.handle} ` : '',
      pepoTwitterHandle = `@${coreConstants.PEPO_TWITTER_HANDLE}`;

    if (params.videoDescription) {
      let truncateLimit = textConstants.truncatedVideoDescriptionLimit;
      if (params.isSelfVideoShare) {
        truncateLimit = textConstants.truncatedSelfVideoDescriptionLimit;
      }
      const truncatedVideoDescription =
        params.videoDescription.length > truncateLimit
          ? params.videoDescription.toString().substring(0, truncateLimit) + '...'
          : params.videoDescription;

      if (params.isSelfVideoShare) {
        message = `🎬 Check out my video on Pepo! @thepepoapp - ${truncatedVideoDescription} - ${params.url}`;
      } else {
        message = `🌶️ Watch ${
          params.creatorName
        }'s ${userTwitterHandle}video on Pepo ${pepoTwitterHandle} - ${truncatedVideoDescription} - ${params.url}`;
      }
    } else if (params.isSelfVideoShare) {
      message = `🎬 Check out my video on Pepo! @thepepoapp - ${params.url}`;
    } else {
      message = `🌶️ Watch ${
        params.creatorName
      }'s ${userTwitterHandle}video on Pepo ${pepoTwitterHandle} - meet the people shaping the crypto movement ${
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
   * @param params
   * @param {string} params.creatorName
   * @param {string} params.url
   *
   * @returns {{subject: string, message: *, title: string, url: *}}
   */ getVideoShareEntityForCuratedVideos(params) {
    return {
      message: `Check out ${params.creatorName}'s video update on Pepo - meet the people shaping the crypto movement ${
        params.url
      }`.replace(/&amp;/g, '&'),
      title: 'Pepo',
      subject: 'Meet the people shaping the crypto movement.',
      url: params.url
    };
  }
}
module.exports = new ShareEntity();
