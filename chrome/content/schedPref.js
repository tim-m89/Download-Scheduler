const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

DownloadScheduler_schedPref = {

  prefLoad: function() {

      var timePickStop     = document.getElementById("DownloadScheduler.prefWin.timePickStop");
      var chkStopEnabled   = document.getElementById("DownloadScheduler.prefWin.chkStopEnabled");

      var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

      timePickStop.value      = prefs.getCharPref("extensions.DownloadScheduler.stopTime");
      chkStopEnabled.checked  = prefs.getBoolPref("extensions.DownloadScheduler.stopEnabled");

      timePickStop.disabled = !chkStopEnabled.checked;

      chkStopEnabled.addEventListener("command", { handleEvent: function(ev){ timePickStop.disabled = !timePickStop.disabled; } }, false);

  }

};

