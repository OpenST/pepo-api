/**
 * This script publishes in-app activity for all active users,
 * for given text and given goto params.
 *
 * Usage: node executables/oneTimers/dynamicTextActivityPublisher.js
 *
 * @module executables/oneTimers/dynamicTextActivityPublisher
 */

const program = require('commander');

const rootPrefix = '../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  notificationJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/notification'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

program
  .option('--url <url>', 'Goto url')
  .option('--text <text>', 'Activity text')
  .parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log(
    '    node executables/oneTimers/dynamicTextActivityPublisher.js --url "http://pepodev.com:8080" --text "Jason Goldberg replied to your video. Update the app to use this new feature."'
  );
  logger.log('');
  logger.log('');
});

if (!program.url || !program.text) {
  program.help();
  process.exit(1);
}

class DynamicTextActivityPublisher {
  /**
   * @constructor
   * @param params
   */
  constructor(params) {
    const oThis = this;

    oThis.url = params.url;
    oThis.text = params.text;

    oThis.userIds = [];
  }

  /**
   * Perform.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchUserIds();

    await oThis._publishActivity();
  }

  /**
   * Fetch user ids
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUserIds() {
    const oThis = this;

    let offset = 0,
      pageNo = 1;

    const limit = 30;

    while (true) {
      offset = (pageNo - 1) * limit;

      const rows = await new UserModel()
        .select('id')
        .where({ status: userConstants.invertedStatuses[userConstants.activeStatus] })
        .offset(offset)
        .limit(limit)
        .fire();

      if (rows.length == 0) {
        break;
      } else {
        for (let ind = 0; ind < rows.length; ind++) {
          oThis.userIds.push(rows[ind].id);
        }
      }

      pageNo += 1;
    }
  }

  /**
   * Publish activity for users
   * @returns {Promise<void>}
   * @private
   */
  async _publishActivity() {
    const oThis = this;

    let promiseArray = [];

    for (let ind = 0; ind < oThis.userIds.length; ind++) {
      promiseArray.push(
        notificationJobEnqueue.enqueue(notificationJobConstants.systemNotification, {
          userId: oThis.userIds[ind],
          systemNotificationParams: {
            payload: {
              url: oThis.url,
              dynamicText: oThis.text
            }
          }
        })
      );

      if ((ind + 1) % 30 == 0) {
        await Promise.all(promiseArray);
        promiseArray = [];
      }
    }

    await Promise.all(promiseArray);
    await basicHelper.sleep(5000);
  }
}

new DynamicTextActivityPublisher({
  url: program.url,
  text: program.text
})
  .perform()
  .then(function() {
    process.exit(0);
  })
  .catch(function(err) {
    logger.error(JSON.stringify(err));
    process.exit(1);
  });
