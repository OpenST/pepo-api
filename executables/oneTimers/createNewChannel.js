const program = require('commander');

const rootPrefix = '../..',
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  imageLib = require(rootPrefix + '/lib/imageLib'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  channelsConstants = require(rootPrefix + '/lib/globalConstant/channel/channels');

program
  .option('--channelName <channelName>', 'Channel Name')
  .option('--channelDescription <channelDescription>', 'Channel Description')
  .option('--imageUrl <imageUrl>', 'Image Url')
  .parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log(
    '    node executables/oneTimers/createNewChannel.js --channelName "PEPO" --channelDescription "This is a video description. Link: https://pepo.com. Tags: #test1 #test2" --imageUrl "https://something.com/image.jpg"'
  );
  logger.log('');
  logger.log('');
});

if (!program.channelName) {
  program.help();
  process.exit(1);
}

/**
 * Class to create a new channel.
 *
 * @class CreateNewChannel
 */
class CreateNewChannel {
  /**
   * Constructor to create a new channel.
   *
   * @param {object} params
   * @param {string} params.channelName
   * @param {string} [params.channelDescription]
   * @param {string} [params.imageUrl]
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.channelName = params.channelName;
    oThis.channelDescription = params.channelDescription || null;
    oThis.imageUrl = params.imageUrl || null;

    oThis.channelId = null;
    oThis.textInsertId = null;
  }

  async perform() {
    const oThis = this;

    console.log('=====', oThis.channelName);
    console.log('=====', oThis.channelDescription);
    console.log('=====', oThis.imageUrl);

    // Validate whether channel exists or not.
    await oThis.validateChannel();

    await oThis.createNewChannel();

    const promisesArray = [oThis.performChannelDescriptionRelatedTasks(), oThis.performImageUrlRelatedTasks()];
    await Promise.all(promisesArray);
  }

  /**
   * Fetch and validate channel.
   *
   * @returns {Promise<never>}
   * @private
   */
  async validateChannel() {
    const oThis = this;

    const dbRows = await new ChannelModel()
      .select('*')
      .where({ name: oThis.channelName })
      .fire();

    if (dbRows.length !== 0) {
      return Promise.reject(new Error('Channel name already exists'));
    }

    logger.info('Channel validation done.');
  }

  /**
   * Create new channel.
   *
   * @sets oThis.channelId
   *
   * @returns {Promise<void>}
   */
  async createNewChannel() {
    const oThis = this;

    const insertResponse = await new ChannelModel()
      .insert({ name: oThis.channelName, status: channelsConstants.invertedStatuses[channelsConstants.activeStatus] })
      .fire();

    oThis.channelId = insertResponse.insertId;

    logger.info(`Channel creation done. Channel ID: ${oThis.channelId}`);
  }

  /**
   * Perform channel description related tasks.
   *
   * @sets oThis.textInsertId
   *
   * @returns {Promise<void>}
   */
  async performChannelDescriptionRelatedTasks() {
    const oThis = this;

    // If channel description is not valid, consider it as null.
    if (!CommonValidators.validateChannelDescription(oThis.channelDescription)) {
      oThis.channelDescription = null;
    }

    if (!oThis.channelDescription) {
      return;
    }

    // Create new entry in texts table.
    const textRow = await new TextModel().insertText({
      text: oThis.channelDescription,
      kind: textConstants.channelDescriptionKind
    });

    const textInsertId = textRow.insertId;

    // Filter out tags from channel description.
    await new FilterTags(oThis.channelDescription, textInsertId).perform();

    await TextModel.flushCache({ ids: [textInsertId] });

    // Update channel table.
    await new ChannelModel()
      .update({ description_id: textInsertId })
      .where({ id: oThis.channelId })
      .fire();

    await ChannelModel.flushCache({ ids: [oThis.channelId] });
  }

  /**
   * Perform channel image url related tasks.
   *
   * @returns {Promise<void>}
   */
  async performImageUrlRelatedTasks() {
    const oThis = this;

    const imageParams = {
      imageUrl: oThis.imageUrl,
      kind: imageConstants.channelImageKind,
      channelId: oThis.channelId,
      userId: oThis.profileUserId,
      isExternalUrl: false,
      enqueueResizer: true
    };

    const resp = imageLib.validateAndSave(imageParams);
  }
}

new CreateNewChannel({
  channelName: program.channelName,
  channelDescription: program.channelDescription,
  imageUrl: program.imageUrl
})
  .perform()
  .then(function() {
    process.exit(0);
  })
  .catch(function(err) {
    logger.log(err);
    process.exit(1);
  });
