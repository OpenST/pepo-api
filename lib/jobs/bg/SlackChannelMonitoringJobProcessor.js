const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  ChannelTagByChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelTagByChannelIds'),
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser.js'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  TagByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/Tag'),
  TextsByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  slackWrapper = require(rootPrefix + '/lib/slack/wrapper'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  slackConstants = require(rootPrefix + '/lib/globalConstant/slack'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  channelUserConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers.js');

/**
 * Class for slack community monitoring job.
 *
 * @class SlackChannelMonitoringJobProcessor
 */
class SlackChannelMonitoringJobProcessor {
  /**
   * Constructor for slack community monitoring job.
   *
   * @param {object} params
   * @param {Integer} params.source
   * @param {Integer} params.source_id
   * @param {Integer} params.channel_id
   * @param {Integer} params.action
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.source = params.source;
    oThis.userId = params.source_id;
    oThis.channelId = params.channel_id;
    oThis.action = params.action;

    oThis.channelDetails = null;
    oThis.channelTagline = '';
    oThis.channelTags = [];
    oThis.channelAdmins = [];
    oThis.channelDescription = '';
    oThis.userData = null;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchChannelDetails();

    await oThis._fetchTagLineAndDescription();

    await oThis._fetchChannelTags();

    await oThis._fetchChannelAdminProfiles();

    await oThis._fetchUser();

    await oThis._sendSlackMessage();
  }

  /**
   * Fetch channel details
   *
   * @sets oThis.channelDetails
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchChannelDetails() {
    const oThis = this;

    const channelByIdsCacheResp = await new ChannelByIdsCache({ ids: [oThis.channelId] }).fetch();

    if (channelByIdsCacheResp.isFailure()) {
      return Promise.reject(channelByIdsCacheResp);
    }

    oThis.channelDetails = channelByIdsCacheResp.data[oThis.channelId];
    if (!CommonValidators.validateNonEmptyObject(oThis.channelDetails)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_j_b_scmjp_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_channel_id'],
          debug_options: {
            channelId: oThis.channelId,
            channelDetails: oThis.channelDetails
          }
        })
      );
    }
  }

  /**
   * Fetch tag line and description of channel.
   *
   * @sets oThis.channelTagline, oThis.channelDescription
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTagLineAndDescription() {
    const oThis = this;

    if (!oThis.channelDetails.taglineId) {
      return;
    }

    const taglineIdCacheResponse = await new TextsByIdCache({ ids: [oThis.channelDetails.taglineId] }).fetch();
    if (taglineIdCacheResponse.isFailure()) {
      return Promise.reject(taglineIdCacheResponse);
    }

    const channelTaglineObject = taglineIdCacheResponse.data[oThis.channelDetails.taglineId];
    if (channelTaglineObject && channelTaglineObject.text) {
      oThis.channelTagline = channelTaglineObject.text;
    }

    const descriptionTextCacheResponse = await new TextsByIdCache({
      ids: [oThis.channelDetails.descriptionId]
    }).fetch();
    if (descriptionTextCacheResponse.isFailure()) {
      return Promise.reject(descriptionTextCacheResponse);
    }

    const channelDescriptionObject = descriptionTextCacheResponse.data[oThis.channelDetails.descriptionId];
    if (channelDescriptionObject && channelDescriptionObject.text) {
      oThis.channelDescription = channelDescriptionObject.text;
    }
  }

  /**
   * Fetch channel tags.
   *
   * @sets oThis.channelTags
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchChannelTags() {
    const oThis = this;

    const cacheResponse = await new ChannelTagByChannelIdsCache({ channelIds: [oThis.channelId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const channelTagByChannelIdsCacheCacheData = cacheResponse.data;
    oThis.tagIds = channelTagByChannelIdsCacheCacheData[oThis.channelId];
    if (oThis.tagIds.length <= 0) {
      return responseHelper.successWithData({});
    }

    const cacheRsp = await new TagByIdCache({ ids: oThis.tagIds }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }
    oThis.tags = cacheRsp.data;

    for (let index = 0; index < oThis.tagIds.length; index++) {
      oThis.channelTags.push(oThis.tags[oThis.tagIds[index]].name);
    }
  }

  /**
   * Fetch channel admins.
   *
   * @sets oThis.channelAdmins
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchChannelAdminProfiles() {
    const oThis = this;

    const fetchByChannelIdResponse = await new ChannelUserModel()
      .select('user_id')
      .where({
        channel_id: oThis.channelId,
        role: channelUserConstants.invertedRoles[channelUserConstants.adminRole]
      })
      .fire();

    for (let index = 0; index < fetchByChannelIdResponse.length; index++) {
      oThis.channelAdmins.push(basicHelper.userProfilePrefixUrl() + '/' + fetchByChannelIdResponse[index].user_id);
    }
  }

  /**
   * Fetch user.
   *
   * @sets oThis.userData
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchUser() {
    const oThis = this;

    const cacheResponse = await new SecureUserCache({ id: oThis.userId }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.userData = cacheResponse.data;

    if (!CommonValidators.validateNonEmptyObject(oThis.userData)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_j_b_scmjp_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_found'],
          debug_options: {
            userId: oThis.userId,
            userData: oThis.userData
          }
        })
      );
    }
  }

  /**
   * Generate message to be posted on Slack.
   *
   * @returns {string}
   * @private
   */
  _generateMessage() {
    const oThis = this;

    const communityUrl = basicHelper.communitiesPrefixUrl() + '/' + oThis.channelDetails.permalink;

    let message = null;

    const status = oThis.channelDetails.status === channelConstants.activeStatus ? 'Active' : 'Hidden';
    if (oThis.action === slackConstants.channelCreated) {
      message = `*Hi, Pepo Community created: *\n
        *Community Type*: New\n
        *Status*: ${status}\n
        *Created By*: ${oThis.userData.name}\n
        *Name*: ${oThis.channelDetails.name}\n
        *Link*: ${communityUrl}\n
        *Admin*: ${oThis.channelAdmins.join(', ')}\n
        *Tagline*: ${oThis.channelTagline}\n
        *About*: ${oThis.channelDescription}\n
        *Tags*: ${oThis.channelTags.join(', ')}`;
    } else if (oThis.action == slackConstants.channelUpdated) {
      message = `*Hi, Pepo Community has been updated: *\n
        *Community Type*: Updated\n
        *Status*: ${status}\n
        *Updated By*: ${oThis.userData.name}\n
        *Name*: ${oThis.channelDetails.name}\n
        *Link*: ${communityUrl}\n
        *Admin*: ${oThis.channelAdmins.join(', ')}\n
        *Tagline*: ${oThis.channelTagline}\n
        *About*: ${oThis.channelDescription}\n
        *Tags*: ${oThis.channelTags.join(', ')}`;
    }

    return message;
  }

  /**
   * Generate block data.
   *
   * @returns {array}
   * @private
   */
  _generateBlocks() {
    const oThis = this;

    const blocks = [];

    blocks.push(slackConstants.addTextSection(oThis._generateMessage()));
    blocks.push(slackConstants.addChannelBlockSection(oThis.channelId));
    blocks.push(slackConstants.addDividerSection);

    return blocks;
  }

  /**
   * Send slack message.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _sendSlackMessage() {
    const oThis = this;

    const slackMessageParams = {
      channel: slackConstants.pepoCommunitiesMonitoringChannelName,
      unfurl_links: false,
      text: null,
      blocks: oThis._generateBlocks()
    };

    return slackWrapper.sendMessage(slackMessageParams);
  }
}

module.exports = SlackChannelMonitoringJobProcessor;
