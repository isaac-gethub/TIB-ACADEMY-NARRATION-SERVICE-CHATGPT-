# TIB Academy Narration Service

Initial protected ElevenLabs narration pilot. Vercel server environment variables required:

- ELEVENLABS_API_KEY (existing; do not commit)
- TIB_NARRATION_ADMIN_CODE (create a strong random secret in Vercel)

Deploy automatically from GitHub main. Test /api/health, then generate a short sample using the administrator code and a voice ID. The application does not yet perform bulk narration or store generated audio persistently. Never share administrator codes in GitHub or chat.
