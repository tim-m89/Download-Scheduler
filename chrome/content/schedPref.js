if(!tim_matthews) var tim_matthews={};
if(!tim_matthews.downloadScheduler) tim_matthews.downloadScheduler={};
if(!tim_matthews.downloadScheduler.schedPref_js) tim_matthews.downloadScheduler.schedPref_js = {};

tim_matthews.downloadScheduler.schedPref_js = {
  prefLoad: function() {
      var tp1 = document.getElementById("tim_matthews.downloadScheduler.prefWin.tp1");
      var tp2 = document.getElementById("tim_matthews.downloadScheduler.prefWin.tp2");
      var cbPauseEnabled = document.getElementById("tim_matthews.downloadScheduler.prefWin.cbPauseEnabled");
      
      var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
      tp1.value = prefs.getCharPref("dlScheduler.startTime");
      tp2.value = prefs.getCharPref("dlScheduler.finishTime");
      cbPauseEnabled.checked = prefs.getBoolPref("dlScheduler.pauseEnabled");
      tp2.disabled = !cbPauseEnabled.checked;
      cbPauseEnabled.addEventListener("command", { handleEvent: function(ev){ tp2.disabled = !tp2.disabled; } }, false);
  }
}

