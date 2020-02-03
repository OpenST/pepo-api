const rootPrefix = '../..',
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  ChannelTagModel = require(rootPrefix + '/app/models/mysql/channel/ChannelTag'),
  ChannelVideoTagDelegator = require(rootPrefix + '/lib/channelTagVideo/Delegator'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  channelTagConstants = require(rootPrefix + '/lib/globalConstant/channel/channelTags');

/**
 * Class to disassociate a new tag from channel.
 *
 * @class RemoveTagFromChannel
 */
class RemoveTagFromChannel {
  /**
   * Constructor to associate a new tag with channel.
   *
   * @param {object} params
   * @param {number} params.channelId
   * @param {number} params.tagId
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.channelId = params.channelId;
    oThis.tagId = params.tagId;

    oThis.channel = null;
    oThis.channelTag = null;
    oThis.channelVideoCount = 0;
    oThis.channelVideoMap = {};
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._validateChannel();

    await oThis._validateChannelTag();

    await oThis._updateChannelTag();

    await oThis._postChannelTagDisassociation();
  }

  /**
   * Fetch and validate channel.
   *
   * @sets oThis.channel
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateChannel() {
    const oThis = this;

    logger.info('Channel validation started.');

    const cacheResponse = await new ChannelByIdsCache({ ids: [oThis.channelId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.channel = cacheResponse.data[oThis.channelId];

    if (
      !CommonValidator.validateNonEmptyObject(oThis.channel) ||
      oThis.channel.status !== channelConstants.activeStatus
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'e_o_atc_vc_1',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            channelId: oThis.channelId
          }
        })
      );
    }

    logger.info('Channel validation done.');
  }

  /**
   * Fetch and validate channel tag.
   *
   * @sets oThis.channelId
   *
   * @returns {Promise<void>}
   */
  async _validateChannelTag() {
    const oThis = this;

    const response = await new ChannelTagModel()
      .select('*')
      .where({
        channel_id: oThis.channelId,
        tag_id: oThis.tagId
      })
      .fire();

    const channelTagRow = response[0];

    console.log('--channelTagRow------', channelTagRow);
    console.log('--channelTagRow------', !channelTagRow);
    console.log('--channelTagRow status------', channelTagRow.status);
    console.log('------status--', channelTagConstants.invertedStatuses[channelTagConstants.activeStatus]);
    if (
      !channelTagRow ||
      channelTagRow.status != channelTagConstants.invertedStatuses[channelTagConstants.activeStatus]
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'e_o_atc_vt_2',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            channelId: oThis.channelId,
            tagId: oThis.tagId
          }
        })
      );
    }

    oThis.channelTag = new ChannelTagModel().formatDbData(channelTagRow);

    logger.info('Channel Tag validation done.');
  }

  /**
   * Update channel tag.
   *
   * @sets oThis.channelTag
   *
   * @returns {Promise<never>}
   * @private
   */
  async _updateChannelTag() {
    const oThis = this;

    logger.info('ChannelTag addUpdateChannelTag started.');

    await new ChannelTagModel()
      .update({ status: channelTagConstants.invertedStatuses[channelTagConstants.inactiveStatus] })
      .where({
        id: oThis.channelTag.id
      })
      .fire();

    await ChannelTagModel.flushCache({ channelIds: [oThis.channelTag.channelId] });

    logger.info('ChannelTag addUpdateChannelTag done.');
  }

  /**
   * Post Channel Tag Association.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _postChannelTagDisassociation() {
    const oThis = this;

    await new ChannelVideoTagDelegator({
      tagIds: [oThis.tagId],
      channelIds: [oThis.channelId],
      isAddInChannelTagVideo: false
    }).perform();
  }
}

module.exports = RemoveTagFromChannel;
