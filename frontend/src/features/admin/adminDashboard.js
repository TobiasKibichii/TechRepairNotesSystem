import { useGetNotesQuery } from "../notes/notesApiSlice"
import { useGetUsersQuery } from "../users/usersApiSlice"
import { useNavigate } from "react-router-dom"
import { FaTools, FaClipboardList, FaUserTie, FaHourglassHalf, FaCheckCircle } from "react-icons/fa"
import PulseLoader from "react-spinners/PulseLoader"
import "./adminDashboard.css"

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { data: notes, isLoading: notesLoading } = useGetNotesQuery("notesList")
  const { data: users, isLoading: usersLoading } = useGetUsersQuery("usersList")

  if (notesLoading || usersLoading) return <PulseLoader color="#FFF" />

  const allNotes = notes?.ids?.map(id => notes.entities[id]) || []

  // Stats
  const totalNotes = allNotes.length
  const pending = allNotes.filter(n => n.status === "Pending").length
  const inProgress = allNotes.filter(n => n.status === "In Progress").length
  const resolved = allNotes.filter(n => n.status === "Resolved").length

  const recentNotes = allNotes.slice(-5).reverse()

  return (
    <section className="admin-dashboard">
      <h1 className="admin-title">Admin Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <FaClipboardList className="stat-icon" />
          <h3>Total Requests</h3>
          <p>{totalNotes}</p>
        </div>

        <div className="stat-card">
          <FaHourglassHalf className="stat-icon" />
          <h3>Pending</h3>
          <p>{pending}</p>
        </div>

        <div className="stat-card">
          <FaTools className="stat-icon" />
          <h3>In Progress</h3>
          <p>{inProgress}</p>
        </div>

        <div className="stat-card">
          <FaCheckCircle className="stat-icon" />
          <h3>Resolved</h3>
          <p>{resolved}</p>
        </div>
      </div>

      <div className="recent-section">
        <h2>Recent Repair Requests</h2>
        <table className="table table--notes">
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Customer</th>
              <th>Device</th>
              <th>Status</th>
              <th>Assigned</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {recentNotes.map((note, index) => (
              <tr key={index}>
                <td>{note.ticket || note._id.slice(-6)}</td>
                <td>{note.customerName}</td>
                <td>{note.deviceType}</td>
                <td>{note.status}</td>
                <td>{note.assignedEmployee?.username || "Unassigned"}</td>
                <td>{new Date(note.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-actions">
        <button className="btn" onClick={() => navigate("/dash/users")}>Manage Users</button>
        <button className="btn" onClick={() => navigate("/dash/notes")}>View All Requests</button>
      </div>
    </section>
  )
}

export default AdminDashboard
