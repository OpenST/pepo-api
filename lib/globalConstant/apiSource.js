class ApiSource {
  get web() {
    return 'web';
  }

  get app() {
    return 'app';
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
