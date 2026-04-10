# Veo4Video.io – AI Video Generation Platform

Veo4Video.io is an independent AI video generation platform supporting multiple models and features:

- 🎬 Sora-style motion video generation
- 🎞️ 10-second cinematic clips
- 📽️ 25-second multi-scene storyboards
- 🚫 Watermark-free output
- 🌍 Globally accessible models

**Live Demo**: https://veo4video.io

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account
- Creem Payment account (for payment integration)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd veo4video.io

# Install dependencies
npm install
# or
yarn install
# or
pnpm install

# Copy environment variables
cp env.example .env.local

# Configure your environment variables (see Configuration section)
```

### Development

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Documentation

All documentation is organized in the [`docs/`](./docs/) directory. See [Documentation Index](./docs/README.md) for a complete list.

### Quick Links

- **[Setup Guides](./docs/README.md#-setup--configuration)** - Supabase, Creem Payment, Product Creation
- **[API References](./docs/README.md#-api-references)** - Creem API documentation
- **[Architecture](./docs/README.md#️-architecture)** - Database schema and credit system
- **[Security](./docs/README.md#-security)** - Security guidelines and fixes
- **[Troubleshooting](./docs/README.md#-troubleshooting)** - Common issues and solutions

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Creem Payment
CREEM_API_KEY=your_creem_api_key
CREEM_WEBHOOK_SECRET=your_webhook_secret
CREAM_BASE_URL=https://api.creem.io

# Product IDs (from Creem Dashboard)
NEXT_PUBLIC_CREEM_PLAN_BASIC_MONTHLY_ID=prod_xxx
NEXT_PUBLIC_CREEM_PLAN_BASIC_YEARLY_ID=prod_xxx
NEXT_PUBLIC_CREEM_PLAN_CREATOR_MONTHLY_V2_ID=prod_xxx
NEXT_PUBLIC_CREEM_PLAN_CREATOR_YEARLY_V2_ID=prod_xxx
NEXT_PUBLIC_CREEM_PLAN_PRO_MONTHLY_ID=prod_xxx
NEXT_PUBLIC_CREEM_PLAN_PRO_YEARLY_ID=prod_xxx
NEXT_PUBLIC_CREEM_PACK_STARTER_ID=prod_xxx
NEXT_PUBLIC_CREEM_PACK_CREATOR_ID=prod_xxx
NEXT_PUBLIC_CREEM_PACK_DEV_ID=prod_xxx

# Video Generation API
KIE_API_BASE_URL=https://api.kie.ai
KIE_API_KEY=your_kie_api_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# SEO (optional)
GOOGLE_SITE_VERIFICATION=your_verification_code
BING_VERIFICATION_CODE=your_verification_code
```

See `env.example` for a complete list of environment variables.

## 🗄️ Database Setup

1. Create a Supabase project
2. Run the schema SQL files in order:
   - `database/schema.sql` - Main database schema
   - `database/fix-all-credit-functions.sql` - Credit system functions
3. Configure RLS policies (included in schema)
4. Set up triggers for automatic user creation

See [Database Architecture](./docs/DATABASE_ARCHITECTURE.md) for detailed information.

## 🏗️ Project Structure

```
veo4video.io/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   └── ...
├── src/                   # Source code
│   ├── components/        # React components
│   ├── lib/               # Utility functions
│   ├── hooks/             # React hooks
│   └── services/          # External service integrations
├── database/              # Database SQL files
├── scripts/               # Utility scripts
└── public/                # Static assets
```

## 🔐 Security

Before deploying to production:

- [ ] Review [Security Guidelines](./docs/SECURITY.md)
- [ ] Implement webhook signature verification
- [ ] Configure rate limiting
- [ ] Audit RLS policies
- [ ] Rotate all API keys
- [ ] Set up monitoring and alerting

## 🧪 Testing

### Local Testing

```bash
# Start development server
npm run dev

# Test webhook locally (requires ngrok)
# See NGROK_WEBHOOK_SETUP.md
```

### Test Accounts

See [Demo Login](./docs/DEMO_LOGIN.md) for test account information.

## 📦 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Environment-Specific Configuration

- **Development/Preview**: Use test API keys (`pk_test_...`, `whsec_test_...`)
- **Production**: Use live API keys (`pk_live_...`, `whsec_live_...`)

See [Creem Payment Integration](./docs/CREEM_PAYMENT_INTEGRATION.md) for detailed configuration.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

See [LICENSE](./LICENSE) file for details.

## 🆘 Support

For issues and questions:
- Check the [Troubleshooting Guide](./docs/TROUBLESHOOTING_CHECKOUT.md)
- Review [Documentation Index](./docs/README.md)
- Open an issue on GitHub

## 🔗 Links

- **Live Site**: https://veo4video.io
- **Supabase**: https://supabase.com
- **Creem Payment**: https://creem.io
- **Next.js Docs**: https://nextjs.org/docs

---

**Last Updated**: 2025-01-XX
