# The Box - Simplified Voting Mechanics

## Flow Overview
1. **First song uploaded** → Auto-plays immediately (no voting)
2. **Songs 2-4 uploaded** → Triggers The Box with 3 candidates
3. **Voting window** → 20 seconds
4. **Winner** → Gains +1 star, plays next
5. **Losers (2 songs)** → Each loses -1 star, returns to pool
6. **Next round** → Fresh 3 from pool

## Star System
- **Starting value**: All songs start at 5 stars (out of 10)
- **Win**: +1 star (max 10)
- **Lose**: -1 star (min 0)
- **Graveyard**: Songs that hit 0 stars

## Voting Rules
- **One vote per listener** (enforced client-side)
- **Simulated votes**: Robot listeners cast votes every 800ms
- **User vote weight**: 10 points (vs. ~1-5 for simulated votes)

## Song States
- `pool`: Available for The Box
- `in_box`: Currently in a voting round
- `now_playing`: Winner is playing
- `debut`: First-time artist song (different flow)
- `graveyard`: 0 stars (RIP)

## 10-Second Sample Feature
- Click play button on any Box candidate
- Plays 10-second preview from the start of the song
- **Main audio automatically mutes** during the preview
- **Main audio unmutes** when preview ends
- This lets voters hear what they're choosing!

## Database Persistence
All star changes are immediately written to Supabase:
- Winner: `updateSong(id, { stars: +1, playCount: +1, status: 'now_playing' })`
- Losers: `updateSong(id, { stars: -1, status: 'pool' })`

This ensures stats persist across page refreshes and are tracked for the leaderboard.
