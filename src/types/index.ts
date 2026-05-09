export type UserRole = 'public' | 'admin'

export interface Festival {
  id: string
  name: string
  year: number
  voting_open: boolean
  created_at: string
}

export interface Film {
  id: string
  festival_id: string
  title: string
  director: string
  synopsis: string | null
  category: string | null
  thumbnail_url: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface PublicVote {
  id: string
  festival_id: string
  film_id: string
  voter_name: string
  voter_email: string
  created_at: string
}

export interface VoteCount {
  film_id: string
  film_title: string
  director: string
  category: string | null
  votes: number
}
