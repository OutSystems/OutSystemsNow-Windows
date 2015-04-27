var wgd = Windows.Graphics.Display;
wgd.DisplayInformation.autoRotationPreferences = wgd.DisplayOrientations.none;

(function () {
    "use strict";

    var app = WinJS.Application;
    var nav = WinJS.Navigation;
    WinJS.UI.Pages.define("/www/webview.html", {
        processed: function (element) {
            return WinJS.Resources.processAll(element);
        },
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            // TODO: Initialize the page here.2
            defineWebviewEvents();
            element.querySelector("#cmdBack").addEventListener("click", doBack, false);
            element.querySelector("#cmdForward").addEventListener("click", doForward, false);
            element.querySelector("#cmdApplist").addEventListener("click", doBackPage, false);
            app.onbackclick = function (evt) {
                doBack();
                return true;
            };
        },

        unload: function () {
            // TODO: Respond to navigations away from this page.
        },

        updateLayout: function (element) {
            /// <param name="element" domElement="true" />
            var x = 0;
            // TODO: Respond to changes in layout.
        }
    });
    function isJsonString(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }
    function execCordovaPlugin(e) {
        if (!isJsonString(e.value)) return;
        var parsed = JSON.parse(e.value);
        var webview = document.getElementById("webview");
        switch (parsed.plugin_name) {
            case "TakePicture":
                navigator.camera.getPicture(function (base64data) {
                    var successparams = JSON.parse(parsed.success_params);
                    successparams.imageData = base64data;
                    webview.invokeScriptAsync(parsed.success_action, JSON.stringify(
                        successparams)).start();
                }, function (err) {
                    var errorparams = JSON.parse(parsed.error_params);
                    errorparams.message = err;
                    webview.invokeScriptAsync(parsed.error_action, JSON.stringify(errorparams)).start();
                },
                JSON.parse(parsed.plugin_params)
                //{ quality: 60, destinationType: Camera.DestinationType.DATA_URL, encodingType: Camera.EncodingType.JPEG, targetWidth: 600, targetHeight: 600, correctOrientation: true }
                );
                break;
            case "GetLocation":
                navigator.geolocation.getCurrentPosition(
                    function (position) {
                        var successparams = JSON.parse(parsed.success_params);
                        successparams.position = position;
                        webview.invokeScriptAsync(parsed.success_action, JSON.stringify(successparams)).start();
                    },
                    function (err) {
                        var errorparams = JSON.parse(parsed.error_params);
                        errorparams.message = err;
                        webview.invokeScriptAsync(parsed.error_action, JSON.stringify(parsed.error_params)).start();
                    });
                break;
            case "BarcodeScanner":
                cordova.require('com.phonegap.plugins.barcodescanner.BarcodeScanner').scan(
                  function (result) {
                      var successparams = JSON.parse(parsed.success_params);
                      successparams.result = result;
                      webview.invokeScriptAsync(parsed.success_action, JSON.stringify(successparams)).start();
                  },
                  function (error) { }
              );
                break;
            default:
        }
        //    eval(e.value);
    }

    function doBack() {
        var webview = document.getElementById("webview");
        if (webview == null) return;
        if (webview.canGoBack) {
            webview.goBack();
        } else {
            globalVars.environment.currentapp = null;
            nav.back();
        }
    }

    function doBackPage() {
        nav.back();
    }

    function doForward() {
        var webview = document.getElementById("webview");
        if (webview == null) return;
        if (webview.canGoForward) {
            webview.goForward();
        }
    }



    function defineWebviewEvents() {
        var webview = document.getElementById("webview");
        var ua = window.navigator.userAgent + " OutSystemsApp v." + globalVars.getAppVersion();
        OutsystemsRuntimeComponent.OutSystemsHelper.changeUserAgent(ua);
        if (webview != null) {
         //   webview.navigate("http://whatsmyuseragent.com/");
            webview.navigate("https://" + globalVars.environment.host + "/" + globalVars.environment.currentapp);
            webview.addEventListener("MSWebViewScriptNotify", execCordovaPlugin);
            webview.addEventListener("MSWebViewNavigationStarting", function (e) {
                var progress = document.getElementById("myProgressLine");
                progress.style.visibility = "visible";
                //var operation = webview.capturePreviewToBlobAsync();
                //operation.oncomplete = function (e) {
                //    captureBitmap();
                //    var url = window.URL.createObjectURL(e.target.result);
                //    var image = document.getElementById("imagetag");
                //    if (image != null) {
                //        image.src = url;
                //    }
                //    var imagetagHolder = document.getElementById("imagetagholder");
                //    if (imagetagHolder != null) {
                //        imagetagHolder.style.opacity = 1;
                //        imagetagHolder.style.display = "inherit";
                //    }
                //    //image.style.width = webview.style.width;
                //    //image.style.height = webview.style.height;
                //};
                //operation.start();
            });
            webview.addEventListener("MSWebViewNavigationCompleted", function (e) {
                var progress = document.getElementById("myProgressLine");
                if (progress != null) progress.style.visibility = "hidden";
                var forward = document.getElementById("cmdForward");
                if (forward != null) {
                    if (webview.canGoForward) {

                        forward.winControl.enable = true;
                    } else {
                        forward.winControl.enable = false;
                    }
                }
                //var image = document.getElementById("imagetagholder");
                //if (image != null) {
                //    image.style.transition = "opacity 1s";
                //    image.style.opacity = 0;
                //    WinJS.Promise.timeout(1000).then(function (c) {
                //        image.style.transition = "";
                //        image.style.display = "none";
                //    });

                //}
            });
        }
    }
})();