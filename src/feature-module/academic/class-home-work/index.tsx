import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as bootstrap from "bootstrap";
import toast, { Toaster } from "react-hot-toast";

// Define interfaces for data structures
interface User {
  userId: string;
  role: "admin" | "teacher" | "parent" | "student";
}

interface Class {
  _id: string;
  name: string;
}

interface Homework {
  _id: string;
  title: string;
  subject: string;
  description: string;
  teacherId: {
    _id: string;
    name: string;
    email: string;
  };
  teacherName: string;
  dueDate: string;
  createdAt: string;
  classId: {
    _id: string;
    name: string;
  };
}

const ClassHomeWork: React.FC = () => {
  // Decode JWT token to get userId and role
  const decodeToken = (token: string): { userId: string; role: string } | null => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const token = localStorage.getItem("token");
  const decoded = token ? decodeToken(token) : null;
  const currentUser: User = decoded
    ? { userId: decoded.userId, role: decoded.role as "admin" | "teacher" | "parent" | "student" }
    : { userId: "", role: "teacher" };

  const [homework, setHomework] = useState<Homework[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);

  // Show error toasts when error state changes
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Fetch classes and homework
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch classes (for admin dropdown and teacher modal)
        const classResponse = await axios.get<Class[]>("http://localhost:5000/api/class", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClasses(classResponse.data);

        // Fetch homework based on user role
        const params = currentUser.role === "admin" && selectedClass ? { classId: selectedClass } : {};
        console.log("Fetching homework with params:", params); // Debug log
        const homeworkResponse = await axios.get<Homework[]>("http://localhost:5000/api/homework", {
          params,
          headers: { Authorization: `Bearer ${token}` },
        });
        setHomework(homeworkResponse.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser.role, selectedClass, token]);

  // Handle adding new homework
  const handleAddHomework = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const homeworkData = {
      title: formData.get("title") as string,
      subject: formData.get("subject") as string,
      description: formData.get("description") as string,
      dueDate: formData.get("dueDate") as string,
      classId: formData.get("classId") as string,
    };

    console.log("Sending homework data:", homeworkData); // Debug log

    if (!homeworkData.classId) {
      setError("Please select a class");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/homework/add", homeworkData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Refresh homework list
      const params = currentUser.role === "admin" && selectedClass ? { classId: selectedClass } : {};
      const homeworkResponse = await axios.get<Homework[]>("http://localhost:5000/api/homework", {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setHomework(homeworkResponse.data);
      (e.target as HTMLFormElement).reset();
      // Close modal programmatically
      const modalElement = document.getElementById("add_home_work");
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
      }
      toast.success(response.data.message || "Homework added successfully");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add homework");
    }
  };

  // Handle editing homework
  const handleEditHomework = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedHomework) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const homeworkData = {
      title: formData.get("title") as string,
      subject: formData.get("subject") as string,
      description: formData.get("description") as string,
      dueDate: formData.get("dueDate") as string,
      classId: formData.get("classId") as string,
    };

    console.log("Sending edit homework data:", homeworkData); // Debug log

    if (!homeworkData.classId) {
      setError("Please select a class");
      return;
    }

    try {
      await axios.put(`http://localhost:5000/api/homework/${selectedHomework._id}`, homeworkData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Refresh homework list
      const params = currentUser.role === "admin" && selectedClass ? { classId: selectedClass } : {};
      const homeworkResponse = await axios.get<Homework[]>("http://localhost:5000/api/homework", {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setHomework(homeworkResponse.data);
      (e.target as HTMLFormElement).reset();
      // Close modal programmatically
      const modalElement = document.getElementById("edit_home_work");
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
      }
      toast.success("Homework updated successfully");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to edit homework");
    }
  };

  // Handle deleting homework
  const handleDeleteHomework = async () => {
    if (!selectedHomework) return;
    try {
      await axios.delete(`http://localhost:5000/api/homework/${selectedHomework._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Refresh homework list
      const params = currentUser.role === "admin" && selectedClass ? { classId: selectedClass } : {};
      const homeworkResponse = await axios.get<Homework[]>("http://localhost:5000/api/homework", {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setHomework(homeworkResponse.data);
      // Close modal programmatically
      const modalElement = document.getElementById("delete-modal");
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
      }
      toast.success("Homework deleted successfully");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete homework");
    }
  };

  // Handle viewing homework details
  const handleViewDetails = (homework: Homework) => {
    setSelectedHomework(homework);
    setShowDetailsModal(true);
    // Open modal programmatically
    const modalElement = document.getElementById("details_home_work");
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
      modal.show();
    }
  };

  // Handle filter apply
  const handleApplyClick = () => {
    if (dropdownMenuRef.current) {
      dropdownMenuRef.current.classList.remove("show");
    }
  };

  return (
    <div className="page-wrapper">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#333',
            border: '1px solid #e0e0e0',
          },
          success: {
            style: {
              border: '1px solid #28a745',
              color: '#28a745',
            },
            iconTheme: {
              primary: '#28a745',
              secondary: '#fff',
            },
          },
          error: {
            style: {
              border: '1px solid #dc3545',
              color: '#dc3545',
            },
            iconTheme: {
              primary: '#dc3545',
              secondary: '#fff',
            },
          },
        }}
      />
      <div className="content">
        {/* Page Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Class Work</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <a href="#">Dashboard</a>
                </li>
                <li className="breadcrumb-item">
                  <a href="#">Academic</a>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Class Work
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="mb-2">
              <button
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add_home_work"
              >
                <i className="ti ti-square-rounded-plus-filled me-2" />
                Add Home Work
              </button>
            </div>
          </div>
        </div>
        {/* Admin Class Selection */}
        {currentUser.role === "admin" && (
          <div className="mb-3">
            <label className="form-label">Select Class</label>
            <select
              className="form-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Homework Table */}
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Class Home Work</h4>
            <div className="d-flex align-items-center flex-wrap">
              <div className="dropdown mb-3 me-2">
                <button
                  className="btn btn-outline-light bg-white dropdown-toggle"
                  data-bs-toggle="dropdown"
                  data-bs-auto-close="outside"
                >
                  <i className="ti ti-filter me-2" />
                  Filter
                </button>
                <div className="dropdown-menu drop-width" ref={dropdownMenuRef}>
                  <form>
                    <div className="d-flex align-items-center border-bottom p-3">
                      <h4>Filter</h4>
                    </div>
                    <div className="p-3 border-bottom pb-0">
                      <div className="row">
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Subject</label>
                            <input type="text" className="form-control" name="subject" placeholder="Enter subject" />
                          </div>
                        </div>
                        {currentUser.role === "admin" && (
                          <div className="col-md-12">
                            <div className="mb-3">
                              <label className="form-label">Class</label>
                              <select className="form-select">
                                {classes.map((c) => (
                                  <option key={c._id} value={c._id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-3 d-flex align-items-center justify-content-end">
                      <button type="button" className="btn btn-light me-3">
                        Reset
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleApplyClick}
                      >
                        Apply
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          <div className="card-body p-0 py-3">
            {loading ? (
              <p>Loading...</p>
            ) : homework.length === 0 ? (
              <p>No homework found</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Subject</th>
                      <th>Homework Date</th>
                      <th>Submission Date</th>
                      <th>Created By</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {homework.map((item) => (
                      <tr key={item._id}>
                        <td>{item.classId.name || "N/A"}</td>
                        <td>{item.subject}</td>
                        <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                        <td>{new Date(item.dueDate).toLocaleDateString()}</td>
                        <td>{item.teacherId.name}</td>
                        <td>
                          <div className="dropdown">
                            <button
                              className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              <i className="ti ti-dots-vertical fs-14" />
                            </button>
                            <ul className="dropdown-menu dropdown-menu-right p-3">
                              <li>
                                <button
                                  className="dropdown-item rounded-1"
                                  onClick={() => handleViewDetails(item)}
                                >
                                  <i className="ti ti-eye me-2" />
                                  View Details
                                </button>
                              </li>
                              <li>
                                <button
                                  className="dropdown-item rounded-1"
                                  onClick={() => {
                                    setSelectedHomework(item);
                                    const modalElement = document.getElementById("edit_home_work");
                                    if (modalElement) {
                                      const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                                      modal.show();
                                    }
                                  }}
                                >
                                  <i className="ti ti-edit-circle me-2" />
                                  Edit
                                </button>
                              </li>
                              <li>
                                <button
                                  className="dropdown-item rounded-1"
                                  onClick={() => {
                                    setSelectedHomework(item);
                                    const modalElement = document.getElementById("delete-modal");
                                    if (modalElement) {
                                      const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                                      modal.show();
                                    }
                                  }}
                                >
                                  <i className="ti ti-trash-x me-2" />
                                  Delete
                                </button>
                              </li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        {/* Add Homework Modal */}
        <div className="modal fade" id="add_home_work">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Home Work</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  onClick={() => {
                    const modalElement = document.getElementById("add_home_work");
                    if (modalElement) {
                      const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                      modal.hide();
                    }
                  }}
                >
                  <i className="ti ti-x" />
                </button>
              </div>
              <form onSubmit={handleAddHomework}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Class</label>
                        <select className="form-select" name="classId" required>
                          <option value="">Select a class</option>
                          {classes.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Title</label>
                        <input
                          type="text"
                          className="form-control"
                          name="title"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Subject</label>
                        <input
                          type="text"
                          className="form-control"
                          name="subject"
                          placeholder="Enter subject"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-control"
                          rows={4}
                          name="description"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Due Date</label>
                        <input
                          type="date"
                          className="form-control"
                          name="dueDate"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light me-2"
                    onClick={() => {
                      const modalElement = document.getElementById("add_home_work");
                      if (modalElement) {
                        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                        modal.hide();
                      }
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Add Homework
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        {/* Edit Homework Modal */}
        <div className="modal fade" id="edit_home_work">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Home Work</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  onClick={() => {
                    const modalElement = document.getElementById("edit_home_work");
                    if (modalElement) {
                      const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                      modal.hide();
                    }
                  }}
                >
                  <i className="ti ti-x" />
                </button>
              </div>
              <form onSubmit={handleEditHomework}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Class</label>
                        <select className="form-select" name="classId" defaultValue={selectedHomework?.classId._id} required>
                          <option value="">Select a class</option>
                          {classes.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Title</label>
                        <input
                          type="text"
                          className="form-control"
                          name="title"
                          defaultValue={selectedHomework?.title}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Subject</label>
                        <input
                          type="text"
                          className="form-control"
                          name="subject"
                          defaultValue={selectedHomework?.subject}
                          placeholder="Enter subject"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-control"
                          rows={4}
                          name="description"
                          defaultValue={selectedHomework?.description}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Due Date</label>
                        <input
                          type="date"
                          className="form-control"
                          name="dueDate"
                          defaultValue={selectedHomework?.dueDate.split("T")[0]}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light me-2"
                    onClick={() => {
                      const modalElement = document.getElementById("edit_home_work");
                      if (modalElement) {
                        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                        modal.hide();
                      }
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        {/* Delete Modal */}
        <div className="modal fade" id="delete-modal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center">
                <span className="delete-icon">
                  <i className="ti ti-trash-x" />
                </span>
                <h4>Confirm Deletion</h4>
                <p>You want to delete this homework. This cannot be undone once deleted.</p>
                <div className="d-flex justify-content-center">
                  <button
                    type="button"
                    className="btn btn-light me-3"
                    onClick={() => {
                      const modalElement = document.getElementById("delete-modal");
                      if (modalElement) {
                        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                        modal.hide();
                      }
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDeleteHomework}
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Details Modal */}
        <div className="modal fade" id="details_home_work">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Homework Details</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  onClick={() => {
                    setShowDetailsModal(false);
                    const modalElement = document.getElementById("details_home_work");
                    if (modalElement) {
                      const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                      modal.hide();
                    }
                  }}
                >
                  <i className="ti ti-x" />
                </button>
              </div>
              <div className="modal-body">
                {selectedHomework && (
                  <div>
                    <p><strong>Title:</strong> {selectedHomework.title}</p>
                    <p><strong>Class:</strong> {selectedHomework.classId.name || "N/A"}</p>
                    <p><strong>Subject:</strong> {selectedHomework.subject}</p>
                    <p><strong>Description:</strong> {selectedHomework.description}</p>
                    <p><strong>Homework Date:</strong> {new Date(selectedHomework.createdAt).toLocaleDateString()}</p>
                    <p><strong>Submission Date:</strong> {new Date(selectedHomework.dueDate).toLocaleDateString()}</p>
                    <p><strong>Created By:</strong> {selectedHomework.teacherId.name}</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => {
                    setShowDetailsModal(false);
                    const modalElement = document.getElementById("details_home_work");
                    if (modalElement) {
                      const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                      modal.hide();
                    }
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassHomeWork;