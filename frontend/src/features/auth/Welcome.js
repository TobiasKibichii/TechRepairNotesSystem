import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import useTitle from '../../hooks/useTitle'

const Welcome = () => {
    const { username, isManager, isAdmin } = useAuth()

    useTitle(`TechNotes: ${username}`)

    const date = new Date()
    const today = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'long' }).format(date)

    return (
        <section className="welcome">
            <p>{today}</p>
            <h1>Welcome {username}!</h1>

            <div className="welcome__links">
                {/* Common links for all users */}
                <p><Link to="/dash/notes">View Repair Requests</Link></p>
                <p><Link to="/dash/notes/new">Add New Repair</Link></p>

                {/* Admin / Manager links */}
                {(isManager || isAdmin) && (
                    <>
                        <p><Link to="/dash/users">View User Settings</Link></p>
                        <p><Link to="/dash/users/new">Add New User</Link></p>
                        <p><Link to="/dash/admin">Go to Admin Dashboard</Link></p>
                        <p><Link to="/dash/predictiveNotifications">Predictive Notifications</Link></p>
                    </>
                )}

                {/* Technician panel link (for all non-admins) */}
                {(!isManager && !isAdmin) && (
                    <p><Link to="/dash/technician">Go to Technician Panel</Link></p>
                )}
            </div>
        </section>
    )
}

export default Welcome
