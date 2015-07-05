const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("chrome://DownloadScheduler/content/DownloadScheduler.jsm");


DownloadScheduler_editWin = {

  getCurrentScheduleItem: function() {

    if((window.arguments != null) && (window.arguments[0] != null))
      return window.arguments[0];
    else
      return null;

  },

  datePickerSetDate: function(datePicker, dateTime) {
    datePicker.date    = dateTime.getDate();
    datePicker.month   = dateTime.getMonth();
    datePicker.year    = dateTime.getFullYear();
  },

  timePickerSetTime: function(timePicker, dateTime) {
    timePicker.hour    = dateTime.getHours();
    timePicker.minute  = dateTime.getMinutes();
    timePicker.second  = dateTime.getSeconds();
  },

  loadDownload: function() {

    var urlBox      = document.getElementById("DownloadScheduler.editWin.source");
    var targetBox   = document.getElementById("DownloadScheduler.editWin.target");

    var timePicker  = document.getElementById("DownloadScheduler.editWin.timepick");
    var datePicker  = document.getElementById("DownloadScheduler.editWin.datepick");

    var scheduleItem = DownloadScheduler_editWin.getCurrentScheduleItem();

    var source       = null;
    var target       = null;
    var scheduleTime = null;

    if(scheduleItem) {

      source       = scheduleItem.source;
      target       = scheduleItem.target

      scheduleTime = scheduleItem.startDateTime;

    } else {

      if(window.arguments.length >= 2)
        source    = window.arguments[1];
      if(window.arguments.length >= 3)
        target    = window.arguments[2];

      scheduleTime = DownloadScheduler.getDefaultScheduleItemTime();

    }

    if(source)
      urlBox.value    = source;

    if(target)
      targetBox.value = target;

    if(scheduleTime) {
      DownloadScheduler_editWin.datePickerSetDate( datePicker, scheduleTime );
      DownloadScheduler_editWin.timePickerSetTime( timePicker, scheduleTime );
    }


  },

  chooseFile: function() {

    var src = document.getElementById("DownloadScheduler.editWin.source").value;

    DownloadScheduler.urlChooseFile(src, function(fileName) {
      if(fileName != null)
        document.getElementById("DownloadScheduler.editWin.target").value = fileName;
      window.focus();
    } );

  },

  save: function() {


    var source        = document.getElementById("DownloadScheduler.editWin.source").value;
    var target        = document.getElementById("DownloadScheduler.editWin.target").value;
    var startDate     = document.getElementById("DownloadScheduler.editWin.datepick").dateValue;
    var startTime     = document.getElementById("DownloadScheduler.editWin.timepick").dateValue;

    var startDateTime = new Date( startDate.getTime() );
      startDateTime.setHours( startTime.getHours() );
      startDateTime.setMinutes( startTime.getMinutes() );
      startDateTime.setSeconds(0);

    var scheduleItem = DownloadScheduler_editWin.getCurrentScheduleItem();

    if(scheduleItem != null) {
      scheduleItem.source        = source;
      scheduleItem.target        = target;
      scheduleItem.startDateTime = startDateTime;
      DownloadScheduler.itemUpdated( scheduleItem );
    }
    else {
      scheduleItem = new DownloadScheduler.ScheduleItem( source, target, startDateTime );
      DownloadScheduler.addItem( scheduleItem );
    }

    window.close();

  }

};

