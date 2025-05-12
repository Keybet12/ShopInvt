// supabase/functions/_shared/cors.ts

export const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*", // or specify "http://localhost:8080" if needed
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS", // include GET for flexibility
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", // lowercase helps with consistency
    "Content-Type": "application/json",
  };
  