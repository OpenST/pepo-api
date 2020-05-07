const fs = require('fs');

const rootPrefix = '../../..',
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest');

class CrawlMindBody {
  constructor(params) {
    const oThis = this;

    oThis.fileDirectory = params.file_directory;
    oThis.jsonData = {};
  }

  async perform() {
    const oThis = this;

    let pageNumber = 1;
    let startDateObj = new Date('2020-05-07T00:00:00.000Z');
    let startDate = oThis.formatDateTime(startDateObj);
    while (true) {
      let res = await oThis.sendRequestToMindBody(pageNumber, startDate);

      if (pageNumber == 100) {
        let eventRecord = res.data[res.data.length - 1];
        let startTimeDateObj = new Date(eventRecord.attributes['class_time_start_time']);
        console.log('Last Class Time: ', eventRecord.attributes['class_time_start_time']);
        startDateObj = new Date(startTimeDateObj.setUTCSeconds(startTimeDateObj.getUTCSeconds() + 1));
        startDate = oThis.formatDateTime(startDateObj);
        pageNumber = 1;
      } else {
        pageNumber++;
      }
    }
  }

  formatDateTime(dateObj) {
    function pad(number) {
      return number < 10 ? '0' + number : number;
    }

    return (
      dateObj.getUTCFullYear() +
      '-' +
      pad(dateObj.getUTCMonth() + 1) +
      '-' +
      pad(dateObj.getUTCDate()) +
      'T' +
      pad(dateObj.getUTCHours()) +
      ':' +
      pad(dateObj.getUTCMinutes()) +
      ':' +
      pad(dateObj.getUTCSeconds()) +
      '.' +
      dateObj.getUTCMilliseconds() +
      'Z'
    );
  }

  async sendRequestToMindBody(pageNumber, startDate) {
    const oThis = this;

    let requestUrl = `https://prod-mkt-gateway.mindbody.io/v1/search/class_times?sort=start_time%2C-_score&page.size=100&page.number=${pageNumber}&filter.category_types=Fitness&filter.inventory_source=MB&filter.start_time_from=${encodeURIComponent(
      startDate
    )}&filter.start_time_to=2021-04-03T03%3A30%3A00.000Z&filter.dynamic_priceable=any&filter.virtual=only&filter.include_dynamic_pricing=true`;

    console.log('Start Date, Page Number: ', startDate, pageNumber);
    console.log('Request Url: ', requestUrl);
    const HttpLibObj = new HttpLibrary({ resource: requestUrl });
    const responseData = await HttpLibObj.get({}).catch(function(err) {
      return Promise.reject(err);
    });

    const res = JSON.parse(responseData.data.responseData);
    if (res.errors) {
      console.log('Response: ', res);
      return Promise.reject(res);
    }
    console.log('Number of records: ', res.data.length);

    if (res.data.length > 0) {
      let startTimestamp = new Date(startDate).getTime();
      fs.writeFileSync(`${oThis.fileDirectory}/json/${startTimestamp}-pn-${pageNumber}.json`, JSON.stringify(res));
    }

    return res;
  }
}

new CrawlMindBody({ file_directory: '/mnt/pepo/apps/pepoApi/shared/mindBody' })
  .perform()
  .then(function() {
    console.log('MindBody data is crawled Successfully!!!');
    process.exit(0);
  })
  .catch(function(err) {
    console.log(err);
    process.exit(1);
  });
