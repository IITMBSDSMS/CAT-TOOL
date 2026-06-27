export interface ReadinessResult {
  score: number;
  label: string;
  color: string;
  bgColor: string;
  factors: {
    awareness: number;
    mentorship: number;
    interest: number;
    resources: number;
    participation: number;
  };
  recommendations: string[];
}

export function calculateResearchReadiness(responses: {
  awareness_rating: number;
  has_done_research: boolean;
  knows_publication: boolean;
  challenges: string[];
  research_interests: string[];
  programs_requested: string[];
}[]): ReadinessResult {
  if (!responses || responses.length === 0) {
    return {
      score: 0,
      label: 'No Data',
      color: '#94A3B8',
      bgColor: '#F1F5F9',
      factors: { awareness: 0, mentorship: 0, interest: 0, resources: 0, participation: 0 },
      recommendations: ['Collect survey data to calculate the Research Readiness Index.'],
    };
  }

  const total = responses.length;

  // Factor 1: Awareness (30% weight)
  const avgAwareness = responses.reduce((sum, r) => sum + r.awareness_rating, 0) / total;
  const awareness = (avgAwareness / 5) * 100;

  // Factor 2: Mentorship Access (20% weight) - inverse of mentorship challenges
  const mentorshipChallenges = responses.filter(r =>
    r.challenges.includes('No mentors') || r.challenges.includes('No faculty support')
  ).length;
  const mentorship = ((total - mentorshipChallenges) / total) * 100;

  // Factor 3: Research Interest (20% weight)
  const avgInterests = responses.reduce((sum, r) => sum + r.research_interests.length, 0) / total;
  const interest = Math.min((avgInterests / 5) * 100, 100);

  // Factor 4: Resources (15% weight) - inverse of resource challenges
  const resourceChallenges = responses.filter(r =>
    r.challenges.includes('No laboratory') || r.challenges.includes('No funding') || r.challenges.includes('No opportunities')
  ).length;
  const resources = ((total - resourceChallenges) / total) * 100;

  // Factor 5: Participation (15% weight) - has done research + knows publication
  const participants = responses.filter(r => r.has_done_research || r.knows_publication).length;
  const participation = (participants / total) * 100;

  // Weighted score
  const score = Math.round(
    awareness * 0.30 +
    mentorship * 0.20 +
    interest * 0.20 +
    resources * 0.15 +
    participation * 0.15
  );

  let label: string;
  let color: string;
  let bgColor: string;

  if (score >= 90) {
    label = 'Excellent';
    color = '#059669';
    bgColor = '#D1FAE5';
  } else if (score >= 75) {
    label = 'Very Good';
    color = '#0E8C8C';
    bgColor = '#CCFBF1';
  } else if (score >= 60) {
    label = 'Developing';
    color = '#2563EB';
    bgColor = '#DBEAFE';
  } else if (score >= 40) {
    label = 'Needs Support';
    color = '#D97706';
    bgColor = '#FEF3C7';
  } else {
    label = 'Immediate Intervention Required';
    color = '#DC2626';
    bgColor = '#FEE2E2';
  }

  const recs: string[] = [];
  if (awareness < 60) recs.push('Launch Research Awareness Workshops to improve student knowledge.');
  if (mentorship < 60) recs.push('Connect students with faculty mentors and industry professionals.');
  if (interest < 60) recs.push('Introduce interdisciplinary research clubs and interest groups.');
  if (resources < 60) recs.push('Partner with labs and institutions to provide research infrastructure.');
  if (participation < 40) recs.push('Create beginner-friendly research projects and internship pipelines.');

  return {
    score,
    label,
    color,
    bgColor,
    factors: {
      awareness: Math.round(awareness),
      mentorship: Math.round(mentorship),
      interest: Math.round(interest),
      resources: Math.round(resources),
      participation: Math.round(participation),
    },
    recommendations: recs.length > 0 ? recs : ['Excellent research ecosystem! Maintain current programs.'],
  };
}

export function generateAIInsights(responses: {
  research_interests: string[];
  challenges: string[];
  career_goal: string;
  programs_requested: string[];
  has_done_research: boolean;
  knows_publication: boolean;
  awareness_rating: number;
  student_department: string;
}[]): string[] {
  if (!responses || responses.length === 0) return ['No data available yet.'];

  const total = responses.length;
  const insights: string[] = [];

  // Interest analysis
  const interestCounts: Record<string, number> = {};
  responses.forEach(r => r.research_interests.forEach(i => { interestCounts[i] = (interestCounts[i] || 0) + 1; }));
  const topInterest = Object.entries(interestCounts).sort((a, b) => b[1] - a[1])[0];
  if (topInterest) insights.push(`${Math.round((topInterest[1] / total) * 100)}% of students are most interested in ${topInterest[0]}.`);

  // Publication awareness
  const knowsPub = responses.filter(r => r.knows_publication).length;
  insights.push(`Only ${Math.round((knowsPub / total) * 100)}% of students know the research publication process.`);

  // Research done
  const hasDone = responses.filter(r => r.has_done_research).length;
  insights.push(`${Math.round((hasDone / total) * 100)}% of students have prior research experience.`);

  // Top challenge
  const challengeCounts: Record<string, number> = {};
  responses.forEach(r => r.challenges.forEach(c => { challengeCounts[c] = (challengeCounts[c] || 0) + 1; }));
  const topChallenge = Object.entries(challengeCounts).sort((a, b) => b[1] - a[1])[0];
  if (topChallenge) insights.push(`Largest barrier: "${topChallenge[0]}" (${Math.round((topChallenge[1] / total) * 100)}% of students).`);

  // Top workshop
  const workshopCounts: Record<string, number> = {};
  responses.forEach(r => r.programs_requested.forEach(p => { workshopCounts[p] = (workshopCounts[p] || 0) + 1; }));
  const topWorkshop = Object.entries(workshopCounts).sort((a, b) => b[1] - a[1])[0];
  if (topWorkshop) insights.push(`Most requested program: "${topWorkshop[0]}" (${Math.round((topWorkshop[1] / total) * 100)}% demand).`);

  // Top department
  const deptCounts: Record<string, number> = {};
  responses.forEach(r => { deptCounts[r.student_department] = (deptCounts[r.student_department] || 0) + 1; });
  const topDept = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0];
  if (topDept) insights.push(`Most active department: ${topDept[0]} (${topDept[1]} responses).`);

  // Avg awareness
  const avgAwareness = responses.reduce((sum, r) => sum + r.awareness_rating, 0) / total;
  insights.push(`Average Research Awareness Score: ${avgAwareness.toFixed(1)} / 5.0.`);

  return insights;
}
