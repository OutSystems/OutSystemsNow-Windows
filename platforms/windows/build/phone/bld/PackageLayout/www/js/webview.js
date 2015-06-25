
(function () {
    "use strict";

    var app = WinJS.Application;
    var nav = WinJS.Navigation;

    // Mobile Improvements
    var applicationHasPreloader = false;

    WinJS.UI.Pages.define("/www/webview.html", {
        processed: function (element) {
            return WinJS.Resources.processAll(element);
        },
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {

            var wgd = Windows.Graphics.Display;
            wgd.DisplayInformation.autoRotationPreferences = wgd.DisplayOrientations.none;

            var progress = document.getElementById("myProgressLine");
            if (progress) {
                progress.style.visibility = "hidden";
            }

            // TODO: Initialize the page here.2
            defineWebviewEvents();
            element.querySelector("#cmdBack").addEventListener("click", doBack, false);
            element.querySelector("#cmdForward").addEventListener("click", doForward, false);
            element.querySelector("#cmdApplist").addEventListener("click", doBackPage, false);
            app.onbackclick = function (evt) {
                doBack();
                return true;
            };

            if (globalVars.environment.currentapp != null && globalVars.environment.currentapp.preloader != null)
                applicationHasPreloader = globalVars.environment.currentapp.preloader

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
            case "DeviceReady":                              
                document.addEventListener('deviceready', function () {
                    webview.invokeScriptAsync('eval', parsed.plugin_params).start();
                }, false);
                break;
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
            case "AddCalendarEvent":
                var params = JSON.parse(parsed.plugin_params);
                var title = params.title;
                var location = params.location;
                var notes = params.notes;
                var startDate = new Date();
                if (params.startDate != null)
                    startDate = new Date(params.startDate);

                var endDate = new Date();
                if (params.endDate != null)
                    endDate = new Date(params.endDate);

                var appointment = new Windows.ApplicationModel.Appointments.Appointment();

                appointment.startTime = startDate;
                appointment.duration = Math.abs(endDate - startDate);
                appointment.location = location;
                appointment.subject = title;
                appointment.details = notes;

                var boundingRect = e.srcElement.getBoundingClientRect();
                var selectionRect = {
                    x: boundingRect.left, y: boundingRect.top,
                    width: boundingRect.width, height: boundingRect.height
                };

                Windows.ApplicationModel.Appointments.AppointmentManager.showAddAppointmentAsync(
                    appointment, selectionRect, Windows.UI.Popups.Placement.default)
                    .done(function (appointmentId) {
                        if (appointmentId) {
                            console.log("Appointment Id: " + appointmentId);
                            webview.invokeScriptAsync(parsed.success_action, parsed.success_params).start();
                        } else {
                            console.log("Appointment not added");
                            webview.invokeScriptAsync(parsed.error_action, parsed.error_params).start();
                        }
                    });

                break;
            case "AddContact":

                var windowsPhone = navigator.userAgent.indexOf('Windows Phone') != -1;
                if (windowsPhone) {
                    webview.invokeScriptAsync(parsed.error_action, parsed.error_params).start();
                    return false;
                }

                var ContactsNS = Windows.ApplicationModel.Contacts;
                var params = JSON.parse(parsed.plugin_params);

                var firstName = params.firstName;
                var lastName = params.lastName;
                var emailAddress = params.email;
                var phoneNumber = params.mobilePhone;

                // Create input contact object for calling ContactManager.showContactCard().
                var contact = new ContactsNS.Contact();
                contact.firstName = firstName;
                contact.lastName = lastName;

                var email = new ContactsNS.ContactEmail();
                email.address = emailAddress;
                contact.emails.append(email);
      
                var phone = new ContactsNS.ContactPhone();
                phone.number = phoneNumber;
                contact.phones.append(phone);         

                // Get the selection rect of the button pressed to show contact card.
                var boundingRect = webview.getBoundingClientRect();
                var selectionRect = { x: boundingRect.left, y: boundingRect.top, width: boundingRect.width, height: boundingRect.height };

                ContactsNS.ContactManager.showContactCard(contact, selectionRect, Windows.UI.Popups.Placement.default);
   
                break;
            case "SaveFile":

                function StoreFileFail(e) {
                    var msg;
                    switch (e.code) {
                        case FileError.QUOTA_EXCEEDED_ERR:
                            msg = 'QUOTA_EXCEEDED_ERR';
                            break;
                        case FileError.NOT_FOUND_ERR:
                            msg = 'NOT_FOUND_ERR';
                            break;
                        case FileError.SECURITY_ERR:
                            msg = 'SECURITY_ERR';
                            break;
                        case FileError.INVALID_MODIFICATION_ERR:
                            msg = 'INVALID_MODIFICATION_ERR';
                            break;
                        case FileError.INVALID_STATE_ERR:
                            msg = 'INVALID_STATE_ERR';
                            break;
                        default:
                            msg = 'Unknown Error';
                            break;
                    };
                    alert('Error: ' + msg);
                };
 
                function StoreFileGotFS(filename, fileContent, fs) {        
                    fs.root.getFile(filename, {create: true, exclusive: false},
                                    StoreFileGotFileEntry.bind(null, fileContent), StoreFileFail);
                }

                function StoreFileGotFileEntry(fileContent, fileEntry) {    
                    fileEntry.createWriter(StoreFileGotFileWriter.bind(null, fileContent), StoreFileFail);
                }

                function StoreFileGotFileWriter(fileContent, fileWriter) {   
                    fileWriter.onwriteend = function(e) {
                        console.log('Write completed.');
                    };

                    fileWriter.onerror = function(e) {
                        alert('Write failed: ' + e.toString());
                    };

                    // Create a new Blob and write it to log.txt.
                    var blob = new Blob([fileContent], {type: 'text/plain'});

                    fileWriter.write(blob);
                }

                var params = JSON.parse(parsed.plugin_params);

                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, StoreFileGotFS.bind(null, params.fileName, params.fileContent), StoreFileFail);
                                
                break;

            case "ReadFile":

                function ReadFileFail(e) {
                    var msg;
                    switch (e.code) {
                        case FileError.QUOTA_EXCEEDED_ERR:
                            msg = 'QUOTA_EXCEEDED_ERR';
                            break;
                        case FileError.NOT_FOUND_ERR:
                            msg = 'NOT_FOUND_ERR';
                            break;
                        case FileError.SECURITY_ERR:
                            msg = 'SECURITY_ERR';
                            break;
                        case FileError.INVALID_MODIFICATION_ERR:
                            msg = 'INVALID_MODIFICATION_ERR';
                            break;
                        case FileError.INVALID_STATE_ERR:
                            msg = 'INVALID_STATE_ERR';
                            break;
                        default:
                            msg = 'Unknown Error';
                            break;
                    };
                    console.log('Error: ' + msg);
                };

                function ReadFileGotFS(filename, inputId, fs) {
                    fs.root.getFile(filename, {},
                                    ReadFileGotFileEntry.bind(null, inputId), ReadFileFail);
                }

                function ReadFileGotFileEntry(inputId, fileEntry) {
                    fileEntry.file(ReadFileGotFileReader.bind(null, inputId), ReadFileFail);
                }

                function ReadFileGotFileReader(inputId, file) {
                    var reader = new FileReader();

                    reader.onloadend = function (e) {
                        ReadFileOnSuccess(this.result);
                    };

                    reader.readAsText(file);
                }

                function ReadFileOnSuccess(fileContent) {
                    var successParams = JSON.parse(parsed.success_params);
                    successParams.fileContent = fileContent;
                    webview.invokeScriptAsync(parsed.success_action, JSON.stringify(successParams)).start();
                }

                var params = JSON.parse(parsed.plugin_params);
                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, ReadFileGotFS.bind(null, params.fileName, params.inputId), ReadFileFail);

                break;

            case "DeviceInfo":

                if (typeof device == 'undefined') {
                    var errorparams = JSON.parse(parsed.error_params);
                    errorparams.result = 'Device plugin undefined';
                    webview.invokeScriptAsync(parsed.error_action, JSON.stringify(errorparams)).start();
                }
                else {

                    var deviceInfo = {
                        manufacturer: device.manufacturer,
                        model: device.model,
                        platform: device.platform,
                        version: device.version,
                        cordova: device.cordova
                    };

                    var successparams = JSON.parse(parsed.success_params);
                    successparams.result = deviceInfo;
                    webview.invokeScriptAsync(parsed.success_action, JSON.stringify(successparams)).start();

                }
                break;


            case "SimInfo":


                if (typeof window.plugins == 'undefined' || typeof window.plugins.sim == 'undefined') {                    
                    var errorparams = JSON.parse(parsed.error_params);
                    errorparams.result = 'SIM plugin undefined';
                    webview.invokeScriptAsync(parsed.error_action, JSON.stringify(errorparams)).start();
                }
                else {

                    window.plugins.sim.getSimInfo(
                        function (obj) {

                            var carrier = obj.carrierName;
                            var country = obj.countryCode;
                            var networkTypeCode = obj.networkType;

                            var networks = {};
                            networks[0] = "UNKNOWN";
                            networks[1] = "GPRS";
                            networks[2] = "EDGE";
                            networks[3] = "UMTS";
                            networks[4] = "CDMA";
                            networks[5] = "EVDO_0";
                            networks[6] = "EVDO_A";
                            networks[7] = "1xRTT";
                            networks[8] = "HSDPA";
                            networks[9] = "HSUPA";
                            networks[10] = "HSPA";
                            networks[11] = "IDEN";
                            networks[12] = "EVDO_B";
                            networks[13] = "LTE";
                            networks[14] = "EHRPD";
                            networks[15] = "HSPAP";


                            var simInfo = {
                                carrierName: carrier,
                                countryCode: country,
                                networkTypeCode: networkTypeCode,
                                networkType: networks[networkTypeCode]
                            };


                            var successparams = JSON.parse(parsed.success_params);
                            successparams.result = simInfo;
                            webview.invokeScriptAsync(parsed.success_action, JSON.stringify(successparams)).start();

                        },
                        function (err) {
                            var errorparams = JSON.parse(parsed.error_params);
                            errorparams.result = err;
                            webview.invokeScriptAsync(parsed.error_action, JSON.stringify(errorparams)).start();
                        }
                    );
                }

                break;

            case "NetworkInfo":

                if (typeof navigator.connection == 'undefined') {
                    var errorparams = JSON.parse(parsed.error_params);
                    errorparams.result = 'NetworkInfo plugin undefined';
                    webview.invokeScriptAsync(parsed.error_action, JSON.stringify(errorparams)).start();
                }
                else {

                    var connectionType = navigator.connection.type;

                    var states = {};
                    states[Connection.UNKNOWN] = 'UNKNOWN';
                    states[Connection.ETHERNET] = 'ETHERNET';
                    states[Connection.WIFI] = 'WIFI';
                    states[Connection.CELL_2G] = 'CELL_2G';
                    states[Connection.CELL_3G] = 'CELL_3G';
                    states[Connection.CELL_4G] = 'CELL_4G';
                    states[Connection.CELL] = 'CELL';
                    states[Connection.NONE] = 'NONE';

                    var networkInfo = {
                        type: states[connectionType]
                    };

                    var successparams = JSON.parse(parsed.success_params);
                    successparams.result = networkInfo;
                    webview.invokeScriptAsync(parsed.success_action, JSON.stringify(successparams)).start();

                }
                break;

            case "GetPosition":
                navigator.geolocation.getCurrentPosition(
                    function (position) {
                        var successparams = JSON.parse(parsed.success_params);
                        successparams.result = position;
                        webview.invokeScriptAsync(parsed.success_action, JSON.stringify(successparams)).start();
                    },
                    function (err) {
                        var errorparams = JSON.parse(parsed.error_params);
                        errorparams.message = err;
                        webview.invokeScriptAsync(parsed.error_action, JSON.stringify(parsed.error_params)).start();
                    });
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
        var userAgent = window.navigator.userAgent + " OutSystemsApp v." + globalVars.getAppVersion();
        //OutsystemsRuntimeComponent.OutSystemsHelper.changeUserAgent(ua);
        if (webview != null) {
            var targetUri = new Windows.Foundation.Uri("https://" + globalVars.environment.host + "/" + globalVars.environment.currentapp.path);

            var httpRequestMessage = new Windows.Web.Http.HttpRequestMessage(Windows.Web.Http.HttpMethod.get, targetUri);
            httpRequestMessage.headers.userAgent.tryParseAdd(userAgent);
            webview.navigateWithHttpRequestMessage(httpRequestMessage);

            //webview.navigate("https://" + globalVars.environment.host + "/" + globalVars.environment.currentapp.path);
            webview.addEventListener("MSWebViewScriptNotify", execCordovaPlugin);
            webview.addEventListener("MSWebViewNavigationStarting", function (e) {
                var progress = document.getElementById("myProgressLine");
                if (progress != null) {
                    if (applicationHasPreloader) {
                        progress.style.visibility = "hidden";
                    }
                    else {
                        progress.style.visibility = "visible";
                    }
                }
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

                if(applicationHasPreloader){
                    var currentURL = webview.src;                
                    applicationHasPreloader = currentURL.indexOf("preloader.html") > 0;
                }

                if (progress != null) {
                    progress.style.visibility = "hidden";
                }

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