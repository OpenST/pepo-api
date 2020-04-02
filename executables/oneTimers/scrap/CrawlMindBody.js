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
    while (true) {
      const res = await oThis.sendRequestToMindBody(pageNumber);

      pageNumber++;
    }
  }

  async sendRequestToMindBody(pageNumber) {
    const oThis = this;

    let requestUrl = `https://prod-mkt-gateway.mindbody.io/v1/search/class_times?sort=start_time%2C-_score&page.size=100&page.number=${pageNumber}&filter.category_types=Fitness&filter.inventory_source=MB&filter.start_time_from=2020-04-02T09%3A37%3A47.749Z&filter.start_time_to=2021-04-03T03%3A30%3A00.000Z&filter.dynamic_priceable=any&filter.virtual=only&filter.include_dynamic_pricing=true`;

    console.log('Page Number: ', pageNumber);
    console.log('Request Url: ', requestUrl);
    const HttpLibObj = new HttpLibrary({ resource: requestUrl });
    const responseData = await HttpLibObj.get({}).catch(function(err) {
      return Promise.reject(err);
    });

    const res = JSON.parse(responseData.data.responseData);
    if (res.errors || res.data.length <= 0) {
      console.log('Response: ', res);
      return Promise.reject(res);
    }
    console.log('Number of records: ', res.data.length);

    fs.writeFileSync(`${oThis.fileDirectory}/json/pn-${pageNumber}.json`, JSON.stringify(res));

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
