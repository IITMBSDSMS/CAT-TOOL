import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'super_admin' | 'campus_ambassador';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  college_id?: string;
  college_name?: string;
  state?: string;
  country?: string;
  department?: string;
  password?: string;
  created_at: string;
}

export interface College {
  id: string;
  name: string;
  state: string;
  country: string;
  city: string;
  type: string;
  established_year?: number;
  total_students?: number;
  created_at: string;
}

export interface SurveyResponse {
  id: string;
  college_id: string;
  college_name: string;
  ambassador_id: string;
  student_department: string;
  student_year: string;
  student_gender: string;
  student_age: number;
  student_email?: string;
  has_done_research: boolean;
  knows_publication: boolean;
  awareness_rating: number;
  research_interests: string[];
  challenges: string[];
  career_goal: string;
  programs_requested: string[];
  recommendation_text: string;
  research_readiness_score: number;
  created_at: string;
  updated_at: string;
}

export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
