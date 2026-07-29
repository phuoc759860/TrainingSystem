using System.Collections.Concurrent;

namespace TrainingSystem.Middlewares
{
    public class RateLimiterService
    {
        private readonly ConcurrentDictionary<string, RateLimitConfig> _configs = new();

        public RateLimiterService()
        {
            _configs["default"] = new RateLimitConfig(10, 60);
        }

        public void Configure(string name, int maxRequests, int windowSeconds)
        {
            _configs[name] = new RateLimitConfig(maxRequests, windowSeconds);
        }

        public bool IsAllowed(string key, string limiterName = "default")
        {
            var config = _configs.GetOrAdd(limiterName, _ => new RateLimitConfig(10, 60));
            return config.IsAllowed(key);
        }

        private class RateLimitConfig
        {
            private readonly ConcurrentDictionary<string, RateLimitEntry> _store = new();
            private readonly int _maxRequests;
            private readonly TimeSpan _window;

            public RateLimitConfig(int maxRequests, int windowSeconds)
            {
                _maxRequests = maxRequests;
                _window = TimeSpan.FromSeconds(windowSeconds);
            }

            public bool IsAllowed(string key)
            {
                var now = DateTime.UtcNow;
                var entry = _store.GetOrAdd(key, _ => new RateLimitEntry { WindowStart = now, Count = 0 });

                lock (entry)
                {
                    if (now - entry.WindowStart > _window)
                    {
                        entry.WindowStart = now;
                        entry.Count = 0;
                    }

                    entry.Count++;
                    return entry.Count <= _maxRequests;
                }
            }
        }

        private class RateLimitEntry
        {
            public DateTime WindowStart { get; set; }
            public int Count { get; set; }
        }
    }
}
