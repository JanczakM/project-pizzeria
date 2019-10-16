import {templates, select, settings, classNames} from '../settings.js';
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
    thisBooking.chooseTable();
    thisBooking.formSubmit();
  }

  render(bookingContainer){
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = bookingContainer;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    thisBooking.dom.container = thisBooking.dom.wrapper.querySelector(select.containerOf.bookingForm);
    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.form);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);
    thisBooking.dom.confirmation = thisBooking.dom.wrapper.querySelector(select.booking.confirmation);
  }

  initWidgets(){
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
    });
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

    thisBooking.updateDOM();
    thisBooking.setBackground();

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

  updateDOM(){
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    for(let table of thisBooking.dom.tables){
      const tableId = parseInt(table.getAttribute(settings.booking.tableIdAttribute));
      if(thisBooking.booked[thisBooking.date] &&
        thisBooking.booked[thisBooking.date][thisBooking.hour] &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].indexOf(tableId) > -1){
        table.classList.add(classNames.booking.tableBooked);
      }
      else{
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  chooseTable(){
    const thisBooking = this;

    for(let table of thisBooking.dom.tables){
      table.addEventListener('click', function(){

        if(!table.classList.contains(classNames.booking.tableBooked)){

          for(let table of thisBooking.dom.tables){
            if(table != this){
              table.classList.remove(classNames.booking.tableChosen);
            }
          }

          table.classList.toggle(classNames.booking.tableChosen);
        }

        if(table.classList.contains(classNames.booking.tableChosen)){
          thisBooking.chosenTableId = parseInt(table.getAttribute(settings.booking.tableIdAttribute));
        }
      });
    }

    thisBooking.dom.wrapper.addEventListener('updated', function(event){
      if(event.detail == thisBooking.hourPicker || event.detail == thisBooking.datePicker){
        for(let table of thisBooking.dom.tables){
          table.classList.remove(classNames.booking.tableChosen);
        }
      }
      if(event.detail == thisBooking.datePicker){
        thisBooking.setBackground();
      }
    });
  }

  formSubmit(){
    const thisBooking = this;

    thisBooking.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisBooking.sendBooking();
      thisBooking.dom.container.classList.add(classNames.booking.hidden);
      thisBooking.dom.confirmation.classList.add(classNames.booking.wrapperActive);
    });
  }

  sendBooking(){
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.booking;

    thisBooking.starters = [];

    for(let starter of thisBooking.dom.starters){
      if(starter.checked){
        thisBooking.starters.push(starter.value);
      }
    }

    const payload = {
      date: thisBooking.datePicker.value,
      hour: thisBooking.hourPicker.value,
      table: thisBooking.chosenTableId,
      duration: thisBooking.hoursAmount.value,
      ppl: thisBooking.peopleAmount.value,
      starters: thisBooking.starters,
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,
    };

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(response => response.json())
      .then(parsedResponse => {
        console.log(parsedResponse);
      });
  }

  setBackground(){
    const thisBooking = this;

    thisBooking.dom.hourPickerBcg = thisBooking.dom.form.querySelector(select.widgets.hourPicker.background);

    const open = settings.hours.open;
    const close = settings.hours.close;
    const hours = [];

    for(let i = open; i < close + 0.5; i = i + 0.5){
      hours.push(i);
    }

    const tablesAmount = [];

    for(let hour of hours){
      if(thisBooking.booked[thisBooking.date][hour]){
        tablesAmount.push(thisBooking.booked[thisBooking.date][hour].length);
      }
      else {
        tablesAmount.push(0);
      }
    }

    const colors = [];


    for(let amount of tablesAmount){
      if (amount == 3){
        colors.push('red');
      }
      if (amount == 2){
        colors.push('orange');
      }
      if (amount < 2) {
        colors.push('green');
      }
    }

    let scale = Math.round(100 / colors.length);
    let scale2 = Math.round(100 / colors.length);
    let scaleZero = 0;

    const styleRule = [];

    for(let color of colors){
      styleRule.push(color + ' ' + scaleZero + '% ' + scale + '%');
      scaleZero = scaleZero + scale2;
      scale = scale + scale2;
    }

    const style = styleRule.join(', ');

    thisBooking.dom.hourPickerBcg.style.backgroundImage = 'linear-gradient(90deg,' + style + ')';

  }
}
