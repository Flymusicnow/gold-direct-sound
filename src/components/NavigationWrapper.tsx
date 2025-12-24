import { useLocation } from "react-router-dom";
import { Navigation } from "@/components/Navigation";

export function NavigationWrapper() {
  const location = useLocation();
  
  // Hide global navigation on admin pages (they have their own sidebar)
  if (location.pathname.startsWith('/admin')) {
    return null;
  }
  
  return <Navigation />;
}
