using Newtonsoft.Json;

namespace PushSDK.Classes
{
    [JsonObject]
    internal class AppOpenRequest : BaseRequest
    {
        public override string GetMethodName() { return "applicationOpen"; }
    }
}
