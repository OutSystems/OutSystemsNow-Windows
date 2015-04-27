using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.RegularExpressions;
using Windows.Networking.Connectivity;
using System.Runtime.InteropServices.WindowsRuntime;
using Newtonsoft.Json.Linq;

namespace PushSDK.Classes
{
    internal static class SDKHelpers
    {
        private static string _deviceId;

        public static string GetDeviceUniqueId()
        {
            if (_deviceId == null)
            {
                try
                {
                    _deviceId = NetworkInformation.GetConnectionProfiles().
                        Where(p => p.GetNetworkConnectivityLevel() != NetworkConnectivityLevel.ConstrainedInternetAccess).
                        Select(p => p.NetworkAdapter.NetworkAdapterId).
                        OrderBy(p => p).First().ToString();
                }
                catch
                {
                    _deviceId = BitConverter.ToString(Windows.System.Profile.HardwareIdentification.GetPackageSpecificToken(null).Id.ToArray());
                }
            }

            return _deviceId;
        }

        internal static ToastPush ParsePushData(String args)
        {
            try
            {
                args = System.Net.WebUtility.UrlDecode(args);
                args = args.Replace("/PushSDK;component/Controls/PushPage.xaml?", "");

                JObject jRoot = JObject.Parse(args);

                ToastPush toast = new ToastPush();

                if (jRoot["pushwoosh"] == null)
                    return toast;

                jRoot = (JObject)jRoot["pushwoosh"];

                if (jRoot["content"] != null)
                    toast.Content = jRoot["content"].ToString();

                if (jRoot["p"] != null)
                    toast.Hash = jRoot["p"].ToString();

                if (jRoot["h"] != null)
                    toast.HtmlId = jRoot["h"].ToObject<int>();

                if (jRoot["data"] != null)
                    toast.UserData = jRoot["data"].ToString();

                try
                {
                    if (jRoot["l"] != null)
                        toast.Url = new Uri(jRoot["l"].ToString(), UriKind.Absolute);
                }
                catch { }

                return toast;
            }
            catch { }

            return null;
        }

        private static Dictionary<string,string> ParseQueryString(string s)
        {
            var list = new Dictionary<string, string>();
           
            // remove anything other than query string from url
            if (s.Contains("?"))
            {
                s = s.Substring(s.IndexOf('?') + 1);
            }

            foreach (string vp in Regex.Split(s, "&"))
            {
                string[] singlePair = Regex.Split(vp, "=");
                if (singlePair.Length == 2)
                    list[singlePair[0]] = singlePair[1];
                else
                    // only one key with no value specified in query string
                    list[singlePair[0]] = string.Empty;
            }
            return list;
        }
    }
}