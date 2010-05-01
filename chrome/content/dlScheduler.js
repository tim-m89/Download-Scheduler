
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
    finishTimer: null,
    cancel: function() {
      if(this.startTimer) {
          this.startTimer.cancel();
          this.startTimer = null;
      }
      if(this.finishTimer) {
          this.finishTimer.cancel();
          this.finishTimer = null;
      }
    },
    setupTimer: function() {
        this.cancel();

        var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("dlScheduler.");
        var startHM = tim_matthews.downloadScheduler.dlScheduler_js.hmFromTimeString(prefs.getCharPref("startTime"));
        var finishHM = tim_matthews.downloadScheduler.dlScheduler_js.hmFromTimeString(prefs.getCharPref("finishTime"));

        /* Set the next start time from today */
        
        var now = new Date();

        var startDate = new Date();
        startDate.setHours(startHM.hours);
        startDate.setMinutes(startHM.mins);
        startDate.setSeconds(0);
        /* If we've missed today's schedule, set time at tommorows date */
        if(startDate.getTime() < now.getTime())
            startDate.setTime(startDate.getTime() + 86400000);
        
        var finDate = new Date();
        finDate.setHours(finishHM.hours);
        finDate.setMinutes(finishHM.mins);
        finDate.setSeconds(0);
        if(finDate.getTime() < startDate.getTime())
            finDate.setTime(finDate.getTime() + 86400000);

        var msStart = startDate.getTime() - now.getTime();
        var msFin = finDate.getTime() - now.getTime();

        this.startTimer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
        this.startTimer.initWithCallback({ notify: function(timerr) { tim_matthews.downloadScheduler.dlScheduler_js.startDownloads(); } }, msStart, Components.interfaces.nsITimer.TYPE_ONE_SHOT);

        this.finishTimer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
        this.finishTimer.initWithCallback({ notify: function(timerr) { tim_matthews.downloadScheduler.dlScheduler_js.pauseDownloads(); } }, msFin, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
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

          var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("dlScheduler.");
          prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
          prefs.addObserver("", tim_matthews.downloadScheduler.dlScheduler_js.timer, false);
          tim_matthews.downloadScheduler.dlScheduler_js.timer.prefs = prefs;
          
          Application.storage.set("tim_matthews.downloadScheduler.downloadArray",  {
            get: function() {
              return JSON.parse(prefs.getCharPref("dlScheduleList"));
            },
            set: function(arr) {
              prefs.setCharPref("dlScheduleList", JSON.stringify(arr));
            }
          });

          Application.storage.set("tim_matthews.downloadScheduler.timer", tim_matthews.downloadScheduler.dlScheduler_js.timer);

      } catch (e) {
          alert(e);
      }
  },
 
  showScheduler: function() {
      window.open("chrome://dlScheduler/content/schedWin.xul", "tim_matthews.downloadScheduler.schedWin", "chrome, width=360, height=220" );
  },

  startDownloads: function() {
      try {
          var downloadArray = Application.storage.get("tim_matthews.downloadScheduler.downloadArray",  null).get();

          var dm = Components.classes["@mozilla.org/download-manager;1"].getService(Components.interfaces.nsIDownloadManager);
          var dlmgrWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("Download:Manager");
          var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
          if (dlmgrWindow)
          {
              if(prefs.getBoolPref("browser.download.manager.focusWhenStarting"))
                  dlmgrWindow.focus();
          }
          else
          {            
              if(prefs.getBoolPref("browser.download.manager.showWhenStarting"))
                  openDialog("chrome://mozapps/content/downloads/downloads.xul", "Download:Manager", "chrome,centerscreen", null);
          }

          var activeDl = dm.activeDownloads;
          while(activeDl.hasMoreElements())
          {
              var dl = activeDl.getNext().QueryInterface(Components.interfaces.nsIDownload);
              if(dl.state==4)
                  dm.resumeDownload(dl.id);
          }

          for (var i=0; i<downloadArray.length; i++)
          {
              var scheduleSlot = downloadArray[i];
              if((scheduleSlot == undefined) || (scheduleSlot==null))
                  continue;

              var obj_Persist = Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"].createInstance(Components.interfaces.nsIWebBrowserPersist);
              const nsIWBP = Components.interfaces.nsIWebBrowserPersist;
              const flags = nsIWBP.PERSIST_FLAGS_REPLACE_EXISTING_FILES;
              obj_Persist.persistFlags = flags | nsIWBP.PERSIST_FLAGS_FROM_CACHE;

              var targetFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
              targetFile.initWithPath(scheduleSlot.target);
              if(!targetFile.exists())
                targetFile.create(0x00,0644);

              var sourceURI = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(scheduleSlot.source, null, null);
              var targetURI = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newFileURI(targetFile);
              
              var download = dm.addDownload(0, sourceURI, targetURI,  null, null, null, null, obj_Persist);

              obj_Persist.progressListener = download;

              obj_Persist.saveURI(sourceURI, null, null, null, null, targetFile);
          }

          Application.storage.get("tim_matthews.downloadScheduler.downloadArray", null).set([]);

          var scheduleWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("tim_matthews.downloadScheduler.schedWindow");
          if(scheduleWindow)
              scheduleWindow.tim_matthews.downloadScheduler.schedWin_js.refreshList();

      } catch (e) {
          alert(e);
      }
      
  },

  pauseDownloads: function() {
      try {
          var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("dlScheduler.");
          if(prefs.getBoolPref("pauseEnabled"))
          {
            var dm = Components.classes["@mozilla.org/download-manager;1"].getService(Components.interfaces.nsIDownloadManager);
            var activeDl = dm.activeDownloads;
            while(activeDl.hasMoreElements())
            {
                var dl = activeDl.getNext().QueryInterface(Components.interfaces.nsIDownload);
                if(dl.state==0)
                    dm.pauseDownload(dl.id);
            }
          }

          tim_matthews.downloadScheduler.dlScheduler_js.timer.setupTimer();

      } catch (e) {
          alert(e);
      }
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

  scheduleDownload: function() {
    try {
          var nsIFilePicker = Components.interfaces.nsIFilePicker;
          var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

          fp.init(window, "Enter name of file for scheduled download...", nsIFilePicker.modeSave);
          
          var source = gContextMenu.linkURL;

          var fileName = tim_matthews.downloadScheduler.dlScheduler_js.parseURL(source);
          fp.defaultString = fileName.file;
          fp.defaultExtension = fileName.ext;
          if(fileName.ext.length > 0)
              fp.appendFilter(fileName.ext, "*." + fileName.ext);
          fp.appendFilter("All files (*.*)", "*.*");

          if(fp.show() == 1)
              return;

          var targetFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
          targetFile.initWithPath(fp.file.path);

          if(!targetFile.exists())
            targetFile.create(0x00,0644);

          var downloadArray = Application.storage.get("tim_matthews.downloadScheduler.downloadArray",  null).get();

          var scheduleSlot = {};
          scheduleSlot.source = source;
          scheduleSlot.target = fp.file.path;
          downloadArray.push(scheduleSlot);

          Application.storage.get("tim_matthews.downloadScheduler.downloadArray", null).set(downloadArray);

          var scheduleWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("tim_matthews.downloadScheduler.schedWindow");
          if(scheduleWindow)
              scheduleWindow.tim_matthews.downloadScheduler.schedWin_js.refreshList();

    } catch (e) {
      alert(e);
    }
  },

};

window.addEventListener("load", tim_matthews.downloadScheduler.dlScheduler_js.init, false);


