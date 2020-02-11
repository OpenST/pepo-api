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

  get channelShareKind() {
    return 'CHANNEL';
  }

  get profileShareKind() {
    return 'PROFILE';
  }

  get inviteShareKind() {
    return 'INVITE';
  }
  // Share kinds end.

  getInviteShareEntity(url) {
    return {
      // eslint-disable-next-line no-useless-escape
      message: `Pepo is where the crypto community comes together, with short video updates and tokens of appreciation. It is so fast, so easy to use, you\'ll re-imagine what\'s possible with crypto. ${url}`,
      title: 'Pepo', // Optional.
      subject: 'Meet your peeps!' // Optional.
    };
  }

  /**
   * Get channel share entity.
   *
   * @param {object} params
   * @param {string} params.channelName
   * @param {string} params.url
   * @param {string} [params.channelTagline]
   *
   * @returns {{subject: string, message: *, title: string, url: *}}
   */
  getChannelShareEntity(params) {
    const pepoTwitterHandle = `@${coreConstants.PEPO_TWITTER_HANDLE}`;

    const title = `${params.channelName} - Pepo`;
    const message = `Here's your invite to join the ${
      params.channelName
    } community on Pepo ${pepoTwitterHandle} - meet people who share your passions, make real connections. ${
      params.url
    }`;

    return {
      message: message.replace(/&amp;/g, '&'),
      title: title, // Optional.
      subject: title, // Optional.
      url: params.url
    };
  }

  /**
   * Get share entity for profile
   * @param {string} params.name
   * @param {string} params.url
   * @param {string} params.twitterHandle
   *
   * @param params
   * @returns {{subject: *, message: *, title: *, url: *}}
   */
  getProfileShareEntity(params) {
    const pepoTwitterHandle = `@${coreConstants.PEPO_TWITTER_HANDLE}`;

    const title = `${params.name} - Pepo`,
      twHandle = params.twitterHandle ? `@${params.twitterHandle} ` : '';

    const message = `Check out ${
      params.name
      // eslint-disable-next-line no-useless-escape
    }\'s ${twHandle}short videos on Pepo ${pepoTwitterHandle} - join the conversation! ${params.url}`;

    return {
      message: message.replace(/&amp;/g, '&'),
      title: title, // Optional.
      subject: title, // Optional.
      url: params.url
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
        message = `🎬 Check out my video on Pepo! ${pepoTwitterHandle} - ${truncatedVideoDescription} - ${params.url}`;
      } else {
        message = `🌶️ Watch ${
          params.creatorName
        }'s ${userTwitterHandle}video on Pepo ${pepoTwitterHandle} - ${truncatedVideoDescription} - ${params.url}`;
      }
    } else if (params.isSelfVideoShare) {
      message = `🎬 Check out my video on Pepo! ${pepoTwitterHandle} - ${params.url}`;
    } else {
      message = `🌶️ Watch ${
        params.creatorName
      }'s ${userTwitterHandle}video on Pepo ${pepoTwitterHandle} - Meet your peeps! ${
        params.url
      }`;
    }
    return {
      message: message.replace(/&amp;/g, '&'),
      title: 'Latest videos on Pepo', // Optional.
      subject: 'Meet your peeps!', // Optional.
      url: params.url
    };
  }
}
module.exports = new ShareEntity();
