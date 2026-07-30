# OTP via abstraction with demo modes, not a live SMS provider

Login and Kesepakatan Kerja confirmation use phone OTP, but a live SMS provider (Twilio Verify or similar) costs money, needs days of approval, and can fail on stage. We decided all OTP goes through one server module with three modes: `DEMO_MODE=true` shows a fixed code on screen, Supabase Auth test phone numbers cover the demo personas, and the production path (Twilio Verify) is documented but not wired. The jury answer for scale is the documented production path; the demo never depends on a network SMS.
