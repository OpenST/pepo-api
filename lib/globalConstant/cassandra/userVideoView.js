const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let longToShortNamesMap;

/**
 * Class for user video view constants.
 *
 * @class userVideoViewConstants
 */
class userVideoViewConstants {
  get shortToLongNamesMap() {
    return {
      user_id: 'userId',
      video_id: 'videoId',
      last_view_at: 'lastViewAt',
      last_reply_view_at: 'lastReplyViewAt'
    };
  }

  get longToShortNamesMap() {
    const oThis = this;

    longToShortNamesMap = longToShortNamesMap || util.invert(oThis.shortToLongNamesMap);

    return longToShortNamesMap;
  }
}

module.exports = new userVideoViewConstants();
