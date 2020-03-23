/**
 * Class for api source constants.
 *
 * @class ApiSource
 */
class ApiSource {
  get web() {
    return 'web';
  }

  get store() {
    return 'store';
  }

  get admin() {
    return 'admin';
  }

  get app() {
    return 'app';
  }

  get webView() {
    return 'webView';
  }

  isWebRequest(source) {
    const oThis = this;

    return source === oThis.web;
  }

  isAppRequest(source) {
    const oThis = this;

    return source === oThis.app;
  }

  isStoreRequest(source) {
    const oThis = this;

    return source === oThis.store;
  }

  isWebViewRequest(source) {
    const oThis = this;

    return source === oThis.webView;
  }
}

module.exports = new ApiSource();
