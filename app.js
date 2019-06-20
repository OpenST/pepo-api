const rootPrefix = '.';

const express = require('express'),
  path = require('path'),
  createNamespace = require('continuation-local-storage').createNamespace,
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  helmet = require('helmet'),
  customUrlParser = require('url');

const requestSharedNameSpace = createNamespace('pepoApiNameSpace');

const responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  customMiddleware = require(rootPrefix + '/helpers/customMiddleware'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer');

const apiRoutes = require(rootPrefix + '/routes/api/index'),
  ostWebhookRoutes = require(rootPrefix + '/routes/ostWebhook/index'),
  elbHealthCheckerRoute = require(rootPrefix + '/routes/internal/elb_health_checker');

const errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1);

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

  logger.info(message.join(''));

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

// Start Request logging. Placed below static and health check to reduce logs
app.use(appendRequestDebugInfo, startRequestLogLine);

// set response Headers
app.use(setResponseHeader);

/**
 * NOTE: API routes where first sanitize and then assign params
 */
app.use('/api', sanitizer.sanitizeBodyAndQuery, assignParams, apiRoutes);

/**
 * NOTE: OST webhooks where first assign params, validate signature and then sanitize the params
 */
app.use('/ost-webhook', ostWebhookRoutes);

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
  logger.error('a_2', 'Something went wrong', err);

  let errorObject = responseHelper.error({
    internal_error_identifier: 'a_2',
    api_error_identifier: 'something_went_wrong',
    debug_options: {}
  });

  await createErrorLogsEntry.perform(errorObject, errorLogsConstants.mediumSeverity);

  return responseHelper.renderApiResponse(errorObject, res, errorConfig);
});

module.exports = app;
