import { useLocation } from "react-router-dom";
import { Navigation } from "@/components/Navigation";

export function NavigationWrapper() {
  const location = useLocation();
  
  // Hide global navigation on admin pages (they have their own sidebar)
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  // Hide global navigation on brand pages (they have their own navigation)
  if (location.pathname.startsWith('/brand')) {
    return null;
  }

  // Hide global navigation on auth pages (they have their own minimal header)
  if (location.pathname.startsWith('/auth') || 
      location.pathname.startsWith('/signin') || 
      location.pathname.startsWith('/join')) {
    return null;
  }

  // Hide global navigation on trust pages (they have their own minimal header)
  if (location.pathname.startsWith('/trust') ||
      location.pathname === '/principles' ||
      location.pathname === '/safety' ||
      location.pathname === '/data' ||
      location.pathname === '/culture') {
    return null;
  }

  // Hide global navigation on legal pages (they have their own minimal header)
  if (location.pathname.startsWith('/legal')) {
    return null;
  }
  
  return <Navigation />;
}
