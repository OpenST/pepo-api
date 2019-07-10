class BgJob {
  constructor() {}

  // topics / topics start
  get exampleKind() {
    return 'bg.p1.example';
  }

  get afterSignUpJobTopic() {
    return 'bg.p1.afterSignUpJob';
  }

  get twitterFriendsSyncJobTopic() {
    return 'bg.p1.twitterFriendsSyncJob';
  }
  // topics / topics end
}

module.exports = new BgJob();
