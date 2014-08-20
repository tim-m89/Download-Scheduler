if(!tim_matthews) var tim_matthews={};
if(!tim_matthews.downloadScheduler) tim_matthews.downloadScheduler={};
if(!tim_matthews.downloadScheduler.schedPref_js) tim_matthews.downloadScheduler.schedPref_js = {};

tim_matthews.downloadScheduler.schedPref_js = {
  prefLoad: function() {
      var timePickStop     = document.getElementById("tim_matthews.downloadScheduler.prefWin.timePickStop");
      var chkStopEnabled = document.getElementById("tim_matthews.downloadScheduler.prefWin.chkStopEnabled");
      
      var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

      timePickStop.value = prefs.getCharPref("extensions.tim_matthews.dlScheduler.stopTime");
      chkStopEnabled.checked = prefs.getBoolPref("extensions.tim_matthews.dlScheduler.stopEnabled");
      timePickStop.disabled = !chkStopEnabled.checked;
      chkStopEnabled.addEventListener("command", { handleEvent: function(ev){ timePickStop.disabled = !timePickStop.disabled; } }, false);
  }
}

