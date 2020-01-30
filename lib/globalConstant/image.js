const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, invertedResizeStatuses, invertedKinds, imageResizeSizes, invertedResolutionKeyToShortMap;

/**
 * Class for image constants
 *
 * @class ImageConstants
 */
class ImageConstants {
  get activeStatus() {
    return 'ACTIVE';
  }

  get statuses() {
    const oThis = this;

    return { '1': oThis.activeStatus };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses ? invertedStatuses : util.invert(oThis.statuses);

    return invertedStatuses;
  }

  get resizeDone() {
    return 'RESIZE_DONE';
  }

  get resizeStarted() {
    return 'RESIZE_STARTED';
  }

  get resizeFailed() {
    return 'RESIZE_FAILED';
  }

  get notResized() {
    return 'NOT_RESIZED';
  }

  get originalResolution() {
    return 'original';
  }

  get resizeStatuses() {
    const oThis = this;

    return {
      '1': oThis.notResized,
      '2': oThis.resizeStarted,
      '3': oThis.resizeDone,
      '4': oThis.resizeFailed
    };
  }

  get invertedResizeStatuses() {
    const oThis = this;

    invertedResizeStatuses = invertedResizeStatuses ? invertedResizeStatuses : util.invert(oThis.resizeStatuses);

    return invertedResizeStatuses;
  }

  get profileImageKind() {
    return 'PROFILE_IMAGE';
  }

  get coverImageKind() {
    return 'COVER_IMAGE';
  }

  get posterImageKind() {
    return 'POSTER_IMAGE';
  }

  get channelImageKind() {
    return 'CHANNEL_IMAGE';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.profileImageKind,
      '2': oThis.coverImageKind,
      '3': oThis.posterImageKind,
      '4': oThis.channelImageKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    invertedKinds = invertedKinds ? invertedKinds : util.invert(oThis.kinds);

    return invertedKinds;
  }

  get allowedImageKinds() {
    const oThis = this;

    return {
      [oThis.profileImageKind]: 1,
      [oThis.coverImageKind]: 1,
      [oThis.posterImageKind]: 1,
      [oThis.channelImageKind]: 1
    };
  }

  get resizeSizes() {
    const oThis = this;

    imageResizeSizes = imageResizeSizes
      ? imageResizeSizes
      : {
          [oThis.profileImageKind]: {
            '144w': { width: 144 }
          },
          [oThis.coverImageKind]: {
            '144w': { width: 144 },
            '288w': { width: 288 },
            '576w': { width: 576 }
          },
          [oThis.posterImageKind]: {
            '288w': { width: 288 }
          },
          [oThis.channelImageKind]: {
            '288w': { width: 288 },
            '576w': { width: 576 },
            '720w': { width: 720 }
          }
        };

    return imageResizeSizes;
  }

  get twitterShortImagePrefix() {
    return '{{tw_im}}';
  }

  get twitterImagePrefix() {
    return 'https://pbs.twimg.com/profile_images';
  }

  get twitterImageUrlPrefix() {
    const oThis = this;

    return [oThis.twitterImagePrefix, oThis.twitterShortImagePrefix];
  }

  get resolutionKeyToShortMap() {
    const oThis = this;

    return {
      [oThis.originalResolution]: 'o',
      '144w': '144w',
      '288w': '288w',
      '576w': '576w'
    };
  }

  get invertedResolutionKeyToShortMap() {
    const oThis = this;

    invertedResolutionKeyToShortMap = invertedResolutionKeyToShortMap
      ? invertedResolutionKeyToShortMap
      : util.invert(oThis.resolutionKeyToShortMap);

    return invertedResolutionKeyToShortMap;
  }

  get githubShortImagePrefix() {
    return '{{gh_im}}';
  }

  get githubImagePrefix() {
    return 'https://avatars[0-9].githubusercontent.com/u';
  }

  get githubImageUrlPrefix() {
    const oThis = this;

    return [oThis.githubImagePrefix, oThis.githubShortImagePrefix];
  }

  get googleShortImagePrefix() {
    return '{{go_im}}';
  }

  get googleImagePrefix() {
    return 'https://lh[0-9].googleusercontent.com/';
  }

  get googleImageUrlPrefix() {
    const oThis = this;

    return [oThis.googleImagePrefix, oThis.googleShortImagePrefix];
  }

  /**
   * Figure out whether image url is from some external source.
   *
   * @param imageUrl
   * @returns {boolean}
   */
  isFromExternalSource(imageUrl) {
    const oThis = this;

    if (imageUrl.match(oThis.twitterImagePrefix) || imageUrl.match(oThis.twitterShortImagePrefix)) {
      return true;
    } else if (imageUrl.match(oThis.githubImagePrefix) || imageUrl.match(oThis.githubShortImagePrefix)) {
      return true;
    } else if (imageUrl.match(oThis.googleImagePrefix) || imageUrl.match(oThis.googleShortImagePrefix)) {
      return true;
    }

    return false;
  }

  /**
   * Enlarge shorten url which is from external source
   *
   * @param imageUrl
   * @returns {string}
   */
  enlargeExternalShortenUrl(imageUrl) {
    const oThis = this;

    let fullUrl = null;
    if (imageUrl.match(oThis.twitterShortImagePrefix)) {
      fullUrl = imageUrl.replace(oThis.twitterShortImagePrefix, oThis.twitterImagePrefix);
    } else if (imageUrl.match(oThis.githubShortImagePrefix)) {
      const imgPrefix = oThis.githubImagePrefix.replace('[0-9]', '0');
      fullUrl = imageUrl.replace(oThis.githubShortImagePrefix, imgPrefix);
    } else if (imageUrl.match(oThis.googleShortImagePrefix)) {
      const imgPrefix = oThis.googleImagePrefix.replace('[0-9]', '3');
      fullUrl = imageUrl.replace(oThis.googleShortImagePrefix, imgPrefix);
    }

    return fullUrl;
  }
}

module.exports = new ImageConstants();
