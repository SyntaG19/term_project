import { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [file, setFile] = useState(null);
  const [uploadedPath, setUploadedPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [batchFilter, setBatchFilter] = useState("All");

  // Handle file selection
  const handleFileChange = (e) => setFile(e.target.files[0]);

  // Upload Excel file to Flask
  const handleUpload = async () => {
    if (!file) return toast.warn("Please select a file first!");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadedPath(res.data.path);
      toast.success("✅ File uploaded successfully!");
    } catch (err) {
      toast.error("❌ Upload failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger backend allocation process
  const handleRunAllocation = async () => {
    if (!uploadedPath) return toast.warn("Please upload a file first!");

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/run-allocation", {
        uploaded_path: uploadedPath,
      });
      toast.success("✅ Allocation completed!");
      console.log(res.data);
    } catch (err) {
      toast.error("❌ Error running allocation");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch allocation results (as JSON)
  const fetchAllocations = async (batch = "All") => {
    setLoading(true);
    try {
      const url =
        batch === "All"
          ? "http://localhost:5000/students"
          : `http://localhost:5000/students?batch=${batch}`;
      const res = await axios.get(url);
      setStudents(res.data);
    } catch (err) {
      toast.error("⚠️ Could not fetch data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch allocations on page load
  useEffect(() => {
    fetchAllocations();
  }, []);

  // Handle batch filter change
  const handleBatchChange = (e) => {
    setBatchFilter(e.target.value);
    fetchAllocations(e.target.value);
  };

  // Download results Excel file
  const handleDownload = () => {
    window.open("http://localhost:5000/download-results", "_blank");
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>🏫 IIT Jammu Hostel Allocation System</h1>

      {/* Upload and control section */}
      <div style={styles.card}>
        <h3>Upload Student Preferences</h3>
        <input type="file" onChange={handleFileChange} accept=".xlsx,.xls" />
        <button onClick={handleUpload} disabled={loading}>
          Upload
        </button>

        {uploadedPath && (
          <button onClick={handleRunAllocation} disabled={loading}>
            Run Allocation
          </button>
        )}

        <button onClick={handleDownload} disabled={loading}>
          Download Results
        </button>
      </div>

      {/* Filter and Table section */}
      <div style={styles.tableCard}>
        <h3>📋 Allocations Overview</h3>
        <div style={{ marginBottom: "10px" }}>
          <label>Filter by Batch: </label>
          <select value={batchFilter} onChange={handleBatchChange}>
            <option value="All">All</option>
            <option value="UG3">UG3</option>
            <option value="UG4">UG4</option>
            <option value="MTech2">MTech2</option>
            <option value="PhD1">PhD1</option>
            <option value="Guest">Guest</option>
          </select>
        </div>

        {loading ? (
          <p>⏳ Loading...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Batch</th>
                <th>Email</th>
                <th>Allocated Room</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={i}>
                  <td>{s.Student_ID}</td>
                  <td>{s.Name}</td>
                  <td>{s.Batch}</td>
                  <td>{s.Email}</td>
                  <td>{s.Allocated_Room || "❌ Unallocated"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    padding: "40px",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
  },
  header: {
    textAlign: "center",
    color: "#222",
    marginBottom: "30px",
  },
  card: {
    background: "#fff",
    padding: "20px",
    marginBottom: "20px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  },
  tableCard: {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    borderBottom: "1px solid #ccc",
    padding: "8px",
  },
  td: {
    padding: "8px",
  },
};

export default App;
