const fs = require('fs');

const rootPrefix = '..',
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest');

class MindBodyDataToCsv {
  constructor() {
    const oThis = this;

    oThis.jsonData = {};
  }

  async perform() {
    const oThis = this,
      requestUrl =
        'https://prod-mkt-gateway.mindbody.io/v1/search/class_times?sort=start_time%2C-_score&page.size=100&page.number=1&filter.category_types=Fitness&filter.inventory_source=MB&filter.start_time_from=2020-04-01T09%3A37%3A47.749Z&filter.start_time_to=2020-04-03T03%3A30%3A00.000Z&filter.dynamic_priceable=any&filter.virtual=only&filter.include_dynamic_pricing=true';

    const HttpLibObj = new HttpLibrary({ resource: requestUrl });
    const responseData = await HttpLibObj.get({}).catch(function(err) {
      return err;
    });

    const res = JSON.parse(responseData.data.responseData);
    console.log('Response: ', res);
    if (res.error) {
      return Promise.reject(res);
    }

    fs.writeFileSync('/Users/pankaj/Desktop/mindbody/complete.json', JSON.stringify(res));
    let headers = [];
    for (let index in oThis.defaultCsvData) {
      let key = Object.keys(oThis.defaultCsvData[index])[0];
      headers.push({ id: key, title: key });
    }
    for (let index in res.data) {
      const classEvent = res.data[index];
      let eventData = {},
        eventCategory = classEvent.attributes['course_category']
          ? classEvent.attributes['course_category'].split('/')[0]
          : 'null';

      for (let index in oThis.defaultCsvData) {
        const csvColumn = oThis.defaultCsvData[index];
        let key = Object.keys(csvColumn)[0];
        const val = csvColumn[key];
        if (val == null) {
          eventData[key] = oThis.mapEventDataWithHeader(key, classEvent.attributes);
        } else {
          eventData[key] = val;
        }
      }

      oThis.jsonData[eventCategory] = oThis.jsonData[eventCategory] || [];
      oThis.jsonData[eventCategory].push(eventData);
    }

    // Write in files according to event category
    for (let eventCategory in oThis.jsonData) {
      const outputFile = `/Users/pankaj/Desktop/mindbody/${eventCategory}.csv`;
      await oThis._writeCsv(outputFile, headers, oThis.jsonData[eventCategory]);
    }
  }

  async _writeCsv(outputFile, headers, records) {
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    const csvWriter = createCsvWriter({
      path: outputFile,
      header: headers
    });

    await csvWriter.writeRecords(records);
  }

  get defaultCsvData() {
    return [
      { publish_status: 'published' },
      { featured: 'no' },
      { event_name: null },
      { event_description: null },
      { event_start_date: null },
      { event_end_date: null },
      { event_start_time: null },
      { event_end_time: null },
      { event_organizer: null },
      { evcal_org_contact: '' },
      { evo_organizer_id: null },
      { event_gmap: 'no' },
      { evcal_subtitle: null },
      { all_day: null },
      { hide_end_time: 'no' },
      { event_type: null },
      { event_type_2: null },
      { cmd_evcal_ec_f1a1_cus: '' },
      { ['cmd_{evcal_ec_f2a1_cus}']: null },
      { cmd__evcal_ec_f3a1_cus: '' },
      { image_url: null },
      { evcal_lmlink: '' },
      { evcal_lmlink_target: 'no' },
      { _evcal_exlink_option: 4 }
    ];
  }

  mapEventDataWithHeader(header, eventRecord) {
    const oThis = this;

    switch (header) {
      case 'event_name':
        return eventRecord['course_name'];
      case 'event_description':
        let str = eventRecord['course_description'] || '';
        str += eventRecord['location_business_name'] ? '\n' + eventRecord['location_business_name'] : '';
        str += eventRecord['location_business_description'] ? '\n' + eventRecord['location_business_description'] : '';
        return str;
      case 'event_start_date': {
        const dateObj = new Date(eventRecord['class_time_start_time']);
        return `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${dateObj.getFullYear()}`;
      }
      case 'event_end_date': {
        const dateObj = new Date(eventRecord['class_time_end_time']);
        return `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${dateObj.getFullYear()}`;
      }
      case 'event_start_time': {
        const dateObj = new Date(eventRecord['class_time_start_time']);
        let med = dateObj.getUTCHours() < 12 ? 'AM' : 'PM';
        return `${dateObj.getUTCHours()}:${dateObj.getUTCMinutes()}:${med}`;
      }
      case 'event_end_time': {
        const dateObj = new Date(eventRecord['class_time_end_time']);
        let med = dateObj.getUTCHours() < 12 ? 'AM' : 'PM';
        return `${dateObj.getUTCHours()}:${dateObj.getUTCMinutes()}:${med}`;
      }
      case 'event_organizer':
        return eventRecord['instructor_name'];
      case 'evo_organizer_id':
        return 'https://mindbody.io/fitness/instructors/' + eventRecord['instructor_identity_slug'];
      case 'evcal_subtitle': {
        if (eventRecord['course_description'] && eventRecord['course_description'] != eventRecord['course_name']) {
          return eventRecord['course_description'].substring(0, 120);
        } else {
          return '';
        }
      }
      case 'all_day':
        return Number(eventRecord['class_time_duration']) >= 480 ? 'yes' : 'no';
      case 'event_type':
        return eventRecord['course_category'];
      case 'event_type_2':
        return 'video platform';
      case 'cmd_{evcal_ec_f2a1_cus}':
        return 'https://mindbody.io/fitness/classes/' + eventRecord['course_slug'];
      case 'image_url':
        return eventRecord['course_stock_image'];
    }
  }
}

new MindBodyDataToCsv()
  .perform()
  .then(function() {
    console.log('Mindbody data is processed Successfully!!!');
    process.exit(0);
  })
  .catch(function(err) {
    console.log(err);
    process.exit(1);
  });
