import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";

export const NavigationRoutes = () => {
  return (
    <ul className="flex items-center justify-end w-full">
      <NavLink
        to="/generate"
        className={({ isActive }) =>
          cn(
            "text-base text-neutral-600",
            isActive && "text-neutral-900 font-semibold"
          )
        }
      >
        Take an AI Interview
      </NavLink>
    </ul>
  );
};