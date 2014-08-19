
if(!tim_matthews) var tim_matthews={};
if(!tim_matthews.downloadScheduler) tim_matthews.downloadScheduler={};
if(!tim_matthews.downloadScheduler.dlScheduler_js) tim_matthews.downloadScheduler.dlScheduler_js = {};

tim_matthews.downloadScheduler.dlScheduler_js = {

  timeStringToDate: function(timeString) {
    var date = new Date();

    var timeComponents = timeString.split(":");
    var hours = parseInt( timeComponents[0], 10 );
    var mins = parseInt( timeComponents[1], 10 );

    date.setHours(hours, mins, 0);

    return date;
  },

  timerCtrl: {
    startTimers: [],
    stopTimer: null,
    setupTimer: function(scheduleSlot) {
        var now = new Date();
        var startDate = scheduleSlot.dateStart;
        var msStart = startDate.getTime() - now.getTime();
        var startTimer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
        startTimer.initWithCallback({ notify: function(timerr) { tim_matthews.downloadScheduler.dlScheduler_js.startDownload(scheduleSlot); } }, msStart, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
        return startTimer;
    },
    setupTimers: function() {
      while(this.startTimers.length > 0 ) {
        var timer = this.startTimers.pop();
        timer.cancel();
      }
      var dlCtrl = Application.storage.get("tim_matthews.downloadScheduler.downloadCtrl",  null);
      var da = null;
      if(dlCtrl != null)
        da = dlCtrl.getDownloads();
      if(da != null) {
        for(var i = 0; (i < da.length) ; i++) {
          var scheduleSlot = da[i];
          this.startTimers.push(this.setupTimer(scheduleSlot));
        }
      }
    },
    setupStopTimer: function() {
      console.log("Setting up stop timer");

      if(this.stopTimer != null)
        this.stopTimer.cancel();

      var stopEnabled = this.observedPrefs.getBoolPref("extensions.tim_matthews.dlScheduler.stopEnabled");

      console.log("Stop enabled = " + stopEnabled.toString());
      
      if(!stopEnabled)
        return;

      var stopTimeString = this.observedPrefs.getCharPref("extensions.tim_matthews.dlScheduler.stopTime");

      var stopDate = tim_matthews.downloadScheduler.dlScheduler_js.timeStringToDate(stopTimeString);

      var now = new Date();

      if(stopDate.getTime() < now.getTime())
        stopDate.setTime(stopDate.getTime() + 86400000);

      var msFin = stopDate.getTime() - now.getTime();


      this.stopTimer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
      this.stopTimer.initWithCallback({ notify: function(timerr) { tim_matthews.downloadScheduler.dlScheduler_js.stopDownloads(); } }, msFin, Components.interfaces.nsITimer.TYPE_ONE_SHOT);

    },
    observe: function(subject, topic, data) {
      if (topic == "nsPref:changed")
        this.setupStopTimer();
    }
  },

  thumbnailsShowHideItems: function(event) {
    var contextSched = document.getElementById("tim_matthews.downloadScheduler.context-schedulelink");
    var contextSep = document.getElementById("tim_matthews.downloadScheduler.context-separator1");
    contextSched.hidden = document.getElementById("context-savelink").hidden;
    contextSep.hidden = contextSched.hidden;
  },

  init: function() {
    var Application = Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication); 
    var contextMenu = document.getElementById("contentAreaContextMenu");
    if (contextMenu)
        contextMenu.addEventListener("popupshowing", tim_matthews.downloadScheduler.dlScheduler_js.thumbnailsShowHideItems, false);
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

    prefs.addObserver("extensions.tim_matthews.dlScheduler.", tim_matthews.downloadScheduler.dlScheduler_js.timerCtrl, false);
    tim_matthews.downloadScheduler.dlScheduler_js.timerCtrl.observedPrefs = prefs;

    var downloadCtrl = {
      da: null,
      getDownloads: function() {
        if(!this.da) {
          this.da = JSON.parse(prefs.getComplexValue("extensions.tim_matthews.dlScheduler.dlScheduleList", Components.interfaces.nsISupportsString).data, function(k,v) {
            if((k == "dateStart") || (k == "dateInterval"))
              return new Date(v);
            return v; }
          );
        }
        return this.da;
      },
      setDownloads: function(arr) {
        var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
        str.data = JSON.stringify(arr);
        prefs.setComplexValue("extensions.tim_matthews.dlScheduler.dlScheduleList", Components.interfaces.nsISupportsString, str)
        this.da = arr;

        tim_matthews.downloadScheduler.dlScheduler_js.timerCtrl.setupTimers();

        var scheduleWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("tim_matthews.downloadScheduler.schedWindow");
        if((scheduleWindow) && (scheduleWindow.tim_matthews.downloadScheduler.schedWin_js))
          scheduleWindow.tim_matthews.downloadScheduler.schedWin_js.refreshList();
      },
      addOne: function(remote, local, dateStart) {
        var targetFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
        targetFile.initWithPath(local);

        if(!targetFile.exists())
          targetFile.create(0x00,0644);

        var downloadArray = this.getDownloads();

        var scheduleSlot = {};
        scheduleSlot.source = remote;
        scheduleSlot.target = local;
        scheduleSlot.dateStart = dateStart;

        downloadArray.push(scheduleSlot);

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

        var fileNameSource = null;

        try {

        var headerLocation = null;
        var headerContentDisp = null;

        var isRedirect = false;

        // the IO service
        var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);

        do {
          // create an nsIURI
          var uri = ioService.newURI(headerLocation == null ? aUrl : headerLocation, null, null);

          // get a channel for that nsIURI
          var ch = ioService.newChannelFromURI(uri);
          try {
            ch = ch.QueryInterface(Components.interfaces.nsIHttpChannel);
            ch.redirectionLimit = 0;

            ch.open();

            try {
              headerLocation = ch.getResponseHeader("location")
            } catch (ex) {}
            try {
              headerContentDisp = ch.getResponseHeader("content-disposition");
            } catch (ex) {}

            isRedirect = ch.responseStatus >= 300 && ch.responseStatus <= 399;
            ch.cancel(Components.results.NS_BINDING_ABORTED);

          } catch (ex) {}

        } while(isRedirect)


        if( headerLocation != null)
          fileNameSource = headerLocation;
        else
          fileNameSource = aUrl;

        } catch (ex) {}

        tim_matthews.downloadScheduler.dlScheduler_js.getFileNameInternal(fileNameSource, headerContentDisp, function(fileName) {
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
              var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
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


    tim_matthews.downloadScheduler.dlScheduler_js.timerCtrl.setupTimers();
    tim_matthews.downloadScheduler.dlScheduler_js.timerCtrl.setupStopTimer();

  },
 
  showScheduler: function() {
    window.open("chrome://dlScheduler/content/schedWin.xul", "tim_matthews.downloadScheduler.schedWin", "chrome, width=360, height=320, resizable=yes, centerscreen" ).focus();
  },

  startDownload: function(scheduleSlot) {

    Components.utils.import("resource://gre/modules/Downloads.jsm");

    var Application = Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication);
    var dlCtrl = Application.storage.get("tim_matthews.downloadScheduler.downloadCtrl",  null);

    Downloads.getList(Downloads.ALL).then(downloadsList => {

    var downloadProps = {};
    downloadProps.source = scheduleSlot.source;
    downloadProps.target = scheduleSlot.target;

    Downloads.createDownload( downloadProps ).then(newDl => {
        newDl.tryToKeepPartialData = true;
        newDl.start().then();
        downloadsList.add(newDl).then();
    } );

    dlCtrl.removeSlot(scheduleSlot);

    var scheduleWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("tim_matthews.downloadScheduler.schedWindow");
    if(scheduleWindow)
      scheduleWindow.tim_matthews.downloadScheduler.schedWin_js.refreshList();

  } );



  },

  stopDownloads: function() {
    console.log("stopping downloads");

    Components.utils.import("resource://gre/modules/Downloads.jsm");

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
    var Application = Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication);
    var dlCtrl = Application.storage.get("tim_matthews.downloadScheduler.downloadCtrl",  null);

    var source = gContextMenu.linkURL;

    dlCtrl.urlChooseFile(source, function(fileName) {
    
    if(fileName != null)
      window.openDialog("chrome://dlScheduler/content/editWin.xul", "tim_matthews.downloadScheduler.editWin", "chrome", -1, source, fileName);

    });
  },

};

window.addEventListener("load", tim_matthews.downloadScheduler.dlScheduler_js.init, false);



