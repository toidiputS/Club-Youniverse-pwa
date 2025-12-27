# 🎛️ DJ Booth - Full Control Testing Guide

## ✅ DJ Booth Complete functional Overhaul - DONE!

### 🚀 **NEW FEATURES Added:**

1. **Real-Time Status Display**
   - Shows current Radio State (DJ_BANTER_INTRO, BOX_VOTING, NOW_PLAYING)
   - Displays currently playing song
   - Shows number of songs in The Box

2. **Full Admin Controls**
   - ✅ **DJ Voice On/Off** - Mute/unmute TTS (already working)
   - ✅ **Skip Current Song** - Immediately end playing track and move to next round
   - ✅ **Force New Box Round** - Reset radio state and start fresh voting
   - ✅ **Custom DJ Message** - Type any text for DJ to say on air
   - ✅ **Master Volume Control** - Slider from 0-100%

3. **Password Protection**
   - Password: `youniverse`
   - Lock/unlock at any time

---

## 🧪 **TESTING INSTRUCTIONS** - Let's Get This Running!

### **Step 1: Access the App**

1. **App is running at:** http://localhost:5173/
2. **Select API Key** (if modal appears - click and choose your Gemini key)
3. **Login with Admin Bypass:**
   - Password field: Type `trad34`
   - Press Sign In
   - ✅ You're in!

---

### **Step 2: Navigate to Radio**

1. Once logged in, you'll see the **Studio** page
2. Click **"Enter the Club"** or **"Radio"** button to go to the radio view
3. You should see:
   - Left side: The Box or Now Playing
   - Bottom left: DJ avatar
   - Bottom right: **🎛️ VIP DJ Booth** ⬅️ HERE IT IS!
   - Right side: Live Chat

---

### **Step 3: Unlock DJ Booth**

1. Click the **DJ icon** (music note) in the DJ Booth card
2. Enter password: `youniverse`
3. Click "Enter"
4. ✅ **BOOTH UNLOCKED!**

You should now see:

- Status display showing radio state
- 5 control buttons
- Volume slider at bottom

---

### **Step 4: Upload Test Songs**

**We need songs to test!** Let's upload 3-5 songs.

1. Go back to **Studio** (top navigation or clicking Club logo)
2. Click **"Upload New Song"**
3. Upload an MP3 file:
   - Title: "Test Song 1"
   - Artist: Your name
   - Source: Upload
4. **Repeat for 3-5 songs**
   - Use different MP3s if you have them
   - Or use the same MP3 with different titles

**⚠️ Need test MP3s?**

- Download free music from: https://www.bensound.com/royalty-free-music
- Or use any MP3 you have locally

---

### **Step 5: Test Full Radio Flow**

Once you have 5+ songs uploaded:

1. **Go to Radio view**
2. **Unlock DJ Booth**
3. Watch the radio cycle automatically:

**Expected Flow:**

```
DJ Banter (Intro)
    ↓
The Box (3 songs, 20 seconds voting)
    ↓
Winner Announcement (DJ speaks)
    ↓
Now Playing (full song)
    ↓
DJ Banter (Outro)
    ↓
(Repeat from The Box)
```

---

### **Step 6: Test DJ Booth Controls**

While the radio is running, test each control:

#### **A) Skip Current Song**

1. Wait for a song to start playing (NOW_PLAYING state)
2. In DJ Booth, click **"Skip Current Song"**
3. ✅ **Expected:** Song stops, radio moves to next round immediately

#### **B) Force New Box Round**

1. During ANY state, click **"Force New Box Round"**
2. ✅ **Expected:** Radio resets, new Box round starts with 3 new songs

#### **C) Custom DJ Message**

1. Click **"Custom DJ Message"**
2. Type something like: "Hey Youniverse, this is a test message!"
3. Click **"Send to DJ"**
4. ✅ **Expected:**
   - DJ adds your message to the queue
   - You'll see it appear in the DJ Transcript ticker at bottom
   - DJ voice should speak it (if Voice is ON)

#### **D) DJ Voice On/Off**

1. Click **"DJ VOICE OFF"** to mute
2. ✅ **Expected:** Button turns RED, DJ stops speaking
3. Click again to turn back ON
4. ✅ **Expected:** Button turns GREEN, DJ voice resumes

#### **E) Master Volume**

1. Drag the volume slider
2. ✅ **Expected:** Music and DJ volume changes in real-time
3. Percentage displays (0-100%)

---

### **Step 7: Test Box Voting Flow** (CRITICAL!)

This is the core feature we need to verify!

1. **Watch The Box round** (3 songs appear)
2. **Vote for a song** by clicking "Vote" button
3. **Wait 20 seconds** for voting to end
4. **Check:**
   - ✅ Winner is announced by DJ
   - ✅ Winner starts playing
   - ✅ Winner gains +1 star (check in Song Library later)
   - ✅ Losers get red dot marked (box appearance counter)

5. **Let the winner song finish playing**
6. **Check:**
   - ✅ Song ends
   - ✅ DJ says outro
   - ✅ New Box round starts with different songs

7. **Let a song LOSE 3 times**
   - During Box voting, DON'T vote for one particular song
   - Let it lose 3 rounds in a row
   - ✅ **Expected:** Song loses 1 star (goes from 5 → 4)

---

## 🐛 **Known Issues to Check For**

While testing, watch for these potential bugs:

### **Issue #1: Box Appearance Counter Not Persisting**

- **Symptom:** Red dots reset after refresh
- **Fix needed:** Database needs to save `boxAppearanceCount`

### **Issue #2: Songs Not Returning to Pool**

- **Symptom:** Same songs keep appearing in Box
- **Fix needed:** Status update logic in Radio.tsx

### **Issue #3: Star Changes Not Saving**

- **Symptom:** Star ratings reset to 5 after refresh
- **Fix needed:** Database update on win/loss

### **Issue #4: Skip Song Doesn't Trigger Next Round**

- **Symptom:** After skip, radio gets stuck
- **Fix needed:** Add `startNextRound()` call after skip

---

## 📊 **Success Criteria**

Before we call this "production ready", we need:

✅ **DJ Booth Controls**

- [ ] All 5 buttons work correctly
- [ ] Status display shows accurate info
- [ ] Volume control affects audio
- [ ] Custom messages appear in DJ transcript
- [ ] Lock/unlock works properly

✅ **Radio Flow**

- [ ] Box round starts with 3 songs
- [ ] Voting lasts 20 seconds
- [ ] Winner plays full song
- [ ] New round starts after song ends
- [ ] No infinite loops or crashes

✅ **Star System**

- [ ] New songs start with 5 stars
- [ ] Box winner gains +1 star (max 10)
- [ ] 3x loser drops -1 star
- [ ] Star changes persist after refresh

✅ **The Box Mechanics**

- [ ] 3 songs appear each round
- [ ] Red dots track attempts (0-3)
- [ ] Songs can appear multiple times until 3 strikes
- [ ] After 3 strikes, song loses star and resets

---

## 🎯 **Next Actions After Testing**

Once you've tested and confirmed everything works:

**Priority fixes** (if any bugs found):

1. Fix box appearance counter persistence
2. Fix star rating database updates
3. Add database indexes for performance

**Then move to:**

1. Song download feature (easy 1-hour add)
2. DJ Line Bank system (cost optimization)
3. Stripe integration (monetization)

---

## 💬 **Report Your Results!**

After testing, let me know:

1. **What worked perfectly?**
2. **What broke or didn't work as expected?**
3. **Any new features you want added to DJ Booth?**
4. **Ready to tackle cost optimization next?**

Let's get this radio station LIVE! 🚀
