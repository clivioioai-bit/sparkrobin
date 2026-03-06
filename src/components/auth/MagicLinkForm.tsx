import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';

interface MagicLinkFormProps {
  email: string;
  onChange: (email: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function MagicLinkForm({ email, onChange, onSubmit, loading }: MagicLinkFormProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        />
      </div>
      <Button
        onClick={onSubmit}
        disabled={loading}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <Mail className="w-4 h-4 mr-2" />
        Continue with Magic Link
      </Button>
    </>
  );
}

