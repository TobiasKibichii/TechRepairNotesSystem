import { useState, useEffect } from "react"
import { useUpdateNoteMutation, useDeleteNoteMutation } from "./notesApiSlice"
import { useNavigate } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSave, faTrashCan } from "@fortawesome/free-solid-svg-icons"
import useAuth from "../../hooks/useAuth"

const EditNoteForm = ({ note, users }) => {

    const { isManager, isAdmin } = useAuth()

    const [updateNote, {
        isLoading,
        isSuccess,
        isError,
        error
    }] = useUpdateNoteMutation()

    const [deleteNote, {
        isSuccess: isDelSuccess,
        isError: isDelError,
        error: delerror
    }] = useDeleteNoteMutation()

    const navigate = useNavigate()

    // Existing fields
    const [title, setTitle] = useState(note.title)
    const [text, setText] = useState(note.text)
    const [completed, setCompleted] = useState(note.completed)
    const [userId, setUserId] = useState(note.user)

    // New fields
    const [customerName, setCustomerName] = useState(note.customerName || '')
    const [customerPhone, setCustomerPhone] = useState(note.customerPhone || '')
    const [customerEmail, setCustomerEmail] = useState(note.customerEmail || '')
    const [deviceType, setDeviceType] = useState(note.deviceType || '')
    const [images, setImages] = useState([])
    const [existingImages, setExistingImages] = useState(note.imageUrls || [])

    useEffect(() => {
        if (isSuccess || isDelSuccess) {
            setTitle('')
            setText('')
            setUserId('')
            navigate('/dash/notes')
        }
    }, [isSuccess, isDelSuccess, navigate])

    const onTitleChanged = e => setTitle(e.target.value)
    const onTextChanged = e => setText(e.target.value)
    const onCompletedChanged = e => setCompleted(prev => !prev)
    const onUserIdChanged = e => setUserId(e.target.value)
    const onCustomerNameChanged = e => setCustomerName(e.target.value)
    const onCustomerPhoneChanged = e => setCustomerPhone(e.target.value)
    const onCustomerEmailChanged = e => setCustomerEmail(e.target.value)
    const onDeviceTypeChanged = e => setDeviceType(e.target.value)
    const onImagesChanged = e => setImages(e.target.files)

    const canSave = [title, text, userId].every(Boolean) && !isLoading

    const onSaveNoteClicked = async (e) => {
        e.preventDefault()
        if (canSave) {
            const formData = new FormData()
            formData.append('id', note.id)
            formData.append('user', userId)
            formData.append('title', title)
            formData.append('text', text)
            formData.append('completed', completed)
            formData.append('customerName', customerName)
            formData.append('customerPhone', customerPhone)
            formData.append('customerEmail', customerEmail)
            formData.append('deviceType', deviceType)
            for (let i = 0; i < images.length; i++) {
                formData.append('images', images[i])
            }
            await updateNote(formData)
        }
    }

    const onDeleteNoteClicked = async () => {
        await deleteNote({ id: note.id })
    }

    const created = new Date(note.createdAt).toLocaleString('en-US', { 
        day: 'numeric', month: 'long', year: 'numeric', 
        hour: 'numeric', minute: 'numeric', second: 'numeric' 
    })
    const updated = new Date(note.updatedAt).toLocaleString('en-US', { 
        day: 'numeric', month: 'long', year: 'numeric', 
        hour: 'numeric', minute: 'numeric', second: 'numeric' 
    })

    const options = users.map(user => (
        <option key={user.id} value={user.id}>
            {user.username}
        </option>
    ))

    const errClass = (isError || isDelError) ? "errmsg" : "offscreen"
    const validTitleClass = !title ? "form__input--incomplete" : ''
    const validTextClass = !text ? "form__input--incomplete" : ''

    const errContent = (error?.data?.message || delerror?.data?.message) ?? ''

    let deleteButton = null
    if (isManager || isAdmin) {
        deleteButton = (
            <button
                className="icon-button"
                title="Delete"
                onClick={onDeleteNoteClicked}
            >
                <FontAwesomeIcon icon={faTrashCan} />
            </button>
        )
    }

    const content = (
        <>
            <p className={errClass}>{errContent}</p>

            <form className="form" onSubmit={e => e.preventDefault()}>
                <div className="form__title-row">
                    <h2>Edit Customer Issue #{note.ticket}</h2>
                    <div className="form__action-buttons">
                        <button
                            className="icon-button"
                            title="Save"
                            onClick={onSaveNoteClicked}
                            disabled={!canSave}
                        >
                            <FontAwesomeIcon icon={faSave} />
                        </button>
                        {deleteButton}
                    </div>
                </div>

                {/* Customer Info */}
                <label className="form__label" htmlFor="customerName">Customer Name:</label>
                <input
                    className="form__input"
                    id="customerName"
                    name="customerName"
                    type="text"
                    value={customerName}
                    onChange={onCustomerNameChanged}
                />

                <label className="form__label" htmlFor="customerPhone">Customer Phone:</label>
                <input
                    className="form__input"
                    id="customerPhone"
                    name="customerPhone"
                    type="tel"
                    value={customerPhone}
                    onChange={onCustomerPhoneChanged}
                />

                <label className="form__label" htmlFor="customerEmail">Customer Email:</label>
                <input
                    className="form__input"
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={onCustomerEmailChanged}
                />

                <label className="form__label" htmlFor="deviceType">Device Type:</label>
                <input
                    className="form__input"
                    id="deviceType"
                    name="deviceType"
                    type="text"
                    value={deviceType}
                    onChange={onDeviceTypeChanged}
                />

                {/* Issue details */}
                <label className="form__label" htmlFor="note-title">Issue Title:</label>
                <input
                    className={`form__input ${validTitleClass}`}
                    id="note-title"
                    name="title"
                    type="text"
                    autoComplete="off"
                    value={title}
                    onChange={onTitleChanged}
                />

                <label className="form__label" htmlFor="note-text">Detailed Description:</label>
                <textarea
                    className={`form__input form__input--text ${validTextClass}`}
                    id="note-text"
                    name="text"
                    value={text}
                    onChange={onTextChanged}
                />

                {/* Existing Images */}
                {existingImages?.length > 0 && (
                    <div className="form__images-preview">
                        <label className="form__label">Existing Images:</label>
                        <div className="image-preview-container">
                            {existingImages.map((img, index) => (
                                <img 
                                    key={index} 
                                    src={img} 
                                    alt={`Uploaded ${index + 1}`} 
                                    className="preview-image"
                                    style={{ width: "100px", borderRadius: "8px", margin: "5px" }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Upload New Images */}
                <label className="form__label" htmlFor="images">Upload New Images:</label>
                <input
                    className="form__input"
                    id="images"
                    name="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={onImagesChanged}
                />

                <div className="form__row">
                    <div className="form__divider">
                        <label className="form__label form__checkbox-container" htmlFor="note-completed">
                            WORK COMPLETE:
                            <input
                                className="form__checkbox"
                                id="note-completed"
                                name="completed"
                                type="checkbox"
                                checked={completed}
                                onChange={onCompletedChanged}
                            />
                        </label>

                        <label className="form__label form__checkbox-container" htmlFor="note-username">
                            ASSIGNED TO:
                        </label>
                        <select
                            id="note-username"
                            name="username"
                            className="form__select"
                            value={userId}
                            onChange={onUserIdChanged}
                        >
                            {options}
                        </select>
                    </div>

                    <div className="form__divider">
                        <p className="form__created">Created:<br />{created}</p>
                        <p className="form__updated">Updated:<br />{updated}</p>
                    </div>
                </div>
            </form>
        </>
    )

    return content
}

export default EditNoteForm
