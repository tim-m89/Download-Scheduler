var EXPORTED_SYMBOLS = ["DownloadScheduler"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var ScheduleDownloadItem = function(source, target, startDateTime) {
  this.source        = source;
  this.target        = target;
  this.startDateTime = startDateTime;
};

var DownloadSchedulerState = {
  scheduleItems : []    ,
  itemTimers    : []    ,
  stopAllTimer  : null  ,
  prefBranch    : null
}

var PreferenceObserver = {

  observe: function(subject, topic, data) {

    if (topic == "nsPref:changed") {
    }

  }

}

var DownloadScheduler = {

  init: function() {
    initPrefs();
    loadScheduleItems();
    initItemTimers();
    initStopAllTimer();
    addContextMenuEntries();
  },

  shutdown: function() {
    removeContextMenuEntries();
    shutdownItemTimers();
    shutdownStopAllTimer();
    saveScheduleItems();
    shutdownPrefs();
  },

  initPrefs: function() {

    var prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);

    DownloadSchedulerState.prefBranch = prefService.getBranch("extensions.DownloadScheduler.");

    DownloadSchedulerState.prefBranch.addObserver("", PreferenceObserver, false);

  },

  shutdownPrefs: function() {

    DownloadSchedulerState.prefBranch.removeObserver("", PreferenceObserver);
    DownloadSchedulerState.prefBranch = null;

  },

  initItemTimers: function() {

    var items = DownloadScheduler.getScheduleItems();

    for(var i = 0; i < items.length; i++) {
      var scheduleItem = items[i];
      DownloadSchedulerState.itemTimers.push( DownloadScheduler.setupTimer(scheduleItem) );
    }

  },

  shutdownItemTimers: function() {

    while(DownloadSchedulerState.itemTimers.length > 0 ) {
      var timer = DownloadSchedulerState.itemTimers.pop();
      timer.cancel();
    }

  },

  initStopAllTimer: function() {

    var stopEnabled = DownloadSchedulerState.prefBranch.getBoolPref("stopEnabled");

    if(!stopEnabled)
      return;

    var stopTimeString = DownloadSchedulerState.prefBranch.getCharPref("stopTime");

    var stopDate = DownloadSchedulerInternal.timeStringToDate(stopTimeString);

    var now = new Date();

    if(stopDate.getTime() < now.getTime())
      stopDate.setTime(stopDate.getTime() + 86400000);

    var msFin = stopDate.getTime() - now.getTime();

    DownloadSchedulerState.stopAllTimer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
    DownloadSchedulerState.stopAllTimer.initWithCallback({ notify: function(timerr) { DownloadSchedulerInternal.stopDownloads(); } }, msFin, Ci.nsITimer.TYPE_ONE_SHOT);

  },

  shutdownStopAllTimer: function() {

    if(DownloadSchedulerState.stopAllTimer != null)
      DownloadSchedulerState.stopAllTimer.cancel();

    DownloadSchedulerState.stopAllTime = null;

  },

  addContextMenuEntries: function() {
  },

  removeContextMenuEntries: function() {
  },

  scheduleUrl: function() {
  },

  urlChooseFile: function() {
  },

  addItem: function() {
  },

  removeItem: function() {
  },

  loadScheduleItems: function() {
  },

  saveScheduleItems: function() {

    var str  = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);

    str.data = JSON.stringify(DownloadSchedulerState.scheduleItems);

    DownloadSchedulerState.prefBranch.setComplexValue("dlScheduleList", Ci.nsISupportsString, str)

  },

  timeStringToDate: function(timeString) {

    var date = new Date();

    var timeComponents = timeString.split(":");

    var hours = parseInt( timeComponents[0], 10 );
    var mins  = parseInt( timeComponents[1], 10 );

    date.setHours(hours, mins, 0);

    return date;

  },

  scheduleItemSetupTimer: function(scheduleItem) {

    var now = new Date();

    var startDate = scheduleItem.dateStart;

    var msStart = startDate.getTime() - now.getTime();

    var startTimer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);

    startTimer.initWithCallback({ notify: function(timerr) { DownloadScheduler.scheduleItemStartDownload(scheduleItem); } }, msStart, Ci.nsITimer.TYPE_ONE_SHOT);

    return startTimer;

  },

  scheduleItemStartDownload: function(scheduleItem) {

    Cu.import("resource://gre/modules/Downloads.jsm");

    Downloads.getList(Downloads.ALL).then(downloadsList => {

      var downloadProps = {};
      downloadProps.source = scheduleItem.source;
      downloadProps.target = scheduleItem.target;

      Downloads.createDownload( downloadProps ).then(newDl => {

        newDl.tryToKeepPartialData = true;
        newDl.start().then();
        downloadsList.add(newDl).then();

        DownloadScheduler.removeItem(scheduleItem);

      } );

    } );

  },

  contextMenuPopupShowing: function(event) {
    var contextSched    = document.getElementById("tim_matthews.downloadScheduler.context-schedulelink");
    var contextSep      = document.getElementById("tim_matthews.downloadScheduler.context-separator1");
    contextSched.hidden = document.getElementById("context-savelink").hidden;
    contextSep.hidden   = contextSched.hidden;
  }


}; // DownloadScheduler







