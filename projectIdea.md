# PricingGPT - AI-Powered Pricing for Your Business

A modern web application that helps freelancers and businesses generate AI-powered pricing recommendations and professional quotes.

## Features

- 🤖 **AI-Powered Pricing**: Generate intelligent pricing recommendations using Google's Gemini AI
- 📊 **Analytics Dashboard**: Track your pricing performance and business growth
- 📧 **Email Integration**: Send professional emails with Gmail integration
- 📄 **PDF Generation**: Create and download professional quote PDFs
- 👤 **User Profiles**: Manage your company information and branding
- 💳 **Pro Subscriptions**: Upgrade to Pro for unlimited quotes and advanced features
- 🌍 **Multi-Currency Support**: Support for 30+ currencies worldwide
- 📱 **Mobile Responsive**: Works perfectly on all devices

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google OAuth Configuration (Required for Gmail integration)
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.googleusercontent.com

# Gemini AI Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Dodo Payments Configuration (Required for Pro subscriptions)
DODO_PAYMENTS_API_KEY=your_dodo_payments_api_key_here
DODO_PAYMENTS_PRODUCT_ID=your_dodo_payments_product_id_here
```

### 2. Dodo Payments Setup (Required for Pro Subscriptions)

To enable Pro subscription upgrades, you need to set up Dodo Payments:

#### Step 1: Create a Dodo Payments Account
1. Go to [Dodo Payments](https://dodopayments.com/) and create an account
2. Complete the account verification process

#### Step 2: Get API Credentials
1. Go to the [Dodo Payments Dashboard](https://dashboard.dodopayments.com/)
2. Navigate to the API section
3. Copy your API keys:
   - **Test Mode**: Use `sk_test_your_test_key` for development
   - **Live Mode**: Use `sk_live_your_live_key` for production

#### Step 3: Create a Product
1. In your Dodo Payments dashboard, create a new product for your "Pro" subscription
2. Set the pricing (e.g., $29/month or $290/year)
3. Configure the product settings (recurring billing, trial periods, etc.)
4. Copy the Product ID

#### Step 4: Configure Environment Variables
Add the following to your `.env` file:
```env
# For development (Test Mode)
DODO_PAYMENTS_API_KEY=sk_test_your_test_key
DODO_PAYMENTS_PRODUCT_ID=your_product_id_here

# For production (Live Mode)
DODO_PAYMENTS_API_KEY=sk_live_your_live_key
DODO_PAYMENTS_PRODUCT_ID=your_product_id_here
```

#### Step 5: Configure Supabase Edge Function Secrets
**CRITICAL**: You must set these environment variables as secrets in your Supabase project:

1. Go to your Supabase dashboard
2. Navigate to "Edge Functions"
3. Find the "create-subscription" function
4. Go to "Settings" or "Environment Variables"
5. Add the following secrets:
   - `DODO_PAYMENTS_API_KEY`: Your Dodo Payments API key (test or live)
   - `DODO_PAYMENTS_PRODUCT_ID`: Your Pro subscription product ID

**Important Notes**:
- Use **test keys** (`sk_test_...`) for development and testing
- Use **live keys** (`sk_live_...`) for production
- The system automatically detects test vs live mode based on your API key prefix
- Edge Functions do not inherit variables from your local `.env` file - you must set them as secrets

#### Step 6: Test the Integration
1. Use test API keys during development
2. Try clicking "Upgrade to Pro" in the Profile section
3. You should be redirected to Dodo Payments checkout page
4. Use test payment methods provided by Dodo Payments
5. Check the browser console and Supabase Edge Function logs for any errors

### 3. Google OAuth Setup

To enable Gmail integration for sending emails, you need to set up Google OAuth:

#### Step 1: Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Go to **APIs & Services** → **Library**
   - Search for "Gmail API" and enable it

#### Step 2: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. Configure the OAuth consent screen:
   - Choose **External** user type
   - Fill in the required information
   - Add your domain to authorized domains
   - Add the following scopes:
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/userinfo.email`
4. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: `PricingGPT`
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - `https://your-domain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:5173` (for development)
     - `https://your-domain.com` (for production)

