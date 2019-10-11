/* global flatpickr */

import {utils} from '../utils.js';
import {select, settings} from '../settings.js';
import {BaseWidget} from './basewidget.js';

export class DatePicker extends BaseWidget{
  constructor(wrapper){
    super(wrapper, utils.dateToStr(new Date()));
    const thisWidget = this;

    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.datePicker.input);
    thisWidget.initPlugin();
  }

  initPlugin(){
    const thisWidget = this;

    thisWidget.minDate = new Date(thisWidget.value);
    thisWidget.maxDate = utils.addDays(thisWidget.minDate, settings.datePicker.maxDaysInFuture);

    flatpickr(thisWidget.dom.input, {
      defaultDate: thisWidget.minDate,
      minDate: thisWidget.minDate,
      maxDate: thisWidget.maxDate,
      locale: {
        firstDayOfWeek: 1
      },
      disable: [
        function(date){
          return (date.getDay() === 1);
        }
      ],
      onChange: function(dateStr){
        thisWidget.value = dateStr;
      }
    });
  }

  parseValue(newValue){
    const day = newValue[0].getDate();
    const month = newValue[0].getMonth() + 1;
    const year = newValue[0].getFullYear();
    const fullDate = year + '-' + month + '-' + day;
    return fullDate;
  }

  isValid(){
    return true;
  }

  renderValue(){

  }
}
