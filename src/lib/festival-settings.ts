// Reveal-results state lives in a marker row of the `films` table because
// we don't have DDL access to add a column on `festivals`. The marker has
// title='__SETTINGS_REVEAL__', active=false (hidden from voting lists),
// synopsis stores 'true' or 'false' as the reveal flag.
//
// All admin queries that list films must filter out rows with title starting
// with '__SETTINGS' so the marker never shows up in the UI.

import { createClient } from '@supabase/supabase-js'

export const SETTINGS_TITLE = '__SETTINGS_REVEAL__'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function getResultsRevealed(festivalId: string): Promise<boolean> {
  const admin = adminClient()
  const { data } = await admin
    .from('films')
    .select('synopsis')
    .eq('festival_id', festivalId)
    .eq('title', SETTINGS_TITLE)
    .maybeSingle()
  return data?.synopsis === 'true'
}

export async function setResultsRevealed(festivalId: string, revealed: boolean): Promise<{ error: Error | null }> {
  const admin = adminClient()
  const { error } = await admin
    .from('films')
    .update({ synopsis: revealed ? 'true' : 'false' })
    .eq('festival_id', festivalId)
    .eq('title', SETTINGS_TITLE)
  return { error: error ? new Error(error.message) : null }
}
