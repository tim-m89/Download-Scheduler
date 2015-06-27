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

  loadDownload: function() {

    var urlBox      = document.getElementById("DownloadScheduler.editWin.source");
    var targetBox   = document.getElementById("DownloadScheduler.editWin.target");
    var timePicker  = document.getElementById("DownloadScheduler.editWin.timepick");
    var datePicker  = document.getElementById("DownloadScheduler.editWin.datepick");

    var scheduleItem = DownloadScheduler_editWin.getCurrentScheduleItem();

    if(scheduleItem != null) {

      urlBox.value    = scheduleItem.source;
      targetBox.value = scheduleItem.target;

      timePicker.dateValue = new Date(this.slot.dateStart.getTime());
      datePicker.dateValue = new Date(this.slot.dateStart.getTime());

    } else {

      scheduleTime = DownloadScheduler.getDefaultScheduleItemTime();

      if(scheduleTime != null) {
        timePicker.dateValue = new Date(scheduleTime.getTime());
        datePicker.dateValue = new Date(scheduleTime.getTime());
      }

      if(window.arguments.length >= 2)
        urlBox.value    = window.arguments[1];
      if(window.arguments.length >= 3)
        targetBox.value = window.arguments[2];

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

