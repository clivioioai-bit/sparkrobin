-- Payment recovery support tables.
-- Run this in Supabase SQL Editor to enable:
-- 1. email alias based user matching
-- 2. unmatched payment event persistence
-- 3. email matching audit logs

CREATE TABLE IF NOT EXISTS user_email_aliases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alias_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  UNIQUE(alias_email),
  UNIQUE(user_id, alias_email)
);

CREATE INDEX IF NOT EXISTS idx_user_email_aliases_user_id ON user_email_aliases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_email_aliases_alias_email ON user_email_aliases(alias_email);
CREATE INDEX IF NOT EXISTS idx_user_email_aliases_status ON user_email_aliases(status);

CREATE TABLE IF NOT EXISTS unmatched_payment_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  webhook_data JSONB,
  payment_id VARCHAR(255),
  subscription_id VARCHAR(255),
  amount DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
  resolved_user_id UUID REFERENCES users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_unmatched_payment_emails_email ON unmatched_payment_emails(email);
CREATE INDEX IF NOT EXISTS idx_unmatched_payment_emails_status ON unmatched_payment_emails(status);
CREATE INDEX IF NOT EXISTS idx_unmatched_payment_emails_created_at ON unmatched_payment_emails(created_at);

CREATE TABLE IF NOT EXISTS email_matching_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  searched_email VARCHAR(255) NOT NULL,
  matched_user_id UUID REFERENCES users(id),
  matched_email VARCHAR(255),
  match_type VARCHAR(50) NOT NULL,
  webhook_event_type VARCHAR(100),
  webhook_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_matching_logs_searched_email ON email_matching_logs(searched_email);
CREATE INDEX IF NOT EXISTS idx_email_matching_logs_match_type ON email_matching_logs(match_type);
CREATE INDEX IF NOT EXISTS idx_email_matching_logs_created_at ON email_matching_logs(created_at);

ALTER TABLE user_email_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE unmatched_payment_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_matching_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own email aliases" ON user_email_aliases;
CREATE POLICY "Users can view their own email aliases" ON user_email_aliases
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage email aliases" ON user_email_aliases;
CREATE POLICY "Service role can manage email aliases" ON user_email_aliases
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage unmatched payment emails" ON unmatched_payment_emails;
CREATE POLICY "Service role can manage unmatched payment emails" ON unmatched_payment_emails
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can view email matching logs" ON email_matching_logs;
CREATE POLICY "Service role can view email matching logs" ON email_matching_logs
  FOR SELECT USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_unmatched_payment_emails_updated_at ON unmatched_payment_emails;
CREATE TRIGGER update_unmatched_payment_emails_updated_at
  BEFORE UPDATE ON unmatched_payment_emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
