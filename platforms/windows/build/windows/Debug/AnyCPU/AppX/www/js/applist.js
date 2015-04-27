var wgd = Windows.Graphics.Display;
wgd.DisplayInformation.autoRotationPreferences = wgd.DisplayOrientations.none;

(function () {
    "use strict";

    var app = WinJS.Application;
    var nav = WinJS.Navigation;

    
    //var itemList = new WinJS.Binding.List(dataArray);
    //var publicMembers =
    //    {
    //        itemList: itemList
    //    };
    //WinJS.Namespace.define("DataExample", publicMembers);
    window.WinJS.Navigation.addEventListener("navigating", function (parameters) {
        if (parameters.detail.delta < 0) {
            globalVars.deeplink = false;
            globalVars.deeplinkLogin = false;
            globalVars.deeplinkapp = false;
        }
    });
    WinJS.UI.Pages.define("/www/applist.html", {
        processed: function (element) {
            return WinJS.Resources.processAll(element);
        },
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            // TODO: Initialize the page here.
            var header = document.getElementById("headerTitle");
            header.innerHTML = "Apps in " + globalVars.environment.name;
            var imgRepeater = element.querySelector("#repeater");
            imgRepeater.winControl.data = new WinJS.Binding.List(globalVars.environment.applist);
            var repeaters = document.getElementsByClassName("smallListIconTextItem");
            for (var i = 0; i < repeaters.length; i++) {
                repeaters[i].addEventListener("click", function(e) {
                    globalVars.environment.currentapp = this.children[0].value;
                    nav.navigate("/www/webview.html");
                });
            }
          //  var msgBox = new Windows.UI.Popups.MessageDialog("deeplink:" + globalVars.deeplikapp + ", currentapp:" + globalVars.environment.currentapp);
           // msgBox.showAsync();
            if (globalVars.deeplinkapp && globalVars.environment.currentapp != null) {
                globalVars.deeplinkapp = false;
                nav.navigate("/www/webview.html");
            }
        },

        unload: function () {
            // TODO: Respond to navigations away from this page.
        },

        updateLayout: function (element) {
            /// <param name="element" domElement="true" />

            // TODO: Respond to changes in layout.
        }
    });
    function button1Click(mouseEvent) {
        nav.navigate("/www/webview.html");
        //WinJS.Navigation.navigate("ms-appx:///login.html", null);
    }
})();