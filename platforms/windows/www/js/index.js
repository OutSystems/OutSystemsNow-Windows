// For an introduction to the Hub/Pivot template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=392285
(function () {
    "use strict";
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
      { });

    var DeepLink = WinJS.Class.define(
       function () {
       },
       {
           host: null,
           operation: null,
           isValid: false,
           params: {},
           invalidate: function () { this.isValid = false; },
           hasValidSettings: function () { return this.isValid; },
           hasApplicationURL: function () {
               var url = this.params.url;
               return url && url.length > 0;
           },
           hasCredentials: function () {
               var username = this.params.username;
               var password = this.params.password;
               return username && username.length > 0 && password && password.length > 0;
           },
           createSettings: function (environment, operation, parameters) {
               this.host = environment;
               this.isValid = true;

               if (operation) {
                   if (operation.indexOf("/openurl/") >= 0) {
                       this.operation = "OpenURL";
                   }
                   else {
                       if (operation.indexOf("/login/") >= 0) {
                           this.operation = "Login";
                       }
                       else {
                           this.isValid = false;
                       }
                   }
               }

               this.params.username = parameters.username;
               this.params.password = parameters.password;
               this.params.url = parameters.url;

               if (this.isValid) {
                   this.isValid = this.host && this.host.length > 0 && this.operation && this.operation.length > 0;
               }

           },
           isLoginOperation: function () { return this.operation == "Login"; },
           isOpenUrlOperation: function () { return this.operation == "OpenURL"; }
       },
       {
       });


    window.WinJS.Namespace.define("globalVars", {
        IsUaSetted: false,
        environment: null,
        autologin: true,
        deeplink: null,
        encryptFunction: function (data, name) {
            if (data.applist != null) data.applist = null;
            var cryptography = Windows.Security.Cryptography;
            var keyHash = this.getMd5Hash("8ce135b5a2361f7eecb83a42f2df15e2");
            var toDecryptBuffer = cryptography.CryptographicBuffer.convertStringToBinary(JSON.stringify(data), cryptography.BinaryStringEncoding.utf8);
            var aes = Windows.Security.Cryptography.Core.SymmetricKeyAlgorithmProvider.openAlgorithm(Windows.Security.Cryptography.Core.SymmetricAlgorithmNames.aesEcbPkcs7);
            var symetricKey = aes.createSymmetricKey(keyHash);
            var buffEncrypted = Windows.Security.Cryptography.Core.CryptographicEngine.encrypt(symetricKey, toDecryptBuffer, null);
            var strEncrypted = cryptography.CryptographicBuffer.encodeToBase64String(buffEncrypted);
            var applicationData = Windows.Storage.ApplicationData.current;
            var localSettings = applicationData.localSettings;
            localSettings.values[name] = strEncrypted;
        }
        ,
        decryptFunction: function (name) {
            try {
                var applicationData = Windows.Storage.ApplicationData.current;
                var localSettings = applicationData.localSettings;
                var cipherString = localSettings.values[name];
                if (cipherString) {
                    var cryptography = Windows.Security.Cryptography;
                    var keyHash = this.getMd5Hash("8ce135b5a2361f7eecb83a42f2df15e2");
                    var toDecryptBuffer = cryptography.CryptographicBuffer.decodeFromBase64String(cipherString);
                    var aes = Windows.Security.Cryptography.Core.SymmetricKeyAlgorithmProvider.openAlgorithm(Windows.Security.Cryptography.Core.SymmetricAlgorithmNames.aesEcbPkcs7);
                    var symetricKey = aes.createSymmetricKey(keyHash);
                    var buffDecrypted = Windows.Security.Cryptography.Core.CryptographicEngine.decrypt(symetricKey, toDecryptBuffer, null);
                    var strDecrypted = cryptography.CryptographicBuffer.convertBinaryToString(cryptography.BinaryStringEncoding.utf8, buffDecrypted);
                    return strDecrypted;
                } else {
                    return null;
                }
            } catch (e) {
                return null;
            }


        },
        getMd5Hash: function (key) {
            var cryptography = Windows.Security.Cryptography;
            // Convert the message string to binary data.
            var buffUtf8Msg = Windows.Security.Cryptography.CryptographicBuffer.convertStringToBinary(key, cryptography.BinaryStringEncoding.utf8);
            // Create a HashAlgorithmProvider object.
            var objAlgProv = Windows.Security.Cryptography.Core.HashAlgorithmProvider.openAlgorithm(Windows.Security.Cryptography.Core.HashAlgorithmNames.md5);
            // Hash the message.
            var buffHash = objAlgProv.hashData(buffUtf8Msg);
            // Verify that the hash length equals the length specified for the algorithm.
            if (buffHash.length != objAlgProv.hashLength) {
                // throw new Exception("There was an error creating the hash");
            }
            return buffHash;
        },
        getHardwareId: function () {
            var ht = Windows.System.Profile.HardwareIdentification.getPackageSpecificToken(null);

            var reader = Windows.Storage.Streams.DataReader.fromBuffer(ht.id);
            var arr = new Array(ht.id.length);
            reader.readBytes(arr);

            var id = "";
            for (var j = 0; j < arr.length; j++) {
                id += arr[j].toString();
            }
            return id;
        }, 
        formatParams: function (p) {
            var queryStr = "";

            for (var propertyName in p) {
                var val = p[propertyName];
                queryStr += propertyName + "=" + encodeURI(val) + "&";
            }

            return queryStr.slice(0, -1);
        }, setUserAgent: function (window, userAgent) {
            if (window.navigator.userAgent != userAgent) {
                var userAgentProp = { get: function () { return userAgent; } };
                try {
                    Object.defineProperty(window.navigator, 'userAgent', userAgentProp);
                } catch (e) {
                    window.navigator = Object.create(navigator, {
                        userAgent: userAgentProp
                    });
                }
            }
        }, getAppVersion: function() {
            var thisPackage = Windows.ApplicationModel.Package.current;
            var version = thisPackage.id.version;

            var appVersion = version.major + "." +
                             version.minor + "." +
                             version.build + "." +
                             version.revision;
            return appVersion;
        }
    });




    var activation = Windows.ApplicationModel.Activation;
    var app = window.WinJS.Application;
    var nav = window.WinJS.Navigation;
    var sched = window.WinJS.Utilities.Scheduler;
    var ui = window.WinJS.UI;

    app.addEventListener("activated", function (args) {

        if (args.detail.kind === activation.ActivationKind.launch || args.detail.kind == Windows.ApplicationModel.Activation.ActivationKind.protocol) {
   
            if (args.detail.previousExecutionState === activation.ApplicationExecutionState.running ||
                args.detail.previousExecutionState === activation.ApplicationExecutionState.suspended) {
                if (args.detail.kind !== Windows.ApplicationModel.Activation.ActivationKind.protocol) {
                    return;
                }

                PushSDK.NotificationService.handleStartPush(args.detail.arguments);
            }
            
            // Global vars initialization          
            globalVars.environment = new Environment();
            globalVars.deeplink = new DeepLink();

            hookUpBackButtonGlobalEventHandlers();
            nav.history = app.sessionState.history || {};
            nav.history.current.initialPlaceholder = true;

            // Cast the generic event args to WebUILaunchActivatedEventArgs.
             
            // Optimize the load of the application and while the splash screen is shown, execute high priority scheduled work.
            if (args.detail.kind == Windows.ApplicationModel.Activation.ActivationKind.protocol) {
                // The received URI is eventArgs.detail.uri.rawUri
                
                var host = args.detail.uri.host;
                var username;
                var password;
                var uriApp;
                

                var uriQuery = args.detail.uri.query;

                if (uriQuery && uriQuery.length > 0) {
                    // Get username parameter
                    var paramIndex = uriQuery.indexOf("username=");
                    if (paramIndex >= 0) {
                        var userStr = uriQuery.substring(paramIndex);
                        var endOfParam = userStr.indexOf("&");
                        var paramString = userStr.substring(0, endOfParam);

                        username = paramString.substring("username=".length);

                    }

                    // Get password parameter
                    paramIndex = uriQuery.indexOf("password=");
                    if (paramIndex >= 0) {
                        var pwdStr = uriQuery.substring(paramIndex);
                        var endOfParam = pwdStr.indexOf("&");
                        var paramString = pwdStr.substring(0, endOfParam);

                        password = paramString.substring("password=".length);

                    }

                    // Get url parameter
                    paramIndex = uriQuery.indexOf("url=");
                    if (paramIndex >= 0) {
                        var urlStr = uriQuery.substring(paramIndex);

                        uriApp = urlStr.substring("url=".length);

                    }

                }

              
                var operation = args.detail.uri.path;
                var parameters = { username: username, password: password, url: uriApp };

                globalVars.deeplink.createSettings(host, operation, parameters);
             
            }
            ui.disableAnimations();
            var p = ui.processAll().then(function () {
                return nav.navigate(nav.location || Application.navigator.home, nav.state);
            }).then(function () {
                return sched.requestDrain(sched.Priority.aboveNormal + 1);
            }).then(function () {
                ui.enableAnimations();
            });

            args.setPromise(p);
        }
    });

    app.oncheckpoint = function () {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. If you need to 
        // complete an asynchronous operation before your application is 
        // suspended, call args.setPromise().
        app.sessionState.history = nav.history;
    };

    function hookUpBackButtonGlobalEventHandlers() {
        window.addEventListener('keyup', backButtonGlobalKeyUpHandler, false);
    }

    // CONSTANTS
    var KEY_LEFT = "Left";
    var KEY_BROWSER_BACK = "BrowserBack";
    var MOUSE_BACK_BUTTON = 3;

    function backButtonGlobalKeyUpHandler(event) {
        // Navigates back when (alt + left) or BrowserBack keys are released.
        if ((event.key === KEY_LEFT && event.altKey && !event.shiftKey && !event.ctrlKey) || (event.key === KEY_BROWSER_BACK)) {
            nav.back();
        }
    }
    
    app.onerror = function (e) {
        console.log("APP CRASH: " + e);
        return true;
    }
    
    app.start();
})();
