import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://pabbrkvkbsskbhdbgenp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhYmJya3ZrYnNza2JoZGJnZW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MTc4MDAsImV4cCI6MjA5OTQ5MzgwMH0.9FAGmUCriUaC9qkp4f9ZZPB1YAqJ7EkRYdZ039GMc4Q";

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);