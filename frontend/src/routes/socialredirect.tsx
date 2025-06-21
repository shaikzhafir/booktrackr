import { useAuth } from '@/auth'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/socialredirect')({
  component: RouteComponent,
})

function RouteComponent() {
    const auth = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
       // since the social redirect is handled by the backend and the cookie is already set,
       // we just need to verify the session and redirect accordingly
       auth.verifysession().then((result) => {
            if (result.success) {
                // Redirect to the dashboard or any other page after successful verification
                navigate({ to: '/dashboard' });
            } else {
                // Handle error case, e.g., redirect to login or show an error message
                console.error('Session verification failed:', result.error);
                navigate({ to: '/' }); // Redirect to home or login page
            }
        }
       ).catch((error) => {
            console.error('Error during session verification:', error);
            navigate({ to: '/' }); // Redirect to home or login page on error
        }
       );   
    }, []); // Empty dependency array means this runs once on mount

    // Optional loading state
    return (
        <div className="flex items-center justify-center h-screen">
            <div>Verifying your session...</div>
        </div>
    );
}
