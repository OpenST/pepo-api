const express = require('express'),
  router = express.Router();

const rootPrefix = '../../../..',
  AdminFormatterComposer = require(rootPrefix + '/lib/formatter/AdminComposer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  adminEntityType = require(rootPrefix + '/lib/globalConstant/adminEntityType'),
  adminResponseEntityKey = require(rootPrefix + '/lib/globalConstant/adminResponseEntity');

/* Whitelist user */
router.post('/whitelist/:invite_id', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminWhitelistUser;
  req.decodedParams.invite_id = req.params.invite_id;

  Promise.resolve(
    routeHelper.perform(req, res, next, '/admin/preLaunch/WhitelistUser', 'r_a_v1_ad_pl_1', null, null, null)
  );
});

/* Approve user */
router.post('/approve/:invite_id', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminApproveUser;
  req.decodedParams.invite_id = req.params.invite_id;

  Promise.resolve(
    routeHelper.perform(req, res, next, '/admin/preLaunch/ApproveUser', 'r_a_v1_ad_pl_2', null, null, null)
  );
});

/* Invite user list */
router.get('/users/search', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.launchInviteSearch;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new AdminFormatterComposer({
      resultType: adminResponseEntityKey.launchInviteSearchResults,
      entityKindToResponseKeyMap: {
        [adminEntityType.inviteUserSearchList]: adminResponseEntityKey.launchInviteSearchResults,
        [adminEntityType.inviteMap]: adminResponseEntityKey.invites,
        [adminEntityType.inviteUserSearchMeta]: adminResponseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/admin/preLaunch/UserSearch', 'r_a_v1_ad_pl_3', null, dataFormatterFunc)
  );
});

module.exports = router;
