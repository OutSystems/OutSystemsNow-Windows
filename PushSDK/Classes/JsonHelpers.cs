using Newtonsoft.Json.Linq;

namespace PushSDK.Classes
{
    internal static class JsonHelpers
    {
        internal static int GetStatusCode(JObject jRoot)
        {
            return jRoot.Value<int>("status_code");
        }

        internal static string GetStatusMessage(JObject jRoot)
        {
            return jRoot.Value<string>("status_message");
        }
    }
}
