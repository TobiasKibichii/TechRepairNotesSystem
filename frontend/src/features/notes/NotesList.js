import { useState, useEffect } from "react";
import { useGetNotesQuery } from "./notesApiSlice";
import useAuth from "../../hooks/useAuth";
import useTitle from "../../hooks/useTitle";
import PulseLoader from "react-spinners/PulseLoader";
import "./NotesList.css";

const NotesList = () => {
  useTitle("TechNotes: Repair Requests");

  const { username, isManager, isAdmin } = useAuth();
  const [selectedNote, setSelectedNote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [assignedFilter, setAssignedFilter] = useState("All");

  const [inventory, setInventory] = useState([]);
  const [deviceType, setDeviceType] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [selectedParts, setSelectedParts] = useState([]);
  const [laborCost, setLaborCost] = useState(0);
  const [status, setStatus] = useState("Pending");
  const [totalBill, setTotalBill] = useState(0);
  const [completedIssues, setCompletedIssues] = useState([]);

  const [otherDevice, setOtherDevice] = useState("");
  const [otherBrand, setOtherBrand] = useState("");
  const [otherModel, setOtherModel] = useState("");

  // ✅ Load inventory from backend CSV
  useEffect(() => {
    fetch("http://localhost:3500/api/inventory/loadStock")
      .then((res) => res.json())
      .then((data) => {
        setInventory(data.data);
      })
      .catch((err) => console.error("Error loading inventory:", err));
  }, []);

  // ✅ Calculate total
  useEffect(() => {
    const partsTotal = selectedParts.reduce(
      (sum, p) => sum + (p.price || 0) * (p.qty || 1),
      0,
    );
    setTotalBill(partsTotal + parseFloat(laborCost || 0));
  }, [selectedParts, laborCost]);

  // ✅ Dropdown options
  const deviceOptions = [...new Set(inventory.map((i) => i.device))];
  const brandOptions = [
    ...new Set(
      inventory.filter((i) => i.device === deviceType).map((i) => i.brand),
    ),
  ];
  const modelOptions = [
    ...new Set(
      inventory
        .filter((i) => i.device === deviceType && i.brand === brand)
        .map((i) => i.model),
    ),
  ];
  const partOptions = inventory.filter(
    (i) => i.device === deviceType && i.brand === brand && i.model === model,
  );

  const handleRowClick = (note) => {
    setSelectedNote(note);
    setShowModal(true);
    setDeviceType(note.deviceType || "");
    setBrand(note.brand || "");
    setModel(note.model || "");
    setSelectedParts(note.partsUsed || []);
    setLaborCost(note.laborCost || 0);
    setStatus(note.status || "Pending");
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedNote(null);
    setDeviceType("");
    setBrand("");
    setModel("");
    setSelectedParts([]);
    setLaborCost(0);
    setStatus("Pending");
    setOtherDevice("");
    setOtherBrand("");
    setOtherModel("");
  };

  const handleAddPart = () =>
    setSelectedParts([
      ...selectedParts,
      { partName: "", qty: 1, price: 0, isOther: false, description: "" },
    ]);

  const handleRemovePart = (i) =>
    setSelectedParts(selectedParts.filter((_, idx) => idx !== i));

  const handlePartChange = (i, partName) => {
    const item = {
      ...selectedParts[i],
      partName,
      isOther: partName === "Other",
    };

    if (!item.isOther) {
      const partObj = partOptions.find((p) => p.part_name === partName);
      item.price = partObj ? parseFloat(partObj.unit_cost_ksh) : 0;
      item.description = "";
    }

    const arr = [...selectedParts];
    arr[i] = item;
    setSelectedParts(arr);
  };

  const handleQtyChange = (i, qty) => {
    const arr = [...selectedParts];
    arr[i].qty = parseInt(qty) || 1;
    setSelectedParts(arr);
  };

  const handleOtherDescription = (i, desc) => {
    const arr = [...selectedParts];
    arr[i].description = desc;
    setSelectedParts(arr);
  };

  const handlePriceChange = (i, price) => {
    const arr = [...selectedParts];
    arr[i].price = parseFloat(price) || 0;
    setSelectedParts(arr);
  };

  // ✅ Update CSV stock when completing a repair
  const handleCompleteIssue = async () => {
    if (!selectedNote) return;
    try {
      const payload = {
        noteId: selectedNote._id,
        status,
        device: deviceType === "Other" ? otherDevice : deviceType,
        brand: brand === "Other" ? otherBrand : brand,
        model: model === "Other" ? otherModel : model,
        partsUsed: selectedParts,
        laborCost,
        finalBill: totalBill,
      };
      console.log("😁", payload);
      const token = localStorage.getItem("token");

      // 1️⃣ Update note info
      const res = await fetch("http://localhost:3500/api/notes/updateIssue", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");

      // 3️⃣ Log completed issue
      setCompletedIssues([
        ...completedIssues,
        {
          ticket: selectedNote.ticket,
          customerName: selectedNote.customerName,
          customerPhone: selectedNote.customerPhone,
          device: payload.device,
          brand: payload.brand,
          model: payload.model,
          partsUsed: selectedParts.map((p) =>
            p.isOther ? p.description : p.partName,
          ),
          laborCost,
          totalBill,
          status,
        },
      ]);

      closeModal();
    } catch (err) {
      alert(err.message);
    }
  };

  const completedOnly = completedIssues.filter(
    (issue) => issue.status === "Completed",
  );

  const {
    data: notes,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useGetNotesQuery("notesList", {
    pollingInterval: 15000,
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });

  let content;
  if (isLoading) content = <PulseLoader color="#FFF" />;
  if (isError) content = <p className="errmsg">{error?.data?.message}</p>;

  if (isSuccess) {
    const { ids, entities } = notes;

    const completedNotes = ids
      .map((id) => entities[id])
      .filter((note) => note.status === "Completed");

    let filteredIds =
      isManager || isAdmin
        ? [...ids]
        : ids.filter(
            (id) => entities[id].assignedEmployee?.username === username,
          );

    if (statusFilter !== "All")
      filteredIds = filteredIds.filter(
        (id) =>
          (entities[id].status || "").toLowerCase() ===
          statusFilter.toLowerCase(),
      );

    if (assignedFilter !== "All")
      filteredIds = filteredIds.filter(
        (id) => entities[id].assignedEmployee?.username === assignedFilter,
      );

    const tableContent = filteredIds.length ? (
      filteredIds.map((id) => {
        const note = entities[id];
        return (
          <tr key={id} onClick={() => handleRowClick(note)}>
            <td>{note.ticket}</td>
            <td>
              <strong>{note.customerName}</strong>
              <br />
              📞{note.customerPhone}
            </td>
            <td>{note.deviceType}</td>
            <td>{note.issueTitle}</td>
            <td>{note.status}</td>
            <td>{note.assignedEmployee?.username || "Unassigned"}</td>
            <td>{new Date(note.createdAt).toLocaleDateString()}</td>
            <td>{note.category || "—"}</td>
          </tr>
        );
      })
    ) : (
      <tr>
        <td colSpan="8">No repair requests found</td>
      </tr>
    );

    content = (
      <div className="notes-dashboard">
        <h1>Repair Requests</h1>
        <div className="filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {["All", "Pending", "In Progress", "Completed"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="table-container">
          <table className="notes-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Customer</th>
                <th>Device</th>
                <th>Issue</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>Created</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>{tableContent}</tbody>
          </table>
        </div>

        {showModal && selectedNote && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Ticket #{selectedNote.ticket}</h2>

              {/* Device / Brand / Model */}
              <section>
                <h3>Device Type</h3>
                <select
                  value={deviceType}
                  onChange={(e) => {
                    setDeviceType(e.target.value);
                    setBrand("");
                    setModel("");
                    setSelectedParts([]);
                  }}
                >
                  <option value="">Select Device</option>
                  {deviceOptions.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                {deviceType === "Other" && (
                  <input
                    placeholder="Enter device"
                    value={otherDevice}
                    onChange={(e) => setOtherDevice(e.target.value)}
                  />
                )}

                {deviceType && deviceType !== "Other" && (
                  <>
                    <h3>Brand</h3>
                    <select
                      value={brand}
                      onChange={(e) => {
                        setBrand(e.target.value);
                        setModel("");
                        setSelectedParts([]);
                      }}
                    >
                      <option value="">Select Brand</option>
                      {brandOptions.map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                    {brand === "Other" && (
                      <input
                        placeholder="Enter brand"
                        value={otherBrand}
                        onChange={(e) => setOtherBrand(e.target.value)}
                      />
                    )}

                    {brand && brand !== "Other" && (
                      <>
                        <h3>Model</h3>
                        <select
                          value={model}
                          onChange={(e) => {
                            setModel(e.target.value);
                            setSelectedParts([]);
                          }}
                        >
                          <option value="">Select Model</option>
                          {modelOptions.map((m) => (
                            <option key={m}>{m}</option>
                          ))}
                          <option value="Other">Other</option>
                        </select>
                        {model === "Other" && (
                          <input
                            placeholder="Enter model"
                            value={otherModel}
                            onChange={(e) => setOtherModel(e.target.value)}
                          />
                        )}
                      </>
                    )}
                  </>
                )}
              </section>

              {/* Status */}
              <section>
                <h3>Status</h3>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {["Pending", "In Progress", "Completed"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </section>

              {/* Parts */}
              {model && (
                <section>
                  <h3>Parts Used</h3>
                  {selectedParts.map((p, i) => (
                    <div key={i}>
                      <select
                        value={p.partName}
                        onChange={(e) => handlePartChange(i, e.target.value)}
                      >
                        <option value="">Select Part</option>
                        {partOptions.map((part) => (
                          <option key={part.part_name}>{part.part_name}</option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                      {p.isOther && (
                        <input
                          placeholder="Describe part"
                          value={p.description}
                          onChange={(e) =>
                            handleOtherDescription(i, e.target.value)
                          }
                        />
                      )}
                      <input
                        type="number"
                        min="1"
                        value={p.qty}
                        onChange={(e) => handleQtyChange(i, e.target.value)}
                      />
                      <input
                        type="number"
                        min="0"
                        value={p.price}
                        onChange={(e) => handlePriceChange(i, e.target.value)}
                      />
                      <button onClick={() => handleRemovePart(i)}>
                        Remove
                      </button>
                    </div>
                  ))}
                  <button onClick={handleAddPart}>Add Part</button>
                </section>
              )}

              {/* Labour & Total */}
              <section>
                <label>
                  Labour Cost:{" "}
                  <input
                    type="number"
                    min="0"
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                  />
                </label>
                <p>Total Bill: KES {totalBill.toLocaleString()}</p>
                <button onClick={handleCompleteIssue}>Complete Issue</button>
              </section>

              <button onClick={closeModal}>Close</button>
            </div>
          </div>
        )}

        <section className="completed-repairs">
          <h2>Completed Repairs</h2>

          <div className="table-container">
            <table className="notes-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Customer</th>
                  <th>Device</th>
                  <th>Brand</th>
                  <th>Model</th>
                  <th>Parts</th>
                  <th>Labour</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {completedNotes.length ? (
                  completedNotes.map((note) => (
                    <tr key={note._id}>
                      <td>{note.ticket}</td>
                      <td>
                        <strong>{note.customerName}</strong>
                        <br />
                        📞{note.customerPhone}
                      </td>
                      <td>{note.deviceType}</td>
                      <td>{note.brand || "—"}</td>
                      <td>{note.model || "—"}</td>
                      <td>
                        {(note.partsUsed || [])
                          .map((p) => (p.isOther ? p.description : p.partName))
                          .join(", ") || "—"}
                      </td>
                      <td>
                        KES {Number(note.laborCost || 0).toLocaleString()}
                      </td>
                      <td>
                        KES {Number(note.finalBill || 0).toLocaleString()}
                      </td>
                      <td>{note.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9">No completed repairs yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  return content;
};

export default NotesList;
