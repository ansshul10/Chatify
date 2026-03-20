import { useState, useEffect } from "react";
import axiosInstance from "@/utils/axiosInstance";

export const useSystemSettings = () => {
  const [settings, setSettings] = useState({
    currentVersion: "V1.0",
    infraLabel: "Fortress Infrastructure",
    architectureLabel: "Architecture V1.0 is live",
    systemIterationLabel: "System Iterations",
    autoApprove: false
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await axiosInstance.get("/pricing/system-settings");
      if (res.data.success && res.data.settings) {
        setSettings(res.data.settings);
      }
    } catch (error) {
      console.error("Error fetching system settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return { settings, loading, refreshSettings: fetchSettings };
};