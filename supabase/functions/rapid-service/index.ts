// supabase/functions/rapid-service/index.ts
// @ts-nocheck
import { serve } from "https://deno.land/x/sift@0.5.0/mod.ts";
import { createClient } from "npm:@supabase/supabase-js";
// Inline CORS headers
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Content-Type": "application/json"
};
// Read your secrets exactly as you’ve set them in the dashboard
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY");
}
serve(async (req)=>{
  // 1) CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS
    });
  }
  // 2) Only POST allowed
  if (req.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method Not Allowed"
    }), {
      status: 405,
      headers: CORS_HEADERS
    });
  }
  // 3) Must have a Bearer token
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({
      error: "Missing or invalid Authorization header"
    }), {
      status: 401,
      headers: CORS_HEADERS
    });
  }
  const jwt = authHeader.replace("Bearer ", "");
  // 4) Validate the JWT and get the user
  const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY"), {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`
      }
    }
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) {
    return new Response(JSON.stringify({
      error: "Invalid user token"
    }), {
      status: 401,
      headers: CORS_HEADERS
    });
  }
  // 5) Parse body
  let body;
  try {
    body = await req.json();
  } catch  {
    return new Response(JSON.stringify({
      error: "Invalid JSON body"
    }), {
      status: 400,
      headers: CORS_HEADERS
    });
  }
  if (!body.user_id || body.user_id !== user.id) {
    return new Response(JSON.stringify({
      error: "Missing or mismatched user_id"
    }), {
      status: 400,
      headers: CORS_HEADERS
    });
  }
  // 6) Admin delete
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { error: deleteErr } = await admin.auth.admin.deleteUser(user.id);
  if (deleteErr) {
    return new Response(JSON.stringify({
      error: `Deletion failed: ${deleteErr.message}`
    }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
  // 7) Success
  return new Response(JSON.stringify({
    message: "User deleted successfully"
  }), {
    status: 200,
    headers: CORS_HEADERS
  });
});
