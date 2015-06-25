(function () {
    "use strict";

    var app = WinJS.Application;
    var nav = WinJS.Navigation;

    
    window.WinJS.Navigation.addEventListener("navigating", function (parameters) {
        if (parameters.detail.delta < 0) {
             if (globalVars.deeplink && globalVars.deeplink.hasValidSettings())
                globalVars.deeplink.invalidate();
        }
    });
    WinJS.UI.Pages.define("/www/applist.html", {
        processed: function (element) {
            return window.WinJS.Resources.processAll(element);
        },
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {

            var wgd = Windows.Graphics.Display;
            wgd.DisplayInformation.autoRotationPreferences = wgd.DisplayOrientations.none;

            
            var backButton = document.getElementById("backButtonAppList");
            if (backButton) {
                if (WinJS.Utilities.isPhone) {
                    backButton.classList.add("backButtonPhone");
                }
                else {
                    backButton.classList.add("backButtonTabletDesktop");
                }
            }

            try {
                var virtualKeyboard = Windows.UI.ViewManagement.InputPane.getForCurrentView();
                virtualKeyboard.tryHide();
            } catch (e) { }
            
            // TODO: Initialize the page here.
            var header = document.getElementById("headerTitle");
            header.innerHTML = "Apps in " + globalVars.environment.name;
            var imgRepeater = element.querySelector("#repeater");
            imgRepeater.winControl.data = new WinJS.Binding.List(globalVars.environment.applist);
            var repeaters = document.getElementsByClassName("smallListIconTextItem");
            for (var i = 0; i < repeaters.length; i++) {
                repeaters[i].children[0].value = i;
                repeaters[i].addEventListener("click", function(e) {
                    var appIndex = this.children[0].value;                    
                    globalVars.environment.currentapp = globalVars.environment.applist[appIndex];
                    nav.navigate("/www/webview.html");
                });
            }
            
            // Allow physical back button to navigate
            app.onbackclick = function (evt) {
                var canGoBack = nav.canGoBack;
                if (canGoBack) {
                    nav.back();
                }
                return canGoBack;
            };

            if (globalVars.deeplink && globalVars.deeplink.hasValidSettings()) {
                if (globalVars.deeplink.isOpenUrlOperation()) {
                    globalVars.deeplink.invalidate();
                }

                if (globalVars.deeplink.hasApplicationURL()) {
                    globalVars.environment.currentapp = { path: globalVars.deeplink.params.url, preloader: false };
                    nav.navigate("/www/webview.html");
                }
            }            

        },

        unload: function () {
            // TODO: Respond to navigations away from this page.
        },

        updateLayout: function (element) {
            /// <param name="element" domElement="true" />

            // TODO: Respond to changes in layout.
            console.log("updateLayout");

            var backButton = document.getElementById("backButtonAppList");
            if (backButton) {
                if (WinJS.Utilities.isPhone) {
                    backButton.classList.add("backButtonPhone");
                }
                else {
                    backButton.classList.add("backButtonTabletDesktop");
                }
            }
        }
    });

})(); 