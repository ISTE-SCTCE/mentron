# Admin Account Setup Guide

## Overview

This guide will help you create admin accounts in Supabase so they can log in to Mentron.

## Admin Credentials

| Position | Email | Password | Department |
|----------|-------|----------|------------|
| Chairman | aadithyanrs9e@gmail.com | chair123 | ECE |
| Vice Chair | archasunil777@gmail.com | vchair123 | ECE |
| Secretary | amantejas05@gmail.com | sec123 | ECE |
| Joint Secretary | nehasanjeevkrishna@gmail.com | jsec123 | ECE |
| Treasurer | abhirammanoj13@gmail.com | treas123 | ECE |
| Sub-Treasurer | aryashibu73@gmail.com | streas123 | ECE |
| Technical Head | anjanapradeep512@gmail.com | thead123 | CSE |
| Media Head | aabhinavbr@gmail.com | mhead123 | ECE |
| Marketing Head | hareeshms6665@gmail.com | marhead123 | ECE |
| Chairman SWAS | unnikrishnan44013au@gmail.com | schair123 | ECE |
| Secretary SWAS | abhiraminair0406@gmail.com | sec-swas123 | ECE |

> **Note**: Design Head, Activity Coordinator, and Membership Drive Head are not included because they don't have email addresses yet.

---

## Step-by-Step Setup

### Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your Mentron project

### Step 2: Run Database Schema

1. Click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy the contents of `supabase/schema.sql`
4. Paste and click **Run**
5. Verify all tables were created successfully

### Step 3: Create Admin Auth Accounts

For each admin in the table above:

1. Go to **Authentication** → **Users** in the left sidebar
2. Click **Add User** → **Create new user**
3. Enter the email address (e.g., `aadithyanrs9e@gmail.com`)
4. Enter the password (e.g., `chair123`)
5. **IMPORTANT**: Uncheck "Send email confirmation" (for testing)
6. Click **Create user**
7. Repeat for all 11 admins

### Step 4: Link Auth Users to Admin Profiles

1. Go back to **SQL Editor**
2. Copy the contents of `supabase/seed-admins.sql`
3. Paste and click **Run**
4. This will create admin profiles linked to the auth accounts

### Step 5: Verify Setup

1. Go to **Table Editor** → **admins**
2. You should see 11 rows (1 chairman + 10 execom)
3. Verify the chairman has `can_view_analytics = true`

---

## Testing Login

1. Go to http://localhost:3000/login
2. Try logging in with chairman credentials:
   - Email: `aadithyanrs9e@gmail.com`
   - Password: `chair123`
3. You should be redirected to `/dashboard/chairman`

---

## Quick Setup Script (Alternative)

If you want to automate user creation, you can use the Supabase Management API:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

Then use this Node.js script to create users:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key!
);

const admins = [
  { email: 'aadithyanrs9e@gmail.com', password: 'chair123' },
  { email: 'archasunil777@gmail.com', password: 'vchair123' },
  // ... add all others
];

async function createAdmins() {
  for (const admin of admins) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: admin.email,
      password: admin.password,
      email_confirm: true
    });
    
    if (error) {
      console.error(`Failed to create ${admin.email}:`, error);
    } else {
      console.log(`Created ${admin.email}`);
    }
  }
}

createAdmins();
```

---

## Security Notes

⚠️ **IMPORTANT**: These are temporary passwords for initial setup.

**After deployment:**
1. All admins should change their passwords immediately
2. Enable email confirmation in Supabase Auth settings
3. Consider implementing 2FA for chairman account
4. Rotate service role keys regularly

---

## Troubleshooting

### "User profile not found" error

This means the auth user exists but isn't linked to the admins table.

**Fix:**
1. Run `supabase/seed-admins.sql` again
2. Check that the email in auth.users matches the email in the script

### "Invalid login credentials" error

The auth user doesn't exist.

**Fix:**
1. Go to Authentication → Users
2. Verify the user exists
3. If not, create it manually with the correct password

### Can't see dashboard after login

Check the user's role in the admins table.

**Fix:**
```sql
-- Check user role
SELECT * FROM admins WHERE email = 'aadithyanrs9e@gmail.com';

-- Update role if needed
UPDATE admins 
SET role = 'chairman' 
WHERE email = 'aadithyanrs9e@gmail.com';
```

---

## Next Steps

After all admins can log in:

1. Test each dashboard (student/execom/chairman)
2. Create some test student accounts
3. Upload test materials
4. Verify permissions are working correctly
