import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try loading .env.local first, then .env
config({ path: resolve(__dirname, '..', '.env.local') });
config({ path: resolve(__dirname, '..', '.env') });

async function resetPassword(email: string) {
  try {
    const supabase = getSupabaseAdmin();
    
    console.log(`Sending password reset email to: ${email}`);
    
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      process.exit(1);
    }

    console.log('✅ Password reset email sent successfully!');
    console.log('Recovery link:', data.properties?.action_link);
    console.log('\nNote: The user will receive an email with the reset link.');
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('Usage: tsx scripts/reset-password.ts <email>');
  process.exit(1);
}

resetPassword(email);

