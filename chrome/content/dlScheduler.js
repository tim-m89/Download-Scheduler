
if(!tim_matthews) var tim_matthews={};
if(!tim_matthews.downloadScheduler) tim_matthews.downloadScheduler={};
if(!tim_matthews.downloadScheduler.dlScheduler_js) tim_matthews.downloadScheduler.dlScheduler_js = {};

tim_matthews.downloadScheduler.dlScheduler_js = {

  hmFromTimeString: function(timeString) {
      var s = timeString.split(":");
      var obj = {};
      obj.hours = parseInt(s[0]);
      obj.mins = parseInt(s[1]);
      
      return obj;
  },


  timer: {
    startTimer: null,
    cancel: function() {
      if(this.startTimer) {
          this.startTimer.cancel();
          this.startTimer = null;
      }
    },
    setupTimer: function() {
        this.cancel();

        var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
        var startHM = tim_matthews.downloadScheduler.dlScheduler_js.hmFromTimeString(prefs.getCharPref("dlScheduler.startTime"));

        /* Set the next start time from today */
        
        var now = new Date();

        var startDate = new Date();
        startDate.setHours(startHM.hours);
        startDate.setMinutes(startHM.mins);
        startDate.setSeconds(0);
        /* If we've missed today's schedule, set time at tommorows date */
        if(startDate.getTime() < now.getTime())
            startDate.setTime(startDate.getTime() + 86400000);
        
        var msStart = startDate.getTime() - now.getTime();

        this.startTimer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
        this.startTimer.initWithCallback({ notify: function(timerr) { tim_matthews.downloadScheduler.dlScheduler_js.startDownloads(); } }, msStart, Components.interfaces.nsITimer.TYPE_ONE_SHOT);

    },
    observe: function(subject, topic, data) {
        if (topic != "nsPref:changed")
            return;
        this.setupTimer();
    }
  },

  thumbnailsShowHideItems: function(event) {
    var contextSched = document.getElementById("tim_matthews.downloadScheduler.context-schedulelink");
    var contextSep = document.getElementById("tim_matthews.downloadScheduler.context-separator1");
    contextSched.hidden = document.getElementById("context-savelink").hidden;
    contextSep.hidden = contextSched.hidden;
  },

  init: function() {
      try {
          var contextMenu = document.getElementById("contentAreaContextMenu");

          if (contextMenu)
              contextMenu.addEventListener("popupshowing", tim_matthews.downloadScheduler.dlScheduler_js.thumbnailsShowHideItems, false);


          tim_matthews.downloadScheduler.dlScheduler_js.timer.setupTimer();

          var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
          prefs.addObserver("", tim_matthews.downloadScheduler.dlScheduler_js.timer, false);
          tim_matthews.downloadScheduler.dlScheduler_js.timer.prefs = prefs;
          
          var Application = Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication); 
          Application.storage.set("tim_matthews.downloadScheduler.downloadArray",  {
            get: function() {
              return JSON.parse(prefs.getComplexValue("dlScheduler.dlScheduleList", Components.interfaces.nsISupportsString).data);
            },
            set: function(arr) {
              var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
              str.data = JSON.stringify(arr);
              prefs.setComplexValue("dlScheduler.dlScheduleList", Components.interfaces.nsISupportsString, str)
            },
            addOne: function(remote, local, recurring) {
              var targetFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
              targetFile.initWithPath(local);

              if(!targetFile.exists())
                targetFile.create(0x00,0644);

              var downloadArray = this.get();

              var scheduleSlot = {};
              scheduleSlot.source = remote;
              scheduleSlot.target = local;
              scheduleSlot.recurring = recurring;
              downloadArray.push(scheduleSlot);

              this.set(downloadArray);

              var scheduleWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("tim_matthews.downloadScheduler.schedWindow");
              if((scheduleWindow) && (scheduleWindow.tim_matthews.downloadScheduler.schedWin_js))
                scheduleWindow.tim_matthews.downloadScheduler.schedWin_js.refreshList();
            },
            parseURL: function(url) {
              var fileName = {};
              fileName.file = "";
              fileName.ext = "";
              var slash = url.split("/");
              if(slash.length > 0)
              {
                var file = slash[slash.length-1];
                if( (file.length > 0) && (file.indexOf("?") == -1) )
                {
                  var dot = file.split(".");
                  if(dot.length > 0)
                  {
                    var ext = dot[dot.length-1];
                    fileName.file = file;
                    fileName.ext = ext;
                  }
                }
              }
              return fileName;
            },
          });

          Application.storage.set("tim_matthews.downloadScheduler.timer", tim_matthews.downloadScheduler.dlScheduler_js.timer);

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
              else if(button==2)
                Application.storage.get("tim_matthews.downloadScheduler.downloadArray",  null).addOne(persistArgs.sourceURI.resolve(""), persistArgs.targetFile.path, false);
            }
        };
      } catch (e) {
          alert(e);
      }
  },
 
  showScheduler: function() {
      window.open("chrome://dlScheduler/content/schedWin.xul", "tim_matthews.downloadScheduler.schedWin", "chrome, width=360, height=220, resizable=yes" ).focus();
  },

  startDownloads: function() {

  var Application = Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication);
  var downloadArray = Application.storage.get("tim_matthews.downloadScheduler.downloadArray",  null).get();
  Components.utils.import("resource://gre/modules/Downloads.jsm");

  var newDownloadArray = [];

  for (var i=0; i < downloadArray.length; i++)
  {
    var scheduleSlot = downloadArray[i];
    if((scheduleSlot == undefined) || (scheduleSlot==null))
      continue;

    var privacyContext = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
      .getInterface(Components.interfaces.nsIWebNavigation)
      .QueryInterface(Components.interfaces.nsILoadContext);

    var downloadProps = {};
    downloadProps.source = scheduleSlot.source;
    downloadProps.target = scheduleSlot.target;

    Downloads.createDownload( downloadProps ).then(function (newDl) { newDl.tryToKeepPartialData = true; newDl.start(); } );

    if(scheduleSlot.recurring)
      newDownloadArray.push(scheduleSlot);
  }

  Application.storage.get("tim_matthews.downloadScheduler.downloadArray", null).set(newDownloadArray);

  var scheduleWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("tim_matthews.downloadScheduler.schedWindow");
  if(scheduleWindow)
    scheduleWindow.tim_matthews.downloadScheduler.schedWin_js.refreshList();



  },

  getFileName: function(aURL, aContentDisposition, aCallback) {

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

    promiseTargetFile(fpParams).then(aDialogAccepted => {
        if (aDialogAccepted)
            aCallback(fpParams.file);
    });

  },


  scheduleLinkAs: function() {
    var Application = Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication);

    var source = gContextMenu.linkURL;

    var headerLocation = null;
    var headerContentDisp = null


    var isRedirect = false;

    // the IO service
    var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);

    do {
      // create an nsIURI
      var uri = ioService.newURI(headerLocation == null ? source : headerLocation, null, null);

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

    var fileNameSource;

    if( headerLocation != null)
      fileNameSource = headerLocation;
    else
      fileNameSource = source;

      tim_matthews.downloadScheduler.dlScheduler_js.getFileName(fileNameSource, headerContentDisp, function(fileName) {

      if( fileName == null)
        return;
    

      var targetFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
      targetFile.initWithFile(fileName);

      if(!targetFile.exists())
      targetFile.create(0x00,0644);


      Application.storage.get("tim_matthews.downloadScheduler.downloadArray",  null).addOne(source, fileName.path, false);

    });
  },

};

window.addEventListener("load", tim_matthews.downloadScheduler.dlScheduler_js.init, false);


