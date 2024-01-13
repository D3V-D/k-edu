import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://uwkqaknwxcjjelrpkjsw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3a3Fha253eGNqamVscnBranN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQ5MjM3MzAsImV4cCI6MjAyMDQ5OTczMH0.c01xycriv_ZZrm625KVz8NSPeVkCMT9sVxK8iOt-VPA'
const supabase = createClient(supabaseUrl, supabaseKey)

export { supabase }