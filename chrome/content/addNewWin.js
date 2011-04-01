if(!tim_matthews) var tim_matthews={};
if(!tim_matthews.downloadScheduler) tim_matthews.downloadScheduler={};
if(!tim_matthews.downloadScheduler.addNewWin_js) tim_matthews.downloadScheduler.addNewWin_js = {};

tim_matthews.downloadScheduler.addNewWin_js = {

  chooseFile: function() {
    try {
    var nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, "Enter name of file for scheduled download...", nsIFilePicker.modeSave);
    
    var src = document.getElementById("tim_matthews.downloadScheduler.addNewWin.source").value;

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

    document.getElementById("tim_matthews.downloadScheduler.addNewWin.target").value = fp.file.path;

    } catch (e) { alert(e); }
  },

  schedule: function() {
    Application.storage.get("tim_matthews.downloadScheduler.downloadArray",  null).addOne(
              document.getElementById("tim_matthews.downloadScheduler.addNewWin.source").value,
              document.getElementById("tim_matthews.downloadScheduler.addNewWin.target").value,
              document.getElementById("tim_matthews.downloadScheduler.addNewWin.recurring").checked);
    window.close();
  }

};

