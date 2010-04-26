if(!tim_matthews) var tim_matthews={};
if(!tim_matthews.downloadScheduler) tim_matthews.downloadScheduler={};
if(!tim_matthews.downloadScheduler.closeDialog_js) tim_matthews.downloadScheduler.closeDialog_js = {};

tim_matthews.downloadScheduler.closeDialog_js = {
  doOK: function(){
    return true;
  },

  doCancel: function(){
    var params = window.arguments[0];
    params.abortClose = true;
    return true;
  }
}

