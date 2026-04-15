# Razorpay Production Deployment Guide

Follow these steps to ensure your payments are properly linked to your bank account and secured.

## 1. Razorpay Dashboard Configuration
1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Switch to **Live Mode** (top right toggle).
3. Go to **Settings > API Keys**.
4. Click **Generate Live Key**.
5. **CRITICAL**: Copy both the **Key ID** (`rzp_live_...`) and **Key Secret**. You will only see the secret once.

## 2. Website Configuration
1. Log in to your Website's Admin Dashboard.
2. Go to the **Settings** tab.
3. Paste the **Razorpay Key ID** into the matching field.
4. Paste the **Razorpay Key Secret** into the new password field.
5. Click **SAVE CONFIG**.

## 3. Verification
1. Perform a small real transaction (e.g., ₹1) on your hosted site.
2. Check your [Razorpay Transactions](https://dashboard.razorpay.com/app/payments) page.
3. The payment should appear as **Captured**.
4. Check your Website Admin Panel > Orders. The order should be marked as **PAID**.

## Security Note
The **Key Secret** is now stored securely on your server and is used by `api/verify_payment.php` to cryptographically sign and verify every transaction. This prevents fraudulent orders.
