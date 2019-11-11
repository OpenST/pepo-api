const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  multiRepliesList = require(rootPrefix + '/listReplies.json'),
  listZeroReplies = require(rootPrefix + '/listZeroReplies.json');

/**
 * Class for video reply details service.
 *
 * @class DummyList
 */
class DummyList extends ServiceBase {
  /**
   * Constructor for video reply details service.
   *
   * @param {object} params
   * @param {string/number} params.video_id
   * @param {object} [params.current_user]
   * @param {string} [params.pagination_identifier]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.videoId = +params.video_id;
    console.log('The oThis.videoId is : ', params);
  }

  /**
   * Async perform.
   *
   * @sets oThis.profileUserObj
   *
   * @return {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    if (oThis.videoId === 0) {
      return responseHelper.successWithData(listZeroReplies);
    }

    return responseHelper.successWithData(multiRepliesList);
  }
}

module.exports = DummyList;
