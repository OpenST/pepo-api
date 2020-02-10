const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

// Get the products url.
router.get('/info', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getRedemptionProductUrl;

  req.decodedParams.pepo_device_os = req.headers['x-pepo-device-os'];
  req.decodedParams.pepo_device_os_version = req.headers['x-pepo-device-os-version'];
  req.decodedParams.pepo_build_number = req.headers['x-pepo-build-number'];
  req.decodedParams.pepo_app_version = req.headers['x-pepo-app-version'];

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.redemptionInfo,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.redemptionInfo]: responseEntityKey.redemptionInfo
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/redemption/GetInfo', 'r_a_v1_redemptions_1', null, dataFormatterFunc)
  );
});

router.get('/webview-url', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getRedemptionWebViewProductUrl;

  req.decodedParams.pepo_device_os = req.headers['x-pepo-device-os'];
  req.decodedParams.pepo_device_os_version = req.headers['x-pepo-device-os-version'];
  req.decodedParams.pepo_build_number = req.headers['x-pepo-build-number'];
  req.decodedParams.pepo_app_version = req.headers['x-pepo-app-version'];

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.redemptionInfo,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.redemptionInfo]: responseEntityKey.redemptionInfo
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/redemption/GetWebViewUrl', 'r_a_v1_redemptions_2', null, dataFormatterFunc)
  );
});

module.exports = router;