#### Step 3: Configure Environment Variables
1. Copy the **Client ID** from the credentials page
2. Add it to your `.env` file:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_client_id_here.googleusercontent.com
   ```

### 4. Supabase Setup

1. Create a new Supabase project
2. Run the migrations in the `supabase/migrations` folder
3. Set up Row Level Security (RLS) policies
4. Create a storage bucket for company logos
5. **Configure Edge Function secrets** (see Dodo Payments setup above)

### 5. Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Troubleshooting

### Subscription Creation Errors

If you encounter errors when trying to upgrade to Pro:

1. **"Payment service is not configured" error**:
   - Ensure `DODO_PAYMENTS_API_KEY` is set in your `.env` file
   - **CRITICAL**: Make sure the API key is also set as a secret in your Supabase Edge Function settings
   - Verify your Dodo Payments account is active and verified
   - Check that you're using the correct API key format (`sk_test_...` or `sk_live_...`)

2. **"Product configuration is missing" error**:
   - Ensure `DODO_PAYMENTS_PRODUCT_ID` is set in your `.env` file
   - **CRITICAL**: Make sure the Product ID is also set as a secret in your Supabase Edge Function settings
   - Verify the Product ID exists in your Dodo Payments dashboard
   - Ensure the product is active and properly configured

3. **"Invalid API key" error**:
   - Check that your API key is correct and hasn't been regenerated
   - Ensure you're using the right environment (test vs live)
   - Verify the API key has the necessary permissions

4. **"Product not found" error**:
   - Double-check your Product ID in the Dodo Payments dashboard
   - Ensure the product is active and not archived
   - Verify you're using the correct product for your environment (test vs live)

5. **"Edge Function returned a non-2xx status code" error**:
   - Check the Supabase Edge Function logs for detailed error messages
   - Ensure all environment variables are set both locally and in Supabase
   - Verify your Dodo Payments API credentials are correct
   - Check that the Dodo Payments service is operational

6. **General troubleshooting steps**:
   - Clear browser cache and localStorage: `localStorage.clear()`
   - Check the browser console for detailed error messages
   - Verify your internet connection
   - Try signing out and signing back in
   - Test with different browsers or incognito mode

### Environment Variable Checklist

Make sure you have set these variables in **both** places:

#### In your local `.env` file:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_GEMINI_API_KEY`
- `DODO_PAYMENTS_API_KEY`
- `DODO_PAYMENTS_PRODUCT_ID`

#### In your Supabase Edge Function secrets:
- `DODO_PAYMENTS_API_KEY`
- `DODO_PAYMENTS_PRODUCT_ID`

### Dodo Payments Test vs Live Mode

The system automatically detects whether you're in test or live mode based on your API key:

- **Test Mode**: API keys start with `sk_test_`
  - Uses `https://test.dodopayments.com` endpoint
  - Safe for development and testing
  - Use test payment methods

- **Live Mode**: API keys start with `sk_live_`
  - Uses `https://live.dodopayments.com` endpoint
  - Processes real payments
  - Only use in production

## Gmail Integration Features

- **OAuth 2.0 Authentication**: Secure connection to Gmail using Google's OAuth 2.0 flow
- **Enhanced Email Threading**: Proper email threading for quote follow-ups and replies
- **Email Composition**: AI-generated or manual email drafts
- **PDF Attachments**: Attach quote PDFs to emails
- **Email History**: Track sent emails and their status
- **Reply Tracking**: Monitor client responses and update quote status
- **Secure Token Management**: Frontend-only OAuth flow for enhanced security

## Multi-Currency Support

PricingGPT supports 30+ currencies worldwide:

- **Automatic Currency Detection**: Based on user location and preferences
- **Real-time Formatting**: Proper currency symbols and decimal places
- **Quote Generation**: All quotes display in user's preferred currency
- **Analytics**: Revenue tracking in user's currency
- **PDF Generation**: Professional quotes with correct currency formatting

Supported currencies include: USD, EUR, GBP, CAD, AUD, JPY, CHF, CNY, INR, BRL, MXN, KRW, SGD, NOK, SEK, DKK, PLN, CZK, HUF, ILS, ZAR, PHP, THB, MYR, IDR, VND, TRY, RUB, AED, SAR, and more.

## How Gmail Integration Works

1. **Connect to Google**: Click the "Connect to Google" button
2. **OAuth Flow**: Uses Google Identity Services for popup-based authentication
3. **Token Management**: Access tokens are stored securely in localStorage
4. **Send Emails**: Use the access token to send emails via Gmail API
5. **Email Threading**: Automatic threading for quote follow-ups and replies
6. **Reply Tracking**: Monitor client responses and update quote status

## Security Notes

- Uses Google's OAuth 2.0 for secure authentication
- No client secrets exposed in frontend code
- OAuth tokens are stored securely in localStorage with expiry handling
- Automatic token refresh when possible
- Row Level Security (RLS) protects user data in Supabase
- Secure payment processing through Dodo Payments
- Environment variables properly separated between client and server

## Deployment

The application can be deployed to any static hosting service:

1. **Netlify**: Automatic deployment from Git
2. **Vercel**: Zero-config deployment
3. **GitHub Pages**: Static site hosting

Make sure to:
1. Set environment variables in your hosting platform
2. Configure Google OAuth redirect URIs for the production domain
3. **Set Dodo Payments secrets in Supabase Edge Functions**
4. Use live API keys for production
5. Test the Gmail integration and subscription flow after deployment

## Support

For issues with subscriptions:
1. Verify environment variables are set correctly in both `.env` and Supabase
2. Check Dodo Payments account status and API credentials
3. Review Supabase Edge Function logs for detailed error messages
4. Ensure all required secrets are configured in Supabase dashboard
5. Verify you're using the correct API keys for your environment (test vs live)

For issues with Gmail integration:
1. Verify environment variables are set correctly
2. Check Google Cloud Console OAuth configuration
3. Ensure redirect URIs match your domain exactly
4. Test with a fresh browser session to clear any cached tokens
5. Check browser console for detailed error messages

Common solutions:
- Clear localStorage: `localStorage.clear()`
- Verify Google Cloud Console settings
- Check that Gmail API is enabled
- Ensure OAuth consent screen is published (for external users)
- Verify Dodo Payments API credentials and product configuration
- Check Supabase Edge Function environment variables/secrets
- Test with different API keys (test vs live)
- Verify product configuration in Dodo Payments dashboard