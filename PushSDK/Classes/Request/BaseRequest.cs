using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace PushSDK.Classes
{
    [JsonObject]
    internal abstract class BaseRequest
    {
        [JsonProperty("application")]
        public string AppId { get; set; }

        // Note: this requires ID_CAP_IDENTITY_DEVICE         
        // to be added to the capabilities of the WMAppManifest         
        // this will then warn users in marketplace  
        [JsonProperty("hwid")]
        public string HardwareId
        {
            get { return SDKHelpers.GetDeviceUniqueId(); }
        }

        [JsonProperty("v")]
        public string SDKVersion
        {
            //returns SDK version
            get { return "2.3"; }
        }

        [JsonIgnore]
        public string ErrorMessage { get; set; }

        public virtual void ParseResponse(JObject jRoot) { }

        public abstract string GetMethodName();
    }
}
