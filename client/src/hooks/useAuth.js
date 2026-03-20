import { useAuthContext } from "@/context/AuthContext";
import axiosInstance      from "@/utils/axiosInstance";

const useAuth = () => {
  const { user, loading, error, dispatch } = useAuthContext();

  const logout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch {
      // ignore
    } finally {
      dispatch({ type: "LOGOUT" });
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    logout,
  };
};

export default useAuth;
