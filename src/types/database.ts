export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          email: string | null
          avatar_url: string | null
          bio: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          user_id: string
          theme: string
          accent_color: string
          notifications_enabled: boolean
          focus_sound: boolean
          daily_goal_minutes: number
          weekly_goal_habits: number
          sleep_reminder_enabled: boolean
          sleep_reminder_time: string | null
          sleep_reminder_days: number[]
          sleep_reminder_sound: string
          sleep_last_triggered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string
          accent_color?: string
          notifications_enabled?: boolean
          focus_sound?: boolean
          daily_goal_minutes?: number
          weekly_goal_habits?: number
          sleep_reminder_enabled?: boolean
          sleep_reminder_time?: string | null
          sleep_reminder_days?: number[]
          sleep_reminder_sound?: string
          sleep_last_triggered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: string
          accent_color?: string
          notifications_enabled?: boolean
          focus_sound?: boolean
          daily_goal_minutes?: number
          weekly_goal_habits?: number
          sleep_reminder_enabled?: boolean
          sleep_reminder_time?: string | null
          sleep_reminder_days?: number[]
          sleep_reminder_sound?: string
          sleep_last_triggered_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      habits: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: string
          color: string
          icon: string
          frequency: string
          streak: number
          best_streak: number
          completed_dates: string[]
          is_active: boolean
          created_at: string
          updated_at: string
          // Reminder fields
          reminder_enabled: boolean
          reminder_time: string | null
          reminder_days: number[]
          reminder_sound: string
          last_triggered_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category?: string
          color?: string
          icon?: string
          frequency?: string
          streak?: number
          best_streak?: number
          completed_dates?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
          // Reminder fields
          reminder_enabled?: boolean
          reminder_time?: string | null
          reminder_days?: number[]
          reminder_sound?: string
          last_triggered_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: string
          color?: string
          icon?: string
          frequency?: string
          streak?: number
          best_streak?: number
          completed_dates?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
          // Reminder fields
          reminder_enabled?: boolean
          reminder_time?: string | null
          reminder_days?: number[]
          reminder_sound?: string
          last_triggered_at?: string | null
        }
      }
      notes: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string | null
          tags: string[]
          is_pinned: boolean
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content?: string | null
          tags?: string[]
          is_pinned?: boolean
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string | null
          tags?: string[]
          is_pinned?: boolean
          color?: string
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          deadline: string | null
          status: string
          priority: string
          progress: number
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          deadline?: string | null
          status?: string
          priority?: string
          progress?: number
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          deadline?: string | null
          status?: string
          priority?: string
          progress?: number
          color?: string
          created_at?: string
          updated_at?: string
        }
      }
      project_tasks: {
        Row: {
          id: string
          user_id: string
          project_id: string
          title: string
          description: string | null
          is_done: boolean
          due_date: string | null
          position: number
          created_at: string
          updated_at: string
          reminder_enabled: boolean
          reminder_time: string | null
          reminder_days: number[]
          reminder_sound: string
          last_triggered_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          title: string
          description?: string | null
          is_done?: boolean
          due_date?: string | null
          position?: number
          created_at?: string
          updated_at?: string
          reminder_enabled?: boolean
          reminder_time?: string | null
          reminder_days?: number[]
          reminder_sound?: string
          last_triggered_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          title?: string
          description?: string | null
          is_done?: boolean
          due_date?: string | null
          position?: number
          created_at?: string
          updated_at?: string
          reminder_enabled?: boolean
          reminder_time?: string | null
          reminder_days?: number[]
          reminder_sound?: string
          last_triggered_at?: string | null
        }
      }
      focus_sessions: {
        Row: {
          id: string
          user_id: string
          duration_minutes: number
          completed_minutes: number
          session_type: string
          status: string
          started_at: string
          ended_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          duration_minutes: number
          completed_minutes?: number
          session_type?: string
          status?: string
          started_at?: string
          ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          duration_minutes?: number
          completed_minutes?: number
          session_type?: string
          status?: string
          started_at?: string
          ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      analytics: {
        Row: {
          id: string
          user_id: string
          date: string
          habits_completed: number
          focus_minutes: number
          tasks_completed: number
          productivity_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date?: string
          habits_completed?: number
          focus_minutes?: number
          tasks_completed?: number
          productivity_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          habits_completed?: number
          focus_minutes?: number
          tasks_completed?: number
          productivity_score?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
