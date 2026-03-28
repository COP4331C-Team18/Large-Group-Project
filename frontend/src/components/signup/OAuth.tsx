// Declare the google object for TypeScript
declare const google: any;


import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// const app_name = 'inkboard.xyz';

function buildPath(route:string) : string
{
  if (import.meta.env.MODE != 'development')
  {
    // Production: Point to the secure domain, NO port 5000!
    return '/' + route; 
  }
  else
  {
    // Local Development remains unchanged
    return 'http://localhost:5000/' + route;
  }
}


export default function OAuth() {
    const navigate = useNavigate();

    const handleGoogleResponse = async (response: any) => {
        const idToken = response.credential;
        try {
            const res = await fetch(buildPath("api/auth/google"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
                credentials: 'include' // Send cookies for authentication
            });
            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Google login failed");
                return;
            }

            // Cookie is set by backend, just navigate
            navigate("/dashboard");
        } catch (err) {
            alert("Google login failed. Please try again.");
        }
    };

    useEffect(() => {
        // Google script is already loaded in index.html
        if (typeof google !== "undefined" && google.accounts && google.accounts.id) {
            google.accounts.id.initialize({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                callback: handleGoogleResponse
            });
            google.accounts.id.renderButton(
                document.getElementById("googleOAuthDiv"),
                { theme: "outline", size: "large", width: "100%" }
            );
        }
    }, []);

    return <div id="googleOAuthDiv"></div>;
}
