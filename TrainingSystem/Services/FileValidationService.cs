namespace TrainingSystem.Services
{
    public class FileValidationService
    {
        private static readonly Dictionary<byte[], string[]> MagicByteSignatures = new(ByteArrayComparer.Instance)
        {
            { new byte[] { 0x25, 0x50, 0x44, 0x46 }, new[] { "application/pdf" } },
            { new byte[] { 0x89, 0x50, 0x4E, 0x47 }, new[] { "image/png" } },
            { new byte[] { 0xFF, 0xD8, 0xFF }, new[] { "image/jpeg" } },
            { new byte[] { 0x47, 0x49, 0x46, 0x38 }, new[] { "image/gif" } },
            { new byte[] { 0x50, 0x4B, 0x03, 0x04 }, new[] {
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                "application/zip"
            }},
            { new byte[] { 0xD0, 0xCF, 0x11, 0xE0 }, new[] {
                "application/msword",
                "application/vnd.ms-excel",
                "application/vnd.ms-powerpoint"
            }},
            { new byte[] { 0x52, 0x49, 0x46, 0x46 }, new[] { "audio/wav" }},
            { new byte[] { 0x1A, 0x45, 0xDF, 0xA3 }, new[] { "video/webm" }},
            { new byte[] { 0x49, 0x44, 0x33 }, new[] { "audio/mpeg" }},
            { new byte[] { 0xFF, 0xFB }, new[] { "audio/mpeg" }},
            { new byte[] { 0x00, 0x00, 0x01, 0xBA }, new[] { "video/mpeg" }},
            { new byte[] { 0x7B, 0x5C, 0x72, 0x74, 0x66 }, new[] { "application/rtf" }},
            { new byte[] { 0xEF, 0xBB, 0xBF }, new[] { "text/plain" }},
            { new byte[] { 0x52, 0x61, 0x72, 0x21 }, new[] { "application/rar" }},
        };

        public bool ValidateMagicBytes(Stream stream, string declaredMimeType, out string detectedMimeType)
        {
            detectedMimeType = declaredMimeType;
            if (stream.Length < 4) return true;

            var buffer = new byte[Math.Min(16, stream.Length)];
            stream.Position = 0;
            stream.ReadExactly(buffer, 0, buffer.Length);
            stream.Position = 0;

            // MP4 ftyp box: bytes 4-7 are "ftyp"; the initial 4-byte size varies
            // Matches both video/mp4 and audio/mp4 (.m4a)
            if ((declaredMimeType == "video/mp4" || declaredMimeType == "audio/mp4") && buffer.Length >= 8)
            {
                var isMp4 = buffer[4] == 0x66 && buffer[5] == 0x74 && buffer[6] == 0x79 && buffer[7] == 0x70;
                if (!isMp4)
                {
                    detectedMimeType = "unknown";
                    return false;
                }
                return true;
            }

            foreach (var kvp in MagicByteSignatures)
            {
                if (BufferStartsWith(buffer, kvp.Key))
                {
                    if (kvp.Value.Contains(declaredMimeType, StringComparer.OrdinalIgnoreCase))
                    {
                        detectedMimeType = declaredMimeType;
                        return true;
                    }

                    detectedMimeType = kvp.Value[0];
                    return false;
                }
            }

            return true;
        }

        private static bool BufferStartsWith(byte[] buffer, byte[] signature)
        {
            if (buffer.Length < signature.Length) return false;
            for (int i = 0; i < signature.Length; i++)
                if (buffer[i] != signature[i]) return false;
            return true;
        }

        private class ByteArrayComparer : IEqualityComparer<byte[]>
        {
            public static readonly ByteArrayComparer Instance = new();
            public bool Equals(byte[]? x, byte[]? y) =>
                x != null && y != null && x.SequenceEqual(y);
            public int GetHashCode(byte[] obj)
            {
                int hash = 17;
                foreach (var b in obj.Take(8))
                    hash = hash * 31 + b;
                return hash;
            }
        }
    }
}
