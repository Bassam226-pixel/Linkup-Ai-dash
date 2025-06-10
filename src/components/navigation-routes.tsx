import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";

// تعريف الـ props لـ NavigationRoutes
interface NavigationRoutesProps {
  isMobile?: boolean; // يمكن يكون اختياري باستخدام ?
}

export const NavigationRoutes = ({ isMobile }: NavigationRoutesProps) => {
  return (
    <ul
      className={cn(
        "flex items-center justify-end w-full",
        isMobile && "flex-col" // مثال: تغيير التصميم للموبايل
      )}
    >
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