const fs = require('fs');

const rootPrefix = '../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  ActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  UserDeviceExtendedDetailModel = require(rootPrefix + '/app/models/mysql/UserDeviceExtendedDetail'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/adminActivityLogs'),
  pixelConstants = require(rootPrefix + '/lib/globalConstant/pixel'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

let userIdsBeforeThis = process.argv[2] || 0;
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

      const userDbRows = await new UserModel()
        .select('*')
        .where(['id < ?', userIdsBeforeThis])
        .limit(10)
        .order_by('id Desc')
        .fire();

      if (userDbRows.length == 0) {
        break;
      }
      for (let i = 0; i < userDbRows.length; i++) {
        let user = userDbRows[i];
        userIds.push(user.id);
      }

      const activityLogsResp = await new ActivityLogModel()
        .select('*')
        .where({ action_on: userIds })
        .where(['action=?', adminActivityLogConstants.invertedActions[adminActivityLogConstants.approvedAsCreator]])
        .fire();

      for (let i = 0; i < activityLogsResp.length; i++) {
        userToApproverAdminDetailsMap[activityLogsResp[i].action_on] = activityLogsResp[i];
      }

      const userDeviceExtResp = await new UserDeviceExtendedDetailModel()
        .select('*')
        .where({ user_id: userIds })
        .order_by('id Desc')
        .fire();

      for (let i = 0; i < userDeviceExtResp.length; i++) {
        userToDeviceDataMap[userDeviceExtResp[i].user_id] = userDeviceExtResp[i];
      }

      for (let i = 0; i < userDbRows.length; i++) {
        let user = userDbRows[i],
          timestamp = user.created_at,
          current_user_id = user.id,
          userApprovedBit = userConstants.invertedProperties[userConstants.isApprovedCreatorProperty];

        if ((user.properties & userApprovedBit) != userApprovedBit) {
          continue;
        }

        let mobile_app_version = userToDeviceDataMap[current_user_id]
            ? userToDeviceDataMap[current_user_id].app_version
            : '',
          deviceId = userToDeviceDataMap[current_user_id] ? userToDeviceDataMap[current_user_id].device_id : '',
          current_admin_user_id = userToApproverAdminDetailsMap[current_user_id]
            ? userToApproverAdminDetailsMap[current_user_id].admin_id
            : '';

        let logline = logPixelTemplate
          .replace('{{timestamp}}', timestamp)
          .replace('{{current_user_id}}', current_user_id)
          .replace('{{mobile_app_version}}', mobile_app_version)
          .replace('{{current_admin_user_id}}', current_admin_user_id)
          .replace('{{device_id}}', deviceId);

        await oThis.appendLoglineToFile(logline, user.id);
        userIdsBeforeThis = user.id;
      }
      break;
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
