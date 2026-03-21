# Google OAuth Info

## Current Flow Model (Implemented)

This project currently uses Google Sign-In ID token verification flow.

1. Frontend renders Google Sign-In button.
    Routes to google sign in  ex: 
2. User selects Google account in the popup.
3. Frontend receives Google ID credential (ID token).
4. Frontend sends ID token to backend endpoint: POST /api/auth/google.
5. Backend verifies ID token with GOOGLE_CLIENT_ID.
6. Backend finds existing user or creates a new Google provider user.
7. Backend issues app JWT.
8. Frontend stores JWT and routes to dashboard.


## Required Environment Variables

For current implementation:
- GOOGLE_CLIENT_ID

## Known Provider Rule

If an email already exists with provider=inkboard, Google login for that same email is blocked with a conflict response.

- Maybe later we can do an account linking type thing where user can sign in with both methods idk. 

