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
  gotoConstants = require(rootPrefix + '/lib/globalConstant/goto'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

program
  .option('--gotoParams <gotoParams>', 'Goto params')
  .option('--text <text>', 'Activity text')
  .option('--publishNotification <publishNotification>', 'Is push notification required.')
  .option('--publishActivity <publishActivity>', 'Is activity required.')
  .option('--userIds <userIds>', 'User ids array')
  .parse(process.argv);

// gotoParams = {
//   kind: 'webview',
//   url: "https://stagingpepo.com?utm_type=1&utm_source=organic"
// };
//
// gotoParams = {
//   kind: 'notificationCentre'
// };
//
// JSON.stringify(gotoParams);

// notificationCentreGotoKind
// node executables/oneTimers/dynamicTextActivityPublisher.js --gotoParams '{"kind":"webview","url":"https://stagingpepo.com?utm_type=1&utm_source=organic"}' --publishNotification 0 --publishActivity 1 --text "New Test System Notification. Goto is webview." --userIds '[3001,3002]'
// node executables/oneTimers/dynamicTextActivityPublisher.js --gotoParams '{"kind":"notificationCentre"}' --publishNotification 1 --publishActivity 0 --text "New Test System Notification. Goto is notification centre." --userIds '[3001,3002]'

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log(
    'node executables/oneTimers/dynamicTextActivityPublisher.js --gotoParams \'{"kind":"webview","url":"https://stagingpepo.com?utm_type=1&utm_source=organic"}\' --publishNotification 0 --publishActivity 1 --text "New Test System Notification. Goto is webview." --userIds "[3001,3002]"'
  );
  logger.log('');
  logger.log('');
});

if (!program.gotoParams || !program.text) {
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

    oThis.gotoParams = JSON.parse(params.gotoParams);
    oThis.text = params.text;
    oThis.publishNotification = params.publishNotification || 0;
    oThis.publishActivity = params.publishActivity || 0;
    oThis.userIds = params.userIds || [];
  }

  /**
   * Perform.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    if (!oThis.userIds || oThis.userIds.length === 0) {
      logger.log('No user ids passed in command line params. So fetching user ids from Users Table.');
      await oThis._fetchUserIds();
    } else {
      // Sanitize input user ids array.
      oThis.userIds = JSON.parse(oThis.userIds);
    }

    await oThis._publishActivity();
  }

  /**
   * Fetch user ids
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUserIds() {
    const oThis = this;

    let minUserId = -1;

    const limit = 30;

    while (true) {
      const rows = await new UserModel()
        .select('id')
        .where({ status: userConstants.invertedStatuses[userConstants.activeStatus] })
        .where(['id > ?', minUserId])
        .limit(limit)
        .order_by('id asc')
        .fire();

      if (rows.length == 0) {
        break;
      } else {
        for (let ind = 0; ind < rows.length; ind++) {
          oThis.userIds.push(rows[ind].id);
          minUserId = rows[ind].id;
        }
      }
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

    logger.info('publishNotification: ', oThis.publishNotification);
    logger.info('publishActivity: ', oThis.publishActivity);
    logger.info('gotoParams: ', oThis.gotoParams);
    logger.info('publish userIds: ', oThis.userIds);

    for (let ind = 0; ind < oThis.userIds.length; ind++) {
      promiseArray.push(
        notificationJobEnqueue.enqueue(notificationJobConstants.systemNotification, {
          userId: oThis.userIds[ind],
          systemNotificationParams: {
            payload: {
              dynamicText: oThis.text
            },
            gotoParams: oThis.gotoParams
          },
          publishActivity: oThis.publishActivity,
          publishNotification: oThis.publishNotification
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
  gotoParams: program.gotoParams,
  text: program.text,
  publishNotification: program.publishNotification,
  publishActivity: program.publishActivity,
  userIds: program.userIds
})
  .perform()
  .then(function() {
    process.exit(0);
  })
  .catch(function(err) {
    logger.error(JSON.stringify(err));
    process.exit(1);
  });
