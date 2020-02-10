const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Invited users list. */
router.get('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.invitedUsersSearch;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.invitedUsers,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.userSearchList]: responseEntityKey.invitedUsers,
        [entityTypeConstants.imagesMap]: responseEntityKey.images,
        [entityTypeConstants.usersMap]: responseEntityKey.users,
        [entityTypeConstants.invitedUsersListMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/invite/InvitedUsers', 'r_a_v1_i_1', null, dataFormatterFunc));
});

/* Get invite code. */
router.get('/code', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getInviteCode;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.inviteDetails,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.inviteCode]: responseEntityKey.inviteDetails,
        [entityTypeConstants.share]: responseEntityKey.share
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/invite/GetCode', 'r_a_v1_i_2', null, dataFormatterFunc));
});

module.exports = router;
