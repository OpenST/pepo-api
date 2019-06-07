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
}

module.exports = new ApiName();
