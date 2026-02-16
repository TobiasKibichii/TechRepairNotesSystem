import { useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faFileCirclePlus,
    faFilePen,
    faUserGear,
    faUserPlus,
    faRightFromBracket,
    faBell,
    faScrewdriverWrench,
    faChartLine
} from "@fortawesome/free-solid-svg-icons"
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useSendLogoutMutation } from '../features/auth/authApiSlice'
import useAuth from '../hooks/useAuth'
import PulseLoader from 'react-spinners/PulseLoader'

const DASH_REGEX = /^\/dash(\/)?$/
const NOTES_REGEX = /^\/dash\/notes(\/)?$/
const USERS_REGEX = /^\/dash\/users(\/)?$/

const DashHeader = () => {
    const { isManager, isAdmin, username } = useAuth()

    const navigate = useNavigate()
    const { pathname } = useLocation()

    const [sendLogout, {
        isLoading,
        isSuccess,
        isError,
        error
    }] = useSendLogoutMutation()

    useEffect(() => {
        if (isSuccess) navigate('/')
    }, [isSuccess, navigate])

    const onNewNoteClicked = () => navigate('/dash/notes/new')
    const onNewUserClicked = () => navigate('/dash/users/new')
    const onNotesClicked = () => navigate('/dash/notes')
    const onUsersClicked = () => navigate('/dash/users')
    const onAdminClicked = () => navigate('/dash/admin')
    const onTechnicianClicked = () => navigate('/dash/technician')
    const onNotificationsClicked = () => navigate('/dash/notifications')

    let dashClass = null
    if (!DASH_REGEX.test(pathname) && !NOTES_REGEX.test(pathname) && !USERS_REGEX.test(pathname)) {
        dashClass = "dash-header__container--small"
    }

    let newNoteButton = null
    if (NOTES_REGEX.test(pathname)) {
        newNoteButton = (
            <button className="icon-button" title="New Note" onClick={onNewNoteClicked}>
                <FontAwesomeIcon icon={faFileCirclePlus} />
            </button>
        )
    }

    let newUserButton = null
    if (USERS_REGEX.test(pathname)) {
        newUserButton = (
            <button className="icon-button" title="New User" onClick={onNewUserClicked}>
                <FontAwesomeIcon icon={faUserPlus} />
            </button>
        )
    }

    let userButton = null
    if (isManager || isAdmin) {
        if (!USERS_REGEX.test(pathname) && pathname.includes('/dash')) {
            userButton = (
                <button className="icon-button" title="Users" onClick={onUsersClicked}>
                    <FontAwesomeIcon icon={faUserGear} />
                </button>
            )
        }
    }

    let notesButton = null
    if (!NOTES_REGEX.test(pathname) && pathname.includes('/dash')) {
        notesButton = (
            <button className="icon-button" title="Notes" onClick={onNotesClicked}>
                <FontAwesomeIcon icon={faFilePen} />
            </button>
        )
    }

    let adminButton = null
    if (isAdmin && pathname !== '/dash/admin') {
        adminButton = (
            <button className="icon-button" title="Admin Dashboard" onClick={onAdminClicked}>
                <FontAwesomeIcon icon={faChartLine} />
            </button>
        )
    }

    let technicianButton = null
    if (!isAdmin && !isManager && pathname !== '/dash/technician') {
        technicianButton = (
            <button className="icon-button" title="Technician Panel" onClick={onTechnicianClicked}>
                <FontAwesomeIcon icon={faScrewdriverWrench} />
            </button>
        )
    }

    const notificationButton = (
        <button className="icon-button" title="Notifications" onClick={onNotificationsClicked}>
            <FontAwesomeIcon icon={faBell} />
        </button>
    )

    const logoutButton = (
        <button className="icon-button" title="Logout" onClick={sendLogout}>
            <FontAwesomeIcon icon={faRightFromBracket} />
        </button>
    )

    const errClass = isError ? "errmsg" : "offscreen"

    let buttonContent
    if (isLoading) {
        buttonContent = <PulseLoader color={"#FFF"} />
    } else {
        buttonContent = (
            <>
                {notificationButton}
                {newNoteButton}
                {newUserButton}
                {notesButton}
                {userButton}
                {adminButton}
                {technicianButton}
                {logoutButton}
            </>
        )
    }

    return (
        <>
            <p className={errClass}>{error?.data?.message}</p>

            <header className="dash-header">
                <div className={`dash-header__container ${dashClass}`}>
                    <Link to="/dash">
                        <h1 className="dash-header__title">techNotes</h1>
                    </Link>
                    <nav className="dash-header__nav">
                        {buttonContent}
                    </nav>
                </div>
            </header>
        </>
    )
}

export default DashHeader
