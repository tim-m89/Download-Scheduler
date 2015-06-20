const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("chrome://content/DownloadScheduer/DownloadScheduler.jsm");

function install(aData, aReason) {}

function uninstall(aData, aReason) {}

function startup(aData, aReason) {
  DownloadScheduler.init();
}

function shutdown(aData, aReason) {
  DownloadScheduler.shutdown();
}