init: function() {
var Application = Cc["@mozilla.org/fuel/application;1"].getService(Ci.fuelIApplication); 
var contextMenu = document.getElementById("contentAreaContextMenu");
if (contextMenu)
contextMenu.addEventListener("popupshowing", DownloadSchedulerInternal.thumbnailsShowHideItems, false);

var downloadCtrl = {
da: null,
getDownloads: function() {
if(!this.da) {
this.da = JSON.parse(prefs.getComplexValue("extensions.tim_matthews.dlScheduler.dlScheduleList", Ci.nsISupportsString).data, function(k,v) {
if((k == "dateStart") || (k == "dateInterval"))
return new Date(v);
return v; }
);
}
return this.da;
},
setDownloads: function(arr) {
},
addOne: function(remote, local, dateStart) {
var targetFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
targetFile.initWithPath(local);

if(!targetFile.exists())
targetFile.create(0x00,0644);

var downloadArray = this.getDownloads();

var scheduleItem = {};
scheduleItem.source = remote;
scheduleItem.target = local;
scheduleItem.dateStart = dateStart;

downloadArray.push(scheduleItem);

this.setDownloads(downloadArray);

prefs.setCharPref("extensions.tim_matthews.dlScheduler.dlScheduleTime", dateStart.getTime().toString());
},
removeSlot: function(slot) {
var da = this.getDownloads();
var i = da.indexOf(slot);
if(i < 0)
return;
da.splice(i, 1);
this.setDownloads(da);
},
updateSlot: function(oldSlot, newSlot) {
var da = this.getDownloads();
var i = da.indexOf(oldSlot);
if(i < 0)
return;
da.splice(i, 1, newSlot);
this.setDownloads(da);
},
urlChooseFile: function(aUrl, aCallback) {

var fileNameSource = aUrl;

var httpPreConnectForFileName = prefs.getBoolPref("extensions.tim_matthews.dlScheduler.httpPreConnectForFileName");

if(httpPreConnectForFileName) {

// This try catch block is specifically for HTTP connections to infer a file name
try {

var headerLocation = null;
var headerContentDisp = null;

var isRedirect = false;

var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);

do {
// create an nsIURI using headerLocation if possible otherwise the aUri 
var uri = ioService.newURI(headerLocation == null ? aUrl : headerLocation, null, null);

// get a channel for that nsIURI
var ch = ioService.newChannelFromURI(uri);

try {

// This is HTTP specific so query that capability
ch = ch.QueryInterface(Ci.nsIHttpChannel);

// We are interested in following these a few times until we get the actual file 
ch.redirectionLimit = 10;

ch.open();

try {
// Look for a file location
headerLocation = ch.getResponseHeader("location")
} catch (ex) {}
try {
// Will take precedence in determining the target file name if available
headerContentDisp = ch.getResponseHeader("content-disposition");
} catch (ex) {}

isRedirect = ch.responseStatus >= 300 && ch.responseStatus <= 399;

// Make sure to close this channel since we only use it for the file name now and getting the content later
ch.cancel(Components.results.NS_BINDING_ABORTED);

} catch (ex) {}

} while(isRedirect)


// If we saw location elements then use those as the url for the routine below to determine the file name
if( headerLocation != null)
fileNameSource = headerLocation;

} catch (ex) {}

}

DownloadSchedulerInternal.getFileNameInternal(fileNameSource, headerContentDisp, function(fileName) {
aCallback(fileName);
});

}

}; //dlctrl

