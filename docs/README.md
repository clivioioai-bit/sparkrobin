# Documentation Index

This directory contains all project documentation organized by category.

## 📚 Setup & Configuration

### Getting Started
- **[Supabase Setup](./SUPABASE_SETUP.md)** - Complete guide for configuring Supabase authentication and database

## 🏗️ Architecture

- **[Database Architecture](./DATABASE_ARCHITECTURE.md)** - Complete database schema, relationships, and data flow
- **[Credit System Audit](./CREDIT_SYSTEM_AUDIT.md)** - Credit system implementation, functions, and usage
- **[Credit System Issues](./CREDIT_SYSTEM_ISSUES.md)** - Known issues and fixes for the credit system

## 🔐 Security

- **[Security Guidelines](./SECURITY.md)** - Security best practices, checklist, and production deployment requirements
- **[Security Fixes](./SECURITY_FIXES.md)** - Security improvements implemented (authentication, rate limiting, logging)

## 🐛 Troubleshooting

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
- [ ] Configure Dodo Payments environment variables
- [ ] Set up the Dodo webhook URL
- [ ] Test checkout flow
- [ ] Verify Dodo webhook events are received

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
