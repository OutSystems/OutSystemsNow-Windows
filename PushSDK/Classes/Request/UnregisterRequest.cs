using System;
using System.Threading;
using Newtonsoft.Json;

namespace PushSDK.Classes
{
    [JsonObject]
    internal class UnregisterRequest : BaseRequest
    {
        public override string GetMethodName() { return "unregisterDevice"; }
    }
}