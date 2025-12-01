# Documentation Index

This directory contains all project documentation organized by category.

## 📚 Setup & Configuration

### Getting Started
- **[Supabase Setup](./SUPABASE_SETUP.md)** - Complete guide for configuring Supabase authentication and database
- **[Creem Payment Integration](./CREEM_PAYMENT_INTEGRATION.md)** - Payment system integration guide (test and production)
- **[Creem Product Creation](./CREEM_PRODUCT_CREATION_GUIDE.md)** - How to create products in Creem Dashboard
- **[Ngrok Webhook Setup](./NGROK_WEBHOOK_SETUP.md)** - Local webhook testing with ngrok

## 🔌 API References

- **[Creem API Reference](./CREEM_API_REFERENCE.md)** - Creem Payment API endpoints, request/response examples, and error codes

## 🏗️ Architecture

- **[Database Architecture](./DATABASE_ARCHITECTURE.md)** - Complete database schema, relationships, and data flow
- **[Credit System Audit](./CREDIT_SYSTEM_AUDIT.md)** - Credit system implementation, functions, and usage
- **[Credit System Issues](./CREDIT_SYSTEM_ISSUES.md)** - Known issues and fixes for the credit system

## 🔐 Security

- **[Security Guidelines](./SECURITY.md)** - Security best practices, checklist, and production deployment requirements
- **[Security Fixes](./SECURITY_FIXES.md)** - Security improvements implemented (authentication, rate limiting, logging)

## 🐛 Troubleshooting

- **[Troubleshooting Checkout](./TROUBLESHOOTING_CHECKOUT.md)** - Payment link creation issues and solutions
- **[Demo Login](./DEMO_LOGIN.md)** - Test account information for development

## 🔍 SEO & Analytics

- **[Search Console Setup](./SEARCH_CONSOLE_SETUP.md)** - Google Search Console and Bing Webmaster Tools configuration

## 📋 Quick Reference

### Database Setup Order
1. Run `database/schema.sql` - Main database schema
2. Run `database/fix-all-credit-functions.sql` - Credit system functions
3. Verify RLS policies are enabled
4. Test user creation trigger

### Payment Setup Checklist
- [ ] Create products in Creem Dashboard
- [ ] Configure environment variables (test and production)
- [ ] Set up webhook URL (local: ngrok, production: domain)
- [ ] Test checkout flow
- [ ] Verify webhook events are received

### Security Checklist
- [ ] Review Security Guidelines
- [ ] Implement webhook signature verification
- [ ] Configure rate limiting
- [ ] Audit RLS policies
- [ ] Rotate API keys
- [ ] Set up monitoring

## 🔗 Related Files

### Database SQL Files
- `database/schema.sql` - Main schema
- `database/fix-all-credit-functions.sql` - Credit functions (use this, not the individual fix files)
- `database/credit-transactions-safe.sql` - Alternative credit functions (if not using fix-all)

### Configuration Files
- `env.example` - Environment variable template
- `middleware.ts` - Authentication middleware
- `vercel.json` - Vercel deployment configuration

