const express = require('express'),
  router = express.Router();

const rootPrefix = '../../../..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName');

/* Update user data. */
router.post('/user-data', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminUpdateUserDataUsage;

  Promise.resolve(
    routeHelper.perform(req, res, next, '/admin/updateUsageData/UserData', 'r_a_ad_uud_1', null, null, null)
  );
});

/* Update videos performance data. */
router.post('/videos-performance', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminUpdateVideosPerformanceUsage;

  Promise.resolve(
    routeHelper.perform(req, res, next, '/admin/updateUsageData/VideosPerformance', 'r_a_ad_uud_2', null, null, null)
  );
});

/* Update tags used data. */
router.post('/tags-used', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminUpdateTagsUsedUsage;

  Promise.resolve(
    routeHelper.perform(req, res, next, '/admin/updateUsageData/TagsUsed', 'r_a_ad_uud_3', null, null, null)
  );
});

/* Update community data. */
router.post('/community-data', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminUpdateCommunityDataUsage;

  Promise.resolve(
    routeHelper.perform(req, res, next, '/admin/updateUsageData/CommunityData', 'r_a_ad_uud_4', null, null, null)
  );
});

module.exports = router;
