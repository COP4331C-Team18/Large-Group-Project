// Declare the google object for TypeScript
declare const google: any;
import { useEffect } from "react";
import {useAuth} from '@/contexts/AuthContext';
import { authService } from '@/api/services/authService';

// const app_name = 'inkboard.xyz';

export default function OAuth() {
    const { login } = useAuth();

    const handleGoogleResponse = async (response: any) => {
        const idToken = response.credential;
        try {
            const data = await authService.googleLogin(idToken);

            login(data.user); // update context with logged in user
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
