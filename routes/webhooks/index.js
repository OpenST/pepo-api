const express = require('express'),
  router = express.Router();

const rootPrefix = '../..',
  ostRoutes = require(rootPrefix + '/routes/webhooks/ost/index');

router.use('/ost', ostRoutes);

module.exports = router;
