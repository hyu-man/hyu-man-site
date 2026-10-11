# ならす — 一曲の生成と編集

`public/daw/` is served by the existing Cloudflare assets configuration. The matching `daw/` copy is kept in sync. No build, server-side model, sample licence or account is required.

## Song model

Version 3 projects store the prompt-derived seed, selected style, minor key, tempo, progression, eight role presets, volumes/pans/mute/solo and four-bar activity cells. Text selects a deterministic seed; it is not interpreted by a language model. Ant/Collatz rule outputs affect pitch decisions.

The 80-bar form is intro 8 → verse 12 → pre 4 → chorus 16 → break 8 → verse 2 8 → pre 2 4 → last chorus 16 → outro 4. The 64/36-bar options preserve all nine sections. Default F minor: verse Fm–Db–Eb–Cm, pre Bbm–Cm–Db–Eb, chorus Db–Eb–Cm–Fm. The final chorus lifts the lead one octave when the lift control exceeds 35%, with continuously variable lead/arp/keys intensity.

Garage, broken electronica and downtempo use distinct kick rhythms, tempos and densities. Each four-bar region changes the arpeggiator pattern and phrase response; section activity, filter curves, beat pumping and selected transition gates provide additional movement. The arpeggiator starts with two held input pitches; exported MIDI contains the expanded notes. The recipe export lists chords and programmed kick positions in each region. Mute/solo and activity edits are applied to both live sound and exports.

## Sound and exports

Eight synthesized roles have separate colour filters and shared delay/reverb sends. Bass and sub occupy separate frequency regions. The master bus has a high-pass, glue compressor, EQ and safety compressor. Transition gates are scheduled only on selected final beats. This applies production lessons from SC/Audiotool; neither product nor its proprietary assets run in this page.

Real-time playback and offline rendering share `composition.js` and `audio.js`. WAV is stereo 44.1 kHz / 24-bit PCM with a three-second fade tail; a whole-file gain reduction is applied only if sample peaks exceed .97. It is not a LUFS or true-peak mastering system. MIDI type 1 has a conductor and eight role tracks, including channel-10 percussion and chord/section markers. Synth presets, effects, pan and audio automation are not embedded in MIDI.

Projects autosave to `hyuman-song-studio-v3`; JSON and hash links preserve the complete v3 settings. `v2/` preserves the previous engine and its storage key; old version-1/2 hash/JSON projects and the previous bpm/ant query links are routed there. `classic/` remains available.

## Verification

Run `node tests/daw-composition.mjs`, `node tests/daw-audio.mjs`, and `node tests/daw-studio.mjs`. Browser checks additionally cover playback/seek, offline rendering, export downloads, project restoration and responsive layout. Serve `public` with a local static HTTP server; ES modules require HTTP rather than opening the HTML as a file.
