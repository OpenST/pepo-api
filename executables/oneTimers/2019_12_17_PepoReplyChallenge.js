/**
 * NOTE:- Please delete this script once pepo 'home for holidays' challenge winners are announced.
 *
 * @module executables/oneTimers/2019_12_17_PepoReplyChallenge
 */

const program = require('commander');

const rootPrefix = '../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  gotoConstants = require(rootPrefix + '/lib/globalConstant/goto'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  replyDetailsConstants = require(rootPrefix + '/lib/globalConstant/replyDetail');

const BATCH_SIZE = 30;

program.option('--parentVideoId <parentVideoId>', 'parent video id.').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/oneTimers/2019_12_17_PepoReplyChallenge.js --parentVideoId "4728"');
  logger.log('');
  logger.log('');
});

if (!program.parentVideoId) {
  program.help();
  process.exit(1);
}

/**
 * Class PepoReplyChallenge.
 *
 * @class PepoReplyChallenge
 */
class PepoReplyChallenge {
  /**
   * Constructor.
   *
   * @param {object} params
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.parentVideoId = params.parentVideoId;

    oThis.replyDetailsMap = {};
    oThis.userDetailsMap = {};
    oThis.replyShareUrlsMap = {};

    oThis.replyDetailIds = [];
    oThis.creatorUserIds = [];
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchReplyDetails();

    await oThis._fetchCreatorUserDetails();

    oThis._fetchReplyShareUrls();

    oThis._createCsvData();
  }

  /**
   * Fetch reply details.
   *
   * @returns {Promise<void>}
   */
  async _fetchReplyDetails() {
    const oThis = this;

    const dbRows = await new ReplyDetailsModel()
      .select('id, creator_user_id, entity_id, total_amount')
      .where({
        parent_id: oThis.parentVideoId,
        status: replyDetailsConstants.invertedStatuses[replyDetailsConstants.activeStatus]
      })
      .fire();

    if (dbRows.length === 0) {
      return;
    }

    for (let ind = 0; ind < dbRows.length; ind++) {
      let dbRow = dbRows[ind];
      oThis.replyDetailsMap[dbRow.id] = dbRow;
      oThis.replyDetailIds.push(dbRow.id);
      oThis.creatorUserIds.push(dbRow.creator_user_id);
    }
  }

  /**
   * Fetch user ids
   * @returns {Promise<void>}
   * @private
   */
  async _fetchCreatorUserDetails() {
    const oThis = this;

    if (oThis.creatorUserIds.length === 0) {
      return;
    }

    let offset = 0;
    let batchNo = 1;
    while (true) {
      let batchedUserIds = oThis.creatorUserIds.slice(offset, offset + BATCH_SIZE);
      offset = offset + BATCH_SIZE;

      batchNo += 1;

      if (batchedUserIds.length == 0) {
        break;
      }

      logger.info('====batchNo', batchNo - 1);

      await oThis._fetchUserData(batchedUserIds);
    }
  }

  /**
   * Fetch reply share urls.
   *
   */
  _fetchReplyShareUrls() {
    const oThis = this;

    if (oThis.replyDetailIds.length === 0) {
      return;
    }

    for (let ind = 0; ind < oThis.replyDetailIds.length; ind++) {
      const replyDetailId = oThis.replyDetailIds[ind];
      oThis.replyShareUrlsMap[replyDetailId] = oThis._generateReplyShareUrl(replyDetailId);
    }
  }

  /**
   * Create CSV Data array.
   *
   * @private
   */
  _createCsvData() {
    const oThis = this;

    if (oThis.replyDetailIds.length === 0) {
      console.log('No data present for this parent video.');
      return;
    }

    const csvDataArray = [];

    const headerRow = ['user_id', 'user_name', 'name', 'reply_share_url', 'total_amount'];

    csvDataArray.push(headerRow);

    for (let ind = 0; ind < oThis.replyDetailIds.length; ind++) {
      const replyDetailId = oThis.replyDetailIds[ind],
        replyDetails = oThis.replyDetailsMap[replyDetailId],
        creatorUserId = replyDetails.creator_user_id,
        creatorUserDetails = oThis.userDetailsMap[creatorUserId],
        replyShareUrl = oThis.replyShareUrlsMap[replyDetailId];

      const row = [
        creatorUserDetails.id,
        creatorUserDetails.user_name,
        creatorUserDetails.name,
        replyShareUrl,
        basicHelper.convertWeiToNormal(replyDetails.total_amount)
      ];

      csvDataArray.push(row);
    }

    for (let ind = 0; ind < csvDataArray.length; ind++) {
      // Print csv data for now.
      console.log(
        `${csvDataArray[ind][0]},${csvDataArray[ind][1]},${csvDataArray[ind][2]},${csvDataArray[ind][3]},${
          csvDataArray[ind][4]
        }`
      );
    }
  }

  /**
   * Fetch user data.
   *
   * @param userIds
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUserData(userIds) {
    const oThis = this;

    if (userIds.length === 0) {
      return;
    }

    const dbRows = await new UserModel()
      .select('id, user_name, name')
      .where({
        id: userIds
      })
      .fire();

    for (let ind = 0; ind < dbRows.length; ind++) {
      let dbRow = dbRows[ind];
      oThis.userDetailsMap[dbRow.id] = dbRow;
    }
  }

  /**
   * Generate video share url.
   *
   * @param replyDetailId
   * @returns {string}
   * @private
   */
  _generateReplyShareUrl(replyDetailId) {
    const oThis = this;

    return coreConstants.PA_DOMAIN + '/' + gotoConstants.replyGotoKind + '/' + replyDetailId;
  }
}

new PepoReplyChallenge({ parentVideoId: program.parentVideoId })
  .perform()
  .then(function() {
    process.exit(0);
  })
  .catch(function(err) {
    logger.error(JSON.stringify(err));
    process.exit(1);
  });
