const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("chrome://DownloadScheduler/content/DownloadScheduler.jsm");

DownloadScheduler_schedWin = {

  getListBox: function() {
    return document.getElementById("DownloadScheduler.schedWin.listBoxItems");
  },

  getCurrentItem: function() {

    var listBox = DownloadScheduler_schedWin.getListBox();

    var index = listBox.selectedIndex;

    if(index < 0)
      return null;

    var scheduleItems = DownloadScheduler.getAllScheduleItems();

    return scheduleItems[ index ];

  },

  refreshList: function() {

      var listBox = DownloadScheduler_schedWin.getListBox();

      while(listBox.itemCount > 0)
          listBox.removeItemAt(0);

      var scheduleItems = DownloadScheduler.getAllScheduleItems();

      for (var i=0; i < scheduleItems.length; i++) {

          let scheduleItem = scheduleItems[i];

          if(scheduleItem == null)
              continue;

          let str = scheduleItem.source + " → " + scheduleItem.target;

          listBox.appendItem(str, scheduleItem).setAttribute("tooltiptext", str);
      }

  },

  addItem: function() {
      window.openDialog("chrome://DownloadScheduler/content/editWin.xul", "", "chrome, modal", null, "", "");
  },

  editItem: function() {

      var scheduleItem = DownloadScheduler_schedWin.getCurrentItem();

      if(scheduleItem != null)
        window.openDialog("chrome://DownloadScheduler/content/editWin.xul", "", "chrome, modal", scheduleItem);

  },

  cancelItem: function() {

      var scheduleItem = DownloadScheduler_schedWin.getCurrentItem();

      if(scheduleItem != null)
        DownloadScheduler.cancelItem(scheduleItem);

  }

};

