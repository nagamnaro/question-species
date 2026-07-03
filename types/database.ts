export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Species =
  | "puzzle"
  | "opinion"
  | "prediction"
  | "estimation"
  | "brainstorm";

export type FriendshipStatus = "pending" | "accepted" | "blocked";

export type QuestionStatus = "pending" | "published" | "rejected";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          thinking_tags_json: Json | null;
          thinking_tags_updated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          thinking_tags_json?: Json | null;
          thinking_tags_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          thinking_tags_json?: Json | null;
          thinking_tags_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      questions: {
        Row: {
          id: string;
          text: string;
          species: Species;
          tags: string[];
          created_by: string | null;
          upvotes: number;
          difficulty: number | null;
          canonical_answer: string | null;
          status: QuestionStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          text: string;
          species: Species;
          tags?: string[];
          created_by?: string | null;
          upvotes?: number;
          difficulty?: number | null;
          canonical_answer?: string | null;
          status?: QuestionStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          text?: string;
          species?: Species;
          tags?: string[];
          created_by?: string | null;
          upvotes?: number;
          difficulty?: number | null;
          canonical_answer?: string | null;
          status?: QuestionStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      responses: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          answer_text: string;
          reasoning_text: string | null;
          prediction_value: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_id: string;
          answer_text: string;
          reasoning_text?: string | null;
          prediction_value?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question_id?: string;
          answer_text?: string;
          reasoning_text?: string | null;
          prediction_value?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "responses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "responses_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      friendships: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          status: FriendshipStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          status?: FriendshipStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          friend_id?: string;
          status?: FriendshipStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "friendships_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "friendships_friend_id_fkey";
            columns: ["friend_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      question_insights: {
        Row: {
          id: string;
          question_id: string;
          clusters_json: Json;
          summary_text: string | null;
          last_updated: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          clusters_json?: Json;
          summary_text?: string | null;
          last_updated?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          clusters_json?: Json;
          summary_text?: string | null;
          last_updated?: string;
        };
        Relationships: [
          {
            foreignKeyName: "question_insights_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: true;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      question_upvotes: {
        Row: {
          user_id: string;
          question_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          question_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          question_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "question_upvotes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "question_upvotes_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      response_reactions: {
        Row: {
          id: string;
          user_id: string;
          response_id: string;
          reaction: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          response_id: string;
          reaction: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          response_id?: string;
          reaction?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "response_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "response_reactions_response_id_fkey";
            columns: ["response_id"];
            isOneToOne: false;
            referencedRelation: "responses";
            referencedColumns: ["id"];
          },
        ];
      };
      response_reply_upvotes: {
        Row: {
          user_id: string;
          reply_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          reply_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          reply_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "response_reply_upvotes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "response_reply_upvotes_reply_id_fkey";
            columns: ["reply_id"];
            isOneToOne: false;
            referencedRelation: "response_replies";
            referencedColumns: ["id"];
          },
        ];
      };
      response_replies: {
        Row: {
          id: string;
          response_id: string;
          user_id: string;
          text: string;
          upvotes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          response_id: string;
          user_id: string;
          text: string;
          upvotes?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          response_id?: string;
          user_id?: string;
          text?: string;
          upvotes?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "response_replies_response_id_fkey";
            columns: ["response_id"];
            isOneToOne: false;
            referencedRelation: "responses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "response_replies_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      response_private_messages: {
        Row: {
          id: string;
          response_id: string;
          question_id: string;
          sender_id: string;
          recipient_id: string;
          body: string;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          response_id: string;
          question_id: string;
          sender_id: string;
          recipient_id: string;
          body: string;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          response_id?: string;
          question_id?: string;
          sender_id?: string;
          recipient_id?: string;
          body?: string;
          created_at?: string;
          read_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "response_private_messages_response_id_fkey";
            columns: ["response_id"];
            isOneToOne: false;
            referencedRelation: "responses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "response_private_messages_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "response_private_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "response_private_messages_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      ensure_current_user_profile: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      user_has_answered_question: {
        Args: { p_question_id: string };
        Returns: boolean;
      };
      get_user_response_count: {
        Args: { p_user_id: string };
        Returns: number;
      };
      get_feed_social_stats: {
        Args: { p_question_ids: string[]; p_friend_ids?: string[] };
        Returns: {
          question_id: string;
          response_count: number;
          friends_answered: number;
        }[];
      };
      get_user_thinking_stats: {
        Args: { p_user_id: string };
        Returns: {
          response_count: number;
          reasoning_count: number;
          species_counts: Json;
        }[];
      };
      toggle_question_upvote: {
        Args: { p_question_id: string };
        Returns: { upvoted: boolean; upvotes: number }[];
      };
      toggle_response_reply_upvote: {
        Args: { p_reply_id: string };
        Returns: { upvoted: boolean; upvotes: number }[];
      };
      upsert_question_insight: {
        Args: {
          p_question_id: string;
          p_clusters_json: Json;
          p_summary_text: string;
        };
        Returns: undefined;
      };
      get_shared_question_link: {
        Args: { p_user_a: string; p_user_b: string };
        Returns: { question_id: string; response_id: string }[];
      };
      get_response_reaction_counts: {
        Args: { p_response_ids: string[] };
        Returns: {
          response_id: string;
          agree_count: number;
          disagree_count: number;
        }[];
      };
    };
    Enums: {
      species: Species;
      friendship_status: FriendshipStatus;
      question_status: QuestionStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

// Convenience aliases
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type User = Tables<"users">;
export type Question = Tables<"questions">;
export type Response = Tables<"responses">;
export type Friendship = Tables<"friendships">;
export type QuestionInsight = Tables<"question_insights">;
export type QuestionUpvote = Tables<"question_upvotes">;
export type ResponseReaction = Tables<"response_reactions">;
export type ResponseReply = Tables<"response_replies">;
export type ResponsePrivateMessage = Tables<"response_private_messages">;

export type UserInsert = TablesInsert<"users">;
export type QuestionInsert = TablesInsert<"questions">;
export type ResponseInsert = TablesInsert<"responses">;
export type FriendshipInsert = TablesInsert<"friendships">;
export type QuestionInsightInsert = TablesInsert<"question_insights">;

export type UserUpdate = TablesUpdate<"users">;
export type QuestionUpdate = TablesUpdate<"questions">;
export type ResponseUpdate = TablesUpdate<"responses">;
export type FriendshipUpdate = TablesUpdate<"friendships">;
export type QuestionInsightUpdate = TablesUpdate<"question_insights">;
