# Password Reset Configuration Guide

## Overview
The password reset functionality has been implemented with two pages:
1. **Forgot Password** (`/forgot-password`) - Request password reset
2. **Reset Password** (`/reset-password`) - Set new password

## Supabase Email Configuration

### Step 1: Enable Email Provider

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Email** provider
5. Make sure it's **Enabled**

### Step 2: Configure Email Templates

1. Go to **Authentication** → **Email Templates**
2. Select **Reset Password** template
3. Update the template if needed (optional)
4. The default template should work fine

### Step 3: Configure Site URL (Important!)

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your application URL:
   - **Local**: `http://localhost:3001`
   - **Production**: `https://your-app.vercel.app`
3. Add **Redirect URLs**:
   - `http://localhost:3001/#/reset-password` (for local)
   - `https://your-app.vercel.app/#/reset-password` (for production)

### Step 4: Configure SMTP (Optional - For Custom Emails)

By default, Supabase uses their email service (limited to 3 emails/hour in free tier).

For production, configure custom SMTP:
1. Go to **Project Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Enable **Custom SMTP**
4. Add your SMTP credentials:
   - Host: `smtp.gmail.com` (for Gmail)
   - Port: `587`
   - Username: Your email
   - Password: App password (not your regular password)
   - Sender email: Your email
   - Sender name: AssetIQ

**Gmail App Password Setup:**
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Generate App Password
4. Use that password in SMTP settings

## How It Works

### User Flow:

1. **User clicks "Forgot password?" on login page**
   - Redirected to `/forgot-password`

2. **User enters email and clicks "Send Reset Link"**
   - Supabase sends email with reset link
   - Link format: `https://your-app/#/reset-password?token=...`

3. **User clicks link in email**
   - Redirected to `/reset-password` page
   - Token is automatically validated by Supabase

4. **User enters new password**
   - Password must meet security requirements:
     - At least 8 characters
     - One uppercase letter
     - One lowercase letter
     - One number
     - One special character
   - Passwords must match

5. **Password is updated**
   - User is redirected to login page
   - Can now login with new password

## Testing

### Local Testing:

1. Start dev server: `npm run dev`
2. Go to http://localhost:3001
3. Click "Forgot password?"
4. Enter a test user email
5. Check email inbox for reset link
6. Click link and set new password

### Important Notes:

- **Email Rate Limits**: Free tier = 3 emails/hour
- **Email Delivery**: May take 1-5 minutes
- **Check Spam**: Reset emails might go to spam folder
- **Token Expiry**: Reset tokens expire after 1 hour
- **One-time Use**: Each reset link can only be used once

## Troubleshooting

### "Email not sent"
- Check Supabase email quota (3/hour on free tier)
- Verify email provider is enabled
- Check SMTP configuration if using custom SMTP

### "Invalid or expired token"
- Token expires after 1 hour
- Each link can only be used once
- Request a new reset link

### "User not found"
- Email doesn't exist in database
- Check for typos in email address

### Email not received
- Check spam/junk folder
- Wait 5 minutes (emails can be delayed)
- Verify Site URL is configured correctly
- Check email quota hasn't been exceeded

## Production Deployment

When deploying to Vercel:

1. Update Site URL in Supabase:
   - `https://your-app.vercel.app`

2. Add Redirect URL:
   - `https://your-app.vercel.app/#/reset-password`

3. Configure custom SMTP for unlimited emails

4. Test the flow on production URL

## Security Features

✅ Password strength validation  
✅ Token-based authentication  
✅ One-time use tokens  
✅ Token expiration (1 hour)  
✅ Secure password hashing  
✅ HTTPS required in production  

---

**Need help?** Check Supabase docs: https://supabase.com/docs/guides/auth/auth-email
