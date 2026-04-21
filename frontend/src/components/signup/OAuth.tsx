// Declare the google object for TypeScript
declare const google: any;
import { useEffect, useRef, useState } from "react";
import {useAuth} from '@/contexts/AuthContext';
import { authService } from '@/api/services/authService';

// const app_name = 'inkboard.xyz';

export default function OAuth() {
    const { login } = useAuth();
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

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
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                // update width state when the box resizes
                setWidth(entry.contentRect.width);
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        // Google script is already loaded in index.html
        if (typeof google !== "undefined" && google.accounts && google.accounts.id && width > 0) {
            google.accounts.id.initialize({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                callback: handleGoogleResponse
            });
            const container = document.getElementById("googleOAuthDiv");
            const width = container?.offsetWidth || 400;

            google.accounts.id.renderButton(container, {
            theme: "outline",
            size: "large",
            width: width  // Dynamic width to match the state of other boxes
            });
        }
    }, [width]);

    return <div ref={containerRef} id="googleOAuthDiv" className="w-full min-h-[40px]"></div>;
}
