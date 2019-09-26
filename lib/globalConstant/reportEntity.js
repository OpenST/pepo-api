const rootPrefix = '../..';

class ReportEntityConstant {
  get videoReportEntityKind() {
    return 'video';
  }

  get userReportEntityKind() {
    return 'user';
  }
}

module.exports = new ReportEntityConstant();
