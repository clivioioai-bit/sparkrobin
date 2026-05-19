"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";
import { getAuthCallbackUrl } from "@/lib/site-url";

export default function SignInPage() {
  const redirectTo = getAuthCallbackUrl({
    currentOrigin: typeof window !== 'undefined' ? window.location.origin : undefined,
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Auth
          supabaseClient={supabase}
          view="magic_link"
          appearance={{
            theme: ThemeSupa,
            className: {
              container: "space-y-4",
              label: "text-foreground",
              input: "bg-background border border-border text-foreground placeholder:text-muted-foreground",
              button: "bg-primary text-primary-foreground hover:bg-primary/90",
              anchor: "text-primary hover:underline",
              divider: "text-muted-foreground",
              message: "text-muted-foreground",
              // social button not typed; rely on default styles
            },
            variables: {
              default: {
                colors: {
                  brand: '#0EA5E9',
                  brandAccent: '#22C55E',
                  inputBackground: 'transparent',
                  inputText: 'hsl(var(--foreground))',
                  anchorTextColor: 'hsl(var(--primary))',
                },
              },
            },
          }}
          providers={["google"]}
          redirectTo={redirectTo}
          showLinks={false}
          magicLink
        />
      </div>
    </div>
  );
}
