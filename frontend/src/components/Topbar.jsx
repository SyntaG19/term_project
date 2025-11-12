import { UserCircle } from "lucide-react";

const Topbar = () => {
  return (
    <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
      <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">
        Hostel Allocation System
      </h1>
      <div className="flex items-center gap-3">
        <UserCircle size={26} className="text-gray-500" />
        <span className="text-gray-600 text-sm font-medium">Admin</span>
      </div>
    </header>
  );
};

export default Topbar;
