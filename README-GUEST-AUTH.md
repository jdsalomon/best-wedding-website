# Wedding Guest Authentication System

This system provides family-based authentication for wedding guests with a separate admin interface for managing guest lists and groups.

## 🏗️ Architecture

- **Main Wedding App** (port 3000): Public website with family login system
- **Admin Server** (port 3001): Separate admin interface for guest management
- **Shared Database**: Both apps connect to the same Supabase database

## 📋 Prerequisites

1. **Database Setup**: Run the SQL migrations in `/database/migrations/` in your Supabase dashboard:
   ```sql
   -- Run these in order:
   -- 001_create_groups_table.sql
   -- 002_create_guests_table.sql
   ```

2. **Environment Variables**: Make sure `.env.local` has your Supabase credentials (already configured)

## 🚀 Getting Started

### 1. Start the Main Wedding App
```bash
# In the root directory
npm run dev
# App runs on http://localhost:3000
```

### 2. Start the Admin Server
```bash
# In a new terminal
cd admin-server
npm start
# Admin interface runs on http://localhost:3001
```

## 👥 Admin Interface Features

Access the admin interface at `http://localhost:3001`:

### 📊 Dashboard
- Total guests and groups statistics
- Contact coverage analysis
- Groups with/without phone numbers and emails

### 👤 Guest Management
- Add, edit, delete guests
- Search functionality
- Assign guests to groups
- Track contact information (phone, email, address, notes)

### 🏠 Group Management
- Create and manage family groups
- Auto-generate passwords based on family names
- View group details and members
- Contact coverage per group

### 📁 CSV Import
- Upload guest lists from Google Sheets
- Expected format: `first_name, last_name, +1 first_name, +1 last_name, source`
- Automatic grouping of guests with their +1
- Smart suggestions for grouping guests with same last names

## 🔐 Authentication Flow

1. **Admin creates groups** using the admin interface
2. **Guests login** on the main website using:
   - **Family Name**: Group name (e.g., "Smith")
   - **Password**: Auto-generated from last name (e.g., "smith")
3. **Authenticated guests** can access protected content

## 📝 CSV Import Process

1. Export your guest list from Google Sheets as CSV
2. Use the admin interface to upload the CSV
3. System automatically:
   - Creates individual guest records
   - Groups guests with their +1
   - Generates family group names and passwords
   - Suggests additional guests for grouping based on last names

## 🔧 Contact Coverage Tracking

The system tracks which groups have contact information:
- ✅ **Groups with contact**: At least one phone or email
- ❌ **Groups without contact**: No phone or email for any member
- 📞 **Phone coverage**: Groups with at least one phone number
- 📧 **Email coverage**: Groups with at least one email address

## 🌐 Translation Support

All authentication interfaces support English and French:
- Login page with language switcher
- All form labels and messages translated
- Error messages in both languages

## 🗂️ Database Schema

### `groups` table
- `id`: UUID primary key
- `name`: Group/family name (used for login)
- `password`: Login password
- `misc`: Notes about the group

### `guests` table  
- `id`: UUID primary key
- `first_name`, `last_name`: Guest name
- `phone`, `email`, `address`: Contact information
- `group_id`: Foreign key to groups table
- `misc`: Notes about the guest

## 🔒 Security Features

- Session-based authentication with HTTP-only cookies
- Input validation and sanitization
- SQL injection prevention
- Separate admin and public interfaces
- Environment-based configuration

## 📱 Responsive Design

Both interfaces are fully responsive and work on:
- Desktop computers
- Tablets  
- Mobile phones

## 🎯 Next Steps

1. **Database Setup**: Run the SQL migrations
2. **Test Admin Interface**: Create some test groups and guests
3. **Test Main App**: Try logging in with the created credentials
4. **Import Real Data**: Upload your guest CSV file
5. **Configure Groups**: Use suggestions to finalize groupings
6. **Distribute Credentials**: Share login details with your guests