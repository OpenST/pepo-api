const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

let usageReportNamesToGroupIdsMap;

/**
 * Class for pepo usage sheet names.
 *
 * @class PepoUsageSheetNames
 */
class PepoUsageSheetNames {
  get userDataLifetimeSheetName() {
    return 'User data Lifetime';
  }

  get userDataLastSevenDaysSheetName() {
    return 'User data Last 7 days';
  }

  get userDataLastTwentyFourHoursSheetName() {
    return 'User data Last 24 hours';
  }

  get videosStatsLifetimeSheetName() {
    return 'Videos Stats Lifetime';
  }

  get videosStatsLastSevenDaysSheetName() {
    return 'Videos Stats Last 7 days';
  }

  get videosStatsLastTwentyFourHoursSheetName() {
    return 'Videos Stats Last 24 hrs';
  }

  get tagsUsedSheetName() {
    return 'Tags Used';
  }

  get channelDataLifetimeSheetName() {
    return 'Community data';
  }

  get usageReportNamesToGroupIdsMap() {
    usageReportNamesToGroupIdsMap =
      usageReportNamesToGroupIdsMap || JSON.parse(coreConstants.PA_GOOGLE_USAGE_REPORT_GROUP_IDS);

    return usageReportNamesToGroupIdsMap;
  }
}

module.exports = new PepoUsageSheetNames();
