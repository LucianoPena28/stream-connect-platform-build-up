
-- TOTP 2FA secrets
CREATE TABLE public.totp_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  encrypted_secret text NOT NULL,
  is_enabled boolean DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.totp_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own totp" ON public.totp_secrets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own totp" ON public.totp_secrets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own totp" ON public.totp_secrets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own totp" ON public.totp_secrets FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all totp" ON public.totp_secrets FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Backup codes
CREATE TABLE public.backup_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  is_used boolean DEFAULT false,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.backup_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own codes" ON public.backup_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own codes" ON public.backup_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own codes" ON public.backup_codes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own codes" ON public.backup_codes FOR DELETE USING (auth.uid() = user_id);

-- Customer subscriptions
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id),
  service_name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  billing_period text DEFAULT 'monthly',
  price_bzd numeric NOT NULL DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (
  auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'support'::app_role)
);
CREATE POLICY "Users can request subscription changes" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Staff can create subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'support'::app_role)
);
CREATE POLICY "Staff can update subscriptions" ON public.subscriptions FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'support'::app_role)
);
CREATE POLICY "Admins can delete subscriptions" ON public.subscriptions FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at on totp_secrets
CREATE TRIGGER update_totp_secrets_updated_at
  BEFORE UPDATE ON public.totp_secrets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on subscriptions
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
