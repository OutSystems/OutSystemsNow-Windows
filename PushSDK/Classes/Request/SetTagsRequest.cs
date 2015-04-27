using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;

namespace PushSDK.Classes
{
    [JsonObject]
    internal class SetTagsRequest : BaseRequest
    {
        [JsonProperty("tags")]
        public JObject Tags { get; set; }

        public void BuildTags(IEnumerable<KeyValuePair<string, object>> tagList)
        {
            JObject tags = new JObject();
            foreach (var tag in tagList)
            {
                tags.Add(new JProperty(tag.Key, tag.Value));
            }

            Tags = tags;
        }

        public void BuildTags(String[] key, object[] values)
        {
            JObject tags = new JObject();

            int lenght = key.Length >= values.Length ? values.Length : key.Length;
            for (int i = 0; i < lenght; i++)
            {
                tags.Add(new JProperty(key[i], values[i]));
            }

            Tags = tags;
        }

        public override string GetMethodName() { return "setTags"; }
    }
}
