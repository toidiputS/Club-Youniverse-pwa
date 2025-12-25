# 🎵 Club Youniverse - Launch Checklist & Roadmap

## 📋 Current Status Analysis

### ✅ **COMPLETED** Features
- [x] User authentication (Supabase)
- [x] Song upload system (with file storage)
- [x] Basic radio player infrastructure
- [x] DJ personality system (rotating hourly)
- [x] TTS integration (Gemini 2.5 Flash TTS)
- [x] Audio visualizer
- [x] Live chat system
- [x] Song library management
- [x] Star rating system (1-10)
- [x] Album cover generator (AI)
- [x] Music video generator (AI)
- [x] Gallery for user creations
- [x] Leaderboard
- [x] Graveyard for zero-star songs
- [x] VIP DJ Booth (password protected)
- [x] Premium user tracking
- [x] New artist debut system with priority queue
- [x] 24-hour second chance rule

### 🚧 **IN PROGRESS** / Needs Completion
- [ ] **The Box voting system** - UI exists but needs full 3-song vote flow
- [ ] **DJ Booth controls** - Interface exists but needs full functionality
- [ ] **Song download feature** - Not yet implemented
- [ ] **Phone number validation** - Needed for zero-star roast calls
- [ ] **Actual TTS/call integration** for zero-star events

### ❌ **NOT STARTED**
- [ ] Payment/subscription system (VIP $10/mo)
- [ ] User account linking to Producer.ai/Suno
- [ ] Admin moderation tools (timeout, ban, silencing)
- [ ] DJ volume controls
- [ ] Club theme customization
- [ ] Proper song rotation algorithm (weighted by stars)
- [ ] First-to-box premium feature
- [ ] "I know the DJ" promos
- [ ] Affiliate integrations
- [ ] Album creation feature
- [ ] Lyrics foldout in album covers

---

## 🎯 PRIORITY 1: Core Radio Experience (Make it Usable NOW)

### **Issue #1: Complete The Box Voting Flow**
**Current State:** TheBox component displays 3 songs, allows voting, but the full cycle hasn't been tested.

**Action Items:**
1. ✅ Verify vote tallying works correctly
2. ✅ Test 3-round elimination (songs that lose 3x drop a star)
3. ✅ Ensure winner plays after voting ends
4. ✅ Test the "box appearance counter" (3 red dots)
5. ✅ (**FIXED**) Verify `boxAppearanceCount` persists to database
6. ✅ (**FIXED**) Songs might not be rotating back to pool correctly

**Test Case:**
1. Upload 5+ songs
2. Let radio run through 3 complete box rounds
3. Verify a song that loses 3x drops from 5 stars to 4 stars
4. Verify winner gains +1 star

---

### **Issue #2: Song Download Feature**
**Current State:** Not implemented.

**Action Items:**
1. Add download button to `NowPlaying` component
2. Add download button to `SongLibrary` for user's own songs
3. Create `downloadSong(song: Song)` function that:
   - Fetches audio from `song.audioUrl`
   - Triggers browser download with proper filename
4. Track download count in database (optional analytics)

**Estimated Time:** 1-2 hours

---

### **Issue #3: Fix DJ Booth Controls**
**Current State:** Booth unlocks with password "youniverse" but controls are placeholders.

**Action Items:**
1. **Voice On/Off** - ✅ Already implemented (`isTtsUserMuted`)
2. **Pop-out Control 1** → Make this "Skip Current Song"
3. **Pop-out Control 2** → Make this "Force New Box Round"
4. Add "Manual DJ Message" input (admin can type text → DJ says it)
5. Add volume slider for DJ voice (separate from music)
6. Add master volume control

**Estimated Time:** 2-3 hours

---

## 💰 PRIORITY 2: Cost Optimization (LLM Usage)

### **Problem:** 
Running Gemini TTS every 3-8 minutes 24/7 = **EXPENSIVE** 💸

### **Solutions (Choose Multiple):**

#### **Option A: Hybrid AI + Pre-recorded System** ⭐ RECOMMENDED
**Cost Savings: ~80%**

1. **Create a "DJ Line Bank"** - Pre-generate 500+ DJ one-liners
   - Run Gemini once to generate a massive list
   - Store in JSON file or database
   - Categorize by event type (intro, outro, filler, etc.)
   - Randomly select from bank instead of generating live

2. **Only Use AI for Special Events:**
   - Box winner announcements (personalized with song title)
   - New artist shoutouts
   - Zero-star roasts
   - User mentions (@clubdj messages)
   - Everything else = pre-recorded bank

