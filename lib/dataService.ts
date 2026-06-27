import { supabase, isDemoMode, SurveyResponse, User, College } from './supabase';
import { MOCK_RESPONSES, MOCK_COLLEGES, MOCK_USERS, MOCK_NOTIFICATIONS, MOCK_PARTNERSHIPS } from './mockData';

export const dataService = {
  // --- Colleges ---
  async getColleges(): Promise<College[]> {
    if (isDemoMode) {
      return MOCK_COLLEGES;
    }
    const { data, error } = await supabase
      .from('colleges')
      .select('*')
      .order('name', { ascending: true });
    if (error) {
      console.warn('Error fetching colleges from Supabase, using fallback:', error);
      return MOCK_COLLEGES;
    }
    return data as College[];
  },

  async addCollege(college: Omit<College, 'id' | 'created_at'>): Promise<College> {
    if (isDemoMode) {
      const newCol: College = {
        ...college,
        id: `c_${Date.now()}`,
        created_at: new Date().toISOString()
      };
      MOCK_COLLEGES.push(newCol);
      return newCol;
    }
    const { data, error } = await supabase
      .from('colleges')
      .insert(college)
      .select()
      .single();
    if (error) throw error;
    return data as College;
  },

  // --- Users / Ambassadors ---
  async getAmbassadors(): Promise<User[]> {
    if (isDemoMode) {
      return MOCK_USERS.filter(u => u.role === 'campus_ambassador');
    }
    const { data, error } = await supabase
      .from('users')
      .select('*, colleges(name)')
      .eq('role', 'campus_ambassador');
    if (error) {
      console.warn('Error fetching ambassadors, fallback to mock:', error);
      return MOCK_USERS.filter(u => u.role === 'campus_ambassador');
    }
    return (data || []).map(item => ({
      ...item,
      college_name: item.colleges?.name
    })) as User[];
  },

  async createAmbassador(ambassador: Omit<User, 'id' | 'created_at'>): Promise<User> {
    if (isDemoMode) {
      const newUser: User = {
        ...ambassador,
        id: `u_${Date.now()}`,
        created_at: new Date().toISOString()
      };
      MOCK_USERS.push(newUser);
      return newUser;
    }
    // Generate a valid client-side UUID v4 for the primary key
    let id = '';
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      id = crypto.randomUUID();
    } else {
      const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
      id = `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
    }

    const { college_name, ...insertData } = ambassador as any;

    const { data, error } = await supabase
      .from('users')
      .insert({ id, ...insertData })
      .select()
      .single();
    if (error) throw error;
    
    return {
      ...data,
      college_name: ambassador.college_name
    } as User;
  },

  // --- Survey Responses ---
  async getSurveyResponses(collegeId?: string): Promise<SurveyResponse[]> {
    if (isDemoMode) {
      if (collegeId) {
        return MOCK_RESPONSES.filter(r => r.college_id === collegeId);
      }
      return MOCK_RESPONSES;
    }
    let query = supabase.from('survey_responses').select(`
      *,
      research_interests(interest),
      challenges(challenge),
      workshop_requests(program)
    `);

    if (collegeId) {
      query = query.eq('college_id', collegeId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error getting survey responses from Supabase, using mock:', error);
      return MOCK_RESPONSES;
    }

    return (data || []).map((r: any) => ({
      id: r.id,
      college_id: r.college_id,
      college_name: r.colleges?.name || 'Unknown College',
      ambassador_id: r.ambassador_id,
      student_department: r.student_department,
      student_year: r.student_year,
      student_gender: r.student_gender,
      student_age: r.student_age,
      student_email: r.student_email,
      has_done_research: r.has_done_research,
      knows_publication: r.knows_publication,
      awareness_rating: r.awareness_rating,
      research_interests: (r.research_interests || []).map((ri: any) => ri.interest),
      challenges: (r.challenges || []).map((c: any) => c.challenge),
      career_goal: r.career_goal,
      programs_requested: (r.workshop_requests || []).map((wr: any) => wr.program),
      recommendation_text: r.recommendation_text,
      research_readiness_score: r.research_readiness_score,
      created_at: r.created_at,
      updated_at: r.updated_at
    })) as SurveyResponse[];
  },

  async addSurveyResponse(response: Omit<SurveyResponse, 'id' | 'created_at' | 'updated_at'>): Promise<SurveyResponse> {
    if (isDemoMode) {
      const newResponse: SurveyResponse = {
        ...response,
        id: `r_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      MOCK_RESPONSES.unshift(newResponse);
      return newResponse;
    }

    let collegeId = response.college_id;
    let ambassadorId = response.ambassador_id;
    
    const isUUID = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    if (!isUUID(collegeId)) {
      const { data: cols } = await supabase.from('colleges').select('id').limit(1);
      if (cols && cols.length > 0) {
        collegeId = cols[0].id;
      } else {
        const defaultColId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1';
        await supabase.from('colleges').insert({
          id: defaultColId,
          name: 'IIT Bombay',
          state: 'Maharashtra',
          country: 'India',
          city: 'Mumbai',
          type: 'Engineering'
        });
        collegeId = defaultColId;
      }
    }

    if (!isUUID(ambassadorId)) {
      const { data: users } = await supabase.from('users').select('id').limit(1);
      if (users && users.length > 0) {
        ambassadorId = users[0].id;
      } else {
        const defaultUserId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'u2u2u2u2-u2u2-u2u2-u2u2-u2u2u2u2u2u2';
        await supabase.from('users').insert({
          id: defaultUserId,
          email: 'ambassador@iitb.edu',
          full_name: 'Priya Sharma',
          role: 'campus_ambassador',
          college_id: collegeId,
          state: 'Maharashtra',
          country: 'India',
          department: 'Biotechnology'
        });
        ambassadorId = defaultUserId;
      }
    }

    // Insert response first
    const { data: resData, error: resError } = await supabase
      .from('survey_responses')
      .insert({
        college_id: collegeId,
        ambassador_id: ambassadorId,
        student_department: response.student_department,
        student_year: response.student_year,
        student_gender: response.student_gender,
        student_age: response.student_age,
        student_email: response.student_email,
        has_done_research: response.has_done_research,
        knows_publication: response.knows_publication,
        awareness_rating: response.awareness_rating,
        career_goal: response.career_goal,
        recommendation_text: response.recommendation_text,
        research_readiness_score: response.research_readiness_score
      })
      .select()
      .single();

    if (resError) throw resError;
    const responseId = resData.id;

    // Insert research interests
    if (response.research_interests.length > 0) {
      const { error } = await supabase.from('research_interests').insert(
        response.research_interests.map(interest => ({ response_id: responseId, interest }))
      );
      if (error) console.warn('Error inserting research interests:', error);
    }

    // Insert challenges
    if (response.challenges.length > 0) {
      const { error } = await supabase.from('challenges').insert(
        response.challenges.map(challenge => ({ response_id: responseId, challenge }))
      );
      if (error) console.warn('Error inserting challenges:', error);
    }

    // Insert workshop requests
    if (response.programs_requested.length > 0) {
      const { error } = await supabase.from('workshop_requests').insert(
        response.programs_requested.map(program => ({ response_id: responseId, program }))
      );
      if (error) console.warn('Error inserting workshop requests:', error);
    }

    return {
      ...response,
      id: responseId,
      created_at: resData.created_at,
      updated_at: resData.updated_at
    };
  },

  // --- Notifications ---
  async getNotifications(): Promise<any[]> {
    if (isDemoMode) {
      return MOCK_NOTIFICATIONS;
    }
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('Error fetching notifications:', error);
      return MOCK_NOTIFICATIONS;
    }
    return data;
  },

  async addNotification(notif: { title: string; message: string; type: string; target_role: string }): Promise<any> {
    if (isDemoMode) {
      const newNotif = {
        id: `n_${Date.now()}`,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        read: false,
        created_at: new Date().toISOString()
      };
      MOCK_NOTIFICATIONS.unshift(newNotif);
      return newNotif;
    }
    const { data, error } = await supabase
      .from('notifications')
      .insert(notif)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- Partnerships ---
  async getPartnerships(): Promise<any[]> {
    if (isDemoMode) {
      return MOCK_PARTNERSHIPS;
    }
    const { data, error } = await supabase
      .from('partnership_orgs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('Error fetching partnerships:', error);
      return MOCK_PARTNERSHIPS;
    }
    return data.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      state: p.state,
      status: p.status,
      contact: p.contact_name,
      created_at: new Date(p.created_at).toISOString().split('T')[0]
    }));
  },

  async addPartnership(partner: { name: string; type: string; state: string; contact: string; status: string; notes?: string }): Promise<any> {
    if (isDemoMode) {
      const newPartner = {
        id: `p_${Date.now()}`,
        name: partner.name,
        type: partner.type,
        state: partner.state,
        contact: partner.contact,
        status: partner.status,
        created_at: new Date().toISOString().split('T')[0]
      };
      MOCK_PARTNERSHIPS.unshift(newPartner);
      return newPartner;
    }
    const { data, error } = await supabase
      .from('partnership_orgs')
      .insert({
        name: partner.name,
        type: partner.type,
        state: partner.state,
        contact_name: partner.contact,
        status: partner.status,
        notes: partner.notes
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
