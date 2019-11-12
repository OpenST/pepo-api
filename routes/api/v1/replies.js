const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType');

router.post('/', cookieHelper.validateUserLoginRequired, function(req, res, next) {
  req.decodedParams.apiName = apiName.initiateReply;

  const dataFormatterFunc = async function(serviceResponse) {
    console.log('=serviceResponse======', serviceResponse);
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.replyDetails,
      entityKindToResponseKeyMap: {
        [entityType.replyDetails]: responseEntityKey.replyDetails
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/reply/Initiate', 'r_a_v1_r_1', null, dataFormatterFunc));
});

router.post('/validate-upload', cookieHelper.validateUserLoginRequired, function(req, res, next) {
  req.decodedParams.apiName = apiName.validateUploadReply;

  Promise.resolve(routeHelper.perform(req, res, next, '/reply/Validate', 'r_a_v1_r_2', null, null));
});

module.exports = router;
