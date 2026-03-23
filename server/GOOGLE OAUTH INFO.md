# Google OAuth Info

## Current Flow Model (Implemented)

This project currently uses Google Sign-In ID token verification flow.

NOTE frontend must load GIS script:
```
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

1. Frontend renders Google Sign-In button.
    - using google.accounts.id.renderButton after loading the script
    
2. User selects Google account in the popup.
    - this is handled by google identity services
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

## Google Sign-In Frontend Integration Example

Add the following to your HTML file:

1. **Google Identity Services script:**
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

2. **Button container:**
```html
<div id="buttonDiv"></div>
```

3. **JavaScript initialization:**
```html
<script>
  window.onload = function () {
    google.accounts.id.initialize({
      client_id: "YOUR_GOOGLE_CLIENT_ID",
      callback: handleCredentialResponse
    });

    google.accounts.id.renderButton(
      document.getElementById("buttonDiv"),
      { theme: "outline", size: "large" }
    );

    google.accounts.id.prompt();
  };

  function handleCredentialResponse(response) {
    // Handle the credential response here
    console.log(response);
    // Send the ID token to your backend
    fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: response.credential })
    })
    .then(res => res.json())
    .then(data => {
      // Handle backend response (e.g., store JWT, redirect, etc.)
      console.log(data);
    })
    .catch(err => {
      console.error('Google login failed:', err);
    });
  }
</script>
```

---

## Example: Sending Google ID Token to Backend

After Google One Tap or button sign-in, you need to send the credential (ID token) to your backend for verification. Here’s how to do it:

```html
<script>
  function handleCredentialResponse(response) {
    // Send the ID token to your backend
    fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: response.credential })
    })
    .then(res => res.json())
    .then(data => {
      // Handle backend response (e.g., store JWT, redirect, etc.)
      console.log(data);
    })
    .catch(err => {
      console.error('Google login failed:', err);
    });
  }
</script>
```

