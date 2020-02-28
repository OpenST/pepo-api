const program = require('commander'),
  fs = require('fs'),
  csv = require('csv-parser');

const rootPrefix = '..',
  CronBase = require(rootPrefix + '/executables/CronBase'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  s3Wrapper = require(rootPrefix + '/lib/aws/S3Wrapper'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/big/cronProcesses');

program.option('--cronProcessId <cronProcessId>', 'Cron table process ID').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/populateUserData --cronProcessId 13');
  logger.log('');
  logger.log('');
});

const cronProcessId = +program.cronProcessId;

const FILEPATH = coreConstants.USER_DATA_LOCAL_FILE_PATH;
const S3_FILEPATH = coreConstants.USER_DATA_S3_FILE_PATH;

if (!cronProcessId) {
  program.help();
  process.exit(1);
}

class PopulateUserData extends CronBase {
  constructor(params) {
    super(params);
    const oThis = this;
    oThis.canExit = true;
  }

  /**
   * Validate and sanitize.
   *
   * @private
   */
  _validateAndSanitize() {
    // Do nothing.
  }

  /**
   * Main function.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _start() {
    const oThis = this;

    oThis.canExit = false;

    await oThis._fetchUserData();

    await oThis._uploadToS3();

    oThis.canExit = true;

    return responseHelper.successWithData({});
  }

  /**
   * Fetch User data.
   *
   * @sets oThis.videoIds, oThis.videoIdToFeedMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUserData() {
    const oThis = this;

    const data = [['name', 'tokenholder_address', 'profile_image']];

    let limit = 100,
      offset = 0;

    while (true) {
      const userIds = [],
        imageIdsArray = [];

      let imageMap = {},
        tokenUserMap = {};

      const userDbRows = await new UserModel()
        .select(['name', 'profile_image_id', 'id'])
        .limit(limit)
        .offset(offset)
        .order_by('id desc')
        .fire();

      if (userDbRows.length === 0) {
        break;
      }

      for (let index = 0; index < userDbRows.length; index++) {
        const dbRow = userDbRows[index];
        userIds.push(dbRow.id);
        if (dbRow.profile_image_id) {
          imageIdsArray.push(dbRow.profile_image_id);
        }
      }

      const tokenDbRows = await new TokenUserModel()
        .select(['ost_token_holder_address', 'user_id'])
        .where({ user_id: userIds })
        .fire();

      for (let index = 0; index < tokenDbRows.length; index++) {
        const formatDbRow = new TokenUserModel().formatDbData(tokenDbRows[index]);
        tokenUserMap[formatDbRow.userId] = {};
        tokenUserMap[formatDbRow.userId]['ostTokenHolderAddress'] = formatDbRow.ostTokenHolderAddress;
      }

      if (imageIdsArray.length > 0) {
        const cacheRsp = await new ImageByIdCache({ ids: imageIdsArray }).fetch();

        if (cacheRsp.isFailure()) {
          return Promise.reject(cacheRsp);
        }

        imageMap = cacheRsp.data;
      }

      for (let index = 0; index < userDbRows.length; index++) {
        const user = userDbRows[index],
          tokenUser = tokenUserMap[user.id] || {},
          image = imageMap[user.profile_image_id] || {};

        let imageUrl = null;
        if (image && image.resolutions) {
          imageUrl = image.resolutions.original.url;
        }

        if (tokenUser.ostTokenHolderAddress) {
          data.push([user.name.replace(',', ','), tokenUser.ostTokenHolderAddress, imageUrl]);
        }
      }

      offset = offset + limit;
    }

    let txt = '';

    for (let index = 0; index < data.length; index++) {
      const row = data[index];
      txt = txt + row.join(',');
      if (index < data.length - 1) {
        txt = txt + '\n';
      }
    }

    return new Promise(function(onResolve, onReject) {
      console.log('Write to File Start.');

      fs.writeFile(FILEPATH, txt, (err) => {
        if (err) {
          onReject(err);
        }
        console.log('Successfully Written to File.');
        onResolve();
      });
    });
  }

  /**
   * Fetch User data.
   *
   * @sets oThis.videoIds, oThis.videoIdToFeedMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _uploadToS3() {
    const oThis = this;

    await s3Wrapper.putObject(coreConstants.S3_USER_ASSETS_BUCKET, S3_FILEPATH, FILEPATH);
  }

  /**
   * This function provides info whether the process has to exit.
   *
   * @returns {boolean}
   * @private
   */
  _pendingTasksDone() {
    const oThis = this;

    // Once sigint is received we will not process the next batch of rows.
    return oThis.canExit;
  }

  /**
   * Get cron kind.
   *
   * @returns {string}
   *
   * @private
   */
  get _cronKind() {
    return cronProcessesConstants.populateUserData;
  }
}

const populateUserDataObj = new PopulateUserData({ cronProcessId: +cronProcessId });

populateUserDataObj
  .perform()
  .then(function() {
    logger.step('** Exiting process');
    logger.info('Cron last run at: ', Date.now());
    process.emit('SIGINT');
  })
  .catch(function(err) {
    logger.error('** Exiting process due to Error: ', err);
    process.emit('SIGINT');
  });
