import { createRoot } from "react-dom/client";
import { AuthProvider } from "@/context/AuthContext";
import App from "./App";
import "./styles/index.css";

createRoot(document.getElementById("root")).render(
  // BrowserRouter yahan se hata diya kyunki router.jsx RouterProvider use kar raha hai
  <AuthProvider>
    <App />
  </AuthProvider>
);