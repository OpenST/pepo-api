const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Invited users list. */
router.get('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.invitedUsersSearch;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.invitedUsers,
      entityKindToResponseKeyMap: {
        [entityType.userSearchList]: responseEntityKey.invitedUsers,
        [entityType.imagesMap]: responseEntityKey.images,
        [entityType.usersMap]: responseEntityKey.users,
        [entityType.invitedUsersListMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/invite/InvitedUsers', 'r_a_v1_u_16', null, dataFormatterFunc));
});

/* Get Invite Code*/
router.get('/code', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getInviteCode;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.inviteDetails,
      entityKindToResponseKeyMap: {
        [entityType.inviteCode]: responseEntityKey.inviteDetails,
        [entityType.share]: responseEntityKey.share
      },
      serviceData: serviceResponse.data
    }).perform();

    if (wrapperFormatterRsp.isFailure()) {
      console.log('----------/api/v1/invites/code for userId--', req.decodedParams.current_user.id);
      console.log('----------/api/v1/invites/code serviceResponse--', serviceResponse);
    }

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/invite/GetCode', 'r_a_v1_u_18', null, dataFormatterFunc));
});

module.exports = router;
