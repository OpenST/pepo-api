const express = require('express'),
  router = express.Router();

const rootPrefix = '../..',
  ostRoutes = require(rootPrefix + '/routes/webhooks/ost/index'),
  slackRoutes = require(rootPrefix + '/routes/webhooks/slack/index');

router.use('/ost', ostRoutes);
router.use('/slack', slackRoutes);

module.exports = router;
