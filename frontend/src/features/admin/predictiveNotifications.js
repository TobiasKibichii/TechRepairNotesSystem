import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminInventoryDashboard.css"; // ✅ Import external CSS

export default function AdminInventoryDashboard() {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [filters, setFilters] = useState({
    brand: "",
    device: "",
    reorder: "all",
  });

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "https://techrepairnotessystembackend.onrender.com/api/inventory/admin",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setInventory(res.data.data);
        setFilteredInventory(res.data.data);
      } catch (error) {
        console.error("Error reading admin inventory:", error.message);
        if (error.response) {
          console.error("Response data:", error.response.data);
          console.error("Response status:", error.response.status);
        } else if (error.request) {
          console.error("No response received:", error.request);
        } else {
          console.error("Error details:", error);
        }
      }
    };
    fetchInventory();
  }, []);

  useEffect(() => {
    let data = [...inventory];

    if (filters.brand)
      data = data.filter((item) =>
        item.brand.toLowerCase().includes(filters.brand.toLowerCase()),
      );

    if (filters.device)
      data = data.filter((item) =>
        item.device.toLowerCase().includes(filters.device.toLowerCase()),
      );

    if (filters.reorder !== "all") {
      data = data.filter((item) =>
        filters.reorder === "yes" ? item.reorder_alert : !item.reorder_alert,
      );
    }

    setFilteredInventory(data);
  }, [filters, inventory]);

  const brands = [...new Set(inventory.map((i) => i.brand))];
  const devices = [...new Set(inventory.map((i) => i.device))];

  return (
    <div className="inventory-dashboard">
      <h2 className="inventory-title">Inventory Overview</h2>

      <div className="filters">
        <select
          value={filters.brand}
          onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
        >
          <option value="">All Brands</option>
          {brands.map((brand, i) => (
            <option key={i} value={brand}>
              {brand}
            </option>
          ))}
        </select>

        <select
          value={filters.device}
          onChange={(e) => setFilters({ ...filters, device: e.target.value })}
        >
          <option value="">All Devices</option>
          {devices.map((device, i) => (
            <option key={i} value={device}>
              {device}
            </option>
          ))}
        </select>

        <select
          value={filters.reorder}
          onChange={(e) => setFilters({ ...filters, reorder: e.target.value })}
        >
          <option value="all">All</option>
          <option value="yes">Reorder Needed</option>
          <option value="no">OK</option>
        </select>
      </div>

      <div className="table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Part</th>
              <th>Device</th>
              <th>Brand</th>
              <th>Stock</th>
              <th>Forecast</th>
              <th>Reorder Alert</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.length > 0 ? (
              filteredInventory.map((item, i) => (
                <tr key={i} className={item.reorder_alert ? "alert-row" : ""}>
                  <td>{item.part_name}</td>
                  <td>{item.device}</td>
                  <td>{item.brand}</td>
                  <td>{item.stock_quantity}</td>
                  <td>{item.forecast_next_week}</td>
                  <td>
                    {item.reorder_alert ? (
                      <span className="reorder-yes">⚠️ Yes</span>
                    ) : (
                      <span className="reorder-ok">✔ OK</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="empty-row">
                  No matching inventory found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
