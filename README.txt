Just a simple addon for firefox to enable scheduling of downloads.

To install, either visit the Mozilla add-ons page here: https://addons.mozilla.org/en-US/firefox/addon/download-scheduler/

Or build the addon from source yourself which is as simple as creating a zip file with a .xpi extension:

> zip -r /path/for/new/file/DownloadScheduler.xpi bootstrap.js chrome/ chrome.manifest install.rdf

The resulting xpi file can then be opened in Firefox. File -> Open File.

Once installed, right click a link and choose 'Schedule link as'.

More usage guidance is described here: https://sites.google.com/site/downloadscheduler/.


