class ApiReferer {
  get webReferer() {
    return 'web';
  }

  get appReferer() {
    return 'app';
  }

  isWebRequest(referer) {
    const oThis = this;

    return referer == oThis.webReferer;
  }

  isAppRequest(referer) {
    const oThis = this;

    return referer == oThis.appReferer;
  }
}

module.exports = new ApiReferer();
