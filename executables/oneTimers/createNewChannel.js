const program = require('commander');

const rootPrefix = '../..',
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  FilterOutLinks = require(rootPrefix + '/lib/FilterOutLinks'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  imageLib = require(rootPrefix + '/lib/imageLib'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  channelsConstants = require(rootPrefix + '/lib/globalConstant/channel/channels');

program
  .option('--channelName <channelName>', 'Channel Name')
  .option('--channelTagline <channelTagline>', 'Channel Tagline')
  .option('--channelDescription <channelDescription>', 'Channel Description')
  .option('--imageUrl <imageUrl>', 'Image Url')
  .parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log(
    '    node executables/oneTimers/createNewChannel.js --channelName "PEPO" --channelTagline "This is some tagline. #new #tagline" --channelDescription "This is a video description. Link: https://pepo.com. Tags: #test1 #test2" --imageUrl "https://s3.amazonaws.com/uassets.stagingpepo.com/d/ca/images/4a13513801c01f00868daa02f71f2551-original.png"'
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
   * @param {string} [params.channelTagline]
   * @param {string} [params.channelDescription]
   * @param {string} [params.imageUrl]
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.channelName = params.channelName;
    oThis.channelTagline = params.channelTagline || null;
    oThis.channelDescription = params.channelDescription || null;
    oThis.imageUrl = params.imageUrl || null;

    oThis.channelId = null;
    oThis.textInsertId = null;
  }

  async perform() {
    const oThis = this;

    console.log('Channel Name: ', oThis.channelName);
    console.log('Channel Tagline: ', oThis.channelTagline);
    console.log('Channel Description: ', oThis.channelDescription);
    console.log('Image URL: ', oThis.imageUrl);

    // Validate whether channel exists or not.
    await oThis.validateChannel();

    await oThis.createNewChannel();

    const promisesArray = [
      oThis.performChannelTaglineRelatedTasks(),
      oThis.performChannelDescriptionRelatedTasks(),
      oThis.performImageUrlRelatedTasks(),
      oThis.createChannelStat()
    ];
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

    if (!CommonValidators.validateChannelTitle(oThis.channelName)) {
      return Promise.reject(new Error('Invalid channel name.'));
    }

    const insertResponse = await new ChannelModel()
      .insert({ name: oThis.channelName, status: channelsConstants.invertedStatuses[channelsConstants.activeStatus] })
      .fire();

    oThis.channelId = insertResponse.insertId;

    logger.info(`Channel creation done. Channel ID: ${oThis.channelId}`);
  }

  /**
   * Perform channel tagline related tasks.
   *
   * @returns {Promise<void>}
   */
  async performChannelTaglineRelatedTasks() {
    const oThis = this;

    // If channel tagline is not valid, consider it as null.
    if (!CommonValidators.validateChannelTagline(oThis.channelTagline)) {
      oThis.channelTagline = null;
    }

    if (!oThis.channelTagline) {
      return;
    }

    // Create new entry in texts table.
    const textRow = await new TextModel().insertText({
      text: oThis.channelTagline,
      kind: textConstants.channelTaglineKind
    });

    const textInsertId = textRow.insertId;

    // Filter out tags from channel tagline.
    await new FilterTags(oThis.channelTagline, textInsertId).perform();

    await TextModel.flushCache({ ids: [textInsertId] });

    // Update channel table.
    await new ChannelModel()
      .update({ tagline_id: textInsertId })
      .where({ id: oThis.channelId })
      .fire();

    await ChannelModel.flushCache({ ids: [oThis.channelId] });

    logger.info('Added channel tagline.');
  }

  /**
   * Perform channel description related tasks.
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

    // Filter out links from channel description.
    await new FilterOutLinks(oThis.channelDescription, textInsertId).perform();

    await TextModel.flushCache({ ids: [textInsertId] });

    // Update channel table.
    await new ChannelModel()
      .update({ description_id: textInsertId })
      .where({ id: oThis.channelId })
      .fire();

    await ChannelModel.flushCache({ ids: [oThis.channelId] });

    logger.info('Added channel description.');
  }

  /**
   * Perform channel image url related tasks.
   *
   * @returns {Promise<void>}
   */
  async performImageUrlRelatedTasks() {
    const oThis = this;

    if (!oThis.imageUrl) {
      return;
    }

    const imageParams = {
      imageUrl: oThis.imageUrl,
      kind: imageConstants.channelImageKind,
      channelId: oThis.channelId,
      isExternalUrl: false,
      enqueueResizer: true
    };

    // Validate and save image.
    const resp = await imageLib.validateAndSave(imageParams);
    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    const imageData = resp.data;

    // Update channel table.
    await new ChannelModel()
      .update({ cover_image_id: imageData.insertId })
      .where({ id: oThis.channelId })
      .fire();

    await ChannelModel.flushCache({ ids: [oThis.channelId] });

    logger.info('Added channel image.');
  }

  /**
   * Create new entry in channel stat table.
   *
   * @returns {Promise<void>}
   */
  async createChannelStat() {
    const oThis = this;

    await new ChannelStatModel().insert({ channel_id: oThis.channelId, total_videos: 0, total_users: 0 }).fire();
  }
}

new CreateNewChannel({
  channelName: program.channelName,
  channelTagline: program.channelTagline,
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
