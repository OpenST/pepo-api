const rootPrefix = '../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  AddInChannelTagVideo = require(rootPrefix + '/lib/channelTagVideo/Add'),
  RemoveFromChannelTagVideo = require(rootPrefix + '/lib/channelTagVideo/Remove'),
  PrepareDataByVideoIdAndTagIds = require(rootPrefix + '/lib/channelTagVideo/PrepareDataByVideoIdAndTagIds'),
  PrepareDataByChannelIdAndTagIds = require(rootPrefix + '/lib/channelTagVideo/PrepareDataByChannelIdAndTagIds');

/**
 *
 * @class Delegator
 */
class Delegator {
  /**
   * @param {object} params
   * @param {array} params.tagIds
   * @param {array} [params.videoIds]
   * @param {array} [params.channelIds]
   * @param {boolean} params.isAddInChannelTagVideo
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.tagIds = params.tagIds;
    oThis.videoIds = params.videoIds || [];
    oThis.channelIds = params.channelIds || [];
    oThis.isAddInChannelTagVideo = params.isAddInChannelTagVideo;

    oThis.channelIdToVideoTagsMap = {};
    oThis.videoIdToVideoDetailsMap = {};
  }

  /**
   * Perform
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._validateAndSanitize();

    await oThis._prepareDataForProcessing();

    if (CommonValidator.validateNonEmptyObject(oThis.channelIdToVideoTagsMap)) {
      await oThis._performSpecificOperation();
    }

    return responseHelper.successWithData({});
  }

  /**
   * Validate and Sanitize
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndSanitize() {
    const oThis = this;

    if (oThis.videoIds.length > 0 && oThis.channelIds.length > 0) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_ctv_d_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            videoIds: oThis.videoIds,
            channelIds: oThis.channelIds
          }
        })
      );
    }

    if (oThis.tagIds.length === 0) {
      logger.error('Tag ids array cannot by empty');
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_ctv_d_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            tagIds: oThis.tagIds
          }
        })
      );
    }
  }

  /**
   * Prepare data for processing
   *
   * @returns {Promise<void>}
   * @private
   */
  async _prepareDataForProcessing() {
    const oThis = this;
    let preparedData = null;
    if (oThis.videoIds.length > 0) {
      preparedData = await new PrepareDataByVideoIdAndTagIds({
        videoId: oThis.videoIds[0],
        tagIds: oThis.tagIds
      }).perform();
    } else if (oThis.channelIds.length > 0) {
      preparedData = await new PrepareDataByChannelIdAndTagIds({
        channelId: oThis.channelIds[0],
        tagIds: oThis.tagIds
      }).perform();
    } else {
      logger.error('Both channel ids array and video ids array cannot be empty.');
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_ctv_d_3',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            tagIds: oThis.tagIds
          }
        })
      );
    }

    if (preparedData.isFailure()) {
      return Promise.reject(preparedData);
    }

    oThis.channelIdToVideoTagsMap = preparedData.data.channelIdToVideoTagsMap;
    oThis.videoIdTagIdToVideoDetailsMap = preparedData.data.videoIdTagIdToVideoDetailsMap;
  }

  /**
   * Perform specific operation.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performSpecificOperation() {
    const oThis = this;

    if (oThis.isAddInChannelTagVideo) {
      await new AddInChannelTagVideo({
        channelIdToVideoTagsMap: oThis.channelIdToVideoTagsMap,
        videoIdTagIdToVideoDetailsMap: oThis.videoIdTagIdToVideoDetailsMap
      }).perform();
    } else {
      await new RemoveFromChannelTagVideo({
        channelIdToVideoTagsMap: oThis.channelIdToVideoTagsMap,
        videoIdTagIdToVideoDetailsMap: oThis.videoIdTagIdToVideoDetailsMap
      }).perform();
    }
  }
}
module.exports = Delegator;
