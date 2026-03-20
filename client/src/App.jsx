import { RouterProvider, useLocation } from "react-router-dom";
import { useEffect } from "react";
import router from "./router";

// Scroll to top on every page change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const App = () => {
  return (
    // Note: ScrollToTop functionality is best handled by registered components
    // or a dedicated Wrapper in router.jsx if needed.
    <RouterProvider router={router} />
  );
};

export default App;