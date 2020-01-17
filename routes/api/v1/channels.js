const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Get channel details. */
router.get('/:channel_id', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.channelDetail;
  req.decodedParams.channel_id = req.params.channel_id;

  // const dataFormatterFunc = async function(serviceResponse) {
  //   const wrapperFormatterRsp = await new FormatterComposer({
  //     resultType: responseEntityKey.tag,
  //     entityKindToResponseKeyMap: {
  //       [entityTypeConstants.tag]: responseEntityKey.tag
  //     },
  //     serviceData: serviceResponse.data
  //   }).perform();
  //
  //   serviceResponse.data = wrapperFormatterRsp.data;
  // };

  // Promise.resolve(routeHelper.perform(req, res, next, '/channel/GetDetail', 'r_a_v1_c_1', null, dataFormatterFunc));
});

/* Join channel by User. */
router.get('/:channel_id/join', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.joinChannel;
  req.decodedParams.channel_id = req.params.channel_id;

  // const dataFormatterFunc = async function(serviceResponse) {
  //   const wrapperFormatterRsp = await new FormatterComposer({
  //     resultType: responseEntityKey.tag,
  //     entityKindToResponseKeyMap: {
  //       [entityTypeConstants.tag]: responseEntityKey.tag
  //     },
  //     serviceData: serviceResponse.data
  //   }).perform();
  //
  //   serviceResponse.data = wrapperFormatterRsp.data;
  // };

  Promise.resolve(routeHelper.perform(req, res, next, '/channel/user/Join', 'r_a_v1_c_2', null, dataFormatterFunc));
});

/* Leave channel by User. */
router.get('/:channel_id/leave', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.leaveChannel;
  req.decodedParams.channel_id = req.params.channel_id;

  // const dataFormatterFunc = async function(serviceResponse) {
  //   const wrapperFormatterRsp = await new FormatterComposer({
  //     resultType: responseEntityKey.tag,
  //     entityKindToResponseKeyMap: {
  //       [entityTypeConstants.tag]: responseEntityKey.tag
  //     },
  //     serviceData: serviceResponse.data
  //   }).perform();
  //
  //   serviceResponse.data = wrapperFormatterRsp.data;
  // };

  Promise.resolve(routeHelper.perform(req, res, next, '/channel/user/Leave', 'r_a_v1_c_3', null, dataFormatterFunc));
});

module.exports = router;
