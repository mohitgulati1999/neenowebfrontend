import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import PredefinedDateRanges from "../../../core/common/datePicker";
import { status } from "../../../core/common/selectoption/selectoption";
import CommonSelect from "../../../core/common/commonSelect";
import TooltipOption from "../../../core/common/tooltipOption";
import axios from "axios";
import Table from "../../../core/common/dataTable/index";
import { TableData } from "../../../core/data/interface";
import { Modal } from "bootstrap"; // Import Modal directly
import toast, { Toaster } from "react-hot-toast"; // Import react-hot-toast

interface Session {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  sessionId: string;
  status: string;
}

const SessionUI = () => {
  const routes = all_routes;
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    sessionId: "",
    status: "inactive",
  });
  const [editSession, setEditSession] = useState<Session | null>(null); // State for the session being edited
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null); // State for the session to delete

  // Fetch sessions from the API
  const fetchSessions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/session/get", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setSessions(res.data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to fetch sessions. Please try again.");
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Handle form input changes for both add and edit forms
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submission for adding a session
  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();

    const sessionData = {
      ...formData,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
    };
    console.log(sessionData);
    try {
      const response = await axios.post("http://localhost:5000/api/session/create", sessionData,{
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.status === 201) {
        toast.success("Session created successfully!");
        fetchSessions();
        setFormData({
          name: "",
          startDate: "",
          endDate: "",
          sessionId: "",
          status: "inactive",
        });
        const modal = document.getElementById("add_session");
        if (modal) {
          const modalInstance = Modal.getInstance(modal) || new Modal(modal);
          modalInstance.hide();
        }
      }
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to create session. Please try again.");
    }
  };

  // Handle edit button click to populate the edit modal
  const handleEditClick = (session: Session) => {
    setEditSession(session);
    // Pre-fill the form with session data (convert dates to YYYY-MM-DD for input)
    setFormData({
      name: session.name,
      startDate: new Date(session.startDate).toISOString().split("T")[0],
      endDate: new Date(session.endDate).toISOString().split("T")[0],
      sessionId: session.sessionId,
      status: session.status,
    });
  };

  // Handle form submission for editing a session
  const handleEditSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editSession) return;

    const updatedSessionData = {
      ...formData,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
    };

    try {
      const response = await axios.put(
        `http://localhost:5000/api/session/update/${editSession._id}`,
        updatedSessionData,{
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.status === 200) {
        toast.success("Session updated successfully!");
        fetchSessions();
        setEditSession(null); // Clear the edit state
        setFormData({
          name: "",
          startDate: "",
          endDate: "",
          sessionId: "",
          status: "inactive",
        });
        const modal = document.getElementById("edit_session");
        if (modal) {
          const modalInstance = Modal.getInstance(modal) || new Modal(modal);
          modalInstance.hide();
        }
      }
    } catch (error) {
      console.error("Error updating session:", error);
      toast.error("Failed to update session. Please try again.");
    }
  };

  // Handle delete button click to set the session to delete
  const handleDeleteClick = (session: Session) => {
    setSessionToDelete(session);
  };

  // Handle form submission for deleting a session
  const handleDeleteSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionToDelete) return;

    try {
      const response = await axios.delete(
        `http://localhost:5000/api/session/delete/${sessionToDelete._id}`,{
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.status === 200) {
        toast.success("Session deleted successfully!");
        setSessions((prev) => prev.filter((session) => session._id !== sessionToDelete._id));
        setSessionToDelete(null); // Clear the delete state
        const modal = document.getElementById("delete-modal");
        if (modal) {
          const modalInstance = Modal.getInstance(modal) || new Modal(modal);
          modalInstance.hide();
        }
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete session. Please try again.");
    }
  };

  // Handle filter apply click
  const handleApplyClick = () => {
    if (dropdownMenuRef.current) {
      dropdownMenuRef.current.classList.remove("show");
    }
  };

  // Table columns
  const columns = [
    {
      title: "ID",
      dataIndex: "sessionId",
      render: (text: string, record: Session) => (
        <Link to="#" className="link-primary">
          {record.sessionId}
        </Link>
      ),
      sorter: (a: Session, b: Session) => a.sessionId.length - b.sessionId.length,
    },
    {
      title: "Name",
      dataIndex: "name",
      sorter: (a: TableData, b: TableData) => a.name.length - b.name.length,
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      render: (text: string) => new Date(text).toLocaleDateString(),
      sorter: (a: TableData, b: TableData) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      render: (text: string) => new Date(text).toLocaleDateString(),
      sorter: (a: TableData, b: TableData) =>
        new Date(a.endDate).getTime() - new Date(b.endDate).getTime(),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: string) => (
        <span
          className={`badge badge-soft-${
            text === "active" ? "success" : "danger"
          } d-inline-flex align-items-center`}
        >
          <i className="ti ti-circle-filled fs-5 me-1"></i>
          {text}
        </span>
      ),
      sorter: (a: TableData, b: TableData) => a.status.length - b.status.length,
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_: any, record: Session) => (
        <div className="dropdown">
          <Link
            to="#"
            className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="ti ti-dots-vertical fs-14" />
          </Link>
          <ul className="dropdown-menu dropdown-menu-right p-3">
            <li>
              <Link
                className="dropdown-item rounded-1"
                to="#"
                data-bs-toggle="modal"
                data-bs-target="#edit_session"
                onClick={() => handleEditClick(record)}
              >
                <i className="ti ti-edit-circle me-2" />
                Edit
              </Link>
            </li>
            <li>
              <Link
                className="dropdown-item rounded-1"
                to="#"
                data-bs-toggle="modal"
                data-bs-target="#delete-modal"
                onClick={() => handleDeleteClick(record)} // Set the session to delete
              >
                <i className="ti ti-trash-x me-2" />
                Delete
              </Link>
            </li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Toaster position="top-right" reverseOrder={false} />

      <div className="page-wrapper">
        <div className="content">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Sessions</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Sessions
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <TooltipOption />
              <div className="mb-2">
                <Link
                  to="#"
                  className="btn btn-primary"
                  data-bs-toggle="modal"
                  data-bs-target="#add_session"
                >
                  <i className="ti ti-square-rounded-plus-filled me-2" />
                  Add Session
                </Link>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Sessions</h4>
              <div className="d-flex align-items-center flex-wrap">
                <div className="input-icon-start mb-3 me-2 position-relative">
                  <PredefinedDateRanges />
                </div>
                <div className="dropdown mb-3 me-2">
                  <Link
                    to="#"
                    className="btn btn-outline-light bg-white dropdown-toggle"
                    data-bs-toggle="dropdown"
                    data-bs-auto-close="outside"
                  >
                    <i className="ti ti-filter me-2" />
                    Filter
                  </Link>
                  <div className="dropdown-menu drop-width" ref={dropdownMenuRef}>
                    <form>
                      <div className="d-flex align-items-center border-bottom p-3">
                        <h4>Filter</h4>
                      </div>
                      <div className="p-3 border-bottom pb-0">
                        <div className="row">
                          <div className="col-md-12">
                            <div className="mb-3">
                              <label className="form-label">Status</label>
                              <CommonSelect
                                className="select"
                                options={status}
                                defaultValue={status.find(
                                  (option) => option.value === formData.status
                                )}
                                onChange={(option) => {
                                  if (option) {
                                    setFormData({
                                      ...formData,
                                      status: option.value,
                                    });
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 d-flex align-items-center justify-content-end">
                        <Link to="#" className="btn btn-light me-3">
                          Reset
                        </Link>
                        <Link
                          to="#"
                          className="btn btn-primary"
                          onClick={handleApplyClick}
                        >
                          Apply
                        </Link>
                      </div>
                    </form>
                  </div>
                </div>
                <div className="dropdown mb-3">
                  <Link
                    to="#"
                    className="btn btn-outline-light bg-white dropdown-toggle"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-sort-ascending-2 me-2" />
                    Sort by A-Z
                  </Link>
                  <ul className="dropdown-menu p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1 active">
                        Ascending
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Descending
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Recently Viewed
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Recently Added
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body p-0 py-3">
              <Table columns={columns} dataSource={sessions} Selection={true} />
            </div>
          </div>
        </div>
      </div>

      {/* Add Session Modal */}
      <div className="modal fade" id="add_session">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Session</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleAddSession}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Session ID</label>
                      <input
                        type="text"
                        className="form-control"
                        name="sessionId"
                        value={formData.sessionId}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <CommonSelect
                        className="select"
                        options={status}
                        defaultValue={status.find(
                          (option) => option.value === formData.status
                        )}
                        onChange={(option) => {
                          if (option) {
                            setFormData({
                              ...formData,
                              status: option.value,
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Link
                  to="#"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </Link>
                <button type="submit" className="btn btn-primary">
                  Add Session
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Session Modal */}

      {/* Edit Session Modal */}
      <div className="modal fade" id="edit_session">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Session</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleEditSession}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Session ID</label>
                      <input
                        type="text"
                        className="form-control"
                        name="sessionId"
                        value={formData.sessionId}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <CommonSelect
                        className="select"
                        options={status}
                        defaultValue={status.find(
                          (option) => option.value === formData.status
                        )}
                        onChange={(option) => {
                          if (option) {
                            setFormData({
                              ...formData,
                              status: option.value,
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Link
                  to="#"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </Link>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Session Modal */}

      {/* Delete Modal */}
      <div className="modal fade" id="delete-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={handleDeleteSession}>
              <div className="modal-body text-center">
                <span className="delete-icon">
                  <i className="ti ti-trash-x" />
                </span>
                <h4>Confirm Deletion</h4>
                <p>
                  Are you sure you want to delete the session "{sessionToDelete?.name}"? This cannot be undone.
                </p>
                <div className="d-flex justify-content-center">
                  <Link
                    to="#"
                    className="btn btn-light me-3"
                    data-bs-dismiss="modal"
                    onClick={() => setSessionToDelete(null)} // Clear the delete state on cancel
                  >
                    Cancel
                  </Link>
                  <button type="submit" className="btn btn-danger">
                    Yes, Delete
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Delete Modal */}
    </div>
  );
};

export default SessionUI;