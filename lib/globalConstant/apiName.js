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

  get recoveryInfo() {
    return 'recovery-info';
  }
}

module.exports = new ApiName();
