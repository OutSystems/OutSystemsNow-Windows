using Newtonsoft.Json;

namespace PushSDK.Classes
{
    [JsonObject]
    internal class StatisticRequest : BaseRequest
    {
        [JsonProperty("hash", NullValueHandling = NullValueHandling.Ignore)]
        public string Hash { get; set; }

        public override string GetMethodName() { return "pushStat"; }
    }
}
