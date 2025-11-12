import { Bed, Building2, Users, Activity } from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Hostels",
      value: 6,
      icon: <Building2 size={30} />,
      color: "bg-gradient-to-r from-blue-500 to-blue-700",
    },
    {
      title: "Total Rooms",
      value: 480,
      icon: <Bed size={30} />,
      color: "bg-gradient-to-r from-green-500 to-green-700",
    },
    {
      title: "Total Students",
      value: 372,
      icon: <Users size={30} />,
      color: "bg-gradient-to-r from-indigo-500 to-indigo-700",
    },
    {
      title: "Occupancy Rate",
      value: "77%",
      icon: <Activity size={30} />,
      color: "bg-gradient-to-r from-orange-400 to-orange-600",
    },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-semibold text-gray-800">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div
            key={i}
            className={`rounded-xl text-white p-6 shadow-lg hover:scale-[1.02] transition-transform ${s.color}`}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm uppercase opacity-80">{s.title}</h3>
                <p className="text-3xl font-bold mt-2">{s.value}</p>
              </div>
              <div className="opacity-90">{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">
          Overview Summary
        </h3>
        <p className="text-gray-600 leading-relaxed">
          The current occupancy rate is stable with the majority of allocations
          completed. New room assignments can be managed via the Allocation tab.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
