import { Link } from 'react-router-dom'
import { FaClipboardList, FaPlusCircle, FaTools } from 'react-icons/fa'
import useAuth from '../../hooks/useAuth'
import useTitle from '../../hooks/useTitle'

const TechnicianPanel = () => {
  const { username } = useAuth()
  useTitle(`TechNotes: Technician Panel`)

  return (
    <section className="technician-panel">
      <h1>Welcome, Technician {username}</h1>
      <p>Manage your repair tasks and assigned devices here.</p>

      <div className="technician-cards">
        <Link to="/dash/notes" className="tech-card">
          <FaClipboardList size={40} />
          <h3>View Assigned Repairs</h3>
          <p>Check and update your assigned repair requests.</p>
        </Link>

        <Link to="/dash/notes/new" className="tech-card">
          <FaPlusCircle size={40} />
          <h3>Add New Repair</h3>
          <p>Create a new repair entry in the system.</p>
        </Link>

        <div className="tech-card disabled">
          <FaTools size={40} />
          <h3>Tools & Resources</h3>
          <p>Coming soon...</p>
        </div>
      </div>
    </section>
  )
}

export default TechnicianPanel