Application.storage.set("tim_matthews.downloadScheduler.downloadCtrl",  downloadCtrl );

/* Scheduling for any code that utilizes contentAreaUtils saving functionality (m4downloader for example) */
var oldIP = internalPersist;
internalPersist = function(persistArgs) {
if(persistArgs.sourceDocument)
oldIP(persistArgs); //only have option to schedule if not saving document
else {
var prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);
var check = {value: false};
var flags = prompts.BUTTON_POS_0 * prompts.BUTTON_TITLE_IS_STRING + prompts.BUTTON_POS_1 * prompts.BUTTON_TITLE_CANCEL + prompts.BUTTON_POS_2 * prompts.BUTTON_TITLE_IS_STRING;
var button = prompts.confirmEx(null, "Download Scheduler", "Would you like to start the download now or schedule for later?", flags, "Download now", "", "Scheduler for later", null, check);
if(button==0)
oldIP(persistArgs);
else if(button==1)
return;
else if(button==2) {
var source = persistArgs.sourceURI.spec;
var fileName = persistArgs.targetFile.path;
window.openDialog("chrome://dlScheduler/content/editWin.xul", "tim_matthews.downloadScheduler.editWin", "chrome", -1, source, fileName);
}
}
};


DownloadSchedulerInternal.timerCtrl.setupTimers();
DownloadSchedulerInternal.timerCtrl.setupStopTimer();

},

showScheduler: function() {
window.open("chrome://dlScheduler/content/schedWin.xul", "tim_matthews.downloadScheduler.schedWin", "chrome, width=360, height=320, resizable=yes, centerscreen" ).focus();
},


stopDownloads: function() {
console.log("stopping downloads");

Cu.import("resource://gre/modules/Downloads.jsm");

Downloads.getList(Downloads.ALL).then(downloadsList => { downloadsList.getAll().then(allDownloads => {

for(var i = 0; i < allDownloads.length; i++) {

var download = allDownloads[i];

download.cancel().then();

}

} ) } );


},

getFileNameInternal: function(aURL, aContentDisposition, aCallback) {

var saveMode = GetSaveModeForContentType(null, null);

var file, sourceURI, saveAsType;
// Find the URI object for aURL and the FileName/Extension to use when saving.
// FileName/Extension will be ignored if aChosenData supplied.
var fileInfo = new FileInfo(null);
initFileInfo(fileInfo, aURL, null, null,
null, aContentDisposition);
sourceURI = fileInfo.uri;

var fpParams = {
fpTitleKey: null, //todo add to string bundle: "Enter name of file for scheduled download...",
fileInfo: fileInfo,
contentType: null,
saveMode: saveMode,
saveAsType: kSaveAsType_Complete,
file: file
};

var gtf = null;

if(window['getTargetFile'] != undefined)
gtf = getTargetFile;
else 
gtf = function(aFpParams, aCallback) {
promiseTargetFile(aFpParams).then( aOk => { aCallback(!aOk); } );
};

gtf(fpParams, aDialogCancelled => {
if(fpParams != null) {
if(aDialogCancelled)
aCallback(null);
else
aCallback(fpParams.file.path);
}
});

},

scheduleLinkAs: function() {
var Application = Cc["@mozilla.org/fuel/application;1"].getService(Ci.fuelIApplication);
var dlCtrl = Application.storage.get("tim_matthews.downloadScheduler.downloadCtrl",  null);

var source = gContextMenu.linkURL;

dlCtrl.urlChooseFile(source, function(fileName) {

if(fileName != null)
window.openDialog("chrome://dlScheduler/content/editWin.xul", "tim_matthews.downloadScheduler.editWin", "chrome", -1, source, fileName);

});
},




