if(!tim_matthews) var tim_matthews={};
if(!tim_matthews.downloadScheduler) tim_matthews.downloadScheduler={};
if(!tim_matthews.downloadScheduler.editWin_js) tim_matthews.downloadScheduler.editWin_js = {};

tim_matthews.downloadScheduler.editWin_js = {

  slot: null,

  loadDownload: function() {
    var index = window.arguments[0];
    if(index>=0) {
      var downloadArray = Application.storage.get("tim_matthews.downloadScheduler.downloadArray",  null).get();
      this.slot = downloadArray[index];
      document.getElementById("tim_matthews.downloadScheduler.editWin.source").value = this.slot.source;
      document.getElementById("tim_matthews.downloadScheduler.editWin.target").value = this.slot.target;
      var radioRec = document.getElementById("tim_matthews.downloadScheduler.editWin.radioRecurring");
      var radioOne = document.getElementById("tim_matthews.downloadScheduler.editWin.radioOneTime");
      var groupFreq =  document.getElementById("tim_matthews.downloadScheduler.editWin.groupFreq");
      if(this.slot.recurring)
        groupFreq.selectedItem = radioRec;
      else
        groupFreq.selectedItem = radioOne;
      var timePicker1 = document.getElementById("tim_matthews.downloadScheduler.editWin.timepick");
      timePicker1.dateValue = new Date(this.slot.dateStart.getTime()); 
    }
  },

  chooseFile: function() {
    try {
    var nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, "Enter name of file for scheduled download...", nsIFilePicker.modeSave);
    
    var src = document.getElementById("tim_matthews.downloadScheduler.editWin.source").value;

    if(src.length>3) {
      var fileName = Application.storage.get("tim_matthews.downloadScheduler.downloadArray",  null).parseURL(src);
      fp.defaultString = fileName.file;
      fp.defaultExtension = fileName.ext;
      if(fileName.ext.length > 0)
        fp.appendFilter(fileName.ext, "*." + fileName.ext);
      fp.appendFilter("All files (*.*)", "*.*");
    }

    if(fp.show() == 1)
      return;

    document.getElementById("tim_matthews.downloadScheduler.editWin.target").value = fp.file.path;

    } catch (e) { alert(e); }
  },

  save: function() {
    var index = window.arguments[0];
    var downloadArray = Application.storage.get("tim_matthews.downloadScheduler.downloadArray",  null).get();
    var newSlot = {};
    newSlot.source = document.getElementById("tim_matthews.downloadScheduler.editWin.source").value;
    newSlot.target = document.getElementById("tim_matthews.downloadScheduler.editWin.target").value;
    newSlot.recurring = document.getElementById("tim_matthews.downloadScheduler.editWin.radioRecurring").selected;
    newSlot.dateStart = document.getElementById("tim_matthews.downloadScheduler.editWin.timepick").dateValue; 
    var hours = document.getElementById("tim_matthews.downloadScheduler.editWin.textboxH").value;
    var mins = document.getElementById("tim_matthews.downloadScheduler.editWin.textboxM").value;
    newSlot.dateInterval = new Date();
    newSlot.dateInterval.setHours(parseInt(hours));
    newSlot.dateInterval.setMinutes(parseInt(mins));
    if(index>=0) {
      Application.storage.get("tim_matthews.downloadScheduler.downloadArray",  null).updateSlot(this.slot, newSlot);
    } else {
      Application.storage.get("tim_matthews.downloadScheduler.downloadArray",  null).addOne(newSlot.source, newSlot.target, newSlot.recurring, newSlot.dateStart, newSlot.dateInterval);
    }
    window.close();
  }

};

