const express = require('express'),
  router = express.Router();

const rootPrefix = '../../../..',
  AdminFormatterComposer = require(rootPrefix + '/lib/formatter/AdminComposer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  adminEntityType = require(rootPrefix + '/lib/globalConstant/adminEntityType'),
  adminResponseEntityKey = require(rootPrefix + '/lib/globalConstant/adminResponseEntity');

/* Edit channel. */
router.post('/edit', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminEditChannel;

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/channel/Edit', 'r_a_ad_c_1', null, null, null));
});

/* Get pre-signed url. */
router.get('/presigned-url', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.presignedUrl;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new AdminFormatterComposer({
      resultType: adminResponseEntityKey.channelUploadParams,
      entityKindToResponseKeyMap: {
        [adminEntityType.channelUploadParamsMap]: adminResponseEntityKey.channelUploadParams
      },
      serviceData: serviceResponse.data
    }).perform();
    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/admin/channel/PreSignedUrl', 'r_a_ad_c_2', null, dataFormatterFunc)
  );
});

module.exports = router;
