import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Allocation from "./pages/Allocation";
import Hostels from "./pages/Hostels";
import Students from "./pages/Students";
import Batches from "./pages/Batches";

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 p-8 bg-gradient-to-br from-gray-50 to-gray-100">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/allocation" element={<Allocation />} />
              <Route path="/hostels" element={<Hostels />} />
              <Route path="/students" element={<Students />} />
              <Route path="/batches" element={<Batches />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
