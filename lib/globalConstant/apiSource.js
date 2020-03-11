class ApiSource {
  get web() {
    return 'web';
  }

  get app() {
    return 'app';
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

    return source == oThis.web;
  }

  isAppRequest(source) {
    const oThis = this;

    return source == oThis.app;
  }
}

module.exports = new ApiSource();
