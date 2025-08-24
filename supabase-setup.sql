-- Supabase Database Setup for RawScan App
-- Run this SQL in your Supabase SQL Editor
-- Note: auth.users table is managed by Supabase and already has RLS enabled

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for profiles - users can only see and edit their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on profiles
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if it doesn't exist and user is confirmed
  IF NEW.email_confirmed_at IS NOT NULL OR NEW.phone_confirmed_at IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      updated_at = NOW();
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on signup and update
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enhanced tables for comprehensive user data management

-- Product scans history table (enhanced)
CREATE TABLE IF NOT EXISTS public.product_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  barcode TEXT NOT NULL,
  product_name TEXT,
  brand TEXT,
  category TEXT,
  health_score INTEGER,
  safety_score INTEGER,
  fit_score INTEGER,
  nutrition_data JSONB,
  ingredients JSONB,
  scan_method TEXT DEFAULT 'barcode', -- 'barcode', 'ocr', 'manual'
  location TEXT, -- where the product was scanned
  notes TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_product_scans_user_id_scanned_at ON public.product_scans(user_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_scans_barcode ON public.product_scans(barcode);

-- Enable RLS on product_scans
ALTER TABLE public.product_scans ENABLE ROW LEVEL SECURITY;

-- Create policies for product_scans
DROP POLICY IF EXISTS "Users can view own scans" ON public.product_scans;
CREATE POLICY "Users can view own scans" ON public.product_scans
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own scans" ON public.product_scans;
CREATE POLICY "Users can insert own scans" ON public.product_scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own scans" ON public.product_scans;
CREATE POLICY "Users can update own scans" ON public.product_scans
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own scans" ON public.product_scans;
CREATE POLICY "Users can delete own scans" ON public.product_scans
  FOR DELETE USING (auth.uid() = user_id);

-- User favorites table (enhanced)
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  barcode TEXT NOT NULL,
  product_name TEXT,
  brand TEXT,
  category TEXT,
  health_score INTEGER,
  notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb, -- custom user tags
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, barcode)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);

-- Enable RLS on user_favorites
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for user_favorites
DROP POLICY IF EXISTS "Users can view own favorites" ON public.user_favorites;
CREATE POLICY "Users can view own favorites" ON public.user_favorites
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own favorites" ON public.user_favorites;
CREATE POLICY "Users can insert own favorites" ON public.user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own favorites" ON public.user_favorites;
CREATE POLICY "Users can update own favorites" ON public.user_favorites
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON public.user_favorites;
CREATE POLICY "Users can delete own favorites" ON public.user_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Enhanced user preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Core preferences (allergen-free as per requirements)
  body_goal TEXT DEFAULT 'maintain_weight' CHECK (body_goal IN ('lose_weight', 'gain_weight', 'maintain_weight')),
  health_goals JSONB DEFAULT '[]'::jsonb, -- ['low_sugar', 'high_protein', 'low_fat', 'keto', 'balanced']
  diet_type TEXT DEFAULT 'balanced' CHECK (diet_type IN ('whole_foods', 'vegan', 'carnivore', 'gluten_free', 'vegetarian', 'balanced')),
  avoid_ingredients JSONB DEFAULT '[]'::jsonb, -- ['seed_oils', 'artificial_colors']
  
  -- Strictness settings
  strictness JSONB DEFAULT '{"diet_type": 0.8, "health_goals": 0.7}'::jsonb,
  
  -- Future accomplishment goals (stored but not used in scoring)
  accomplish_future JSONB DEFAULT '[]'::jsonb, -- ['eat_and_live_healthier', 'boost_energy_and_mood', etc.]
  
  -- Personal info
  display_name TEXT,
  gender TEXT,
  age INTEGER,
  height_cm INTEGER,
  weight_kg DECIMAL(5,2),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
  
  -- App settings
  notifications_enabled BOOLEAN DEFAULT true,
  notification_preferences JSONB DEFAULT '{"scan_reminders": true, "goal_updates": true, "weekly_reports": true}'::jsonb,
  privacy_settings JSONB DEFAULT '{"share_data": false, "analytics": true}'::jsonb,
  
  -- Onboarding status
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user_preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- User goals tracking table
CREATE TABLE IF NOT EXISTS public.user_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_type TEXT NOT NULL, -- 'daily_scans', 'weekly_healthy_choices', 'monthly_weight', etc.
  goal_value DECIMAL(10,2) NOT NULL, -- target value
  current_value DECIMAL(10,2) DEFAULT 0, -- current progress
  unit TEXT, -- 'scans', 'kg', 'servings', etc.
  target_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id_status ON public.user_goals(user_id, status);

