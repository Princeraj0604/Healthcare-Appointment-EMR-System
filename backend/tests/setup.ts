// Test environment setup — runs before all tests
// Sets NODE_ENV and loads test environment variables

process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.DATABASE_URL = 'postgresql://postgres:postgres123@localhost:5432/healthcare_test_db?schema=public';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_at_least_32_characters_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_characters_long';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';
process.env.OTP_EXPIRY_MINUTES = '10';
process.env.OTP_LENGTH = '6';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = '1000';
process.env.MAX_FILE_SIZE_MB = '10';
process.env.UPLOAD_DIR = 'uploads';
