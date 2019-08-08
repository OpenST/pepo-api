const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, invertedKinds, imageResizeSizes;

/**
 * Class for image constants
 *
 * @class ImageConstants
 */
class ImageConstants {
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

  get profileImageKind() {
    return 'PROFILE_IMAGE';
  }

  get coverImageKind() {
    return 'COVER_IMAGE';
  }

  get posterImageKind() {
    return 'POSTER_IMAGE';
  }

  get originalResolution() {
    return 'original';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.notResized,
      '2': oThis.resizeStarted,
      '3': oThis.resizeDone,
      '4': oThis.resizeFailed
    };
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.profileImageKind,
      '2': oThis.coverImageKind,
      '3': oThis.posterImageKind
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses ? invertedStatuses : util.invert(oThis.statuses);

    return invertedStatuses;
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
      [oThis.posterImageKind]: 1
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
}

module.exports = new ImageConstants();
