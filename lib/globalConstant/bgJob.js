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

  get allowedPublishedAfterTimes() {
    return {
      10000: 1, // 10s
      20000: 1, // 20s
      30000: 1 // 30s
    };
  }
  // Topics / topics end
}

module.exports = new BgJob();
