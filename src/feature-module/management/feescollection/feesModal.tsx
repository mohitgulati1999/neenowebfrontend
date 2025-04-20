import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import CommonSelect, { Option } from "../../../core/common/commonSelect";
import { feeGroup } from "../../../core/common/selectoption/selectoption";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

interface FeesGroup {
  _id: string;
  id: string;
  name: string;
  description?: string;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

interface FeesType {
  _id: string;
  id: string;
  name: string;
  feesGroup: { _id: string; name: string }; // Updated to match populated object
  description?: string;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}
const API_URL = process.env.REACT_APP_URL;

interface FeesModalProps {
  feesGroups: FeesGroup[];
  setFeesGroups: React.Dispatch<React.SetStateAction<FeesGroup[]>>;
  feesTypes: FeesType[];
  setFeesTypes: React.Dispatch<React.SetStateAction<FeesType[]>>;
  showAddModal: boolean;
  setShowAddModal: React.Dispatch<React.SetStateAction<boolean>>;
  editModalId: string | null;
  setEditModalId: React.Dispatch<React.SetStateAction<string | null>>;
  deleteModalId: string | null;
  setDeleteModalId: React.Dispatch<React.SetStateAction<string | null>>;
}

const FeesModal: React.FC<FeesModalProps> = ({
  feesGroups,
  setFeesGroups,
  feesTypes,
  setFeesTypes,
  showAddModal,
  setShowAddModal,
  editModalId,
  setEditModalId,
  deleteModalId,
  setDeleteModalId,
}) => {
  const [activeContent, setActiveContent] = useState<string>("");
  const [showAddFeesGroupModal, setShowAddFeesGroupModal] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    status: "Active" as "Active" | "Inactive",
  });
  const [editFormData, setEditFormData] = useState<Record<string, Partial<FeesGroup>>>({});
  const [typeFormData, setTypeFormData] = useState({
    id: "",
    name: "",
    feesGroupId: "",
    description: "",
    status: "Active" as "Active" | "Inactive",
  });
  const [editTypeFormData, setEditTypeFormData] = useState<Record<string, Partial<FeesType>>>({});
  
  const today = new Date();
  const formattedDate = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}-${today.getFullYear()}`;
  const defaultValue = dayjs(formattedDate);

  const feesTypesOptions: Option[] = feesTypes.map((type) => ({
    value: type._id,
    label: type.name,
  }));

  const handleContentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setActiveContent(event.target.value);
  };

  // Fees Group Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, id: string) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [id]: { ...prev[id], [name]: value } }));
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, status: e.target.checked ? "Active" : "Inactive" }));
  };

  const handleEditToggleChange = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: e.target.checked ? "Active" : "Inactive" },
    }));
  };

  const handleAddFeesGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await axios.post<FeesGroup>(`${API_URL}/api/feesGroup`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }});
      setFeesGroups((prev) => [...prev, response.data]);
      setFormData({ id: "", name: "", description: "", status: "Active" });
      toast.success("Fees Group added successfully");
      setShowAddModal(false);
      setShowAddFeesGroupModal(false);
    } catch (error) {
      console.error("Error adding fees group:", (error as Error).message);
      toast.error("Error adding fees group");
    }
  };

  const handleEditFeesGroup = async (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    try {
      const response = await axios.put<FeesGroup>(
        `${API_URL}/api/feesGroup/${id}`,
        editFormData[id] || {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );      
      setFeesGroups((prev) => prev.map((group) => (group._id === id ? response.data : group)));
      toast.success("Fees Group updated successfully");
      setEditModalId(null);
    } catch (error) {
      console.error("Error updating fees group:", (error as Error).message);
      toast.error("Error updating fees group");
    }
  };

  const handleDeleteFeesGroup = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/feesGroup/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setFeesGroups((prev) => prev.filter((group) => group._id !== id));
      toast.success("Fees Group deleted successfully");
      setDeleteModalId(null);
    } catch (error) {
      console.error("Error deleting fees group:", (error as Error).message);
      toast.error("Error deleting fees group");
    }
  };

  // Fees Type Handlers
  const handleTypeInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTypeFormData((prev) => ({ ...prev, [name]: value }));
  };

const handleEditTypeInputChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  id: string
) => {
  const { name, value } = e.target;
  setEditTypeFormData((prev) => ({
    ...prev,
    [id]: {
      ...prev[id],
      [name]: value, // Store feesGroupId directly as a string
    },
  }));
};

  const handleTypeToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTypeFormData((prev) => ({ ...prev, status: e.target.checked ? "Active" : "Inactive" }));
  };

  const handleEditTypeToggleChange = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    setEditTypeFormData((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: e.target.checked ? "Active" : "Inactive" },
    }));
  };

  const handleAddFeesType = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Sending Fees Type:", typeFormData);
    try {
      const response = await axios.post<FeesType>(`${API_URL}/api/feesType`, typeFormData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setFeesTypes((prev) => [...prev, response.data]);
      setTypeFormData({ id: "", name: "", feesGroupId: "", description: "", status: "Active" });
      toast.success("Fees Type added successfully");
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding fees type:", (error as Error).message);
      toast.error("Error adding fees type");
    }
  };

  const handleEditFeesType = async (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    try {
      const currentType = feesTypes.find((t) => t._id === id); // Get the current type
      if (!currentType) throw new Error("Current type not found");
  
      const payload = {
        name: editTypeFormData[id]?.name !== undefined ? editTypeFormData[id].name : currentType.name,
        feesGroupId: editTypeFormData[id]?.feesGroup?._id || currentType.feesGroup._id, // Send feesGroupId
        description: editTypeFormData[id]?.description !== undefined ? editTypeFormData[id].description : currentType.description,
        status: editTypeFormData[id]?.status !== undefined ? editTypeFormData[id].status : currentType.status,
      };
      console.log("Edit Payload:", payload); // Debug payload
  
      const response = await axios.put<FeesType>(`${API_URL}/api/feesType/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setFeesTypes((prev) => prev.map((type) => (type._id === id ? response.data : type)));
      toast.success("Fees Type updated successfully");
      setEditModalId(null);
      setEditTypeFormData({}); // Reset edit form data
    } catch (error) {
      console.error("Error updating fees type:", (error as Error).message);
      toast.error("Error updating fees type");
    }
  };

  const handleDeleteFeesType = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/feesType/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setFeesTypes((prev) => prev.filter((type) => type._id !== id));
      toast.success("Fees Type deleted successfully");
      setDeleteModalId(null);
    } catch (error) {
      console.error("Error deleting fees type:", (error as Error).message);
      toast.error("Error deleting fees type");
    }
  };

  const isFeesTypePage = window.location.pathname.includes("/fees-type");
  const isFeesGroupPage = window.location.pathname.includes("/fees-group");

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />

      {/* Add Fees Type Modal */}
      <Modal show={showAddModal && isFeesTypePage} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Fees Type</Modal.Title>
        </Modal.Header>
        <form onSubmit={handleAddFeesType}>
          <Modal.Body>
            <div className="row">
              <div className="col-md-12">
                <div className="mb-3">
                  <label className="form-label">Fees Type Id</label>
                  <input
                    type="text"
                    className="form-control"
                    name="id"
                    value={typeFormData.id}
                    onChange={handleTypeInputChange}
                    placeholder="Enter ID"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Fees Type</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={typeFormData.name}
                    onChange={handleTypeInputChange}
                    placeholder="Enter Fees Type Name"
                    required
                  />
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <label className="form-label">Fees Group</label>
                    <Link to="#" className="text-primary" onClick={() => setShowAddFeesGroupModal(true)}>
                      <span><i className="ti ti-square-rounded-plus-filled" /></span> Add New
                    </Link>
                  </div>
                  <select
                    className="form-select"
                    name="feesGroupId" // Changed to feesGroupId to match backend expectation
                    value={typeFormData.feesGroupId}
                    onChange={handleTypeInputChange}
                    required
                  >
                    <option value="">Select Fees Group</option>
                    {feesGroups.map((group) => (
                      <option key={group._id} value={group._id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    name="description"
                    value={typeFormData.description}
                    onChange={handleTypeInputChange}
                    placeholder="Add Description"
                  />
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="status-title">
                    <h5>Status</h5>
                    <p>Change the Status by toggle</p>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={typeFormData.status === "Active"}
                      onChange={handleTypeToggleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Add Fees Type</Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Add Fees Group Modal */}
      <Modal show={showAddModal && isFeesGroupPage} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Fees Group</Modal.Title>
        </Modal.Header>
        <form onSubmit={handleAddFeesGroup}>
          <Modal.Body>
            <div className="row">
              <div className="col-md-12">
                <div className="mb-3">
                  <label className="form-label">ID</label>
                  <input
                    type="text"
                    className="form-control"
                    name="id"
                    value={formData.id}
                    onChange={handleInputChange}
                    placeholder="Enter ID"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Fees Group</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter Fees Group"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Add Description"
                  />
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="status-title">
                    <h5>Status</h5>
                    <p>Change the Status by toggle</p>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={formData.status === "Active"}
                      onChange={handleToggleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Add Fees Group</Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Nested Add Fees Group Modal */}
      <Modal show={showAddFeesGroupModal} onHide={() => setShowAddFeesGroupModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Fees Group</Modal.Title>
        </Modal.Header>
        <form onSubmit={handleAddFeesGroup}>
          <Modal.Body>
            <div className="row">
              <div className="col-md-12">
                <div className="mb-3">
                  <label className="form-label">ID</label>
                  <input
                    type="text"
                    className="form-control"
                    name="id"
                    value={formData.id}
                    onChange={handleInputChange}
                    placeholder="Enter ID"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter Name"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Add Description"
                  />
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="status-title">
                    <h5>Status</h5>
                    <p>Change the Status by toggle</p>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={formData.status === "Active"}
                      onChange={handleToggleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddFeesGroupModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Add Fees Group</Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Edit Fees Type Modals */}
      {feesTypes.map((type) => (
        <React.Fragment key={type._id}>
          <Modal show={editModalId === type._id && isFeesTypePage} onHide={() => setEditModalId(null)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Edit Fees Type</Modal.Title>
            </Modal.Header>
            <form onSubmit={(e) => handleEditFeesType(e, type._id)}>
              <Modal.Body>
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Fees Type</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={editTypeFormData[type._id]?.name !== undefined ? editTypeFormData[type._id].name : type.name}
                        onChange={(e) => handleEditTypeInputChange(e, type._id)}
                        placeholder="Enter Fees Type"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between">
                        <label className="form-label">Fees Group</label>
                        <Link to="#" className="text-primary" onClick={() => setShowAddFeesGroupModal(true)}>
                          <span><i className="ti ti-square-rounded-plus-filled" /></span> Add New
                        </Link>
                      </div>
                      <select
                          className="form-select"
                          name="feesGroupId" // Changed to feesGroupId to match backend expectation
                          value={
                            editTypeFormData[type._id]?.feesGroup?._id !== undefined
                              ? editTypeFormData[type._id]?.feesGroup?._id ?? "" // Use nullish coalescing for safety
                              : type.feesGroup._id
                          }
                          onChange={(e) => handleEditTypeInputChange(e, type._id)}
                          required
                        >
                          <option value="">Select Fees Group</option>
                          {feesGroups.map((group) => (
                            <option key={group._id} value={group._id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={4}
                        name="description"
                        value={editTypeFormData[type._id]?.description !== undefined ? editTypeFormData[type._id].description : type.description || ""}
                        onChange={(e) => handleEditTypeInputChange(e, type._id)}
                        placeholder="Add Description"
                      />
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="status-title">
                        <h5>Status</h5>
                        <p>Change the Status by toggle</p>
                      </div>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          checked={editTypeFormData[type._id]?.status !== undefined ? editTypeFormData[type._id].status === "Active" : type.status === "Active"}
                          onChange={(e) => handleEditTypeToggleChange(e, type._id)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setEditModalId(null)}>Cancel</Button>
                <Button variant="primary" type="submit">Save Changes</Button>
              </Modal.Footer>
            </form>
          </Modal>

          <Modal show={deleteModalId === type._id && isFeesTypePage} onHide={() => setDeleteModalId(null)} centered>
            <Modal.Body className="text-center">
              <span className="delete-icon"><i className="ti ti-trash-x" /></span>
              <h4>Confirm Deletion</h4>
              <p>Are you sure you want to delete "{type.name}"? This action cannot be undone.</p>
              <div className="d-flex justify-content-center">
                <Button variant="light" className="me-3" onClick={() => setDeleteModalId(null)}>Cancel</Button>
                <Button variant="danger" onClick={() => handleDeleteFeesType(type._id)}>Yes, Delete</Button>
              </div>
            </Modal.Body>
          </Modal>
        </React.Fragment>
      ))}

      {/* Edit Fees Group Modals */}
      {feesGroups.map((group) => (
        <React.Fragment key={group._id}>
          <Modal show={editModalId === group._id && isFeesGroupPage} onHide={() => setEditModalId(null)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Edit Fees Group</Modal.Title>
            </Modal.Header>
            <form onSubmit={(e) => handleEditFeesGroup(e, group._id)}>
              <Modal.Body>
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Fees Group</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={editFormData[group._id]?.name !== undefined ? editFormData[group._id].name : group.name}
                        onChange={(e) => handleEditInputChange(e, group._id)}
                        placeholder="Enter Fees Group"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={4}
                        name="description"
                        value={editFormData[group._id]?.description !== undefined ? editFormData[group._id].description : group.description || ""}
                        onChange={(e) => handleEditInputChange(e, group._id)}
                        placeholder="Add Description"
                      />
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="status-title">
                        <h5>Status</h5>
                        <p>Change the Status by toggle</p>
                      </div>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          checked={editFormData[group._id]?.status !== undefined ? editFormData[group._id].status === "Active" : group.status === "Active"}
                          onChange={(e) => handleEditToggleChange(e, group._id)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setEditModalId(null)}>Cancel</Button>
                <Button variant="primary" type="submit">Save Changes</Button>
              </Modal.Footer>
            </form>
          </Modal>

          <Modal show={deleteModalId === group._id && isFeesGroupPage} onHide={() => setDeleteModalId(null)} centered>
            <Modal.Body className="text-center">
              <span className="delete-icon"><i className="ti ti-trash-x" /></span>
              <h4>Confirm Deletion</h4>
              <p>Are you sure you want to delete "{group.name}"? This action cannot be undone.</p>
              <div className="d-flex justify-content-center">
                <Button variant="light" className="me-3" onClick={() => setDeleteModalId(null)}>Cancel</Button>
                <Button variant="danger" onClick={() => handleDeleteFeesGroup(group._id)}>Yes, Delete</Button>
              </div>
            </Modal.Body>
          </Modal>
        </React.Fragment>
      ))}
    </>
  );
};

export default FeesModal;