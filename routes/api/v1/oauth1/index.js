const express = require('express'),
  router = express.Router();

const rootPrefix = '../../../..',
  twitterRoutes = require(rootPrefix + '/routes/api/v1/oauth1/twitter');

router.use('/twitter', twitterRoutes);

module.exports = router;
