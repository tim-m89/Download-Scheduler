if(!tim_matthews) var tim_matthews={};
if(!tim_matthews.downloadScheduler) tim_matthews.downloadScheduler={};
if(!tim_matthews.downloadScheduler.editWin_js) tim_matthews.downloadScheduler.editWin_js = {};

tim_matthews.downloadScheduler.editWin_js = {

  loadDownload: function() {
    var Application = Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication);
    var index = window.arguments[0];
    if(index>=0) {
      var downloadArray = Application.storage.get("tim_matthews.downloadScheduler.downloadArray",  null).get();
      var scheduleSlot = downloadArray[index];
      document.getElementById("tim_matthews.downloadScheduler.editWin.source").value = scheduleSlot.source;
      document.getElementById("tim_matthews.downloadScheduler.editWin.target").value = scheduleSlot.target;
      document.getElementById("tim_matthews.downloadScheduler.editWin.recurring").checked = scheduleSlot.recurring; 
    }
  },

  chooseFile: function() {
    try {
    var Application = Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication);
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
    var Application = Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication);
    if(index>=0) {
      var downloadArray = Application.storage.get("tim_matthews.downloadScheduler.downloadArray",  null).get();
      var scheduleSlot = downloadArray[index];
      scheduleSlot.source = document.getElementById("tim_matthews.downloadScheduler.editWin.source").value;
      scheduleSlot.target = document.getElementById("tim_matthews.downloadScheduler.editWin.target").value;
      scheduleSlot.recurring = document.getElementById("tim_matthews.downloadScheduler.editWin.recurring").checked;
      Application.storage.get("tim_matthews.downloadScheduler.downloadArray",  null).set(downloadArray);
    } else {
      Application.storage.get("tim_matthews.downloadScheduler.downloadArray",  null).addOne(
              document.getElementById("tim_matthews.downloadScheduler.editWin.source").value,
              document.getElementById("tim_matthews.downloadScheduler.editWin.target").value,
              document.getElementById("tim_matthews.downloadScheduler.editWin.recurring").checked)
    } 
    window.close();
  }

};

