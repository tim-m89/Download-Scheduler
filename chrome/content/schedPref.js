if(!tim_matthews) var tim_matthews={};
if(!tim_matthews.downloadScheduler) tim_matthews.downloadScheduler={};
if(!tim_matthews.downloadScheduler.schedPref_js) tim_matthews.downloadScheduler.schedPref_js = {};

tim_matthews.downloadScheduler.schedPref_js = {
  prefLoad: function() {
      var tp1 = document.getElementById("tim_matthews.downloadScheduler.prefWin.tp1");
      var cbPauseEnabled = document.getElementById("tim_matthews.downloadScheduler.prefWin.cbPauseEnabled");
      
      var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
      tp1.value = prefs.getCharPref("dlScheduler.startTime");
  }
}

