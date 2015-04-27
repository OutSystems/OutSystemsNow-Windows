using Newtonsoft.Json;

namespace PushSDK.Classes
{
    [JsonObject]
    internal class SendPurchaseRequest : BaseRequest
    {
        [JsonProperty("productIdentifier")]
        public string ProductIdentifier { get; set; }

        [JsonProperty("quantity")]
        public int Quantity { get; set; }

        [JsonProperty("transactionDate")]
        public int DateTimeStamp { get; set; }

        [JsonProperty("price")]
        public double Price { get; set; }

        [JsonProperty("currency")]
        public string Currency { get; set; }

        public override string GetMethodName() { return "setPurchase"; }
    }
}
