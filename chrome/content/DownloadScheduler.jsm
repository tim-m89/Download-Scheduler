var EXPORTED_SYMBOLS = ["DownloadScheduler"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

const PrefBranchName = "extensions.DownloadScheduler.";

var ScheduleDownloadItem = function(source, target, startDateTime) {
  this.source        = source;
  this.target        = target;
  this.startDateTime = startDateTime;
  this.timer         = null;
};

var DownloadSchedulerState = {
  scheduleItems           : []    ,
  itemTimers              : []    ,
  stopAllTimer            : null  ,
  prefBranch              : null  ,
  originalInternalPersist : null
}

var PreferenceObserver = {

  observe: function(subject, topic, data) {

    if (topic == "nsPref:changed") {
    }

  }

}

var DownloadScheduler = {

  ScheduleItem: ScheduleDownloadItem,

  init: function() {
    DownloadScheduler.initPrefs();
    DownloadScheduler.loadScheduleItems();
    DownloadScheduler.initItemTimers();
    DownloadScheduler.initStopAllTimer();
    DownloadScheduler.addContextMenuEntries();
    DownloadScheduler.addToolbarButton();
    DownloadScheduler.replaceInternalPersist();
  },

  shutdown: function() {
    DownloadScheduler.restoreInternalPersist();
    DownloadScheduler.removeContextMenuEntries();
    DownloadScheduler.removeToolbarButton();
    DownloadScheduler.shutdownItemTimers();
    DownloadScheduler.shutdownStopAllTimer();
    DownloadScheduler.saveScheduleItems();
    DownloadScheduler.shutdownPrefs();
  },

  initPrefs: function() {

    DownloadScheduler.initDefaultPrefs();

    var prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);

    DownloadSchedulerState.prefBranch = prefService.getBranch(PrefBranchName);

    DownloadSchedulerState.prefBranch.addObserver("", PreferenceObserver, false);

  },


  initDefaultPrefs: function() {

    var prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);

    var defaultBranch = prefService.getDefaultBranch(PrefBranchName);

    var str  = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
      str.data = JSON.stringify([]);
      defaultBranch.setComplexValue("dlScheduleList", Ci.nsISupportsString, str)

    defaultBranch.setCharPref("dlScheduleTime", "0");
    defaultBranch.setCharPref("stopTime", "0");
    defaultBranch.setBoolPref("stopEnabled", false);
    defaultBranch.setBoolPref("httpPreConnectForFileName", false);

  },

  shutdownPrefs: function() {

    DownloadSchedulerState.prefBranch.removeObserver("", PreferenceObserver);
    DownloadSchedulerState.prefBranch = null;

  },

  getDefaultScheduleItemTime: function() {

    if(!DownloadSchedulerState.prefBranch.prefHasUserValue("dlScheduleTime"))
      return null;

    var scheduleTimeString = DownloadSchedulerState.prefBranch.getCharPref( "dlScheduleTime" );

    var now               = new Date();
    var lastStart         = new Date( parseInt( scheduleTimeString, 10 ) );
    var newStart          = null;

    if(lastStart > now)
      newStart = lastStart;
    else {

      newStart = new Date();
      newStart.setHours( lastStart.getHours() );
      newStart.setMinutes( lastStart.getMinutes() );
      newStart.setSeconds( 0 );

      if(newStart.getTime() < now.getTime())
        newStart.setTime( newStart.getTime() + 86400000 );

    }

    return newStart;

  },

  setDefaultScheduleItemTime: function(startDateTime) {
    DownloadSchedulerState.prefBranch.setCharPref( "dlScheduleTime", startDateTime.getTime().toString() );
  },

  initItemTimers: function() {

    var items = DownloadSchedulerState.scheduleItems;

    for(var i = 0; i < items.length; i++) {
      var scheduleItem = items[i];
      DownloadScheduler.scheduleItemSetupTimer( scheduleItem );
    }

  },

  shutdownItemTimers: function() {

    var items = DownloadSchedulerState.scheduleItems;

    for(var i = 0; i < items.length; i++) {

      var scheduleItem = items[i];

      if(scheduleItem.tiimer) {
        scheduleItem.timer.cancel();
        scheduleItem.timer = null;
      }

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
    DownloadSchedulerState.stopAllTimer.initWithCallback({ notify: function(timerr) { DownloadScheduler.stopAllDownloads(); } }, msFin, Ci.nsITimer.TYPE_ONE_SHOT);

  },

  shutdownStopAllTimer: function() {

    if(DownloadSchedulerState.stopAllTimer != null)
      DownloadSchedulerState.stopAllTimer.cancel();

    DownloadSchedulerState.stopAllTime = null;

  },

  foreachBrowserWindow: function(aCallback) {

    var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);

    var enumerator = wm.getEnumerator("navigator:browser");

    while(enumerator.hasMoreElements()) {
      var win = enumerator.getNext();
      aCallback(win);
    }

  },

  firstBrowserWindow: function() {

    var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);

    var enumerator = wm.getEnumerator("navigator:browser");

    while(enumerator.hasMoreElements()) {
      var win = enumerator.getNext();
      return win;
    }

  },

  addContextMenuEntries: function() {

    DownloadScheduler.foreachBrowserWindow(win => {

      var contextMenu    = win.document.getElementById("contentAreaContextMenu");
      var saveLinkAs     = win.document.getElementById("context-savelink");

      var scheduleLinkAsElement = win.document.createElement("menuitem");
        scheduleLinkAsElement.id        = "DownloadScheduler.context-schedulelink";
        scheduleLinkAsElement.setAttribute("label", "Schedule Link As...");
        scheduleLinkAsElement.addEventListener("command", DownloadScheduler.scheduleLinkAs, false);

      contextMenu.insertBefore(scheduleLinkAsElement, saveLinkAs.nextSibling);
      contextMenu.addEventListener("popupshowing", DownloadScheduler.contextMenuPopupShowing, false);

    } );

  },

  removeContextMenuEntries: function() {

    DownloadScheduler.foreachBrowserWindow(win => {

      var contextMenu    = win.document.getElementById("contentAreaContextMenu");

      var scheduleLinkAsElement = win.document.getElementById("DownloadScheduler.context-schedulelink");

      if(scheduleLinkAsElement != null)
        contextMenu.removeChild(scheduleLinkAsElement);

      contextMenu.removeEventListener("popupshowing", DownloadScheduler.contextMenuPopupShowing, false);

    } );

  },

  addToolbarButton: function() {

    Cu.import("resource:///modules/CustomizableUI.jsm");

    var io = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);

    var ss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);

    var uri = io.newURI("chrome://DownloadScheduler/content/button.css", null, null);

    ss.loadAndRegisterSheet(uri, ss.USER_SHEET);

    var widget = {
      id            : "DownloadScheduler-button"         ,
      defaultArea   : CustomizableUI.AREA_NAVBAR   ,
      label         : "Download Scheduler"          ,
      tooltiptext   : "Download Scheduler"         ,
      onCommand     : function(aEvent) { DownloadScheduler.showScheduleWindow(aEvent); }
    };

    CustomizableUI.createWidget(widget);

  },

  showScheduleWindow: function(aEvent) {

    var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);

    var scheduleWindow = wm.getMostRecentWindow("DownloadScheduler.schedWindow");

    if(scheduleWindow)
      scheduleWindow.focus();
    else
      aEvent.target.ownerDocument.defaultView.open( "chrome://DownloadScheduler/content/schedWin.xul", "", "chrome, width=360, height=320, resizable=yes, centerscreen" ).focus();

  },

  refreshScheduleWindow: function() {

    var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);

    var scheduleWindow = wm.getMostRecentWindow("DownloadScheduler.schedWindow");

    if(scheduleWindow)
      scheduleWindow.DownloadScheduler_schedWin.refreshList();

  },

  removeToolbarButton: function() {

    CustomizableUI.destroyWidget("DownloadScheduler-button");

    var io = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);

    var ss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);

    var uri = io.newURI("chrome://DownloadScheduler/content/button.css", null, null);

    if(ss.sheetRegistered(uri, ss.USER_SHEET))
      ss.unregisterSheet(uri, ss.USER_SHEET);

  },

  scheduleUrl: function() {
  },

  urlChooseFile: function(aUrl, aCallback) {

    var fileNameSource = aUrl;

    var httpPreConnectForFileName = DownloadSchedulerState.prefBranch.getBoolPref("httpPreConnectForFileName");

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

    DownloadScheduler.resolveFileName(fileNameSource, headerContentDisp, aCallback );

  },

  resolveFileName: function(aURL, aContentDisposition, aCallback) {

    var win = DownloadScheduler.firstBrowserWindow();

    var saveMode = win.GetSaveModeForContentType(null, null);

    var file, sourceURI, saveAsType;
    // Find the URI object for aURL and the FileName/Extension to use when saving.
    // FileName/Extension will be ignored if aChosenData supplied.
    var fileInfo = new win.FileInfo(null);
    win.initFileInfo(fileInfo, aURL, null, null, null, aContentDisposition);
    sourceURI = fileInfo.uri;

    var fpParams = {
      fpTitleKey: null, //todo add to string bundle: "Enter name of file for scheduled download...",
      fileInfo: fileInfo,
      contentType: null,
      saveMode: saveMode,
      saveAsType: win.kSaveAsType_Complete,
      file: file
    };

    var gtf = null;

    if(win['getTargetFile'] != undefined)
      gtf = win.getTargetFile;
    else
      gtf = function(aFpParams, aCallback) {
        win.promiseTargetFile(aFpParams).then( aOk => { aCallback(!aOk); } );
    };

    gtf(fpParams, aDialogCancelled => {
      if(fpParams != null) {
        if(aDialogCancelled)
          aCallback(null);
        else
          aCallback(fpParams.file.path);
      }
    } );

  },

  addItem: function(scheduleItem) {

    DownloadSchedulerState.scheduleItems.push( scheduleItem );

    DownloadScheduler.itemUpdated( scheduleItem );

  },

  itemUpdated: function(scheduleItem) {

    DownloadSchedulerState.prefBranch.setCharPref( "dlScheduleTime", scheduleItem.startDateTime.getTime().toString() );

    DownloadScheduler.initEmptyFile( scheduleItem.target );

    DownloadScheduler.scheduleItemSetupTimer( scheduleItem );

    DownloadScheduler.saveScheduleItems();

    DownloadScheduler.refreshScheduleWindow();

  },

  removeItem: function(scheduleItem) {

    var i = DownloadSchedulerState.scheduleItems.indexOf(scheduleItem);

    if(i < 0)
      return;

    DownloadSchedulerState.scheduleItems.splice(i, 1);

    DownloadScheduler.saveScheduleItems();

    DownloadScheduler.refreshScheduleWindow();

  },

  cancelItem: function(scheduleItem) {
    DownloadScheduler.removeItem(scheduleItem);
    DownloadScheduler.removeEmptyFile( scheduleItem.target );
  },

  loadScheduleItems: function() {

    var data = DownloadSchedulerState.prefBranch.getComplexValue("dlScheduleList", Ci.nsISupportsString).data;

    DownloadSchedulerState.scheduleItems = JSON.parse(data, function(k,v) {

      if( (k == "startDateTime") || (k == "dateInterval") || (k == "dateStart") )
        return new Date(v);

      return v;

    } );

  },

  saveScheduleItems: function() {

    var str  = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);

    str.data = JSON.stringify(DownloadSchedulerState.scheduleItems, function(k,v) {

      if(k == "timer")
        return undefined;
      else
        return v;

    } );

    DownloadSchedulerState.prefBranch.setComplexValue("dlScheduleList", Ci.nsISupportsString, str)

  },

  getAllScheduleItems: function() {
    return DownloadSchedulerState.scheduleItems;
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

    if(scheduleItem.timer) {

      scheduleItem.timer.cancel();
      scheduleItem.timer = null;

    }

    var now = new Date();

    var startDate = scheduleItem.startDateTime;

    var msStart = startDate.getTime() - now.getTime();

    if(msStart > 0) {

      scheduleItem.timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);

      scheduleItem.timer.initWithCallback({ notify: function(timerr) { DownloadScheduler.scheduleItemStartDownload(scheduleItem); } }, msStart, Ci.nsITimer.TYPE_ONE_SHOT);

    }

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

  contextMenuPopupShowing: function(aEvent) {

    var doc = aEvent.target.ownerDocument;

    var contextSched    = doc.getElementById("DownloadScheduler.context-schedulelink");

    var hidden          = doc.getElementById("context-savelink").hidden;

    contextSched.hidden = hidden;

  },

  stopAllDownloads: function() {

    Cu.import("resource://gre/modules/Downloads.jsm");

    Downloads.getList(Downloads.ALL).then(downloadsList => { downloadsList.getAll().then(allDownloads => {

      for(var i = 0; i < allDownloads.length; i++) {

        var download = allDownloads[i];

        download.cancel().then();

      }

    } ) } );

  },

  getNewInternalPersist: function(win) {

    var newInternalPersist = function(persistArgs) {
      /* Scheduling for any code that utilizes contentAreaUtils saving functionality (m4downloader for example) */

      var oldIP = DownloadSchedulerState.originalInternalPersist;

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
          win.openDialog("chrome://DownloadScheduler/content/editWin.xul", "", "chrome", null, source, fileName);

        }
      }

    };

    return newInternalPersist;

  },

  replaceInternalPersist: function() {

    if(DownloadSchedulerState.originalInternalPersist != null)
      return;

    DownloadScheduler.foreachBrowserWindow(win => {

      DownloadSchedulerState.originalInternalPersist = win.internalPersist;
      win.internalPersist = DownloadScheduler.getNewInternalPersist(win);

    } );

  },

  restoreInternalPersist: function() {
    if(DownloadSchedulerState.originalInternalPersist == null)
      return;

    internalPersist = DownloadSchedulerState.originalInternalPersist;
  },

  scheduleLinkAs: function(aEvent) {

    var doc = aEvent.target.ownerDocument;

    var win = doc.defaultView;

    var source = win.gContextMenu.linkURL;

    DownloadScheduler.urlChooseFile(source, function(fileName) {

      if(fileName != null)
        win.openDialog("chrome://DownloadScheduler/content/editWin.xul", "", "chrome", null, source, fileName);

    } );

  },

  initEmptyFile: function(filePath) {

    var targetFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);

    targetFile.initWithPath(filePath);

    if(!targetFile.exists())
      targetFile.create(0x00,0644);

  },

  removeEmptyFile: function(filePath) {

    var targetFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);

    targetFile.initWithPath(filePath);

    if( (targetFile.exists()) && (targetFile.fileSize==0) )
      try {
        targetFile.remove();
      } catch (ex) { }

  }


}; // DownloadScheduler



