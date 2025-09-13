import { FiMonitor, FiMoon, FiSun } from "react-icons/fi";
import { Badge } from "../ui/badge";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { selectSettings, setTheme } from "@/lib/settingSlice";
import { AppDispatch } from "@/lib/store";
import { useTheme } from "@/lib/theme";

const AsideThemeToggler = () => {
  const { setTheme: applyTheme } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const settings = useSelector(selectSettings);

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    dispatch(setTheme(newTheme));
    applyTheme(newTheme);
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      <button
        onClick={() => handleThemeChange("light")}
        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
          settings.theme === "light"
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
      >
        <FiSun className="w-6 h-6" />
        <span className="text-sm font-medium">Light</span>
        {settings.theme === "light" && (
          <Badge variant="default" className="text-xs">
            Active
          </Badge>
        )}
      </button>

      <button
        onClick={() => handleThemeChange("dark")}
        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
          settings.theme === "dark"
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
      >
        <FiMoon className="w-6 h-6" />
        <span className="text-sm font-medium">Dark</span>
        {settings.theme === "dark" && (
          <Badge variant="default" className="text-xs">
            Active
          </Badge>
        )}
      </button>

      <button
        onClick={() => handleThemeChange("system")}
        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
          settings.theme === "system"
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
      >
        <FiMonitor className="w-6 h-6" />
        <span className="text-sm font-medium">System</span>
        {settings.theme === "system" && (
          <Badge variant="default" className="text-xs">
            Active
          </Badge>
        )}
      </button>
    </div>
  );
};

export default AsideThemeToggler;
