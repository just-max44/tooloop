// @ts-nocheck
/* eslint-disable import/no-unresolved */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function resolveClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip')?.trim();
  return forwardedFor || realIp || 'unknown-ip';
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json(401, { error: 'Unauthorized' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return json(500, { error: 'Server misconfiguration' });
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return json(401, { error: 'Invalid session' });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const clientIp = resolveClientIp(request);
  const rateKey = `delete-account:${user.id}:${clientIp}`;
  const { data: allowed, error: rateLimitError } = await adminClient.rpc('check_rate_limit', {
    p_rate_key: rateKey,
    p_max_hits: 3,
    p_window_seconds: 3600,
  });

  if (rateLimitError) {
    return json(500, { error: 'Rate limit check failed' });
  }

  if (!allowed) {
    return json(429, { error: 'Too many requests' });
  }

  const { error: profileDeleteError } = await adminClient.from('users').delete().eq('id', user.id);
  if (profileDeleteError) {
    return json(500, { error: 'Failed to delete user data' });
  }

  const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (authDeleteError) {
    return json(500, { error: 'Failed to delete auth account' });
  }

  return json(200, { success: true });
});