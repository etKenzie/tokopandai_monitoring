# Kasbon Dashboard Setup

## Overview
This dashboard displays employee (karyawan) data from the AM API with filtering capabilities by client and search functionality.

## Environment Setup

### 1. Create Environment File
Create a `.env.local` file in your project root with the following content:

```bash
NEXT_PUBLIC_AM_API_URL=http://your-api-domain.com/api
```

Replace `http://your-api-domain.com/api` with your actual API endpoint.

### 2. API Endpoint
The dashboard expects the API to have a `/karyawan` endpoint that returns data in this format:

```json
{
  "status": "success",
  "count": 551,
  "results": [
    {
      "id_karyawan": 90973,
      "status": "2",
      "loan_kasbon_eligible": 0,
      "klient": "12"
    }
  ]
}
```

## Features

### Dashboard Components
- **Statistics Cards**: Total employees, active employees, kasbon eligible count, selected client
- **Client Filter**: Dropdown to filter employees by specific client
- **Search**: Search employees by ID or client
- **Data Table**: Displays employee data with status indicators

### Status Mapping
- **Employee Status**:
  - `1` = Active (Green)
  - `2` = Pending (Yellow) 
  - `3` = Inactive (Red)
- **Kasbon Eligible**:
  - `1` = Yes (Green)
  - `0` = No (Gray)

## Usage

1. **Filter by Client**: Use the dropdown to select a specific client or view all clients
2. **Search**: Enter employee ID or client number to search
3. **Clear Filters**: Reset all filters to show all data
4. **View Statistics**: Monitor key metrics at the top of the dashboard

## Customization

### Adding New Clients
Edit the `clientOptions` array in `src/app/(DashboardLayout)/kasbon/page.tsx`:

```typescript
const clientOptions = [
  { value: '12', label: 'Client 12' },
  { value: '13', label: 'Client 13' },
  // Add your clients here
];
```

### Modifying Status Labels
Update the `getStatusLabel` function to match your status codes:

```typescript
const getStatusLabel = (status: string) => {
  switch (status) {
    case '1': return 'Your Status Label';
    // Add more cases
  }
};
```

## Troubleshooting

### Common Issues
1. **API Connection Error**: Check your `NEXT_PUBLIC_AM_API_URL` environment variable
2. **No Data Displayed**: Verify the API endpoint returns data in the expected format
3. **Filter Not Working**: Ensure the client values in `clientOptions` match your API data

### Development
- The dashboard uses React hooks for state management
- Material-UI components for the interface
- Responsive design for mobile and desktop
- TypeScript for type safety

## API Requirements

Your API should support:
- `GET /karyawan` - Returns all employees
- `GET /karyawan?klient={clientId}` - Returns employees filtered by client
- CORS enabled for frontend requests
- JSON response format as specified above 