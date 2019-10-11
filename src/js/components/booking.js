import {templates, select, settings} from '../settings.js';
import {AmountWidget} from './amountwidget.js';
import {DatePicker} from './datepicker.js';
import {HourPicker} from './hourpicker.js';
import {utils} from '../utils.js';

export class Booking{
  constructor(bookingContainer){
    const thisBooking = this;
    thisBooking.render(bookingContainer);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  render(bookingContainer){
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = bookingContainer;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
  }

  initWidgets(){
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this;
    if(!thisBooking.booked[date]){
      thisBooking.booked[date] = {};
    }
    const iterate = duration * 2;

    for(let i = 0; i < iterate; i++){
      if(!thisBooking.booked[date][hour + (0.5 * i)]){
        thisBooking.booked[date][hour + (0.5 * i)] = [];
      }
      thisBooking.booked[date][hour + (0.5 * i)].push(table);
    }
  }

  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;

    thisBooking.booked = {};

    for(let currentEventsData of eventsCurrent){
      thisBooking.makeBooked(currentEventsData.date, utils.hourToNumber(currentEventsData.hour), currentEventsData.duration, currentEventsData.table);
    }

    for(let bookingsData of bookings){
      thisBooking.makeBooked(bookingsData.date, utils.hourToNumber(bookingsData.hour), bookingsData.duration, bookingsData.table);
    }

    const year = thisBooking.datePicker.minDate.getUTCFullYear();
    const month = thisBooking.datePicker.minDate.getUTCMonth() + 1;

    for(let repeatEventsData of eventsRepeat){
      for(let i = thisBooking.datePicker.minDate.getDate(); i < (thisBooking.datePicker.maxDate.getDate() + 1); i++){
        thisBooking.makeBooked(year + '-' + month + '-' + i, utils.hourToNumber(repeatEventsData.hour), repeatEventsData.duration, repeatEventsData.table);
      }
    }

    console.log(thisBooking.booked);

  }

  getData(){
    const thisBooking = this;

    const startEndDates = {};
    startEndDates[settings.db.dateStartParamKey] = utils.dateToStr(thisBooking.datePicker.minDate);
    startEndDates[settings.db.dateEndParamKey] = utils.dateToStr(thisBooking.datePicker.maxDate);

    const endDate = {};
    endDate[settings.db.dateEndParamKey] = startEndDates[settings.db.dateEndParamKey];

    const params = {
      booking: utils.queryParams(startEndDates),
      eventsCurrent: settings.db.notRepeatParam + '&' + utils.queryParams(startEndDates),
      eventsRepeat: settings.db.repeatParam + '&' + utils.queryParams(endDate),
    };

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking,
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent,
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat,
    };

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function([bookingsResponse, eventsCurrentResponse, eventsRepeatResponse]){
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }
}
