using Newtonsoft.Json;

namespace PushSDK.Classes
{
    [JsonObject]
    internal class GeozoneRequest : BaseRequest
    {
        [JsonProperty("lat")]
        public double Lat { get; set; }

        [JsonProperty("lng")]
        public double Lon { get; set; }

        public override string GetMethodName() { return "getNearestZone"; }
    }
}
