import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Public from './components/Public'
import Login from './features/auth/Login'
import DashLayout from './components/DashLayout'
import Welcome from './features/auth/Welcome'
import NotesList from './features/notes/NotesList'
import UsersList from './features/users/UsersList'
import EditUser from './features/users/EditUser'
import NewUserForm from './features/users/NewUserForm'
import EditNote from './features/notes/EditNote'
import NewNote from './features/notes/NewNote'
import Prefetch from './features/auth/Prefetch'
import PersistLogin from './features/auth/PersistLogin'
import RequireAuth from './features/auth/RequireAuth'
import { ROLES } from './config/roles'
import useTitle from './hooks/useTitle'

// 🆕 Import the new dashboard components
import AdminDashboard from './features/admin/adminDashboard'
import TechnicianPanel from './features/technician/technicianPanel'
import NotificationsPanel from './features/notifications/notificationsPanel'
import PredctiveNotifications from './features/admin/predictiveNotifications'

function App() {
  useTitle('Dan D. Repairs')

  return (
    <Routes>
      <Route path="/" element={<Layout />}>

        {/* Public routes */}
        <Route index element={<Public />} />
        <Route path="login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<PersistLogin />}>
          <Route element={<RequireAuth allowedRoles={[...Object.values(ROLES)]} />}>
            <Route element={<Prefetch />}>

              <Route path="dash" element={<DashLayout />}>

                {/* Default dashboard welcome page */}
                <Route index element={<Welcome />} />

                {/* 🧑‍💼 Admin Dashboard route */}
                
                <Route element={<RequireAuth allowedRoles={[ROLES.Admin]} />}>
                  <Route path="admin">
                    <Route index element={<AdminDashboard />} />
                    
                  </Route>
                </Route>
                <Route element={<RequireAuth allowedRoles={[ROLES.Admin]} />}>
                  <Route path="predictiveNotifications">
                    <Route index element={<PredctiveNotifications />} />
                    
                  </Route>
                </Route>

                {/* 🔧 Technician Panel route (for Employees) */}
                
                <Route element={<RequireAuth allowedRoles={[ROLES.Employee]} />}>
                  <Route path="technician">
                    <Route index element={<TechnicianPanel />} />
                    
                  </Route>
                </Route>
                
                 {/* Notification */}
                <Route >
                  <Route path="notifications">
                    <Route index element={<NotificationsPanel />} />
                    
                  </Route>
                </Route>

                {/* Manager & Admin routes for users */}
                <Route element={<RequireAuth allowedRoles={[ROLES.Manager, ROLES.Admin]} />}>
                  <Route path="users">
                    <Route index element={<UsersList />} />
                    <Route path=":id" element={<EditUser />} />
                    <Route path="new" element={<NewUserForm />} />
                  </Route>
                </Route>

                {/* Notes routes */}
                <Route path="notes">
                  <Route index element={<NotesList />} />
                  <Route path=":id" element={<EditNote />} />
                  <Route path="new" element={<NewNote />} />
                </Route>

              </Route>{/* End Dash */}
            </Route>
          </Route>
        </Route>{/* End Protected Routes */}

      </Route>
    </Routes>
  )
}

export default App
