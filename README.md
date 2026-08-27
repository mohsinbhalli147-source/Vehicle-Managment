# Vehicle Management System

A professional vehicle and inventory management application built with Next.js and Supabase.

## Features

- 🏍️ **Inventory Management** - Track bikes, rickshaws, batteries, and body parts
- 👥 **Customer Management** - Manage customer information and history
- 💰 **Sales & Payment Tracking** - Record sales and track payments
- 🔄 **Rental System** - Manage vehicle rentals and returns
- 💸 **Expenses Tracking** - Track business expenses
- 📊 **Reports & Analytics** - View sales, stock, and rental reports
- 👨‍💼 **Staff Management** - Manage team members and access
- ⚙️ **Business Settings** - Configure shop information and preferences
- 📝 **Activity Logs** - Track all system activities

## Tech Stack

- **Frontend**: Next.js 16.3.3, React 19, TypeScript
- **UI**: Tailwind CSS v4, Lucide React
- **Backend**: Supabase (Database, Auth, RLS)
- **State Management**: React Query (TanStack Query)
- **Authentication**: Supabase Auth

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account and project
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd vehicle-management
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Set up the database:
- Go to your Supabase project dashboard
- Run the SQL migrations in order:
  - `supabase/migrations/001_initial_schema.sql`
  - `supabase/migrations/002_add_vehicle_types.sql`
  - `supabase/migrations/003_fix_profiles_rls.sql`

5. Create admin user:
Run this SQL in Supabase SQL Editor:
```sql
INSERT INTO profiles (id, email, full_name, role, is_active)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'your-email@example.com'),
    'your-email@example.com',
    'Your Name',
    'admin',
    true
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;
```

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The application uses the following main tables:

- `profiles` - User profiles and roles
- `categories` - Inventory categories with types
- `inventory_items` - Vehicle inventory with vehicle types
- `customers` - Customer information
- `sales` - Sales records
- `rentals` - Rental records
- `payments` - Payment transactions
- `expenses` - Business expenses
- `activities` - Activity logs
- `business_settings` - Shop configuration

## Vehicle Types

The system supports multiple vehicle types:
- **Bikes** - Motorcycles and scooters
- **Rickshaws** - Three-wheeled vehicles
- **Batteries** - Lead acid batteries
- **Body Parts** - Vehicle components and parts
- **Other** - Miscellaneous items

## Category Types

Categories are organized by type:
- **Vehicle** - Complete vehicles
- **Parts** - Vehicle parts and components
- **Batteries** - Battery inventory
- **Other** - Miscellaneous categories

## Performance

The application uses React Query for:
- Automatic data caching
- Optimistic updates
- Background refetching
- Query deduplication
- Millisecond response times for cached data

## Security

- Row Level Security (RLS) enabled on all tables
- Admin and staff role-based access control
- Secure authentication with Supabase Auth
- No service role keys exposed in client code

## License

This project is proprietary software.

## Support

For support and questions, please contact the development team.
