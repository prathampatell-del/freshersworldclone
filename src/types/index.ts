export interface User {
  id: number;
  email: string;
  role: 'jobseeker' | 'employer' | 'admin';
  name: string;
  phone?: string;
  location?: string;
  experience_years: number;
  resume_url?: string;
  profile_photo?: string;
  bio?: string;
  skills: string[];
  education: EducationEntry[];
  created_at: string;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  year: string;
  percentage?: string;
}

export interface Company {
  id: number;
  user_id: number;
  name: string;
  logo_url?: string;
  website?: string;
  industry?: string;
  size?: string;
  description?: string;
  location?: string;
  is_verified: boolean | number;
  rating: number;
  review_count: number;
  open_jobs?: number;
  created_at: string;
}

export interface Job {
  id: number;
  company_id: number;
  title: string;
  description: string;
  type: 'fulltime' | 'internship' | 'walkin' | 'govt';
  category: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  experience_min: number;
  experience_max: number;
  qualifications?: string;
  skills_required: string[];
  openings: number;
  is_active: boolean | number;
  is_featured: boolean | number;
  deadline?: string;
  views: number;
  created_at: string;
  // from joins
  company_name?: string;
  company_logo?: string;
  company_rating?: number;
  company_verified?: boolean | number;
  company_size?: string;
  company_industry?: string;
  company_description?: string;
  company_website?: string;
  company_location?: string;
  is_bookmarked?: boolean;
  has_applied?: boolean;
}

export interface Application {
  id: number;
  job_id: number;
  user_id: number;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
  cover_letter?: string;
  applied_at: string;
  // from joins
  job_title?: string;
  job_type?: string;
  job_location?: string;
  company_name?: string;
  company_logo?: string;
  applicant_name?: string;
  applicant_email?: string;
  applicant_phone?: string;
  applicant_location?: string;
  applicant_skills?: string[];
  experience_years?: number;
  resume_url?: string;
}

export interface Course {
  id: number;
  title: string;
  provider?: string;
  category?: string;
  description?: string;
  duration?: string;
  price: number;
  rating: number;
  enrollments: number;
  thumbnail_url?: string;
  url?: string;
  is_featured: boolean | number;
  created_at: string;
}

export interface JobAlert {
  id: number;
  user_id: number;
  keywords?: string;
  location?: string;
  category?: string;
  job_type?: string;
  frequency: 'daily' | 'weekly';
  is_active: boolean | number;
  created_at: string;
}

export interface CompanyReview {
  id: number;
  company_id: number;
  user_id: number;
  rating: number;
  title?: string;
  review?: string;
  pros?: string;
  cons?: string;
  created_at: string;
  user_name?: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  pages: number;
  [key: string]: T[] | number;
}
