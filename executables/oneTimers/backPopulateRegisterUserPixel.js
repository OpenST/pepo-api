const fs = require('fs');

const rootPrefix = '../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  InviteCodeModel = require(rootPrefix + '/app/models/mysql/InviteCode'),
  UserUtmDetailModel = require(rootPrefix + '/app/models/mysql/UserUtmDetail'),
  pixelConstants = require(rootPrefix + '/lib/globalConstant/pixel'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

//select u_id from devp101_tracker.pixels where e_entity='user' AND e_action='registration' order by id DESC;
const registeredUserIds = [1000, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009];

let userIdsBeforeThis = process.argv[2] || 0;
const logPixelTemplate = `{{timestamp}} :: 114.143.238.58 :: GET /devp101_pixel.png?v=2&tid=back_populate&serid=1&sesid=back_populate&dt=back_populate&ua=${
  pixelConstants.pixelUserAgent
}&ee=user&ea=registration&pt=back_populate&uid={{current_user_id}}&invite_code={{invite_code}}&registration_at={{registration_at}}&utm_source={{utm_source}}&utm_medium={{utm_medium}}&utm_campaign={{utm_campaign}} HTTP/1.1 :: - :: ${
  pixelConstants.pixelUserAgent
}\n`;

let fileName = 'devp101_pixel_access.log-20191211.1575892201';
if (process.env.PA_ENVIRONMENT == 'production') {
  fileName = 'pp1001_pixel_access.log-20191211.1575892201';
}
const filePath = __dirname + '/../../' + fileName;

class populateRegisterUserPixel {
  /**
   * Perform.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;
    const userUtmParams = {};

    const utmDbRows = await new UserUtmDetailModel().select('*').fire();
    for (let i = 0; i < utmDbRows.length; i++) {
      let utmParams = utmDbRows[i];
      userUtmParams[utmParams.user_id] = utmParams;
    }

    while (1) {
      let userIds = [];

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

      const userToInviterUser = {},
        inviterUserToCode = {},
        inviterCodeIds = [];

      const inviteCodeDbRows = await new InviteCodeModel()
        .select('*')
        .where({ user_id: userIds })
        .fire();

      for (let i = 0; i < inviteCodeDbRows.length; i++) {
        let inviteCodeRow = inviteCodeDbRows[i];
        if (inviteCodeRow.inviter_code_id) {
          userToInviterUser[inviteCodeRow.user_id] = inviteCodeRow.inviter_code_id;
          inviterCodeIds.push(inviteCodeRow.inviter_code_id);
        }
      }
      if (inviterCodeIds.length > 0) {
        const inviterCodeDbRows = await new InviteCodeModel()
          .select('*')
          .where({ id: inviterCodeIds })
          .fire();
        for (let i = 0; i < inviterCodeDbRows.length; i++) {
          let inviterCodeRow = inviterCodeDbRows[i];
          inviterUserToCode[inviterCodeRow.id] = inviterCodeRow.code;
        }
      }

      for (let i = 0; i < userDbRows.length; i++) {
        let user = userDbRows[i],
          timestamp = user.created_at,
          current_user_id = +user.id,
          registration_at = timestamp;

        userIdsBeforeThis = current_user_id;
        if (registeredUserIds.includes(current_user_id)) {
          continue;
        }

        let inviterCodeId = userToInviterUser[current_user_id];
        let invite_code = inviterCodeId ? inviterUserToCode[inviterCodeId] : null;

        let utmParams = userUtmParams[current_user_id],
          utm_source = '',
          utm_medium = '',
          utm_campaign = '';

        if (utmParams) {
          utm_source = utmParams.utm_source;
          utm_medium = utmParams.utm_medium;
          utm_campaign = utmParams.utm_campaign;
        }

        let logline = logPixelTemplate
          .replace('{{timestamp}}', timestamp)
          .replace('{{current_user_id}}', current_user_id)
          .replace('{{registration_at}}', registration_at)
          .replace('{{invite_code}}', invite_code)
          .replace('{{utm_source}}', utm_source)
          .replace('{{utm_medium}}', utm_medium)
          .replace('{{utm_campaign}}', utm_campaign);

        await oThis.appendLoglineToFile(logline, current_user_id);
      }
    }
  }

  async appendLoglineToFile(logline, userId) {
    return new Promise(function(onResolve, onReject) {
      console.log('logline------------------', logline);
      console.log('filePath---------------', filePath);
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

new populateRegisterUserPixel()
  .perform()
  .then(function() {
    logger.win('All Devices recorded.');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('Devices recording failed. Error: ', err);
    process.exit(1);
  });
