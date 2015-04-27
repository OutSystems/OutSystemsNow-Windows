using Newtonsoft.Json;

namespace PushSDK.Classes
{
    [JsonObject]
    internal class AppEventRequest : BaseRequest
    {
        [JsonProperty("goal")]
        public string Goal { get; set; }

        [JsonProperty("count")]
        public int Count { get; set; }

        public override string GetMethodName() { return "applicationEvent"; }
    }
}
