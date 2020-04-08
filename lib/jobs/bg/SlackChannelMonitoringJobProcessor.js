const rootPrefix = '../../..',
  AdminByIdCache = require(rootPrefix + '/lib/cacheManagement/single/AdminById'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  ChannelTagByChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelTagByChannelIds'),
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser.js'),
  TagByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/Tag'),
  TextsByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  slackWrapper = require(rootPrefix + '/lib/slack/wrapper'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  slackConstants = require(rootPrefix + '/lib/globalConstant/slack'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels');

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
    oThis.sourceId = params.source_id;
    oThis.channelId = params.channel_id;
    oThis.action = params.action;

    oThis.channelDetails = null;
    oThis.channelTagline = '';
    oThis.channelTags = [];
    oThis.channelAdmins = [];
    oThis.channelDescription = '';
    oThis.sourceUsername = '';
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchSourceUsername();

    await oThis._fetchChannelDetails();

    await oThis._fetchTagLineAndDescription();

    await oThis._fetchChannelTags();

    await oThis._fetchChannelAdminProfiles();

    await oThis._sendSlackMessage();
  }

  /**
   * Fetch source username.
   *
   * @sets oThis.sourceUsername
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchSourceUsername() {
    const oThis = this;

    let cacheResponse;

    if (oThis.source === slackConstants.adminSource) {
      cacheResponse = await new AdminByIdCache({ id: oThis.sourceId }).fetch();
      if (cacheResponse.isFailure()) {
        return Promise.reject(cacheResponse);
      }
      const adminInfo = cacheResponse.data[oThis.sourceId];
      if (!CommonValidators.validateNonEmptyObject(adminInfo)) {
        return Promise.reject(
          responseHelper.paramValidationError({
            internal_error_identifier: 'l_j_b_scmjp_1',
            api_error_identifier: 'invalid_api_params',
            params_error_identifiers: ['user_not_found'],
            debug_options: {
              userId: oThis.sourceId,
              userData: cacheResponse.data
            }
          })
        );
      }

      oThis.sourceUsername = adminInfo.name;
    } else if (oThis.source === slackConstants.userSource) {
      oThis.sourceUsername = 'Pepo user';
    }
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
    if (
      !CommonValidators.validateNonEmptyObject(oThis.channelDetails) ||
      oThis.channelDetails.status !== channelConstants.activeStatus
    ) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_j_b_scmjp_2',
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

    const channelAdminUserIdsMap = await new ChannelUserModel().fetchAdminProfilesByChannelId([oThis.channelId]),
      channelAdminUserIds = channelAdminUserIdsMap[oThis.channelId];

    for (let index = 0; index < channelAdminUserIds.length; index++) {
      oThis.channelAdmins.push(basicHelper.userProfilePrefixUrl() + '/' + channelAdminUserIds[index]);
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

    let messageHead, type, sourceType;

    if (oThis.action === slackConstants.channelCreated) {
      messageHead = '*Hi, Pepo Community created: *';
      type = 'New';
      sourceType = '*Created By*';
    } else if (oThis.action == slackConstants.channelUpdated) {
      messageHead = '*Hi, Pepo Community has been updated: *';
      type = 'Updated';
      sourceType = '*Updated By*';
    }

    message = `${messageHead}\n
      *Community Type*: ${type}\n
      *Status*: ${status}\n
      ${sourceType}: ${oThis.sourceUsername}\n
      *Name*: ${oThis.channelDetails.name}\n
      *Link*: ${communityUrl}\n
      *Community Admin*: ${oThis.channelAdmins.join(', ')}\n
      *Tagline*: ${oThis.channelTagline}\n
      *About*: ${oThis.channelDescription}\n
      *Tags*: ${oThis.channelTags.join(', ')}`;

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
      text: '*Hi, a Pepo Community has  been created or updated.*',
      blocks: oThis._generateBlocks()
    };

    return slackWrapper.sendMessage(slackMessageParams);
  }
}

module.exports = SlackChannelMonitoringJobProcessor;
