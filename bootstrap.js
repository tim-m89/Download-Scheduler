const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource:///modules/CustomizableUI.jsm");

var console =
  Cu.import("resource://gre/modules/devtools/Console.jsm", {}).console;

function install(aData, aReason) {}

function uninstall(aData, aReason) {}

function startup(aData, aReason) {
  DownloadScheduler.init();
}

function shutdown(aData, aReason) {
  DownloadScheduler.uninit();
}

let DownloadScheduler = {
  init : function() {

    console.log("init called");

    let io =
      Cc["@mozilla.org/network/io-service;1"].
        getService(Ci.nsIIOService);

    // the 'style' directive isn't supported in chrome.manifest for bootstrapped
    // extensions, so this is the manual way of doing the same.
    this._ss =
      Cc["@mozilla.org/content/style-sheet-service;1"].
        getService(Ci.nsIStyleSheetService);
    this._uri = io.newURI("chrome://dlScheduler/content/button.css", null, null);
    this._ss.loadAndRegisterSheet(this._uri, this._ss.USER_SHEET);

    // create widget and add it to the main toolbar.
    CustomizableUI.createWidget(
      { id : "dlScheduler-button",
        defaultArea : CustomizableUI.AREA_NAVBAR,
        label : "Download Scheuler",
        tooltiptext : "Download Scheduler",
        onCommand : function(aEvent) {
          DownloadScheduler.showScheduleWindow(aEvent.target.ownerDocument.defaultView.content.document);
        }
      });

    //CustomizableUI.addWidgetToArea("dlScheduler-button", CustomizableUI.AREA_NAVBAR);
  },

  showScheduleWindow : function(contentDocument) {
  },

  uninit : function() {
    CustomizableUI.destroyWidget("dlScheduler-button");

    if (this._ss.sheetRegistered(this._uri, this._ss.USER_SHEET)) {
      this._ss.unregisterSheet(this._uri, this._ss.USER_SHEET);
    }
  }
};
