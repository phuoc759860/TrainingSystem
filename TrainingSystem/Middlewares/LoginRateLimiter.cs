using System.Collections.Concurrent;

namespace TrainingSystem.Middlewares
{
    public class LoginRateLimiter
    {
        private readonly ConcurrentDictionary<string, LoginAttemptInfo> _attempts = new();
        private readonly int _maxAttempts;
        private readonly TimeSpan _lockoutDuration;

        public LoginRateLimiter(int maxAttempts = 5, int lockoutSeconds = 300)
        {
            _maxAttempts = maxAttempts;
            _lockoutDuration = TimeSpan.FromSeconds(lockoutSeconds);
        }

        public bool IsLockedOut(string key)
        {
            if (!_attempts.TryGetValue(key, out var info))
                return false;

            if (DateTime.UtcNow - info.LastAttempt > _lockoutDuration)
            {
                _attempts.TryRemove(key, out _);
                return false;
            }

            return info.FailCount >= _maxAttempts;
        }

        public void RecordFailure(string key)
        {
            _attempts.AddOrUpdate(key,
                _ => new LoginAttemptInfo { FailCount = 1, LastAttempt = DateTime.UtcNow },
                (_, existing) =>
                {
                    if (DateTime.UtcNow - existing.LastAttempt > _lockoutDuration)
                        return new LoginAttemptInfo { FailCount = 1, LastAttempt = DateTime.UtcNow };

                    existing.FailCount++;
                    existing.LastAttempt = DateTime.UtcNow;
                    return existing;
                });
        }

        public void Reset(string key)
        {
            _attempts.TryRemove(key, out _);
        }

        public int GetRemainingAttempts(string key)
        {
            if (!_attempts.TryGetValue(key, out var info))
                return _maxAttempts;

            if (DateTime.UtcNow - info.LastAttempt > _lockoutDuration)
            {
                _attempts.TryRemove(key, out _);
                return _maxAttempts;
            }

            return Math.Max(0, _maxAttempts - info.FailCount);
        }

        private class LoginAttemptInfo
        {
            public int FailCount { get; set; }
            public DateTime LastAttempt { get; set; }
        }
    }
}
