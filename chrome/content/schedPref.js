const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("chrome://DownloadScheduler/content/DownloadScheduler.jsm");

DownloadScheduler_schedPref = {

  prefLoad: function() {

      var timePickStop     = document.getElementById("DownloadScheduler.prefWin.timePickStop");
      var chkStopEnabled   = document.getElementById("DownloadScheduler.prefWin.chkStopEnabled");

      var prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);

      // this perference needs to be manuall loaded. Saving and loading of other prefs happens with the XUL alone.
      timePickStop.value      = prefs.getCharPref("extensions.DownloadScheduler.stopTime");

      timePickStop.disabled = !chkStopEnabled.checked;

      chkStopEnabled.addEventListener("command", { handleEvent: function(ev){ timePickStop.disabled = !timePickStop.disabled; } }, false);

  },

  prefUnload: function() {

    DownloadScheduler.shutdownStopAllTimer();
    DownloadScheduler.initStopAllTimer();

  }

};

