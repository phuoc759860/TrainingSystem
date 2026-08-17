using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.StaticFiles;

namespace TrainingSystem.Services
{
    public class S3FileStorageService : IFileStorageService, IDisposable
    {
        private readonly IAmazonS3 _s3;
        private readonly string _bucket;
        private readonly string _prefix;
        private static readonly FileExtensionContentTypeProvider _mimeProvider = new();

        public S3FileStorageService(IConfiguration config)
        {
            var section = config.GetSection("Storage:S3");
            var accessKey = section["AccessKey"] ?? Environment.GetEnvironmentVariable("AWS_ACCESS_KEY_ID");
            var secretKey = section["SecretKey"] ?? Environment.GetEnvironmentVariable("AWS_SECRET_ACCESS_KEY");
            var region = section["Region"] ?? Environment.GetEnvironmentVariable("AWS_REGION") ?? "us-east-1";

            _bucket = section["Bucket"] ?? throw new InvalidOperationException("Storage:S3:Bucket is required.");
            _prefix = section["Prefix"]?.TrimEnd('/') ?? "uploads";

            _s3 = new AmazonS3Client(accessKey, secretKey, RegionEndpoint.GetBySystemName(region));
        }

        public async Task<string> SaveFileAsync(IFormFile file, string? subDirectory = null)
        {
            var keyName = subDirectory != null
                ? $"{_prefix}/{subDirectory}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}"
                : $"{_prefix}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

            using var stream = file.OpenReadStream();
            var request = new PutObjectRequest
            {
                BucketName = _bucket,
                Key = keyName,
                InputStream = stream,
                ContentType = file.ContentType
            };
            await _s3.PutObjectAsync(request);

            return $"/{keyName}";
        }

        public async Task<bool> DeleteFileAsync(string relativePath)
        {
            var keyName = ToKey(relativePath);
            try
            {
                await _s3.DeleteObjectAsync(_bucket, keyName);
                return true;
            }
            catch { return false; }
        }

        public string GetPhysicalPath(string relativePath)
        {
            return ToKey(relativePath);
        }

        public async Task<(Stream stream, string contentType, long totalLength)?> OpenFileStreamAsync(
            string relativePath, long? startBytes = null, long? endBytes = null)
        {
            var keyName = ToKey(relativePath);

            try
            {
                var request = new GetObjectMetadataRequest { BucketName = _bucket, Key = keyName };
                var meta = await _s3.GetObjectMetadataAsync(request);

                var contentType = meta.Headers.ContentType;
                if (string.IsNullOrEmpty(contentType))
                {
                    var ext = Path.GetExtension(relativePath).ToLowerInvariant();
                    _mimeProvider.TryGetContentType(ext, out contentType);
                    contentType ??= "application/octet-stream";
                }

                GetObjectRequest getRequest = new()
                {
                    BucketName = _bucket,
                    Key = keyName
                };

                if (startBytes.HasValue)
                {
                    var end = endBytes ?? meta.ContentLength - 1;
                    getRequest.ByteRange = new ByteRange(startBytes.Value, end);
                }

                var response = await _s3.GetObjectAsync(getRequest);
                return (response.ResponseStream, contentType, meta.ContentLength);
            }
            catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return null;
            }
        }

        public bool FileExists(string relativePath)
        {
            var keyName = ToKey(relativePath);
            try
            {
                _s3.GetObjectMetadataAsync(_bucket, keyName).GetAwaiter().GetResult();
                return true;
            }
            catch { return false; }
        }

        private string ToKey(string relativePath)
        {
            var normalized = relativePath.Replace('\\', '/').TrimStart('/');
            if (normalized.StartsWith(_prefix, StringComparison.OrdinalIgnoreCase))
                return normalized;
            return $"{_prefix}/{Path.GetFileName(relativePath)}";
        }

        public void Dispose()
        {
            _s3?.Dispose();
        }
    }
}
