import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import { getCookie } from 'cookies-next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a Supabase client for server-side operations
const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey);

// Function to create a Supabase client for user sessions
export const createSupabaseClient = (req: NextApiRequest) => {
    const token = getCookie('supabase-auth-token', { req }) as string;
    return createClient(supabaseUrl, token);
};

// Admin client for operations requiring higher privileges
export const supabaseAdminClient = supabaseAdmin;

// Exported functions for server-side handling
export const fetchUserData = async (req: NextApiRequest, res: NextApiResponse) => {
    const supabase = createSupabaseClient(req);
    const { user, error } = await supabase.auth.getUser();
    if (error) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(200).json(user);
};

export const runQuery = async (query: string) => {
    const { data, error } = await supabaseAdminClient
        .rpc('your_rpc_function', { query });
    if (error) throw error;
    return data;
};
