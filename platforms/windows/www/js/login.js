(function () {
    "use strict";

    var app = WinJS.Application;
    var nav = WinJS.Navigation;

    var applicationData = Windows.Storage.ApplicationData.current;
    var localSettings = applicationData.localSettings;
    window.WinJS.Navigation.addEventListener("navigating", function (parameters) {
        if (parameters.detail.delta < 0) {
            if (globalVars.deeplink && globalVars.deeplink.hasValidSettings())
                globalVars.deeplink.invalidate();
        }
    });

    window.WinJS.UI.Pages.define("/www/login.html", {
        processed: function (element) {
            return window.WinJS.Resources.processAll(element);
        },
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function () {

  
            //Force portrait screen only
            var wgd = Windows.Graphics.Display;

            var backButton = document.getElementById("backButtonLogin");

            if (WinJS.Utilities.isPhone) {
                wgd.DisplayInformation.autoRotationPreferences = wgd.DisplayOrientations.portrait;
                if (backButton) {
                    backButton.classList.add("backButtonPhone");
                }
            }
            else {
                wgd.DisplayInformation.autoRotationPreferences = wgd.DisplayOrientations.none;
                if (backButton) {
                    backButton.classList.add("backButtonTabletDesktop");
                }
            }


            //if (!WinJS.Utilities.isPhone)
                pushRegistration();
            var button1 = document.getElementById("loginbutton");
            if (button1 != null) button1.addEventListener("click", button1Click, false);
            var serverName = globalVars.environment.name;
            var serverNamePlace = document.getElementById("endpoint");
            if (serverNamePlace != null) serverNamePlace.innerHTML = serverName;
            autoLoginHandler();

            // Allow physical back button to navigate
            app.onbackclick = function (evt) {
                var canGoBack = nav.canGoBack;
                if (canGoBack) {

                    if (globalVars.deeplink && globalVars.deeplink.hasValidSettings()) {
                       globalVars.deeplink.invalidate();
                    }

                    nav.back();
                }
                return canGoBack;
            };
        },
        updateLayout: function (element) {
            /// <param name="element" domElement="true" />

            console.log("updateLayout");

            var backButton = document.getElementById("backButtonLogin");
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

    function autoLoginHandler() {
        var username = document.getElementById("username");
        var password = document.getElementById("password");
        //if deeplink brings username and password will execute this and use the values of username and password fields.
        if (globalVars.deeplink.hasValidSettings()) {

            if (globalVars.deeplink.isLoginOperation()) {
                globalVars.deeplink.invalidate();
            }

            if (globalVars.deeplink.hasCredentials()) {
                username.value = globalVars.deeplink.params.username;
                password.value = globalVars.deeplink.params.password;

            } else {
                
                var savedState = globalVars.decryptFunction(globalVars.environment.host);
                if (savedState != null) {
                    var parsed = JSON.parse(savedState);
                    username = document.getElementById("username");
                    password = document.getElementById("password");
                    username.value = parsed.username;
                    password.value = parsed.password;
                }
            }

            doLogin();

        } else {
            //if the device has a saved instance of last login will, try to login again with the last saved instance
            var savedState = globalVars.decryptFunction(globalVars.environment.host);
            if (savedState != null) {
                var parsed = JSON.parse(savedState);
                username = document.getElementById("username");
                password = document.getElementById("password");
                username.value = parsed.username;
                password.value = parsed.password;
                var lastHost = localSettings.values["lastlogin"];
                if (lastHost != null && globalVars.autologin) {
                    doLogin();
                }
            }
        }
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

        // Before making a POST request we first have to issue a GET against the target
        // server to work around Network Error 0x2ee4.         
        window.WinJS.xhr({
            url: envUrl
        }).done(
            function completed(request) {

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
            },
            function error(request) {
            },
            function progress(request) {
            }
        );
    }

    function button1Click() {
        try {
            var virtualKeyboard = Windows.UI.ViewManagement.InputPane.getForCurrentView();
            virtualKeyboard.tryHide();
        } catch (e) { }

        doLogin();
    }

    //This method will call the host to try to login with the values on the screen inputs: username, password
    function doLogin() {
        var username = document.getElementById("username");
        var password = document.getElementById("password");
        var loginSize = document.getElementById("loginSize");
        var loginbutton = document.getElementById("loginbutton");
        var loginProgressRing = document.getElementById("loginProgressRing");
        var errorMessage = document.getElementById("errormessage");
        loginbutton.style.display = "none";
        loginProgressRing.style.display = "inherit";
        errorMessage.innerHTML = "";
        var width = window.WinJS.Utilities.getContentWidth(loginSize);
        var height = window.WinJS.Utilities.getContentHeight(loginSize);
        // hardware id, signature, certificate IBuffer objects 
        // that can be accessed through properties.
        var params = {
            username: username.value,
            password: password.value,
            devicetype: "windows",
            deviceHwId: globalVars.getHardwareId(),
            screenWidth: width,
            screenHeight: height,
            device: null
        }
        var envUrl;
        if (globalVars.environment.isJsp) {
            envUrl = "https://" + globalVars.environment.host + "/OutSystemsNowService/login.jsf";
        } else {
            envUrl = "https://" + globalVars.environment.host + "/OutSystemsNowService/login.aspx";
        }


        // Before making a POST request we first have to issue a GET against the target
        // server to work around Network Error 0x2ee4.         
        window.WinJS.xhr({
            url: envUrl
        }).done(
            function completed(request) {

                // After a single GET request we can now invoke POST requests.           
                window.WinJS.xhr({
                    type: "post",
                    url: envUrl,
                    headers: { "Content-type": "application/x-www-form-urlencoded", "charset": "utf-8" },
                    data: globalVars.formatParams(params)
                }).done(
                       function completed(result) {
                           var resultParsed = JSON.parse(result.response);
                           if (!resultParsed.success) {
                               errorMessage.innerHTML = window.WinJS.Resources.getString("loginError1").value;;
                               loginbutton.style.display = "inherit";
                               loginProgressRing.style.display = "none";
                               return;
                           } else {
                               globalVars.autologin = false;
                               globalVars.environment.username = username.value;
                               globalVars.environment.password = password.value;
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
                               saveLocalDb();
                               globalVars.environment.applist = resultParsed.applications;
                               nav.navigate("/www/applist.html");
                           }
                       },
                       function error(error) {
                           globalVars.autologin = false;
                           errorMessage.innerHTML = window.WinJS.Resources.getString("loginError2").value;;;
                           loginbutton.style.display = "inherit";
                           loginProgressRing.style.display = "none";
                       },
                       function progress() {
                           // report on progress of download.
                       });

            },
            function error(request) {
                globalVars.autologin = false;
                errorMessage.innerHTML = window.WinJS.Resources.getString("environmentError2").value;
                loginbutton.style.display = "inherit";
                loginProgressRing.style.display = "none";
            },
            function progress(request) {
                // report on progress of download.
            }
        );


        //This save local db basically will save the login if success as last instance allowing auto login next time.
        function saveLocalDb() {
            globalVars.encryptFunction(globalVars.environment, globalVars.environment.host);
            localSettings.values["lastlogin"] = globalVars.environment.host;
        }
    }
})();