-- Enable RLS on user_goals
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- Create policies for user_goals
DROP POLICY IF EXISTS "Users can manage own goals" ON public.user_goals;
CREATE POLICY "Users can manage own goals" ON public.user_goals
  FOR ALL USING (auth.uid() = user_id);

-- User achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_type TEXT NOT NULL, -- 'first_scan', 'healthy_week', 'goal_crusher', etc.
  achievement_name TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 0,
  badge_icon TEXT, -- icon name or URL
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id, unlocked_at DESC);

-- Enable RLS on user_achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for user_achievements
DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert achievements" ON public.user_achievements;
CREATE POLICY "System can insert achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (true); -- Allow system to award achievements

-- User activity log table
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL, -- 'scan', 'favorite', 'goal_set', 'preference_update', etc.
  activity_data JSONB, -- flexible data storage for different activity types
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries (with retention in mind)
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id_created_at ON public.user_activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON public.user_activity_log(created_at); -- for cleanup

-- Enable RLS on user_activity_log
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- Create policies for user_activity_log
DROP POLICY IF EXISTS "Users can view own activity" ON public.user_activity_log;
CREATE POLICY "Users can view own activity" ON public.user_activity_log
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can log user activity" ON public.user_activity_log;
CREATE POLICY "System can log user activity" ON public.user_activity_log
  FOR INSERT WITH CHECK (true);

-- User insights/analytics table
CREATE TABLE IF NOT EXISTS public.user_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  insight_type TEXT NOT NULL, -- 'weekly_summary', 'monthly_report', 'trend_analysis', etc.
  insight_data JSONB NOT NULL, -- flexible storage for different insight types
  period_start DATE,
  period_end DATE,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_insights_user_id_type ON public.user_insights(user_id, insight_type, period_end DESC);

-- Enable RLS on user_insights
ALTER TABLE public.user_insights ENABLE ROW LEVEL SECURITY;

-- Create policies for user_insights
DROP POLICY IF EXISTS "Users can view own insights" ON public.user_insights;
CREATE POLICY "Users can view own insights" ON public.user_insights
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can generate insights" ON public.user_insights;
CREATE POLICY "System can generate insights" ON public.user_insights
  FOR INSERT WITH CHECK (true);

-- Create triggers for updated_at timestamps
DROP TRIGGER IF EXISTS handle_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER handle_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_product_scans_updated_at ON public.product_scans;
CREATE TRIGGER handle_product_scans_updated_at
  BEFORE UPDATE ON public.product_scans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_user_favorites_updated_at ON public.user_favorites;
CREATE TRIGGER handle_user_favorites_updated_at
  BEFORE UPDATE ON public.user_favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_user_goals_updated_at ON public.user_goals;
CREATE TRIGGER handle_user_goals_updated_at
  BEFORE UPDATE ON public.user_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to clean up old activity logs (optional - run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_old_activity_logs()
RETURNS void AS $$
BEGIN
  -- Delete activity logs older than 1 year
  DELETE FROM public.user_activity_log 
  WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically create user preferences on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create preferences if they don't exist and user is confirmed
  IF NEW.email_confirmed_at IS NOT NULL OR NEW.phone_confirmed_at IS NOT NULL THEN
    INSERT INTO public.user_preferences (user_id, display_name)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
    )
    ON CONFLICT (user_id) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      updated_at = NOW();
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create preferences for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user preferences on signup and update
DROP TRIGGER IF EXISTS on_auth_user_created_preferences ON auth.users;
CREATE TRIGGER on_auth_user_created_preferences
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_preferences();