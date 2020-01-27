const rootPrefix = '.';

const express = require('express'),
  path = require('path'),
  createNamespace = require('continuation-local-storage').createNamespace,
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  helmet = require('helmet'),
  customUrlParser = require('url'),
  URL = require('url').URL;

const requestSharedNameSpace = createNamespace('pepoApiNameSpace');

const responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  customMiddleware = require(rootPrefix + '/helpers/customMiddleware'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer');

const apiRoutes = require(rootPrefix + '/routes/api/index'),
  storeRoutes = require(rootPrefix + '/routes/storeApi/index'),
  webhookRoutes = require(rootPrefix + '/routes/webhooks/index'),
  elbHealthCheckerRoute = require(rootPrefix + '/routes/internal/elb_health_checker');

const errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1);

const pepoApiHostName = new URL(coreConstants.PA_DOMAIN).hostname;
const pepoStoreApiHostName = new URL(coreConstants.PA_STORE_DOMAIN).hostname;

morgan.token('id', function getId(req) {
  return req.id;
});

morgan.token('pid', function getId(req) {
  return process.pid;
});

morgan.token('endTime', function getendTime(req) {
  return Date.now();
});

morgan.token('endDateTime', function getEndDateTime(req) {
  return basicHelper.logDateFormat();
});

const startRequestLogLine = function(req, res, next) {
  const message = [
    "Started '",
    customUrlParser.parse(req.originalUrl).pathname,
    "'  '",
    req.method,
    "' at ",
    basicHelper.logDateFormat()
  ];

  logger.step(message.join(''));

  if (!basicHelper.isProduction()) {
    logger.step(
      '\nHEADERS FOR CURRENT REQUEST=====================================\n',
      JSON.stringify(req.headers),
      '\n========================================================'
    );
  }

  next();
};

/**
 * Assign params
 *
 * @param req
 * @param res
 * @param next
 */
const assignParams = function(req, res, next) {
  // IMPORTANT NOTE: Don't assign parameters before sanitization
  // Also override any request params, related to signatures
  // And finally assign it to req.decodedParams
  req.decodedParams = Object.assign(getRequestParams(req), req.decodedParams);
  delete req.decodedParams.current_user;
  delete req.decodedParams.user_login_cookie_value;
  delete req.decodedParams.current_admin;
  delete req.decodedParams.admin_login_cookie_value;
  //IMPORTANT: Above keys are removed from decoded params as they are being set internally. Thus any such key coming from front end should not be respected.

  next();
};

/**
 * Get request params
 *
 * @param req
 * @return {*}
 */
const getRequestParams = function(req) {
  // IMPORTANT NOTE: Don't assign parameters before sanitization
  if (req.method === 'POST') {
    return req.body;
  } else if (req.method === 'GET') {
    return req.query;
  }

  return {};
};

// Set request debugging/logging details to shared namespace
const appendRequestDebugInfo = function(req, res, next) {
  requestSharedNameSpace.run(function() {
    requestSharedNameSpace.set('reqId', req.id);
    requestSharedNameSpace.set('startTime', req.startTime);
    next();
  });
};

const setResponseHeader = async function(req, res, next) {
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Cache-Control', 'no-store, no-cache, max-age=0, must-revalidate, post-check=0, pre-check=0');
  res.setHeader('Vary', '*');
  res.setHeader('Expires', '-1');
  res.setHeader('Last-Modified', new Date().toUTCString());
  next();
};

// If the process is not a master

// Set worker process title
process.title = 'Pepo API node worker';

// Create express application instance
const app = express();

// Add id and startTime to request
app.use(customMiddleware());

// Load Morgan
app.use(
  morgan(
    '[:pid][:id][:endTime][' +
      coreConstants.APP_NAME +
      '] Completed with ":status" in :response-time ms at :endDateTime -  ":res[content-length] bytes" - ":remote-addr" ":remote-user" - "HTTP/:http-version :method :url" - ":referrer" - ":user-agent"'
  )
);

app.use(function(req, res, next) {
  var data = '';
  req.on('data', function(chunk) {
    data += chunk;
  });
  req.on('end', function() {
    req.rawBody = data;
  });
  next();
});

// Helmet helps secure Express apps by setting various HTTP headers.
app.use(helmet());

// Node.js body parsing middleware.
app.use(bodyParser.json());

// Parsing the URL-encoded data with the qs library (extended: true)
app.use(bodyParser.urlencoded({ extended: true }));

// Static file location
app.use(express.static(path.join(__dirname, 'public')));

// Health checker
app.use('/health-checker', elbHealthCheckerRoute);

/* Dummy routes */
app.use('/api/v1/search/channels', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  return res.status(200).json(require(rootPrefix + '/dummy/searchChannel.json'));
});
app.use('/api/v1/search/top', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  return res.status(200).json(require(rootPrefix + '/dummy/searchTop.json'));
});

app.use('/api/v1/channels/1/videos', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  return res.status(200).json(require(rootPrefix + '/dummy/getChannelVideos.json'));
});

app.use('/api/v1/channels/1/share', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  return res.status(200).json(require(rootPrefix + '/dummy/getChannelShare.json'));
});

app.use('/api/v1/channels/1', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  return res.status(200).json(require(rootPrefix + '/dummy/getChannel.json'));
});

// Start Request logging. Placed below static and health check to reduce logs
app.use(appendRequestDebugInfo, startRequestLogLine);

// set response Headers
app.use(setResponseHeader);

/**
 * NOTE: API routes where first sanitize and then assign params
 */
app.use('/api', sanitizer.sanitizeBodyAndQuery, assignParams, function(request, response, next) {
  if (request.hostname === pepoApiHostName) {
    apiRoutes(request, response, next);
  } else if (request.hostname === pepoStoreApiHostName) {
    storeRoutes(request, response, next);
  } else {
    next();
  }
});

/**
 * NOTE: OST webhooks where first assign params, validate signature and then sanitize the params
 */

app.use('/webhooks', webhookRoutes);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  return responseHelper.renderApiResponse(
    responseHelper.error({
      internal_error_identifier: 'a_1',
      api_error_identifier: 'resource_not_found',
      debug_options: {}
    }),
    res,
    errorConfig
  );
});

// Error handler
app.use(async function(err, req, res, next) {
  let errorObject = null;

  if (err.code == 'EBADCSRFTOKEN') {
    logger.error('a_3', 'Bad CSRF TOKEN', err);

    errorObject = responseHelper.error({
      internal_error_identifier: 'a_3',
      api_error_identifier: 'forbidden_api_request',
      debug_options: {}
    });
  } else {
    logger.error('a_2', 'Something went wrong', err);

    errorObject = responseHelper.error({
      internal_error_identifier: 'a_2',
      api_error_identifier: 'something_went_wrong',
      debug_options: { err: err }
    });

    await createErrorLogsEntry.perform(errorObject, errorLogsConstants.mediumSeverity);
    logger.error(' In catch block of app.js', errorObject);
  }

  return responseHelper.renderApiResponse(errorObject, res, errorConfig);
});

module.exports = app;
