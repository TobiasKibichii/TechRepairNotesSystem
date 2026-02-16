import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons"
import { useNavigate } from 'react-router-dom'
import { useGetNotesQuery } from './notesApiSlice'
import { memo } from 'react'

const Note = ({ noteId }) => {
  const { note } = useGetNotesQuery("notesList", {
    selectFromResult: ({ data }) => ({
      note: data?.entities[noteId]
    }),
  })

  const navigate = useNavigate()

  if (!note) return null

  const created = new Date(note.createdAt).toLocaleString('en-US', { day: 'numeric', month: 'long' })
  const updated = new Date(note.updatedAt).toLocaleString('en-US', { day: 'numeric', month: 'long' })

  const handleEdit = () => navigate(`/dash/notes/${noteId}`)

  return (
    <tr className="table__row">
      {/* Ticket Number */}
      <td className="table__cell">{note.ticket}</td>

      {/* Customer Info (combined) */}
      <td className="table__cell">
        <strong>{note.customerName || 'N/A'}</strong><br />
        📞 {note.customerPhone || 'N/A'}<br />
        ✉️ {note.customerEmail || 'N/A'}
      </td>

      {/* Device */}
      <td className="table__cell">{note.deviceType || '—'}</td>

      {/* Issue */}
      <td className="table__cell">{note.issueTitle || '—'}</td>

      {/* Category */}
      <td className="table__cell">{note.category || 'Uncategorized'}</td>

      {/* Status */}
      <td className="table__cell note__status">
        <span className={`note__status--${note.status?.toLowerCase() || 'pending'}`}>
          {note.status || 'Pending'}
        </span>
      </td>

      {/* Assigned Employee */}
      <td className="table__cell">
        {note.assignedEmployee?.username || "Unassigned"}
      </td>

      {/* Optional image preview */}
      <td className="table__cell">
        {note.image ? (
          <img
            src={note.image}
            alt="Device"
            className="note__image"
            style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px" }}
          />
        ) : (
          <span>No image</span>
        )}
      </td>

      {/* Dates */}
      <td className="table__cell note__created">{created}</td>
      <td className="table__cell note__updated">{updated}</td>

      {/* Edit button */}
      <td className="table__cell">
        <button className="icon-button table__button" onClick={handleEdit}>
          <FontAwesomeIcon icon={faPenToSquare} />
        </button>
      </td>
    </tr>
  )
}

export default memo(Note)
