import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mkdibpvhnmuvnrflupbl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rZGlicHZobm11dm5yZmx1cGJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1MjY3MTUsImV4cCI6MjA2MjEwMjcxNX0.4nozGgjnMDmiyVQ78M_Xnng2_SSy9JANbf1iKuJn9XY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
