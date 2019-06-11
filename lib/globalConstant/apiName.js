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

  get users() {
    return 'users';
  }

  get gifs() {
    return 'gifs';
  }
}

module.exports = new ApiName();
