const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const promises = [];
  const date = new Date(`03/01/2021`);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long'
  })
  // console.log('initial date:', formatter.format(date))
  const offvalues = ['Saturday', 'Sunday', '04/29/2021', '05/13/2021', '05/14/2021']
  do {
    // console.log('current Date:', formatter.format(date));
    // console.log(`date details: day: ${date.getDate() > 9 ? date.getDate() : '0' + date.getDate()} month: ${date.getMonth() > 9 ? date.getMonth() + 1 : '0' + (date.getMonth() + 1)} year: ${date.getFullYear()}`)
    promises.push(fetch(`http://sto.imi.gov.my/e-temujanji/slot.php?d=84&e=10&trkh=${date.getDate() > 9 ? date.getDate() : '0' + date.getDate()}-${date.getMonth() > 9 ? date.getMonth() + 1 : '0' + (date.getMonth() + 1)}-${date.getFullYear()}`).catch(error => { return error }))
    // add one day and check if the date is not off
    date.setDate(date.getDate() + 1);
    let loop = true;
    while (loop) {
      let match = false;
      for (const value of offvalues) {
        // test every off value with the date
        if (formatter.format(date).match(value)) {
          // if the date is off we have a match we add one more day
          match = true;
          date.setDate(date.getDate() + 1);
        }
      }
      // if we matched we keep looping to check if the  new date is not off
      loop = match;
    }
  } while (formatter.format(date) !== 'Tuesday, 05/25/2021')
  // check if there is an open slot
  let failedDates = []
  let openSlots = [];
  const dateMatcher = /(\d{1,2})-(\d{1,2})-(\d{1,4})/g
  await Promise.allSettled(promises).then(results => {
    results.forEach(async (res, i) => {
      if (res.value.errno) {
        failedDates.push(res.value.message.match(dateMatcher))
      } else {
        await res.value.text().then(txt => {
          if (!txt.match('TELAH PENUH')) {
            openSlots.push(`${res.value.url.substring(res.value.url.length - 10)}`)
          } else {
            console.log(`${res.value.url.substring(res.value.url.length - 10)} is FULL`)
          }
        })
      }
    });
  })
  return res.json({ totalDays: promises.length, openSlots: {
    total: openSlots.length,
    slots: openSlots
  }, failedDates: {
    total: failedDates.length,
    dates: failedDates
  },  });
}