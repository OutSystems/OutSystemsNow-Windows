using PushSDK.Classes;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Windows.Devices.Geolocation;
using System.Net.Http;
using System.Net;
using System.IO;
using System.Diagnostics;
using Windows.UI.Popups;

namespace PushSDK
{
    internal class GeozoneService : PushwooshAPIServiceBase
    {
        private const int MovementThreshold = 100;
        private readonly TimeSpan _minSendTime = TimeSpan.FromMinutes(10);

        private Geolocator _watcher;
        private Geolocator LazyWatcher
        {
            get
            {
                if (_watcher == null)
                {
                    _watcher = new Geolocator();
                }
                return _watcher;
            }
        }

        private readonly GeozoneRequest _geozoneRequest = new GeozoneRequest();

        public event EventHandler<string> OnError;

        private TimeSpan _lastTimeSend;

        public GeozoneService(string appId)
        {
            _geozoneRequest.AppId = appId;
        }


        public async void Start()
        {
            try
            {
                LazyWatcher.MovementThreshold = MovementThreshold;
                LazyWatcher.PositionChanged += WatcherOnPositionChanged;
                await LazyWatcher.GetGeopositionAsync(TimeSpan.FromMinutes(1), TimeSpan.FromMinutes(1));
            }
            catch (Exception ex)
            {
                Debug.WriteLine("GeoService: got exception " + ex.Message);
            }
        }

        public void Stop()
        {
            LazyWatcher.PositionChanged -= WatcherOnPositionChanged;
        }

        private async void WatcherOnPositionChanged(Geolocator sender, PositionChangedEventArgs e)
        {
            try
            {
                if (DateTime.Now.TimeOfDay.Subtract(_lastTimeSend) >= _minSendTime)
                {
                    _geozoneRequest.Lat = e.Position.Coordinate.Latitude;
                    _geozoneRequest.Lon = e.Position.Coordinate.Longitude;

                    await InternalSendRequestAsync(_geozoneRequest,
                        (obj, arg) => {
                            double dist = arg["response"].Value<double>("distance");
                            if (dist > 0)
                                LazyWatcher.MovementThreshold = dist / 2;
                        }, OnError);

                    _lastTimeSend = DateTime.Now.TimeOfDay;
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Error when handling position change: " + ex.ToString());
            }
        }
    }
}
