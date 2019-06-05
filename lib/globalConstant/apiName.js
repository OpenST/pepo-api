'use strict';

class ApiName {
  get signUp() {
    return 'sign-up';
  }

  get login() {
    return 'login';
  }
}

module.exports = new ApiName();
