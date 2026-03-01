import os
import time
import requests
import uuid
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") # Better to use service role since it's a backend bot
VOICEBOX_URL = "http://127.0.0.1:17493" # Local Voicebox API

if not SUPABASE_URL or not SUPABASE_KEY:
    print("🚨 ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ID of the AI DJ user (to attach to uploaded tracks)
# In production, you might want a dedicated row in the `profiles` table for "DJ Python"
BOT_USER_ID = "dj-python-bot" 

def generate_voicebox_audio(text: str) -> bytes:
    """
    Hits the local Voicebox TTS endpoint and returns the raw WAV/MP3 bytes.
    You will need to adjust the exact route/payload based on your Voicebox API schema.
    """
    print(f"🎙️ Generating Audio for: '{text}'")
    try:
        # Example Payload (adjust to match your Voicebox API)
        response = requests.get(
            f"{VOICEBOX_URL}/api/tts", 
            params={"text": text, "voice": "dj_voice", "format": "mp3"}
        )
        response.raise_for_status()
        return response.content
    except Exception as e:
        print(f"❌ Voicebox generation failed: {e}")
        return None

def upload_to_supabase(audio_bytes: bytes, filename: str) -> str:
    """Uploads the generated audio to Supabase Storage and returns the public URL."""
    storage_path = f"ai_dj/{filename}"
    try:
        supabase.storage.from_("songs").upload(
            file=audio_bytes,
            path=storage_path,
            file_options={"content-type": "audio/mpeg", "upsert": "true"}
        )
        # Get public URL
        public_url = supabase.storage.from_("songs").get_public_url(storage_path)
        return public_url
    except Exception as e:
        print(f"❌ Storage Upload failed: {e}")
        return None

def inject_announcement(public_url: str, title: str):
    """Inserts the AI DJ's audio clip into the songs table and forces it to play next."""
    print("🎧 Injecting Announcement to The Dance Floor...")
    try:
        response = supabase.table("songs").insert({
            "uploader_id": BOT_USER_ID,
            "title": title,
            "artist_name": "DJ Python",
            "source": "ai_announcement",
            "audio_url": public_url,
            "duration_sec": 15, # Hardcoded or calculated length
            "status": "next_play", # Force it to be the next song in the queue
            "cover_art_url": "https://i.pravatar.cc/150?u=djpython",
            "is_canvas": False
        }).execute()
        print("✅ Announcement successfully queued for broadcast!")
    except Exception as e:
        print(f"❌ Database Insertion failed: {e}")

def check_for_dead_songs():
    """Polls Supabase for any newly tagged Dead Songs that haven't been announced."""
    try:
        # Query for songs that are marked as DSW but haven't been announced yet
        # NOTE: Requires adding 'dsw_announced' boolean to the database!
        response = supabase.table("songs") \
            .select("*") \
            .eq("is_dsw", True) \
            .eq("dsw_announced", False) \
            .execute()
        
        songs = response.data
        if not songs:
            return

        for song in songs:
            print(f"⚠️ Detected unannounced Dead Song Walking: {song['title']} by {song['artist_name']}")
            
            # --- 1. Agent Zero LLM Hook (Placeholder) ---
            # Here is where you would hook in Agent Zero's LLM via API or local function to write the script
            # Example: script = agent_zero.generate_prompt(f"Roast this song: {song['title']}")
            script = f"Attention Club Youniverse. The track {song['title']} by {song['artist_name']} just bombed the dance floor and hit zero stars. It is officially a Dead Song Walking. Next time you hear it, it's the Farewell Play. Rest in peace."
            
            # --- 2. TTS Generation ---
            audio_bytes = generate_voicebox_audio(script)
            if not audio_bytes:
                continue
            
            # --- 3. Upload & Queue Broadcast ---
            filename = f"dsw_alert_{uuid.uuid4().hex[:8]}.mp3"
            public_url = upload_to_supabase(audio_bytes, filename)
            
            if public_url:
                inject_announcement(public_url, f"🚨 DSW Alert: {song['title']}")
                
                # Mark as announced so we don't spam the club
                supabase.table("songs") \
                    .update({"dsw_announced": True}) \
                    .eq("id", song["id"]) \
                    .execute()

    except Exception as e:
        print(f"❌ Error polling Supabase: {e}")

def main():
    print("🐍 DJ Python initialized. Listening to the club...")
    while True:
        check_for_dead_songs()
        time.sleep(10) # Poll every 10 seconds

if __name__ == "__main__":
    main()
