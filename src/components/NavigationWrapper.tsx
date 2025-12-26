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
  
  return <Navigation />;
}
