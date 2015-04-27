using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace PushSDK.Classes
{
    [JsonObject]
    internal class GetTagsRequest : BaseRequest
    {
        [JsonIgnore]
        public JObject Tags { get; set; }

        public override void ParseResponse(JObject jRoot)
        {
            Tags = jRoot["response"].Value<JObject>("result");
        }

        public override string GetMethodName() { return "getTags"; }
    }
}
