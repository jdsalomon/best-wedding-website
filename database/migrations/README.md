# Database Migrations

Run these SQL files in order in your Supabase SQL editor:

1. `001_create_groups_table.sql`
2. `002_create_guests_table.sql`

These create the necessary tables for the wedding guest management system.

## Schema Overview

- **groups**: Family/group information with authentication passwords
- **guests**: Individual guest information linked to groups

## To apply migrations:
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Execute each migration file in order