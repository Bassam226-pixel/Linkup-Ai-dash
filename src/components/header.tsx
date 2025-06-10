import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const Header = () => {
  return (
    <header className={cn("w-full border-b duration-150 transition-all ease-in-out p-4")}>
      <div className="container mx-auto flex justify-between items-center">
        {/* اسم المشروع على اليسار */}
        <Link to="/" className="text-xl font-bold text-gray-800 hover:text-blue-600 transition">
          LinkUp Project
        </Link>

        {/* زر بدء المقابلة على اليمين */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            cn(
              "text-base text-neutral-600 px-4 py-2 rounded-lg transition-all",
              isActive && "text-neutral-900 font-semibold bg-gray-200"
            )
          }
        >
          Take an AI Interview
        </NavLink>
      </div>
    </header>
  );
};

export default Header;