const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;


function install(aData, aReason) {}

function uninstall(aData, aReason) {}

function startup(aData, aReason) {
  Cu.import("chrome://DownloadScheduler/content/DownloadScheduler.jsm");
  DownloadScheduler.init();
}

function shutdown(aData, aReason) {
  Cu.import("chrome://DownloadScheduler/content/DownloadScheduler.jsm");
  DownloadScheduler.shutdown();
}

