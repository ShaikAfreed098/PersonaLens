import { createClient } from "@supabase/supabase-js";
import { TraitState, UserResponse } from "./trait-engine";

// Retrieve environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if Supabase keys are fully configured
const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== "your-supabase-project-url" && 
  supabaseAnonKey !== "your-supabase-anon-key";

// Initialize Supabase Client if configured
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : null;

console.log(isSupabaseConfigured 
  ? "Supabase connected successfully." 
  : "Supabase keys not found or default. Running in Local Storage Fallback Mode."
);

// Define Types
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface AssessmentRecord {
  id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  confidence_score: number;
}

export interface ReportRecord {
  id: string;
  assessment_id: string;
  report_json: any;
  created_at: string;
}

// Database API Wrapper - handles both Supabase and Local Storage fallback
export const db = {
  // 1. Auth: Get Current User
  async getCurrentUser(): Promise<UserProfile | null> {
    // Check if we have a local user logged in first
    if (typeof window !== "undefined") {
      const userJson = localStorage.getItem("pl_user");
      if (userJson) {
        const parsed = JSON.parse(userJson) as UserProfile;
        if (parsed.id.startsWith("local-user-")) {
          return parsed;
        }
      }
    }

    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        // Get user profile
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();
          
        if (profile) return profile as UserProfile;
        
        // If profile doesn't exist, create it
        const newProfile: UserProfile = {
          id: user.id,
          email: user.email || "",
          name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
          created_at: new Date().toISOString()
        };
        await supabase.from("users").insert(newProfile);
        return newProfile;
      } catch (e) {
        console.warn("Supabase user session check failed, returning local user if exists.");
      }
    }

    // Local Storage Fallback
    if (typeof window === "undefined") return null;
    const userJson = localStorage.getItem("pl_user");
    if (!userJson) return null;
    return JSON.parse(userJson) as UserProfile;
  },

  // Auth: Log In / Register
  async loginOrRegister(email: string, name: string): Promise<UserProfile> {
    if (supabase) {
      const password = "PersonaLensDefaultPassword123!";
      let authData;
      
      try {
        // Try sign-in first (does not send confirmation emails, consumes 0 quota)
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          // If it fails, sign up the user
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name }
            }
          });

          if (signUpError) {
            throw signUpError;
          }
          authData = signUpData;
        } else {
          authData = signInData;
        }

        const user = authData.user;
        if (!user) throw new Error("Could not authenticate user session.");

        const profile: UserProfile = {
          id: user.id,
          email: user.email || email,
          name: user.user_metadata?.name || name || "User",
          created_at: new Date().toISOString()
        };
        
        // Insert or update profile
        const { error: upsertError } = await supabase.from("users").upsert(profile);
        if (upsertError) {
          throw upsertError;
        }
        return profile;
      } catch (error: any) {
        // Automatically switch to local storage if rate limited or hit other Auth blocks
        console.warn("Supabase signup/signin failed. Switching to Local Storage Fallback.", error);
        return this.loginOrRegisterLocalStorage(email, name);
      }
    } else {
      return this.loginOrRegisterLocalStorage(email, name);
    }
  },

  loginOrRegisterLocalStorage(email: string, name: string): UserProfile {
    if (typeof window === "undefined") throw new Error("Window is undefined");
    const userId = "local-user-" + Math.random().toString(36).substr(2, 9);
    const profile: UserProfile = {
      id: userId,
      email,
      name,
      created_at: new Date().toISOString()
    };
    localStorage.setItem("pl_user", JSON.stringify(profile));
    return profile;
  },

  // Auth: Logout
  async logout(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pl_user");
    }
    if (supabase) {
      await supabase.auth.signOut();
    }
  },

  // 2. Assessments: Create new assessment
  async createAssessment(userId: string): Promise<AssessmentRecord> {
    const isLocal = userId.startsWith("local-user-");

    if (supabase && !isLocal) {
      try {
        const { data, error } = await supabase
          .from("assessments")
          .insert({
            user_id: userId,
            confidence_score: 0.0
          })
          .select()
          .single();
          
        if (error) throw error;
        return data as AssessmentRecord;
      } catch (e) {
        console.warn("Supabase assessment creation failed. Falling back to local storage.", e);
        return this.createLocalAssessment(userId);
      }
    } else {
      return this.createLocalAssessment(userId);
    }
  },

  createLocalAssessment(userId: string): AssessmentRecord {
    const newRecord: AssessmentRecord = {
      id: "assessment-" + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      started_at: new Date().toISOString(),
      completed_at: null,
      confidence_score: 0.0
    };
    if (typeof window === "undefined") return newRecord;
    const list = JSON.parse(localStorage.getItem("pl_assessments") || "[]") as AssessmentRecord[];
    list.push(newRecord);
    localStorage.setItem("pl_assessments", JSON.stringify(list));
    return newRecord;
  },

  // Assessments: Save assessment completion
  async completeAssessment(assessmentId: string, confidenceScore: number): Promise<void> {
    const isLocal = assessmentId.startsWith("assessment-");

    if (supabase && !isLocal) {
      try {
        const { error } = await supabase
          .from("assessments")
          .update({
            completed_at: new Date().toISOString(),
            confidence_score: confidenceScore
          })
          .eq("id", assessmentId);
        if (error) throw error;
      } catch (e) {
        console.warn("Supabase assessment completion failed. Saving locally.", e);
        this.completeLocalAssessment(assessmentId, confidenceScore);
      }
    } else {
      this.completeLocalAssessment(assessmentId, confidenceScore);
    }
  },

  completeLocalAssessment(assessmentId: string, confidenceScore: number): void {
    if (typeof window === "undefined") return;
    const list = JSON.parse(localStorage.getItem("pl_assessments") || "[]") as AssessmentRecord[];
    const idx = list.findIndex(a => a.id === assessmentId);
    if (idx !== -1) {
      list[idx].completed_at = new Date().toISOString();
      list[idx].confidence_score = confidenceScore;
      localStorage.setItem("pl_assessments", JSON.stringify(list));
    }
  },

  // 3. Responses: Save individual answer response
  async saveResponse(
    assessmentId: string,
    questionId: number,
    answer: string | string[],
    responseTimeMs: number
  ): Promise<void> {
    const isLocal = assessmentId.startsWith("assessment-");

    if (supabase && !isLocal) {
      try {
        const { error } = await supabase
          .from("responses")
          .insert({
            assessment_id: assessmentId,
            question_id: questionId,
            answer,
            response_time_ms: responseTimeMs
          });
        if (error) throw error;
      } catch (e) {
        console.warn("Supabase response save failed. Saving locally.", e);
        this.saveLocalResponse(assessmentId, questionId, answer, responseTimeMs);
      }
    } else {
      this.saveLocalResponse(assessmentId, questionId, answer, responseTimeMs);
    }
  },

  saveLocalResponse(
    assessmentId: string,
    questionId: number,
    answer: string | string[],
    responseTimeMs: number
  ): void {
    if (typeof window === "undefined") return;
    const list = JSON.parse(localStorage.getItem("pl_responses") || "[]");
    list.push({
      id: "resp-" + Math.random().toString(36).substr(2, 9),
      assessment_id: assessmentId,
      question_id: questionId,
      answer,
      response_time_ms: responseTimeMs,
      created_at: new Date().toISOString()
    });
    localStorage.setItem("pl_responses", JSON.stringify(list));
  },

  // Responses: Get responses for an assessment
  async getResponses(assessmentId: string): Promise<UserResponse[]> {
    const isLocal = assessmentId.startsWith("assessment-");

    if (supabase && !isLocal) {
      try {
        const { data, error } = await supabase
          .from("responses")
          .select("question_id, answer, response_time_ms")
          .eq("assessment_id", assessmentId)
          .order("created_at", { ascending: true });
          
        if (error) throw error;
        return (data || []).map(r => ({
          questionId: r.question_id,
          answer: r.answer,
          responseTimeMs: r.response_time_ms
        })) as UserResponse[];
      } catch (e) {
        console.warn("Supabase responses fetch failed. Fetching locally.", e);
        return this.getLocalResponses(assessmentId);
      }
    } else {
      return this.getLocalResponses(assessmentId);
    }
  },

  getLocalResponses(assessmentId: string): UserResponse[] {
    if (typeof window === "undefined") return [];
    const list = JSON.parse(localStorage.getItem("pl_responses") || "[]") as any[];
    return list
      .filter(r => r.assessment_id === assessmentId)
      .map(r => ({
        questionId: r.question_id,
        answer: r.answer,
        responseTimeMs: r.response_time_ms
      })) as UserResponse[];
  },

  // 4. Reports: Save final Gemini report
  async saveReport(assessmentId: string, reportJson: any): Promise<ReportRecord> {
    const isLocal = assessmentId.startsWith("assessment-");

    if (supabase && !isLocal) {
      try {
        const { data, error } = await supabase
          .from("reports")
          .insert({
            assessment_id: assessmentId,
            report_json: reportJson
          })
          .select()
          .single();
          
        if (error) throw error;
        return data as ReportRecord;
      } catch (e) {
        console.warn("Supabase report save failed. Saving locally.", e);
        return this.saveLocalReport(assessmentId, reportJson);
      }
    } else {
      return this.saveLocalReport(assessmentId, reportJson);
    }
  },

  saveLocalReport(assessmentId: string, reportJson: any): ReportRecord {
    const reportId = "report-" + Math.random().toString(36).substr(2, 9);
    const newReport: ReportRecord = {
      id: reportId,
      assessment_id: assessmentId,
      report_json: reportJson,
      created_at: new Date().toISOString()
    };
    if (typeof window === "undefined") return newReport;
    const list = JSON.parse(localStorage.getItem("pl_reports") || "[]") as ReportRecord[];
    list.push(newReport);
    localStorage.setItem("pl_reports", JSON.stringify(list));
    return newReport;
  },

  // Reports: Get report by ID
  async getReport(reportId: string): Promise<ReportRecord | null> {
    const isLocal = reportId.startsWith("report-");

    if (supabase && !isLocal) {
      try {
        const { data, error } = await supabase
          .from("reports")
          .select("*")
          .eq("id", reportId)
          .single();
          
        if (error || !data) throw new Error("Report not found");
        return data as ReportRecord;
      } catch (e) {
        console.warn("Supabase report fetch failed. Fetching locally.", e);
        return this.getLocalReport(reportId);
      }
    } else {
      return this.getLocalReport(reportId);
    }
  },

  getLocalReport(reportId: string): ReportRecord | null {
    if (typeof window === "undefined") return null;
    const list = JSON.parse(localStorage.getItem("pl_reports") || "[]") as ReportRecord[];
    const report = list.find(r => r.id === reportId);
    return report || null;
  },

  // Reports: Get assessment history with reports
  async getUserHistory(userId: string): Promise<Array<{ assessment: AssessmentRecord; report: ReportRecord | null }>> {
    const isLocal = userId.startsWith("local-user-");

    if (supabase && !isLocal) {
      try {
        const { data: assessments, error } = await supabase
          .from("assessments")
          .select(`
            *,
            reports (*)
          `)
          .eq("user_id", userId)
          .order("started_at", { ascending: false });

        if (error || !assessments) throw new Error("Assessments not found");
        
        return assessments.map((a: any) => ({
          assessment: {
            id: a.id,
            user_id: a.user_id,
            started_at: a.started_at,
            completed_at: a.completed_at,
            confidence_score: a.confidence_score
          },
          report: a.reports && a.reports.length > 0 ? (a.reports[0] as ReportRecord) : null
        }));
      } catch (e) {
        console.warn("Supabase history fetch failed. Fetching locally.", e);
        return this.getLocalUserHistory(userId);
      }
    } else {
      return this.getLocalUserHistory(userId);
    }
  },

  getLocalUserHistory(userId: string): Array<{ assessment: AssessmentRecord; report: ReportRecord | null }> {
    if (typeof window === "undefined") return [];
    const assessmentsList = JSON.parse(localStorage.getItem("pl_assessments") || "[]") as AssessmentRecord[];
    const reportsList = JSON.parse(localStorage.getItem("pl_reports") || "[]") as ReportRecord[];
    
    const filtered = assessmentsList.filter(a => a.user_id === userId);
    // Sort descending
    filtered.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

    return filtered.map(a => {
      const report = reportsList.find(r => r.assessment_id === a.id) || null;
      return {
        assessment: a,
        report
      };
    });
  }
};
