const Allocation = () => {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Room Allocation</h2>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {/* Replace this with your current upload/download UI */}
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div>
            <input type="file" className="block mb-2" />
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md mr-2">
              Upload
            </button>
            <button className="bg-gray-800 text-white px-4 py-2 rounded-md">
              Download Results
            </button>
          </div>
          <div>
            <label className="mr-2 text-gray-600">Filter:</label>
            <select className="border rounded-md px-2 py-1">
              <option>All</option>
              <option>Allocated</option>
              <option>Pending</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Allocation;
