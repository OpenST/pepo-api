const express = require('express'),
  router = express.Router();

const rootPrefix = '../..',
  ostRoutes = require(rootPrefix + '/routes/webhooks/ost/index'),
  slackRoutes = require(rootPrefix + '/routes/webhooks/slack/index'),
  zoomRoutes = require(rootPrefix + '/routes/webhooks/zoom/index');

router.use('/ost', ostRoutes);
router.use('/slack', slackRoutes);
router.use('/zoom', zoomRoutes);

module.exports = router;
