const express = require('express'),
  router = express.Router();

const rootPrefix = '../../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Whitelist user */
router.post('/whitelist/:invite_id', cookieHelper.setAdminCsrf(), sanitizer.sanitizeDynamicUrlParams, function(
  req,
  res,
  next
) {
  req.decodedParams.apiName = apiName.adminWhitelistUser;
  req.decodedParams.invite_id = req.params.invite_id;

  Promise.resolve(
    routeHelper.perform(req, res, next, '/admin/preLaunch/WhitelistUser', 'r_a_v1_ad_7', null, null, null)
  );
});

/* Approve user */
router.post('/approve/:invite_id', cookieHelper.setAdminCsrf(), sanitizer.sanitizeDynamicUrlParams, function(
  req,
  res,
  next
) {
  req.decodedParams.apiName = apiName.adminApproveUser;
  req.decodedParams.invite_id = req.params.invite_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/preLaunch/ApproveUser', 'r_a_v1_ad_8', null, null, null));
});

/* Invite user list */
router.get('/users/search', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.launchInviteSearch;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.launchInviteSearchResults,
      entityKindToResponseKeyMap: {
        [entityType.inviteUserSearchList]: responseEntityKey.launchInviteSearchResults,
        [entityType.inviteMap]: responseEntityKey.invites,
        [entityType.inviteUserSearchMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/admin/preLaunch/UserSearch', 'r_a_v1_ad_9', null, dataFormatterFunc)
  );
});

module.exports = router;
