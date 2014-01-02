if(!tim_matthews) var tim_matthews={};
if(!tim_matthews.downloadScheduler) tim_matthews.downloadScheduler={};
if(!tim_matthews.downloadScheduler.editWin_js) tim_matthews.downloadScheduler.editWin_js = {};

tim_matthews.downloadScheduler.editWin_js = {

  slot: null,

  loadDownload: function() {
    var index = window.arguments[0];

    var urlBox = document.getElementById("tim_matthews.downloadScheduler.editWin.source");
    var targetBox = document.getElementById("tim_matthews.downloadScheduler.editWin.target");

    if(index>=0) {
      var downloadArray = Application.storage.get("tim_matthews.downloadScheduler.downloadCtrl",  null).getDownloads();
      this.slot = downloadArray[index];

      urlBox.value = this.slot.source;
      targetBox.value = this.slot.target;

      var timePicker1 = document.getElementById("tim_matthews.downloadScheduler.editWin.timepick");
      timePicker1.dateValue = new Date(this.slot.dateStart.getTime()); 
      var datePicker1 = document.getElementById("tim_matthews.downloadScheduler.editWin.datepick");
      datePicker1.dateValue = new Date(this.slot.dateStart.getTime()); 
    }
    else {
      urlBox.value = window.arguments[1];
      targetBox.value = window.arguments[2];
    }

  },

  chooseFile: function() {
    var dlCtrl = Application.storage.get("tim_matthews.downloadScheduler.downloadCtrl",  null);
    var src = document.getElementById("tim_matthews.downloadScheduler.editWin.source").value;

    dlCtrl.urlChooseFile(src, function(fileName) {
      document.getElementById("tim_matthews.downloadScheduler.editWin.target").value = fileName;
      window.focus();
    });

  },

  save: function() {
    var index = window.arguments[0];
    var downloadArray = Application.storage.get("tim_matthews.downloadScheduler.downloadCtrl",  null).getDownloads();

    var newSlot = {};
    newSlot.source = document.getElementById("tim_matthews.downloadScheduler.editWin.source").value;
    newSlot.target = document.getElementById("tim_matthews.downloadScheduler.editWin.target").value;
    newSlot.dateStart = document.getElementById("tim_matthews.downloadScheduler.editWin.datepick").dateValue;

    var timeDate = document.getElementById("tim_matthews.downloadScheduler.editWin.timepick").dateValue;
    newSlot.dateStart.setHours(timeDate.getHours());
    newSlot.dateStart.setMinutes(timeDate.getMinutes());
    newSlot.dateStart.setSeconds(0);

    if(index>=0) {
      Application.storage.get("tim_matthews.downloadScheduler.downloadCtrl",  null).updateSlot(this.slot, newSlot);
    } else {
      Application.storage.get("tim_matthews.downloadScheduler.downloadCtrl",  null).addOne(newSlot.source, newSlot.target, newSlot.dateStart);
    }

    window.close();
  }

};

