# CORS Issue Solution

## Problem
You're getting a CORS error when trying to fetch data from your API:
```
Access to fetch at 'http://localhost:8000/karyawan' from origin 'http://localhost:3000' has been blocked by CORS policy
```

## Quick Solutions

### Option 1: Fix CORS on Your Backend (Recommended)

Add CORS headers to your backend API:

**For Node.js/Express:**
```bash
npm install cors
```

```javascript
const cors = require('cors');

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
```

**For Python/Flask:**
```bash
pip install flask-cors
```

```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000'])
```

**For Python/Django:**
```bash
pip install django-cors-headers
```

```python
# settings.py
INSTALLED_APPS = [
    # ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ... other middleware
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

### Option 2: Use Browser Extension (Development Only)
Install a CORS browser extension like "CORS Unblock" for Chrome/Firefox.

### Option 3: Use Next.js API Routes as Proxy
Create a proxy API route in your Next.js app:

```typescript
// src/app/api/proxy/karyawan/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('klient');
  
  const baseUrl = process.env.AM_API_URL || 'http://localhost:8000';
  const targetUrl = clientId 
    ? `${baseUrl}/karyawan?klient=${clientId}`
    : `${baseUrl}/karyawan`;
  
  const response = await fetch(targetUrl);
  const data = await response.json();
  
  return NextResponse.json(data);
}
```

Then update your KasbonSlice to use the proxy:
```typescript
export const fetchKaryawan = async (clientId?: string): Promise<KaryawanResponse> => {
  const url = clientId 
    ? `/api/proxy/karyawan?klient=${clientId}`
    : '/api/proxy/karyawan';
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch karyawan data');
  }
  return response.json();
};
```

## Environment Setup
Make sure your `.env.local` file has the correct API URL:
```bash
NEXT_PUBLIC_AM_API_URL=http://localhost:8000
```

## Testing
1. Start your backend API on port 8000
2. Start your Next.js app on port 3000
3. Navigate to `/kasbon` in your browser
4. Check the browser console for any errors

## Production
For production, ensure your backend API has proper CORS configuration for your domain. 