**Implementation:**
```typescript
// services/djLineBank.ts
const DJ_LINES = {
  intro: [
    "Alright Youniverse, let's keep this party cosmic!",
    "Time to shake the stars with some fresh beats!",
    // ... 100 more
  ],
  outro: [
    "That track was out of this world!",
    "Another banger for the books!",
    // ... 100 more
  ],
  filler: [
    "You're listening to Club Youniverse, where YOU are the star!",
    "Don't forget, VIP members get priority placement!",
    // ... 200 more
  ]
};

export const getRandomLine = (category: string) => {
  const lines = DJ_LINES[category] || DJ_LINES.filler;
  return lines[Math.floor(Math.random() * lines.length)];
};
```

**Cost Breakdown:**
- Pre-generation: $2-5 one-time
- Live personalized events: ~$0.50/day (assuming 50 personalized lines/day)
- **Monthly Cost: ~$15-20 vs. $200+**

---

#### **Option B: Self-Hosted TTS** (Free but Lower Quality)
**Cost Savings: ~95%**

Use **Piper TTS** or **Coqui TTS** (open-source, runs locally)

**Pros:**
- Completely free
- No API limits
- Runs on your server

**Cons:**
- Voice quality is lower than Gemini
- Requires server setup
- More technical complexity

**Implementation:**
- Set up Piper TTS on a cheap VPS ($5/mo DigitalOcean droplet)
- Create API endpoint: `/api/tts?text=...&voice=...`
- Swap Gemini TTS calls with your endpoint

---

#### **Option C: Reduce Frequency + Smart Scheduling**
**Cost Savings: ~60%**

1. **Longer gaps between DJ chatter**
   - Current: Every 3-8 min
   - New: Every 10-15 min during "quiet hours" (2am-8am)
   - Peak hours (6pm-midnight): Every 5 min

2. **DJ Goes to Sleep**
   - Midnight-8am: Pre-recorded only
   - "The DJ is taking a cosmic nap, but the music never stops!"

3. **Weekly Generation Batch**
   - Every Sunday, generate 100 DJ lines for the week
   - Use them throughout the week
   - Reduces API calls by 70%

---

#### **Option D: Tiered AI Quality**
**Cost Savings: ~40%**

Use different models based on importance:
- **Critical events** (new artist, zero-star roast): `gemini-2.5-flash-tts` (high quality)
- **Regular banter**: Cheaper alternative or pre-recorded
- **Filler**: Always pre-recorded

---

### **RECOMMENDED APPROACH:** Combine A + C

1. Build the DJ Line Bank (500+ lines)
2. Use AI only for personalized events
3. Reduce frequency during off-peak hours
4. **Result: ~$20-30/month vs. $200+**

---

## 🎯 PRIORITY 3: Monetization Readiness

### **VIP System ($10/mo)**
**Current State:** `is_premium` flag exists in database but no payment flow.

**Action Items:**
1. Integrate **Stripe** for subscriptions
2. Create `/api/create-subscription` endpoint
3. Add "Upgrade to VIP" button in multiple places:
   - Login screen
   - Upload screen (after free upload limit)
   - Radio (before entering to vote/chat)
4. Implement free user limits:
   - Free: Can listen only (no uploads, votes, chat)
   - VIP: Full access

**Features to Gate:**
- ✅ Song uploads
- ✅ Box voting
- ✅ Live chat
- ✅ DJ mentions
- ⏰ First-to-box (premium feature - not implemented yet)

**Estimated Time:** 4-6 hours

---

## 🐛 CRITICAL BUGS TO FIX

### **Bug #1: Box Voting State Management**
**Symptom:** Songs might not properly return to pool after box rounds.

**Fix:**
- ✅ **COMPLETED**: Added database persistence for `boxAppearanceCount`, `boxRoundsLost`
- ✅ **COMPLETED**: Updated `Radio.tsx` to handle persistence directly
- ✅ **COMPLETED**: Verified `supabaseSongService.ts` handles the updates

---

### **Bug #4: Real-Time Synchronization (Split Reality)**
**Symptom:** Users hear different "next songs" because client-side logic drifts.

**Fix:**
- [ ] Implement Supabase Real-Time subscriptions in `App.tsx`
- [ ] Push "Now Playing" updates to all connected clients
- [ ] Ensure all listeners sync to the database state on song change

---

### **Bug #2: Zero-Star Roast System**
**Current State:** Logic exists but no actual phone call/SMS integration.

**Temporary Solution (Launch):**
- Just play the roast message in the radio
- Display popup to user in the app
- Email the user instead of calling

**Future Solution:**
- Integrate **Twilio** for actual calls/SMS
- Cost: ~$0.02/minute for calls, $0.01/SMS

---

