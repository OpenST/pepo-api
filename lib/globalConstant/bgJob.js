class BgJob {
  constructor() {}

  // Topics / topics start
  get exampleKind() {
    return 'bg.p1.example';
  }

  get afterSignUpJobTopic() {
    return 'bg.p1.afterSignUpJob';
  }

  get twitterFriendsSyncJobTopic() {
    return 'bg.p1.twitterFriendsSyncJob';
  }

  get imageResizer() {
    return 'bg.p1.imageResizer';
  }
  // Topics / topics end
}

module.exports = new BgJob();
