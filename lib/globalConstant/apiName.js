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

  get userList() {
    return 'userList';
  }
}

module.exports = new ApiName();
