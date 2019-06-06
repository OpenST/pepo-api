'use strict';

class ApiName {
  get signUp() {
    return 'sign-up';
  }

  get login() {
    return 'login';
  }

  get registerDevice() {
    return 'register-device';
  }
}

module.exports = new ApiName();
