class BgJob {
  constructor() {}

  // topics / topics start
  get exampleKind() {
    return 'bg.p1.example';
  }

  get afterSignUpJob() {
    return 'bg.p1.afterSignUpJob';
  }
  // topics / topics end
}

module.exports = new BgJob();
