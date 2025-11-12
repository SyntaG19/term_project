import { NavLink } from "react-router-dom";
import { Home, Users, Building2, Layers, ClipboardList } from "lucide-react";

const Sidebar = () => {
  const links = [
    { name: "Dashboard", path: "/", icon: <Home size={18} /> },
    { name: "Allocation", path: "/allocation", icon: <ClipboardList size={18} /> },
    { name: "Hostels", path: "/hostels", icon: <Building2 size={18} /> },
    { name: "Students", path: "/students", icon: <Users size={18} /> },
    { name: "Batches", path: "/batches", icon: <Layers size={18} /> },
  ];

  return (
    <aside className="w-64 bg-[#0A1930] text-gray-100 shadow-lg flex flex-col">
      <div className="text-xl font-semibold p-6 border-b border-gray-700 flex items-center gap-2">
        🏫 <span>IIT Jammu</span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-blue-500 hover:text-white"
              }`
            }
          >
            {link.icon}
            {link.name}
          </NavLink>
        ))}
      </nav>
      <footer className="p-4 text-xs text-gray-500 border-t border-gray-700">
        © 2025 IIT Jammu
      </footer>
    </aside>
  );
};

export default Sidebar;
