'use strict';

class ApiName {
  get signUp() {
    return 'signUp';
  }

  get login() {
    return 'login';
  }

  get registerDevice() {
    return 'registerDevice';
  }

  get recoveryInfo() {
    return 'recoveryInfo';
  }

  get token() {
    return 'token';
  }
}

module.exports = new ApiName();