### **Bug #3: Song Duration Detection**
**Issue:** App requires manual duration input during upload.

**Fix:**
- Add auto-detection using Web Audio API:
```typescript
const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
    });
    audio.src = URL.createObjectURL(file);
  });
};
```

---

## 📅 LAUNCH TIMELINE

### **Week 1: MVP (Minimum Viable Product)**
**Goal: Get it running well enough to share**

**Day 1-2:**
- [ ] Fix Box voting persistence bugs
- [ ] Add song download button
- [ ] Complete DJ Booth controls

**Day 3-4:**
- [ ] Build DJ Line Bank (500+ lines)
- [ ] Implement hybrid AI system (Option A)
- [ ] Test full radio cycle (24-hour test run)

**Day 5:**
- [ ] Add phone number field to user profiles
- [ ] Implement email version of zero-star roast
- [ ] Test new artist debut flow

**Day 6-7:**
- [ ] Polish UI/UX issues
- [ ] Add loading states everywhere
- [ ] Write user onboarding guide
- [ ] **SOFT LAUNCH** to 10-20 friends

---

### **Week 2: Monetization & Scaling**
**Goal: Add payments and prepare for growth**

**Day 8-10:**
- [ ] Integrate Stripe subscriptions
- [ ] Implement free vs. VIP gates
- [ ] Create pricing page

**Day 11-12:**
- [ ] Set up analytics (track plays, votes, uploads)
- [ ] Add moderation tools (DJ Booth admin panel)
- [ ] Implement ban/timeout system

**Day 13-14:**
- [ ] Performance optimization
- [ ] SEO and marketing site
- [ ] **PUBLIC LAUNCH** 🚀

---

## 💡 QUICK WINS (Do These First)

1. **Add "How It Works" Tutorial** (2 hours)
   - Modal on first visit explaining The Box
   - Show star system rules
   - Explain VIP benefits

2. **Song Limits Display** (1 hour)
   - Show "3 songs in The Box" counter
   - Display "Songs uploaded this month: 2/10"

3. **Better Error Messages** (1 hour)
   - If TTS fails: Show friendly message
   - If upload fails: Clear instructions
   - If vote fails: Explain why (not VIP, etc.)

4. **Add Meta Tags for Sharing** (30 min)
   - Open Graph tags for social media
   - When someone shares clubyouniverse.live, it looks good!

---

## 🔧 Technical Debt to Address

1. **Database Indexes**
   - Add indexes on `songs.stars`, `songs.status`
   - Add index on `profiles.is_premium`

2. **Caching**
   - Cache song pool in Redis for faster queries
   - Cache DJ line bank in memory

3. **Real-time Updates**
   - Use Supabase real-time subscriptions for vote counts
   - Show live vote tallies to all users

4. **Backup & Disaster Recovery**
   - Set up automated Supabase backups
   - Have a rollback plan

---

## 📊 Success Metrics to Track

**Week 1 Goals:**
- [ ] 50 songs uploaded
- [ ] 20 active VIP users
- [ ] 100+ total users
- [ ] 24/7 radio uptime (>95%)

**Month 1 Goals:**
- [ ] 500 songs in library
- [ ] 100 VIP subscribers ($1,000 MRR)
- [ ] 1,000+ total users
- [ ] 10,000+ song plays

---

## 🚨 LAUNCH BLOCKERS (Must Fix Before Public Launch)

1. ⚠️ **The Box voting must work flawlessly** - This is your core feature!
2. ⚠️ **LLM costs must be under control** - Or you'll bleed money fast
3. ⚠️ **Payment system must be secure** - Use Stripe, don't roll your own
4. ⚠️ **User data must be protected** - GDPR compliance, privacy policy

---

## 💬 Discussion Points

### **Question 1: DJ Line Generation**
Do you want me to:
- A) Generate 500 DJ lines right now using Gemini?
- B) Show you how to build the hybrid system first?
- C) Both?

### **Question 2: Self-Hosted TTS**
Are you open to:
- Running your own TTS server (Piper/Coqui)?
- OR stick with Gemini but use the line bank approach?

### **Question 3: Minimum Stars for Box Entry**
Should songs need a minimum star rating to enter The Box?
- Example: Songs with <2 stars can't enter The Box anymore
- This prevents graveyard songs from clogging the system

---

## 🎬 NEXT STEPS

**Tell me what you want to tackle first:**

1. **Fix The Box voting** and test the full flow?
2. **Build the cost-saving DJ system** (line bank + hybrid)?
3. **Add song downloads** and complete DJ Booth?
4. **Set up Stripe** and monetization?
5. **Something else?**

I'm ready to dive in and make Club Youniverse launch-ready! 🚀
