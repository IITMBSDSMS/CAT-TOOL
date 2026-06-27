import { SurveyResponse, College, User } from './supabase';

// Mock data for demo mode
export const MOCK_COLLEGES: College[] = [
  { id: 'c1', name: 'IIT Bombay', state: 'Maharashtra', country: 'India', city: 'Mumbai', type: 'Engineering', total_students: 12000, created_at: '2024-01-01' },
  { id: 'c2', name: 'AIIMS Delhi', state: 'Delhi', country: 'India', city: 'New Delhi', type: 'Medical', total_students: 8000, created_at: '2024-01-01' },
  { id: 'c3', name: 'NIT Trichy', state: 'Tamil Nadu', country: 'India', city: 'Tiruchirappalli', type: 'Engineering', total_students: 9500, created_at: '2024-01-01' },
  { id: 'c4', name: 'Manipal Academy', state: 'Karnataka', country: 'India', city: 'Manipal', type: 'Deemed University', total_students: 25000, created_at: '2024-01-01' },
  { id: 'c5', name: 'Symbiosis International', state: 'Maharashtra', country: 'India', city: 'Pune', type: 'Deemed University', total_students: 18000, created_at: '2024-01-01' },
];

export const MOCK_USERS: User[] = [
  { id: 'u1', email: 'admin@healix.com', role: 'super_admin' as const, full_name: 'Dr. Arjun Mehta', created_at: '2024-01-01' },
  { id: 'u2', email: 'ambassador@iitb.edu', role: 'campus_ambassador' as const, full_name: 'Priya Sharma', college_id: 'c1', college_name: 'IIT Bombay', state: 'Maharashtra', country: 'India', department: 'Biotechnology', created_at: '2024-01-01' },
];

const DEPARTMENTS = ['Biotechnology', 'Computer Science', 'Mechanical Engineering', 'Medicine', 'Psychology', 'Data Science', 'Chemical Engineering', 'Public Health', 'Economics', 'Environmental Science'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'];
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const INTERESTS = ['Artificial Intelligence', 'Medical Research', 'Biotechnology', 'Mental Health', 'Healthcare', 'Engineering', 'Robotics', 'Business', 'Economics', 'Public Health', 'Psychology', 'Data Science', 'Environmental Science'];
const CHALLENGES = ['No mentors', 'No opportunities', 'No funding', 'Lack of awareness', 'No laboratory', 'No faculty support', 'Time', 'Research guidance'];
const GOALS = ['MS', 'MTech', 'MBA', 'PhD', 'Industry', 'Government', 'Startup', 'Undecided'];
const PROGRAMS = ['Research Workshop', 'Publication Guidance', 'Internship', 'Mentorship', 'Innovation Program', 'Healthcare Workshop', 'Mental Health Session', 'Entrepreneurship', 'Fellowship'];

function randomFrom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateResponse(id: string, collegeId: string, collegeName: string, ambassadorId: string, daysAgo: number): SurveyResponse {
  return {
    id,
    college_id: collegeId,
    college_name: collegeName,
    ambassador_id: ambassadorId,
    student_department: DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)],
    student_year: YEARS[Math.floor(Math.random() * YEARS.length)],
    student_gender: GENDERS[Math.floor(Math.random() * GENDERS.length)],
    student_age: 18 + Math.floor(Math.random() * 8),
    has_done_research: Math.random() > 0.65,
    knows_publication: Math.random() > 0.75,
    awareness_rating: 1 + Math.floor(Math.random() * 5),
    research_interests: randomFrom(INTERESTS, 2 + Math.floor(Math.random() * 4)),
    challenges: randomFrom(CHALLENGES, 1 + Math.floor(Math.random() * 3)),
    career_goal: GOALS[Math.floor(Math.random() * GOALS.length)],
    programs_requested: randomFrom(PROGRAMS, 1 + Math.floor(Math.random() * 4)),
    recommendation_text: 'We need better research infrastructure and faculty guidance.',
    research_readiness_score: 40 + Math.floor(Math.random() * 55),
    created_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// Generate 47 mock responses for IIT Bombay
export const MOCK_RESPONSES: SurveyResponse[] = Array.from({ length: 47 }, (_, i) =>
  generateResponse(`r${i + 1}`, 'c1', 'IIT Bombay', 'u2', Math.floor(Math.random() * 90))
);

export const MOCK_NOTIFICATIONS = [
  { id: 'n1', title: 'New Survey Available', message: 'Q2 2025 Research Awareness Survey is now live.', type: 'survey', created_at: new Date(Date.now() - 86400000).toISOString(), read: false },
  { id: 'n2', title: 'Workshop Scheduled', message: 'Research Methodology Workshop on July 15, 2025.', type: 'workshop', created_at: new Date(Date.now() - 2 * 86400000).toISOString(), read: false },
  { id: 'n3', title: 'Monthly Report Ready', message: 'Your June 2025 analytics report is ready to download.', type: 'report', created_at: new Date(Date.now() - 5 * 86400000).toISOString(), read: true },
  { id: 'n4', title: 'Deadline Reminder', message: 'Target: 50 survey responses by June 30.', type: 'deadline', created_at: new Date(Date.now() - 7 * 86400000).toISOString(), read: true },
];

export const MOCK_PARTNERSHIPS = [
  { id: 'p1', name: 'AIIMS Research Centre', type: 'Hospital', state: 'Delhi', status: 'MoU', contact: 'Dr. Kavita Rao', created_at: '2025-01-15' },
  { id: 'p2', name: 'TCS Foundation', type: 'Company', state: 'Maharashtra', status: 'Partnership', contact: 'Mr. Rajan Nair', created_at: '2025-02-10' },
  { id: 'p3', name: 'Pratham NGO', type: 'NGO', state: 'Maharashtra', status: 'Proposal', contact: 'Ms. Ananya Singh', created_at: '2025-03-05' },
  { id: 'p4', name: 'IISc Bangalore', type: 'Research Institute', state: 'Karnataka', status: 'Meeting', contact: 'Prof. Suresh Kumar', created_at: '2025-04-20' },
  { id: 'p5', name: 'Manipal University', type: 'University', state: 'Karnataka', status: 'Completed', contact: 'Dr. Preethi Nair', created_at: '2025-05-01' },
];
