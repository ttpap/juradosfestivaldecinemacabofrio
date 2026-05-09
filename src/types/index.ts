export type UserRole = 'public' | 'judge' | 'admin'

export interface Festival {
  id: string
  name: string
  year: number
  logo_url: string | null
  voting_open: boolean
  min_votes_for_winner: number
  allow_jury_edit: boolean
  created_at: string
}

export interface Film {
  id: string
  festival_id: string | null
  title: string
  director: string
  category: string
  country: string | null
  city: string | null
  duration_minutes: number | null
  synopsis: string | null
  poster_url: string | null
  session_date: string | null
  session_location: string | null
  is_active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  name: string | null
  email: string | null
  role: UserRole
  created_at: string
}

export interface Judge {
  id: string
  user_id: string | null
  festival_id: string | null
  name: string
  email: string
  bio: string | null
  created_at: string
}

export interface AwardCategory {
  id: string
  festival_id: string | null
  name: string
  criteria_key: string | null
  is_active: boolean
  order_index: number
  created_at: string
}

export interface EvaluationCriteria {
  id: string
  festival_id: string | null
  name: string
  key: string
  max_score: number
  order_index: number
  is_active: boolean
  created_at: string
}

export interface PublicVote {
  id: string
  film_id: string
  voter_name: string
  voter_email: string
  rating: number
  comment: string | null
  created_at: string
}

export type ScoreMap = Record<string, number>

export interface TechnicalEvaluation {
  id: string
  film_id: string
  judge_id: string
  scores: ScoreMap
  comment: string | null
  is_submitted: boolean
  submitted_at: string | null
  updated_at: string
}

// Shaped for display
export interface FilmWithStats extends Film {
  vote_count?: number
  average_rating?: number
}

export interface JudgeWithEvals extends Judge {
  evaluations?: TechnicalEvaluation[]
  films_evaluated?: number
  total_films?: number
}

export interface FilmRankingRow {
  film: Film
  vote_count: number
  average_rating: number
}

export interface TechnicalRankingRow {
  film: Film
  averages: ScoreMap
  overall_average: number
  judge_count: number
}
