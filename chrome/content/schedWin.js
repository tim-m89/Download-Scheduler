if(!tim_matthews) var tim_matthews={};
if(!tim_matthews.downloadScheduler) tim_matthews.downloadScheduler={};
if(!tim_matthews.downloadScheduler.schedWin_js) tim_matthews.downloadScheduler.schedWin_js = {};

tim_matthews.downloadScheduler.schedWin_js = {

  list1: {},

  init: function() {
      tim_matthews.downloadScheduler.schedWin_js.list1 = document.getElementById("tim_matthews.downloadScheduler.schedWin.list1");
      tim_matthews.downloadScheduler.schedWin_js.refreshList();
  },

  refreshList: function() {
      var Application = Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication);
      while(tim_matthews.downloadScheduler.schedWin_js.list1.itemCount > 0)
          tim_matthews.downloadScheduler.schedWin_js.list1.removeItemAt(0);

      var downloadArray = Application.storage.get("tim_matthews.downloadScheduler.downloadCtrl",  null).getDownloads();
      for (var i=0; i<downloadArray.length; i++) {
          var scheduleSlot = downloadArray[i];
          if((scheduleSlot == undefined) || (scheduleSlot==null))
              continue;

          var s = scheduleSlot.source + " → " + scheduleSlot.target;
          var listitem = tim_matthews.downloadScheduler.schedWin_js.list1.appendItem(s, scheduleSlot).setAttribute("tooltiptext", s);
      }
  },

  addDownload: function() {
      window.openDialog("chrome://dlScheduler/content/editWin.xul", "tim_matthews.downloadScheduler.editWin", "chrome, modal", -1, "", "");
      tim_matthews.downloadScheduler.schedWin_js.refreshList();
  },

  editDownload: function() {
      var index = tim_matthews.downloadScheduler.schedWin_js.list1.selectedIndex;
      if(index == -1)
          return;
      
      window.openDialog("chrome://dlScheduler/content/editWin.xul", "tim_matthews.downloadScheduler.editWin", "chrome, modal", index);
      tim_matthews.downloadScheduler.schedWin_js.refreshList();

  },

  cancelDownload: function() {
      var Application = Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication);
      var index = tim_matthews.downloadScheduler.schedWin_js.list1.selectedIndex;
      if(index == -1)
          return;
      
      var downloadArray = Application.storage.get("tim_matthews.downloadScheduler.downloadCtrl",  null).getDownloads();

      var targetFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
      targetFile.initWithPath(downloadArray[index].target);
      if(targetFile.exists() && (targetFile.fileSize==0))
        targetFile.remove(false);

      downloadArray.splice(index, 1);

      Application.storage.get("tim_matthews.downloadScheduler.downloadCtrl",  null).setDownloads(downloadArray); 

      tim_matthews.downloadScheduler.schedWin_js.refreshList();
  }

};

