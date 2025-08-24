# Backend Connection Issues - Troubleshooting Guide

## Current Status
The app is configured to connect to: `https://awroo30hww4zvdjwpwrgm.rork.com`

## Step-by-Step Testing Process

### 1. Test Backend Connection
1. Open the app in your browser or mobile device
2. On the welcome screen, tap "Backend Test" at the bottom
3. Tap "Run Tests" to check:
   - Backend Health Check
   - tRPC Connection  
   - Example Route

### 2. Expected Results
- **All tests pass**: Backend is working correctly
- **All tests fail**: Backend is not deployed or URL is incorrect
- **Health check fails**: Backend server is down
- **tRPC fails**: tRPC router configuration issue
- **Example route fails**: Route implementation issue

### 3. Common Issues & Solutions

#### Issue: "Failed to fetch" or "Network error"
**Cause**: Backend URL is not accessible
**Solutions**:
1. Check if the backend is deployed on Rork platform
2. Verify the URL in `.env` file: `EXPO_PUBLIC_RORK_API_BASE_URL`
3. Test the URL manually in a browser: `https://awroo30hww4zvdjwpwrgm.rork.com/api/`

#### Issue: "Backend health check timed out"
**Cause**: Backend is slow or overloaded
**Solutions**:
1. Wait and retry
2. Check backend logs for performance issues
3. Consider scaling the backend

#### Issue: "404 Not Found"
**Cause**: Backend routes are not properly configured
**Solutions**:
1. Ensure the backend is deployed with the correct routes
2. Check that `/api/` and `/api/trpc` endpoints exist
3. Verify the Hono app is properly mounted

### 4. Backend Deployment Steps

#### On Rork Platform:
1. Ensure your backend code is in the `backend/` directory
2. The main file should be `backend/hono.ts`
3. Deploy using the Rork platform interface
4. The backend will be available at: `https://[project-id].rork.com/api/`

#### Local Development:
1. Change the URL in `.env` to: `EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:3000`
2. Run the backend locally
3. Test the connection

### 5. Manual Testing URLs

Test these URLs in your browser:
- Health check: `https://awroo30hww4zvdjwpwrgm.rork.com/api/`
- tRPC endpoint: `https://awroo30hww4zvdjwpwrgm.rork.com/api/trpc`
- Test route: `https://awroo30hww4zvdjwpwrgm.rork.com/api/test-trpc`

### 6. Environment Variables

Check your `.env` file contains:
```
EXPO_PUBLIC_RORK_API_BASE_URL=https://awroo30hww4zvdjwpwrgm.rork.com
```

### 7. Authentication Testing

Once backend is working:
1. Test email OTP flow in `/auth`
2. Test Google OAuth (if configured)
3. Verify user sessions persist

### 8. Product Scanner Testing

After authentication works:
1. Use the scanner to test barcode lookup
2. Test product data retrieval
3. Verify nutrition scoring

## Next Steps

1. **First**: Run the Backend Test to identify the specific issue
2. **Then**: Follow the appropriate solution based on test results
3. **Finally**: Test the full app functionality once backend is connected

## Support

If issues persist:
1. Check browser/app console for detailed error messages
2. Verify network connectivity
3. Contact Rork platform support for deployment issues