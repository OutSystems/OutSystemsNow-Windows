
var Environment = window.WinJS.Class.define(function () {
},
  {
      host: "",
      userName: "",
      password: "",
      dateLastLogin: "",
      name: "",
      isJsp: false,
      applist: null,
      currentapp: null
  },
  {});
 
(function () {
    "use strict";


    var app = WinJS.Application;
    var nav = window.WinJS.Navigation;
    var applicationData = Windows.Storage.ApplicationData.current;

    window.WinJS.UI.Pages.define("/www/environment.html", {
        processed: function (element) {
            return window.WinJS.Resources.processAll(element);
        },

        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function () {
          
            // TODO: Initialize the page here.
            var wgd = Windows.Graphics.Display;
            if (WinJS.Utilities.isPhone) {
                wgd.DisplayInformation.autoRotationPreferences = wgd.DisplayOrientations.portrait;
            }
            else {
                wgd.DisplayInformation.autoRotationPreferences = wgd.DisplayOrientations.none;
            }

            var button1 = document.getElementById("gobutton");
            button1.addEventListener("click", button1Click, false);
            var demoButton = document.getElementById("demobutton");
            demoButton.addEventListener("click", demoClickHandler, false);
            var buttonHelp = document.getElementById("helpImage");
            buttonHelp.addEventListener("click", showHelpMessage, false);
            var closeHelpImage = document.getElementById("closeHelpImage");
            closeHelpImage.addEventListener("click", hideHelpMessage, false);
            var buttonHelpPhone = document.getElementById("helpImagePhone");
            buttonHelpPhone.addEventListener("click", showHelpMessage, false);
            var closeHelpImagePhone = document.getElementById("closeHelpImagePhone");
            closeHelpImagePhone.addEventListener("click", hideHelpMessage, false);

            var inputEnv = document.getElementById("endpointapp");
            inputEnv.addEventListener("keypress", keypressHandler, false);
            loginSavedBind();
            if (globalVars.deeplink.hasValidSettings()) {
                // globalVars.deeplink = false;
                var userInput = document.getElementById("endpointapp");
                userInput.value = globalVars.deeplink.host;
                tryConnectEnvironment();
            }
            else {                
                loginSavedHandler();
            }
       

        },
        unload: function () {
            // TODO: Respond to navigations away from this page.
            console.log("unload");
        },

        
    });
   
    function keypressHandler(parameters) {
        if (parameters.key === "Enter") {
            button1Click();
        }
    }

    function loginSavedBind() {
        var localSettings = applicationData.localSettings;
        var lastHost = localSettings.values["lastlogin"];
        var lastLoginData;
        if (globalVars.environment != null && globalVars.environment.host.length > 0 && !globalVars.environment.isDemo) {
            var endpointapp = document.getElementById("endpointapp");
            if (endpointapp != null) {
                endpointapp.value = globalVars.environment.host;
            }
        }
        else {
            if (lastHost != null) {                
                lastLoginData = globalVars.decryptFunction(lastHost);
                if (lastLoginData) {
                    var parsed = JSON.parse(lastLoginData);
                    var endpointapp = document.getElementById("endpointapp");
                    if (endpointapp != null) endpointapp.value = parsed.host;
                }
            }
        }
    }

    function loginSavedHandler() {
        var localSettings = applicationData.localSettings;
        var lastHost = localSettings.values["lastlogin"];
        var lastLoginData;
        if (lastHost != null) {
            lastLoginData = globalVars.decryptFunction(lastHost);
            if (lastLoginData) {
                var parsed = JSON.parse(lastLoginData);
                var endpointapp = document.getElementById("endpointapp");
                if (endpointapp != null) endpointapp.value = parsed.host;
                if (globalVars.autologin) {
                    globalVars.environment = parsed;
                    nav.navigate("/www/login.html");
                }
            }
        }
        else {
            globalVars.autologin = false;
        }
    }

    function showHelpMessage() {
        var helpSection = document.getElementById("helpSection");
        var helpImage = document.getElementById("helpImage");
        var closeHelpImage = document.getElementById("closeHelpImage");
        var helpImagePhone = document.getElementById("helpImagePhone");
        var closeHelpImagePhone = document.getElementById("closeHelpImagePhone");
        helpImage.style.display = "none";
        closeHelpImage.style.display = "inherit";
        helpImagePhone.style.display = "none";
        closeHelpImagePhone.style.display = "inherit";
        helpSection.style.transition = "height 0.5s";
        helpSection.style.height = "80px";
    }

    function hideHelpMessage() {
        var helpSection = document.getElementById("helpSection");
        var helpImage = document.getElementById("helpImage");
        var closeHelpImage = document.getElementById("closeHelpImage");
        var helpImagePhone = document.getElementById("helpImagePhone");
        var closeHelpImagePhone = document.getElementById("closeHelpImagePhone");
        helpImage.style.display = "inherit";
        closeHelpImage.style.display = "none";
        helpImagePhone.style.display = "inherit";
        closeHelpImagePhone.style.display = "none";
        helpSection.style.transition = "height 0.5s";
        helpSection.style.height = "0px";
    }

    function demoClickHandler() {
        var currentEnv = new Environment();
        currentEnv.host = "your.demo.server";
        currentEnv.isJsp = false;
        currentEnv.name = "demo apps";
        currentEnv.username = "outsystems";
        currentEnv.password = "outsystems";
        currentEnv.isDemo = true;
        globalVars.environment = currentEnv;
        var environmentpage = document.getElementById("environmentpage");
        var width = window.WinJS.Utilities.getContentWidth(environmentpage);
        var height = window.WinJS.Utilities.getContentHeight(environmentpage);
        // hardware id, signature, certificate IBuffer objects 
        // that can be accessed through properties.
        var params = {
            username: currentEnv.username,
            password: currentEnv.password,
            devicetype: "windows",
            deviceHwId: getHardwareId(),
            screenWidth: width,
            screenHeight: height,
            device: null
        }

        pushRegistration();

        var envUrl = "https://" + globalVars.environment.host + "/OutSystemsNowService/login.aspx";
        window.WinJS.xhr({
            type: "post",
            url: envUrl,
            headers: { "Content-type": "application/x-www-form-urlencoded" },
            data: formatParams(params)
        }).done(
            function completed(result) {              

                var resultParsed = JSON.parse(result.response);

                for (var i = 0; i < resultParsed.applications.length; i++) {
                    if (resultParsed.applications[i].imageId != 0) {
                        var text = "https://" + globalVars.environment.host + "/OutSystemsNowService/applicationImage." + ((globalVars.environment.isJsp == true) ? "jsf" : "aspx") + "?id=" + resultParsed.applications[i].imageId;
                        resultParsed.applications[i].imageId = "url('" + text + "')";
                    } else {
                        resultParsed.applications[i].imageId = "url('ms-appx:///www/img/NoAppImage.png')";
                    }

                    if (resultParsed.applications[i].description == null || resultParsed.applications[i].description == "") {
                        resultParsed.applications[i].description = "(no description)";
                    }


                }
                globalVars.environment.applist = resultParsed.applications;
                nav.navigate("/www/applist.html");
                // handle completed download.
            },
            function error(request) {
            },
            function progress(request) {
                // report on progress of download.
            });
    }

    function getHardwareId() {
        var ht = Windows.System.Profile.HardwareIdentification.getPackageSpecificToken(null);

        var reader = Windows.Storage.Streams.DataReader.fromBuffer(ht.id);
        var arr = new Array(ht.id.length);
        reader.readBytes(arr);

        var id = "";
        for (var j = 0; j < arr.length; j++) {
            id += arr[j].toString();
        }
        return id;
    }

    function formatParams(p) {
        var queryStr = "";

        for (var propertyName in p) {
            var val = p[propertyName];
            queryStr += propertyName + "=" + encodeURI(val) + "&";
        }

        return queryStr.slice(0, -1);
    }
    function tryConnectEnvironment() {

        var userInput = document.getElementById("endpointapp");
        var errorMessage = document.getElementById("errormessage");
        var gobutton = document.getElementById("gobutton");
        gobutton.style.display = "none";
        var envProgressRing = document.getElementById("envProgressRing");
        envProgressRing.style.display = "inherit";
        errorMessage.innerHTML = "";
        if (!userInput.value) {
            errorMessage.innerHTML = window.WinJS.Resources.getString("environmentError1").value;
            gobutton.style.display = "inherit";
            envProgressRing.style.display = "none";
            return;
        }
        var fixedUserInput = userInput.value.trim().replace("https://", "").replace("http://", "");
        var envUrl = "https://" + fixedUserInput + "/OutSystemsNowService/infrastructure.aspx";

        window.WinJS.xhr({
            url: envUrl,
            headers: { "Content-type": "application/json" }
        }).done(
        function completed(result) {
            var resultParsed = JSON.parse(result.response);
            // handle completed download.
            if (globalVars.environment != null) {
                globalVars.environment.host = fixedUserInput;
                globalVars.environment.isJsp = false;
                globalVars.environment.name = resultParsed.Name;
                globalVars.environment.isDemo = false;
            } else {
                var currentEnv = new Environment();
                currentEnv.host = fixedUserInput;
                currentEnv.isJsp = false;
                currentEnv.name = resultParsed.Name;
                currentEnv.isDemo = false;
                globalVars.environment = currentEnv;
            }
       
            nav.navigate("/www/login.html");
        },
        function error(result) {
            envUrl = "https://" + fixedUserInput + "/OutSystemsNowService/infrastructure.jsf";
            window.WinJS.xhr({
                url: envUrl,
                headers: { "Content-type": "application/json" },
            }).done(
                   function completed(result) {
                       var resultParsed = JSON.parse(result.response);
                       // handle completed download.
                       if (globalVars.environment != null) {
                           globalVars.environment.host = fixedUserInput;
                           globalVars.environment.isJsp = true;
                           globalVars.environment.name = resultParsed.Name;
                           globalVars.environment.isDemo = false;
                       } else {
                           var currentEnv = new Environment();
                           currentEnv.host = fixedUserInput;
                           currentEnv.isJsp = true;
                           currentEnv.name = resultParsed.Name;
                           currentEnv.isDemo = false;
                           globalVars.environment = currentEnv;
                       }
                       nav.navigate("/www/login.html");
                   },
                   function error(request) {
                       errorMessage.innerHTML = window.WinJS.Resources.getString("environmentError2").value;
                       gobutton.style.display = "inherit";
                       envProgressRing.style.display = "none";
                       return;
                   },
                   function progress(request) {
                       // report on progress of download.
                   });
        },
        function progress(request) {
            // report on progress of download.
        });

    }


    function button1Click(mouseEvent) {

        try {
            var virtualKeyboard = Windows.UI.ViewManagement.InputPane.getForCurrentView();
            virtualKeyboard.tryHide();
        } catch (e) { }

        tryConnectEnvironment();
        // nav.navigate("/www/login.html");
        //WinJS.Navigation.navigate("ms-appx:///login.html", null);
    }



    //This function will register pushwoosh push notifications and send the pushToken to the host
    function pushRegistration() {
        try {
            var service = new PushSDK.NotificationService.getCurrent("PUSHWOOSH_ID", "", null);

            service.ononpushaccepted = function (args) {
                //code to handle push notification
                //display push notification payload for test only
                var md = new Windows.UI.Popups.MessageDialog(args.toString());
                md.showAsync();
            }

            service.ononpushtokenreceived = function (pushToken) {
                //code to handle push token
                sendToken(pushToken);
                console.log("ononpushtokenreceived");
            }

            service.ononpushtokenfailed = function () {
                //code to handle push subscription failure
                console.log("ononpushtokenfailed");
            }

            service.subscribeToPushService();
        } catch (e) {
            console.log(e.message);
        }
    }

    function sendToken(pushToken) {
        var params = {
            device: pushToken,
            devicetype: "windows",
            deviceHwId: globalVars.getHardwareId(),
        }
        var envUrl = "https://" + globalVars.environment.host + "/OutSystemsNowService/registertoken.aspx";
        window.WinJS.xhr({
            type: "post",
            url: envUrl,
            headers: { "Content-type": "application/x-www-form-urlencoded" },
            data: globalVars.formatParams(params)
        }).done(
            function completed(result) {
                //var resultParsed = JSON.parse(result.response);
                var x = 0;
            },
            function error(e) {
                var x = 0;
            },
            function progress() {
                var x = 0;
            });
    }


})();
