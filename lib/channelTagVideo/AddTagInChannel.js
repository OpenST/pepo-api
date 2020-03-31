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
 * Class to associate a new tag with channel.
 *
 * @class AddTagInChannel
 */
class AddTagInChannel {
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

    await oThis._validateChannelTag();

    await oThis._addUpdateChannelTag();

    await oThis._postChannelTagAssociation();
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

    if (response.length > 0) {
      oThis.channelTag = new ChannelTagModel().formatDbData(response[0]);
    }

    if (
      CommonValidator.validateNonEmptyObject(oThis.channelTag) &&
      oThis.channelTag.status === channelTagConstants.activeStatus
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'e_o_atc_vt_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: {
            channelId: oThis.channelId,
            tagId: oThis.tagId
          }
        })
      );
    }

    logger.info('Channel Tag validation done.');
  }

  /**
   * Add/Update channel tag.
   *
   * @sets oThis.channelTag
   *
   * @returns {Promise<never>}
   * @private
   */
  async _addUpdateChannelTag() {
    const oThis = this;

    logger.info('ChannelTag addUpdateChannelTag started.');

    if (oThis.channelTag && oThis.channelTag.id) {
      await new ChannelTagModel()
        .update({ status: channelTagConstants.invertedStatuses[channelTagConstants.activeStatus] })
        .where({
          id: oThis.channelTag.id
        })
        .fire();

      oThis.channelTag.status = channelTagConstants.activeStatus;
    } else {
      const insertData = {
        channel_id: oThis.channelId,
        tag_id: oThis.tagId,
        status: channelTagConstants.invertedStatuses[channelTagConstants.activeStatus]
      };

      const insertResponse = await new ChannelTagModel().insert(insertData).fire();

      insertData.id = insertResponse.insertId;

      Object.assign(insertData, insertResponse.defaultUpdatedAttributes);

      oThis.channelTag = new ChannelTagModel().formatDbData(insertData);
    }

    await ChannelTagModel.flushCache({ channelIds: [oThis.channelTag.channelId] });

    logger.info('ChannelTag addUpdateChannelTag done.');
  }

  /**
   * Post Channel Tag Association.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _postChannelTagAssociation() {
    const oThis = this;

    await new ChannelVideoTagDelegator({
      tagIds: [oThis.tagId],
      channelIds: [oThis.channelId],
      isAddInChannelTagVideo: true
    }).perform();
  }
}

module.exports = AddTagInChannel;
