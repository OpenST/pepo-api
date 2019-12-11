const fs = require('fs');

const rootPrefix = '../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  ActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  UserDeviceExtendedDetailModel = require(rootPrefix + '/app/models/mysql/UserDeviceExtendedDetail'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/adminActivityLogs'),
  pixelConstants = require(rootPrefix + '/lib/globalConstant/pixel'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

let activityLogIdBeforeThis = process.argv[2] || 0;

const logPixelTemplate = `{{timestamp}} :: 114.143.238.58 :: GET /devp101_pixel.png?v=2&tid=back_populate&did={{device_id}}&sesid=back_populate&serid=1&dt=back_populate&ua=${
  pixelConstants.pixelUserAgent
}&ee=user&ea=creator_approved&pt=back_populate&uid={{current_admin_user_id}}&approved_user_id={{current_user_id}}&mobile_app_version={{mobile_app_version}} HTTP/1.1 :: - :: ${
  pixelConstants.pixelUserAgent
}\n`;

let fileName = 'devp101_pixel_access.log-20191211.1575892201';
if (process.env.PA_ENVIRONMENT == 'production') {
  fileName = 'pp1001_pixel_access.log-20191211.1575892201';
}
const filePath = __dirname + '/../../' + fileName;

class backPopulateBecomeCreatorPixel {
  /**
   * Perform.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    while (1) {
      let userIds = [],
        userToApproverAdminDetailsMap = {},
        userToDeviceDataMap = {};

      const activityLogsResp = await new ActivityLogModel()
        .select('*')
        .where(['id < ?', activityLogIdBeforeThis])
        .where(['action=?', adminActivityLogConstants.invertedActions[adminActivityLogConstants.approvedAsCreator]])
        .order_by('id Desc')
        .limit(10)
        .fire();

      if (activityLogsResp.length == 0) {
        break;
      }
      for (let i = 0; i < activityLogsResp.length; i++) {
        let activityLog = activityLogsResp[i];
        userIds.push(activityLog.action_on);
        userToApproverAdminDetailsMap[activityLog.action_on] = activityLog;
      }

      const userDeviceExtResp = await new UserDeviceExtendedDetailModel()
        .select('*')
        .where({ user_id: userIds })
        .fire();

      for (let i = 0; i < userDeviceExtResp.length; i++) {
        userToDeviceDataMap[userDeviceExtResp[i].user_id] = userDeviceExtResp[i];
      }

      for (let i = 0; i < activityLogsResp.length; i++) {
        let activityLog = activityLogsResp[i],
          current_user_id = activityLog.action_on,
          actionTimestamp = userToApproverAdminDetailsMap[current_user_id].created_at,
          current_admin_user_id = userToApproverAdminDetailsMap[current_user_id].admin_id,
          mobile_app_version = '',
          deviceId = '';

        activityLogIdBeforeThis = userToApproverAdminDetailsMap[current_user_id].id;

        if (userToDeviceDataMap[current_user_id]) {
          mobile_app_version = userToDeviceDataMap[current_user_id].app_version;
          deviceId = userToDeviceDataMap[current_user_id].device_id;
        }

        let logline = logPixelTemplate
          .replace('{{timestamp}}', actionTimestamp)
          .replace('{{current_user_id}}', current_user_id)
          .replace('{{mobile_app_version}}', mobile_app_version)
          .replace('{{current_admin_user_id}}', current_admin_user_id)
          .replace('{{device_id}}', deviceId);

        await oThis.appendLoglineToFile(logline, current_user_id);
      }
    }
  }

  async appendLoglineToFile(logline, userId) {
    return new Promise(function(onResolve, onReject) {
      console.log('filePath----------', filePath);
      fs.appendFile(filePath, logline, function(err) {
        if (err) {
          logger.error(err);
        } else {
          logger.log('The log inserted for userId:' + userId);
        }
        onResolve();
      });
    });
  }
}

new backPopulateBecomeCreatorPixel()
  .perform()
  .then(function() {
    logger.win('All Devices recorded.');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('Devices recording failed. Error: ', err);
    process.exit(1);
  });
