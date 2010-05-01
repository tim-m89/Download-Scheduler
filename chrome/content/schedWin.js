if(!tim_matthews) var tim_matthews={};
if(!tim_matthews.downloadScheduler) tim_matthews.downloadScheduler={};
if(!tim_matthews.downloadScheduler.schedWin_js) tim_matthews.downloadScheduler.schedWin_js = {};

tim_matthews.downloadScheduler.schedWin_js = {

  list1: {},

  init: function() {
      try {
          tim_matthews.downloadScheduler.schedWin_js.list1 = document.getElementById("tim_matthews.downloadScheduler.schedWin.list1");
          tim_matthews.downloadScheduler.schedWin_js.refreshList();
      } catch (e) {
          alert(e);
      }
  },

  refreshList: function() {
      try {
          while(tim_matthews.downloadScheduler.schedWin_js.list1.itemCount > 0)
              tim_matthews.downloadScheduler.schedWin_js.list1.removeItemAt(0);

          var downloadArray = Application.storage.get("tim_matthews.downloadScheduler.downloadArray",  null).get();
          for (var i=0; i<downloadArray.length; i++) {
              var scheduleSlot = downloadArray[i];
              if((scheduleSlot == undefined) || (scheduleSlot==null))
                  continue;

              var s = scheduleSlot.source + " → " + scheduleSlot.target;
              var listitem = tim_matthews.downloadScheduler.schedWin_js.list1.appendItem(s, scheduleSlot).setAttribute("tooltiptext", s);
          }
      } catch (e) {
          alert(e);
      }
  },

  cancelDownload: function() {
      try {
          var index = tim_matthews.downloadScheduler.schedWin_js.list1.selectedIndex;
          if(index == -1)
              return;
          
          var downloadArray = Application.storage.get("tim_matthews.downloadScheduler.downloadArray",  null).get();

          var targetFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
          targetFile.initWithPath(downloadArray[index].target);
          if(targetFile.exists() && (targetFile.fileSize==0))
            targetFile.remove(false);

          downloadArray.splice(index, 1);

          Application.storage.get("tim_matthews.downloadScheduler.downloadArray",  null).set(downloadArray); 

          tim_matthews.downloadScheduler.schedWin_js.refreshList();
      } catch (e) {
          alert(e);
      }
  }

};

