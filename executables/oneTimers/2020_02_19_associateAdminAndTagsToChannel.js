/**
 * Associate Admins and tags to a channel.
 *
 * Usage:- node executables/oneTimers/2020_02_19_associateAdminAndTagsToChannel.js --channelId 1 --admins '["dhananjay","patil"]' --tags '["apple","bat"]'
 *
 * NOTE:- Please pass tag names without '#'.
 *
 * @module
 */

const program = require('commander');

const rootPrefix = '../..',
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  AddInChannelLib = require(rootPrefix + '/lib/channelTagVideo/AddTagInChannel'),
  ChangeChannelUserRoleLib = require(rootPrefix + '/lib/channel/ChangeChannelUserRole'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers'),
  tagConstants = require(rootPrefix + '/lib/globalConstant/tag'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

program
  .option('--channelId <channelId>', 'Channel id')
  .option('--admins <admins>', 'admin users array')
  .option('--tags <tags>', 'tags names array')
  .parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log(
    '    node executables/oneTimers/2020_02_19_associateAdminAndTagsToChannel.js --channelId 1 --admins ' /
      ['dhananjay', 'patil'] /
      ' --tags ' /
      ['apple', 'bat'] /
      ' '
  );
  logger.log('');
  logger.log('');
});

if (!program.admins || !program.channelId || !program.tags) {
  program.help();
  process.exit(1);
}

class AssociateAdminAndTagsToChannel {
  constructor(params) {
    const oThis = this;

    oThis.channelId = params.channelId;
    oThis.adminUserNames = JSON.parse(params.admins);
    oThis.tagNames = JSON.parse(params.tags);

    oThis.adminUserIds = [];
    oThis.tagIds = [];
  }

  async perform() {
    const oThis = this;

    console.log(' Input adminUserNames ====>', oThis.adminUserNames);
    console.log(' Input tagNames ====>', oThis.tagNames);

    await oThis._validateChannel();

    await oThis._validateAndSetAdminUserIds();

    await oThis._fetchOrCreateTags();

    await oThis._associateTagsToChannel();

    await oThis._associateAdminsToChannel();
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
   * Validate admins.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndSetAdminUserIds() {
    const oThis = this;

    const userNamesToUserMap = await new UserModel().fetchByUserNames(oThis.adminUserNames);

    if (Object.keys(userNamesToUserMap).length !== oThis.adminUserNames.length) {
      console.log('Some admins are not present in admin db.');
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'e_o_atc_vc_2',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            adminUserNames: oThis.adminUserNames
          }
        })
      );
    }

    for (let userName in userNamesToUserMap) {
      oThis.adminUserIds.push(userNamesToUserMap[userName].id);
    }

    console.log('Final admin user ids to associate ------->', oThis.adminUserIds);
  }

  /**
   * Fetch existing or create new tags.
   *
   * @returns {Promise<[]>}
   * @private
   */
  async _fetchOrCreateTags() {
    const oThis = this;

    let tagNameToTagIdMap = {},
      newTagsToInsert = [],
      newTagsToCreateArray = [];

    const dbRows = await new TagModel()
      .select(['id', 'name'])
      .where({ name: oThis.tagNames })
      .fire();

    console.log('dbRows=====', dbRows);

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = new TagModel()._formatDbData(dbRows[index]);
      tagNameToTagIdMap[formatDbRow.name] = formatDbRow;
      oThis.tagIds.push(formatDbRow.id);
    }

    for (let ind = 0; ind < oThis.tagNames.length; ind++) {
      let inputTagName = oThis.tagNames[ind];
      if (!tagNameToTagIdMap[inputTagName]) {
        newTagsToInsert.push(inputTagName);
        newTagsToCreateArray.push([inputTagName, 0, tagConstants.invertedStatuses[tagConstants.activeStatus]]);
      }
    }

    // Creates new tags.
    if (newTagsToCreateArray.length > 0) {
      console.log('Some tags are not present in tags db.');
      await new TagModel().insertTags(newTagsToCreateArray);
    }

    // Fetch new inserted tags.
    const newTags = await new TagModel().getTags(newTagsToInsert);

    for (let ind = 0; ind < newTags.length; ind++) {
      oThis.tagIds.push(newTags[ind].id);
    }

    if (oThis.tagNames.length !== oThis.tagIds.length) {
      console.log('Some tags are not present in db.\nPlease verify.');
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'e_o_atc_vc_3',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            tagNames: oThis.tagNames,
            tagIds: oThis.tagIds
          }
        })
      );
    }

    console.log('Final Tag Ids to associate ------->', oThis.tagIds);
  }

  /**
   * Associate tags to channel.
   *
   * @returns {Promise<unknown[]>}
   * @private
   */
  async _associateTagsToChannel() {
    const oThis = this;

    let promiseArray = [];

    for (let ind = 0; ind < oThis.tags.length; ind++) {
      promiseArray.push(
        new AddInChannelLib({
          channelId: oThis.channelId,
          tagId: oThis.tags[ind]
        }).perform()
      );
    }

    return Promise.all(promiseArray);
  }

  /**
   * Associate admins to channel.
   *
   * @returns {Promise<unknown[]>}
   * @private
   */
  async _associateAdminsToChannel() {
    const oThis = this;

    let promiseArray = [];

    for (let ind = 0; ind < oThis.adminUserIds.length; ind++) {
      promiseArray.push(
        new ChangeChannelUserRoleLib({
          userId: oThis.adminUserIds[ind],
          channelId: oThis.channelId,
          role: channelUsersConstants.adminRole
        }).perform()
      );
    }

    return Promise.all(promiseArray);
  }
}

new AssociateAdminAndTagsToChannel({
  channelId: program.channelId,
  admins: program.admins,
  tags: program.tags
})
  .perform()
  .then(function() {
    process.exit(0);
  })
  .catch(function(err) {
    logger.error(err);
    process.exit(1);
  });
