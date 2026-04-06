-- Create Campaigns Table
CREATE TABLE public.outreach_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'instagram',
    target_account TEXT, -- Account to pull followers from
    message_template TEXT, -- Template using spintax e.g. {Hola|Buenas}
    link_url TEXT, -- The tracking link to the VIP Table
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    is_active BOOLEAN DEFAULT true
);

-- Create Leads Table
CREATE TABLE public.outreach_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.outreach_campaigns(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    profile_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'replied', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    UNIQUE(campaign_id, username)
);

-- Setup RLS (Row Level Security) - optional but recommended, allowing authenticated users fully
ALTER TABLE public.outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all actions for authenticated users" ON public.outreach_campaigns
    FOR ALL USING (auth.role() = 'authenticated');
    
CREATE POLICY "Allow all actions for authenticated users" ON public.outreach_leads
    FOR ALL USING (auth.role() = 'authenticated');
    
-- Ensure the anon role doesn't have access, or if you call from local script via anon key + RLS bypass, 
-- you might want to create a service_role policy, but service_role bypasses RLS by default.
