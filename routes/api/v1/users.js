const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Register Device*/
router.post('/register-device', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.registerDevice;

  const onServiceSuccess = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.device,
      entityKindToResponseKeyMap: {
        [entityType.device]: responseEntityKey.device
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/user/RegisterDevice', 'r_a_v1_u_1', null, onServiceSuccess));
});

/* Recovery Info Device*/
router.get('/recovery-info', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.recoveryInfo;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.recoveryInfo,
      entityKindToResponseKeyMap: {
        [entityType.recoveryInfo]: responseEntityKey.recoveryInfo
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/user/RecoveryInfo', 'r_a_v1_u_2', null, dataFormatterFunc));
});

/* Contributed To Users List */
router.get('/contribution-to', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.contributionTo;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.users,
      entityKindToResponseKeyMap: {
        [entityType.users]: responseEntityKey.users,
        [entityType.userListMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/contribution/To', 'r_a_v1_u_ct_1', null, dataFormatterFunc)
  );
});

/* Contributed By Users List */
router.get('/contribution-by', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.contributionBy;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.users,
      entityKindToResponseKeyMap: {
        [entityType.users]: responseEntityKey.users,
        [entityType.userListMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/contribution/By', 'r_a_v1_u_cb_1', null, dataFormatterFunc)
  );
});

/* User Suggestion to Logged IN User */
router.get('/contribution-suggestion', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.contributionSuggestion;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.users,
      entityKindToResponseKeyMap: {
        [entityType.users]: responseEntityKey.users,
        [entityType.userListMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/contribution/Suggestion', 'r_a_v1_u_cs_1', null, dataFormatterFunc)
  );
});

/* Logged In User*/
router.get('/current', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.loggedInUser;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.loggedInUser,
      entityKindToResponseKeyMap: {
        [entityType.user]: responseEntityKey.loggedInUser,
        [entityType.pricePointsMap]: responseEntityKey.pricePoints
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/user/CurrentUser', 'r_a_v1_u_5', null, dataFormatterFunc));
});

/* User Activities*/
router.get('/:user_id/activities', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.userActivity;
  req.decodedParams.user_id = req.params.user_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.userActivity,
      entityKindToResponseKeyMap: {
        [entityType.userActivityList]: responseEntityKey.userActivity,
        [entityType.ostTransactionMap]: responseEntityKey.ostTransaction,
        [entityType.externalEntityGifMap]: responseEntityKey.gifs,
        [entityType.usersMap]: responseEntityKey.users,
        [entityType.activityListMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/activity/User', 'r_a_v1_u_6', null, dataFormatterFunc));
});

/* User profile */
router.get('/:user_id/profile', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getUserProfile;
  req.decodedParams.user_id = req.params.user_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.userProfile,
      entityKindToResponseKeyMap: {
        [entityType.userProfile]: responseEntityKey.userProfile,
        [entityType.usersMap]: responseEntityKey.users,
        [entityType.linksMap]: responseEntityKey.links,
        [entityType.imagesMap]: responseEntityKey.images,
        [entityType.videosMap]: responseEntityKey.videos,
        [entityType.tagsMap]: responseEntityKey.tags,
        [entityType.userProfileAllowedActions]: responseEntityKey.userProfileAllowedActions,
        [entityType.userStats]: responseEntityKey.userStats,
        [entityType.videoDetailsMap]: responseEntityKey.videoDetails,
        [entityType.currentUserUserContributionsMap]: responseEntityKey.currentUserUserContributions,
        [entityType.currentUserVideoContributionsMap]: responseEntityKey.currentUserVideoContributions,
        [entityType.pricePointsMap]: responseEntityKey.pricePoints
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/user/GetProfile', 'r_a_v1_u_7', null, dataFormatterFunc));
});

/* User profile */
router.get('/:user_id/profile-image', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getUserProfile;
  req.decodedParams.user_id = req.params.user_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/user/SaveImage', 'r_a_v1_u_8', null));
});

/* Video save */
router.post('/:user_id/fan-video', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.saveFanVideo;
  req.decodedParams.user_id = req.params.user_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/user/profile/AddFanVideo', 'r_a_v1_u_9', null));
});

/* Profile image save */
router.post('/:user_id/profile-image', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.saveProfileImage;
  req.decodedParams.user_id = req.params.user_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/user/profile/UpdateProfileImage', 'r_a_v1_u_10', null));
});

/* Profile save */
router.post('/:user_id/profile', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.saveProfile;
  req.decodedParams.user_id = req.params.user_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/user/profile/UpdateProfile', 'r_a_v1_u_11', null));
});

module.exports = router;
