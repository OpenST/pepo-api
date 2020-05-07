const fs = require('fs');

const rootPrefix = '../../..';
const csvWriter = require('csv-write-stream');

class ImportMindBody {
  constructor(params) {
    const oThis = this;

    // oThis.pageNumber = params.page_number;
    oThis.fileDirectory = params.file_directory;
  }

  async perform() {
    const oThis = this;

    let fileNames = fs.readdirSync(`${oThis.fileDirectory}/json`);
    for (let i = 0; i < fileNames.length; i++) {
      let fileName = `${oThis.fileDirectory}/json/${fileNames[i]}`;
      console.log('Reading json file: ', fileName);
      if (!fs.existsSync(fileName)) {
        return Promise.reject('File does not exist');
      }
      try {
        const jsonResponse = JSON.parse(fs.readFileSync(fileName));

        await oThis.insertInCsv(jsonResponse);
      } catch (e) {
        console.log(e);
      }
    }
    // while (true) {
    //   let fileName = `/pn-${oThis.pageNumber}.json`;
    //   console.log('Reading json file: ', fileName);
    //   if (!fs.existsSync(fileName)) {
    //     return Promise.reject('File does not exist');
    //   }
    //   const jsonResponse = JSON.parse(fs.readFileSync(fileName));
    //
    //   await oThis.insertInCsv(jsonResponse);
    //
    //   oThis.pageNumber++;
    // }
  }

  async insertInCsv(res) {
    const oThis = this;

    let headers = [];
    for (let index in oThis.defaultCsvData) {
      let key = Object.keys(oThis.defaultCsvData[index])[0];
      headers.push({ id: key, title: key });
    }
    let jsonData = {};
    for (let index in res.data) {
      const classEvent = res.data[index];
      let eventData = {},
        eventCategory = classEvent.attributes['course_category']
          ? classEvent.attributes['course_category'].split('/')[0].trim()
          : 'null';

      for (let i in oThis.defaultCsvData) {
        const csvColumn = oThis.defaultCsvData[i];
        let key = Object.keys(csvColumn)[0];
        const val = csvColumn[key];
        if (val == null) {
          eventData[key] = oThis.mapEventDataWithHeader(key, classEvent.attributes);
        } else {
          eventData[key] = val;
        }
      }
      eventData['featured'] = classEvent.id;

      jsonData[eventCategory] = jsonData[eventCategory] || [];
      jsonData[eventCategory].push(eventData);
    }

    // Write in files according to event category
    for (let eventCategory in jsonData) {
      const outputFile = `${oThis.fileDirectory}/csv/${eventCategory}.csv`;
      await oThis._writeObjectToCsv(outputFile, headers, jsonData[eventCategory]);
    }
  }

  // async _writeCsv(outputFile, headers, records) {
  //   const createCsvWriter = require('csv-writer').createObjectCsvWriter;
  //   const csvWriter = createCsvWriter({
  //     path: outputFile,
  //     header: headers
  //   });
  //
  //   await csvWriter.writeRecords(records);
  // }

  async _writeObjectToCsv(outputFile, headers, records) {
    const ObjectsToCsv = require('objects-to-csv');
    const csv = new ObjectsToCsv(records);
    if (fs.existsSync(outputFile)) {
      await csv.toDisk(outputFile, { append: true });
    } else {
      await csv.toDisk(outputFile);
    }
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
      { cmd_1: '' },
      { cmd_2: null },
      { cmd_3: '' },
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
        let str = eventRecord['course_description'] ? eventRecord['course_description'] + '<br><br>' : '';
        str += eventRecord['location_business_name'] ? '<b>' + eventRecord['location_business_name'] + '</b><br>' : '';
        str += eventRecord['location_business_description'] || '';
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
      case 'cmd_2':
        return 'https://mindbody.io/fitness/classes/' + eventRecord['course_slug'];
      case 'image_url':
        return eventRecord['course_stock_image'];
    }
  }
}

new ImportMindBody({
  file_directory: '/Users/pankaj/simpleTokenWorkspace'
})
  .perform()
  .then(function() {
    console.log('mindBody data is processed Successfully!!!');
    process.exit(0);
  })
  .catch(function(err) {
    console.log(err);
    process.exit(1);
  });
