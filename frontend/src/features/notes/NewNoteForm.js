import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAddNewNoteMutation } from "./notesApiSlice";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave } from "@fortawesome/free-solid-svg-icons";
import { io } from "socket.io-client";

// ⚡ Connect to your backend Socket.IO server
const socket = io("https://techrepairnotessystembackend.onrender.com");

const NewNoteForm = ({ users }) => {
  const [addNewNote, { isLoading, isSuccess, isError, error }] =
    useAddNewNoteMutation();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [userId, setUserId] = useState(users[0]?.id || "");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [images, setImages] = useState([]);

  // --- Smart triage suggestions ---
  const [suggestedCategory, setSuggestedCategory] = useState("");
  const [suggestedCause, setSuggestedCause] = useState("");
  const [isTriageLoading, setIsTriageLoading] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      setTitle("");
      setText("");
      setUserId("");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setDeviceType("");
      setImages([]);
      setSuggestedCategory("");
      setSuggestedCause("");
      navigate("/dash/notes");
    }
  }, [isSuccess, navigate]);

  const onTitleChanged = (e) => setTitle(e.target.value);
  const onTextChanged = (e) => setText(e.target.value);
  const onUserIdChanged = (e) => setUserId(e.target.value);
  const onCustomerNameChanged = (e) => setCustomerName(e.target.value);
  const onCustomerPhoneChanged = (e) => setCustomerPhone(e.target.value);
  const onCustomerEmailChanged = (e) => setCustomerEmail(e.target.value);
  const onDeviceTypeChanged = (e) => setDeviceType(e.target.value);
  const onImagesChanged = (e) => setImages([...e.target.files]);

  const canSave =
    [title, text, userId, customerName, customerPhone, deviceType].every(
      Boolean,
    ) && !isLoading;

  // --- Call T5 triage API ---
  useEffect(() => {
    if (title && text) {
      const controller = new AbortController();
      const fetchTriage = async () => {
        setIsTriageLoading(true);
        try {
          const res = await fetch(
            "https://techrepairnotessystembackend.onrender.com/triage",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title, description: text }),
              signal: controller.signal,
            },
          );
          const data = await res.json();
          setSuggestedCategory(data.category || "");
          setSuggestedCause(data.possible_cause || "");
        } catch (err) {
          if (err.name !== "AbortError") console.error("Triage error:", err);
        } finally {
          setIsTriageLoading(false);
        }
      };
      fetchTriage();
      return () => controller.abort();
    } else {
      setSuggestedCategory("");
      setSuggestedCause("");
    }
  }, [title, text]);

  const onSaveNoteClicked = async (e) => {
    e.preventDefault();
    if (canSave) {
      try {
        const result = await addNewNote({
          assignedEmployee: userId,
          title,
          text,
          customerName,
          customerPhone,
          customerEmail,
          deviceType,
          category: suggestedCategory, // store predicted category
          possibleCause: suggestedCause, // store suggested cause
          images: images.map((img) => img.name),
        }).unwrap();

        socket.emit("sendNotification", {
          recipientId: userId,
          message: `You have been assigned a new customer issue: "${title}"`,
          noteId: result._id,
          createdAt: new Date(),
        });

        alert("Issue created and employee notified!");
      } catch (err) {
        console.error("Failed to create note:", err);
      }
    }
  };

  const options = users.map((user) => (
    <option key={user.id} value={user.id}>
      {user.username}
    </option>
  ));

  const errClass = isError ? "errmsg" : "offscreen";
  const validTitleClass = !title ? "form__input--incomplete" : "";
  const validTextClass = !text ? "form__input--incomplete" : "";

  return (
    <>
      <p className={errClass}>{error?.data?.message}</p>

      <form className="form" onSubmit={onSaveNoteClicked}>
        <div className="form__title-row">
          <h2>New Customer Issue</h2>
          <div className="form__action-buttons">
            <button className="icon-button" title="Save" disabled={!canSave}>
              <FontAwesomeIcon icon={faSave} />
            </button>
          </div>
        </div>

        <label className="form__label" htmlFor="customerName">
          Customer Name:
        </label>
        <input
          className="form__input"
          id="customerName"
          type="text"
          value={customerName}
          onChange={onCustomerNameChanged}
          required
        />

        <label className="form__label" htmlFor="customerPhone">
          Customer Phone:
        </label>
        <input
          className="form__input"
          id="customerPhone"
          type="tel"
          value={customerPhone}
          onChange={onCustomerPhoneChanged}
          required
        />

        <label className="form__label" htmlFor="customerEmail">
          Customer Email (optional):
        </label>
        <input
          className="form__input"
          id="customerEmail"
          type="email"
          value={customerEmail}
          onChange={onCustomerEmailChanged}
        />

        <label className="form__label" htmlFor="deviceType">
          Device Type:
        </label>
        <input
          className="form__input"
          id="deviceType"
          type="text"
          placeholder="e.g., Laptop, Phone, TV"
          value={deviceType}
          onChange={onDeviceTypeChanged}
          required
        />

        <label className="form__label" htmlFor="title">
          Issue Title:
        </label>
        <input
          className={`form__input ${validTitleClass}`}
          id="title"
          type="text"
          value={title}
          onChange={onTitleChanged}
          required
        />

        <label className="form__label" htmlFor="text">
          Detailed Description:
        </label>
        <textarea
          className={`form__input form__input--text ${validTextClass}`}
          id="text"
          value={text}
          onChange={onTextChanged}
          required
        />

        {title && text && (
          <div className="triage-suggestions">
            <p>
              <strong>Suggested Category:</strong>{" "}
              {isTriageLoading ? "Loading..." : suggestedCategory || "—"}
            </p>
            <p>
              <strong>Possible Cause:</strong>{" "}
              {isTriageLoading ? "Loading..." : suggestedCause || "—"}
            </p>
          </div>
        )}

        <label className="form__label" htmlFor="images">
          Upload Images (optional):
        </label>
        <input
          className="form__input"
          id="images"
          type="file"
          multiple
          accept="image/*"
          onChange={onImagesChanged}
        />
        {images.length > 0 && (
          <ul>
            {images.map((img, idx) => (
              <li key={idx}>{img.name}</li>
            ))}
          </ul>
        )}

        <label className="form__label" htmlFor="username">
          Assigned To:
        </label>
        <select
          id="username"
          className="form__select"
          value={userId}
          onChange={onUserIdChanged}
        >
          {options}
        </select>
      </form>
    </>
  );
};

export default NewNoteForm;
