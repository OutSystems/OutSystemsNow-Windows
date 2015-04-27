using Newtonsoft.Json;

namespace PushSDK.Classes
{
    [JsonObject]
    internal class SendBadgeRequest : BaseRequest
    {
        [JsonProperty("badge")]
        public int Badge { get; set; }

        public override string GetMethodName() { return "setBadge"; }
    }
}
