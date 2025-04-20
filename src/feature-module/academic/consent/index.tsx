import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as bootstrap from "bootstrap";
import toast, { Toaster } from "react-hot-toast";
const API_URL = process.env.REACT_APP_URL;
// Define interfaces for data structures
interface User {
  userId: string;
  role: "admin" | "teacher" | "parent" | "student";
}

interface Class {
  _id: string;
  name: string;
}

interface Session {
  _id: string;
  name: string;
}

interface Consent {
  _id: string;
  title: string;
  description: string;
  sessionId: {
    _id: string;
    name: string;
  };
  classId: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface ConsentResponse {
  _id: string;
  consentId: Consent;
  studentId: {
    _id: string;
    name: string;
    admissionNumber: string;
  };
  parentId: {
    _id: string;
    name: string;
    email: string;
  };
  status: "pending" | "approved" | "rejected";
  responseDate?: string;
  respondedBy?: {
    _id: string;
    name: string;
  };
}

const Consents: React.FC = () => {
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

  const [consents, setConsents] = useState<Consent[]>([]);
  const [consentResponses, setConsentResponses] = useState<ConsentResponse[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [showResponsesModal, setShowResponsesModal] = useState<boolean>(false);
  const [showRespondModal, setShowRespondModal] = useState<boolean>(false);
  const [selectedConsent, setSelectedConsent] = useState<Consent | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<ConsentResponse | null>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);

  // Show error toasts only for user actions (not fetching)
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Fetch classes, sessions, and consents
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch classes
        const classResponse = await axios.get<Class[]>(`${API_URL}/api/class`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClasses(classResponse.data);

        // Fetch sessions
        const sessionResponse = await axios.get<Session[]>(`${API_URL}/api/session/get`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSessions(sessionResponse.data);

        // Fetch consents based on role
        let consentEndpoint = "";
        let params = {};
        if (currentUser.role === "parent") {
          consentEndpoint = `${API_URL}/api/consent/my-consents`;
        } else if (currentUser.role === "teacher") {
          consentEndpoint = `${API_URL}/api/consent/teacher`;
        } else if (currentUser.role === "admin") {
          consentEndpoint = `${API_URL}/api/consent/admin`;
          if (selectedClass) {
            params = { classId: selectedClass };
          }
        }

        console.log(`Fetching consents from ${consentEndpoint} with params:`, params);
        const consentResponse = await axios.get<Consent[] | ConsentResponse[]>(consentEndpoint, {
          params,
          headers: { Authorization: `Bearer ${token}` },
        });

        if (currentUser.role === "parent") {
          const responses = consentResponse.data as ConsentResponse[];
          setConsentResponses(responses);
          const uniqueConsents = Array.from(
            new Map(responses.map((r) => [r.consentId._id, r.consentId])).values()
          );
          setConsents(uniqueConsents);
        } else {
          setConsents(consentResponse.data as Consent[]);
        }
      } catch (err: any) {
        // Suppress error toast for fetching
        console.error("Failed to fetch data:", err.response?.data?.message || err.message);
        setConsents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser.role, selectedClass, token]);

  // Handle adding new consent
  const handleAddConsent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const consentData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      sessionId: formData.get("sessionId") as string,
      classId: formData.get("classId") as string,
    };

    console.log("Sending consent data:", consentData);

    if (!consentData.classId || !consentData.sessionId) {
      setError("Please select a class and session");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/consent/create`, consentData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Refresh consents list
      const consentEndpoint = currentUser.role === "teacher" ? `${API_URL}/api/consent/teacher` : `${API_URL}/api/consent/admin`;
      const params = currentUser.role === "admin" && selectedClass ? { classId: selectedClass } : {};
      const consentResponse = await axios.get<Consent[]>(consentEndpoint, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setConsents(consentResponse.data);

      (e.target as HTMLFormElement).reset();
      const modalElement = document.getElementById("add_consent");
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
      }
      toast.success(response.data.message || "Consent request created successfully");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create consent");
    }
  };

  // Handle responding to consent
  const handleRespondConsent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedResponse) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const responseData = {
      consentResponseId: selectedResponse._id,
      status: formData.get("status") as "approved" | "rejected",
    };

    console.log("Sending consent response data:", responseData);

    try {
      const response = await axios.put(`${API_URL}/api/consent/respond`, responseData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Refresh consents list
      const consentResponse = await axios.get<ConsentResponse[]>(`${API_URL}/api/consent/my-consents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConsentResponses(consentResponse.data);
      const uniqueConsents = Array.from(
        new Map(consentResponse.data.map((r) => [r.consentId._id, r.consentId])).values()
      );
      setConsents(uniqueConsents);

      const modalElement = document.getElementById("respond_consent");
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
      }
      toast.success(response.data.message || `Consent ${responseData.status} successfully`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to respond to consent");
    }
  };

  // Handle viewing consent details
  const handleViewDetails = (consent: Consent) => {
    setSelectedConsent(consent);
    setShowDetailsModal(true);
    const modalElement = document.getElementById("details_consent");
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
      modal.show();
    }
  };

  // Handle viewing consent responses
  const handleViewResponses = async (consent: Consent) => {
    try {
      const response = await axios.get<ConsentResponse[]>(`${API_URL}/api/consent/responses/${consent._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filter responses to show only one per student
      const filteredResponses: ConsentResponse[] = [];
      const studentIds = new Set<string>();

      response.data.forEach((res) => {
        const studentId = res.studentId._id;
        if (!studentIds.has(studentId)) {
          // If there's a non-pending response, use it
          const nonPending = response.data.find(
            (r) => r.studentId._id === studentId && r.status !== "pending"
          );
          if (nonPending) {
            filteredResponses.push(nonPending);
          } else {
            // Otherwise, use the first pending response
            filteredResponses.push(res);
          }
          studentIds.add(studentId);
        }
      });

      setConsentResponses(filteredResponses);
      setSelectedConsent(consent);
      setShowResponsesModal(true);
      const modalElement = document.getElementById("responses_consent");
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.show();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch consent responses");
    }
  };

  // Handle responding to consent (parent)
  const handleOpenRespondModal = (response: ConsentResponse) => {
    setSelectedResponse(response);
    setShowRespondModal(true);
    const modalElement = document.getElementById("respond_consent");
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
      modal.show();
    }
  };

  // Handle filter apply (stub for future title filtering)
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
            background: "#fff",
            color: "#333",
            border: "1px solid #e0e0e0",
          },
          success: {
            style: {
              border: "1px solid #28a745",
              color: "#28a745",
            },
            iconTheme: {
              primary: "#28a745",
              secondary: "#fff",
            },
          },
          error: {
            style: {
              border: "1px solid #dc3545",
              color: "#dc3545",
            },
            iconTheme: {
              primary: "#dc3545",
              secondary: "#fff",
            },
          },
        }}
      />
      <div className="content">
        {/* Page Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Consents</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <a href="#">Dashboard</a>
                </li>
                <li className="breadcrumb-item">
                  <a href="#">Academic</a>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Consents
                </li>
              </ol>
            </nav>
          </div>
          {(currentUser.role === "admin" || currentUser.role === "teacher") && (
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="mb-2">
                <button
                  className="btn btn-primary"
                  data-bs-toggle="modal"
                  data-bs-target="#add_consent"
                >
                  <i className="ti ti-square-rounded-plus-filled me-2" />
                  Add Consent
                </button>
              </div>
            </div>
          )}
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
        {/* Consents Table */}
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Consent Requests</h4>
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
                            <label className="form-label">Title</label>
                            <input type="text" className="form-control" name="title" placeholder="Enter title" />
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
            ) : consents.length === 0 ? (
              <p>{selectedClass ? "No consents found for this class" : "No consents found"}</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Class</th>
                      <th>Session</th>
                      <th>Created Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consents.map((consent) => (
                      <tr key={consent._id}>
                        <td>{consent.title}</td>
                        <td>{consent.classId.name || "N/A"}</td>
                        <td>{consent.sessionId.name || "N/A"}</td>
                        <td>{new Date(consent.createdAt).toLocaleDateString()}</td>
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
                                  onClick={() => handleViewDetails(consent)}
                                >
                                  <i className="ti ti-eye me-2" />
                                  View Details
                                </button>
                              </li>
                              {(currentUser.role === "teacher" || currentUser.role === "admin") && (
                                <li>
                                  <button
                                    className="dropdown-item rounded-1"
                                    onClick={() => handleViewResponses(consent)}
                                  >
                                    <i className="ti ti-list me-2" />
                                    View Responses
                                  </button>
                                </li>
                              )}
                              {currentUser.role === "parent" && (
                                <li>
                                  <button
                                    className="dropdown-item rounded-1"
                                    onClick={() => {
                                      const response = consentResponses.find(
                                        (r) =>
                                          r.consentId._id === consent._id &&
                                          r.parentId._id === currentUser.userId &&
                                          r.status === "pending"
                                      );
                                      if (response) {
                                        handleOpenRespondModal(response);
                                      } else {
                                        toast.error("No pending response available");
                                      }
                                    }}
                                  >
                                    <i className="ti ti-check me-2" />
                                    Respond
                                  </button>
                                </li>
                              )}
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
        {/* Add Consent Modal */}
        {(currentUser.role === "admin" || currentUser.role === "teacher") && (
          <div className="modal fade" id="add_consent">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Add Consent Request</h4>
                  <button
                    type="button"
                    className="btn-close custom-btn-close"
                    onClick={() => {
                      const modalElement = document.getElementById("add_consent");
                      if (modalElement) {
                        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                        modal.hide();
                      }
                    }}
                  >
                    <i className="ti ti-x" />
                  </button>
                </div>
                <form onSubmit={handleAddConsent}>
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
                          <label className="form-label">Session</label>
                          <select className="form-select" name="sessionId" required>
                            <option value="">Select a session</option>
                            {sessions.map((s) => (
                              <option key={s._id} value={s._id}>
                                {s.name}
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
                            placeholder="e.g., Annual Picnic Consent"
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Description</label>
                          <textarea
                            className="form-control"
                            rows={4}
                            name="description"
                            placeholder="Describe the activity (e.g., picnic details)"
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
                        const modalElement = document.getElementById("add_consent");
                        if (modalElement) {
                          const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                          modal.hide();
                        }
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Add Consent
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        {/* Details Consent Modal */}
        <div className="modal fade" id="details_consent">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Consent Details</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  onClick={() => {
                    setShowDetailsModal(false);
                    const modalElement = document.getElementById("details_consent");
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
                {selectedConsent && (
                  <div>
                    <p><strong>Title:</strong> {selectedConsent.title}</p>
                    <p><strong>Class:</strong> {selectedConsent.classId.name || "N/A"}</p>
                    <p><strong>Session:</strong> {selectedConsent.sessionId.name || "N/A"}</p>
                    <p><strong>Description:</strong> {selectedConsent.description}</p>
                    <p><strong>Created Date:</strong> {new Date(selectedConsent.createdAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => {
                    setShowDetailsModal(false);
                    const modalElement = document.getElementById("details_consent");
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
        {/* Responses Consent Modal */}
        {(currentUser.role === "teacher" || currentUser.role === "admin") && (
          <div className="modal fade" id="responses_consent">
            <div className="modal-dialog modal-xl" style={{ maxWidth: "90vw" }}>
              <div className="modal-content" style={{ maxHeight: "80vh", overflowY: "auto" }}>
                <div className="modal-header">
                  <h4 className="modal-title">Consent Responses</h4>
                  <button
                    type="button"
                    className="btn-close custom-btn-close"
                    onClick={() => {
                      setShowResponsesModal(false);
                      const modalElement = document.getElementById("responses_consent");
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
                  {selectedConsent && (
                    <div>
                      <h5>{selectedConsent.title}</h5>
                      <p><strong>Class:</strong> {selectedConsent.classId.name || "N/A"}</p>
                      {consentResponses.length === 0 ? (
                        <p>No responses found</p>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-striped">
                            <thead>
                              <tr>
                                <th>Student</th>
                                <th>Admission Number</th>
                                <th>Parent</th>
                                <th>Status</th>
                                <th>Response Date</th>
                                <th>Responded By</th>
                              </tr>
                            </thead>
                            <tbody>
                              {consentResponses.map((response) => (
                                <tr key={response._id}>
                                  <td>{response.studentId?.name || "N/A"}</td>
                                  <td>{response.studentId?.admissionNumber || "N/A"}</td>
                                  <td>{response.parentId?.name || "N/A"} ({response.parentId?.email || "N/A"})</td>
                                  <td>
                                    <span
                                      className={`badge ${
                                        response.status === "approved"
                                          ? "bg-success"
                                          : response.status === "rejected"
                                          ? "bg-danger"
                                          : "bg-warning"
                                      }`}
                                    >
                                      {response.status}
                                    </span>
                                  </td>
                                  <td>
                                    {response.responseDate
                                      ? new Date(response.responseDate).toLocaleDateString()
                                      : "N/A"}
                                  </td>
                                  <td>{response.respondedBy?.name || "N/A"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => {
                      setShowResponsesModal(false);
                      const modalElement = document.getElementById("responses_consent");
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
        )}
        {/* Respond Consent Modal */}
        {currentUser.role === "parent" && (
          <div className="modal fade" id="respond_consent">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Respond to Consent</h4>
                  <button
                    type="button"
                    className="btn-close custom-btn-close"
                    onClick={() => {
                      setShowRespondModal(false);
                      const modalElement = document.getElementById("respond_consent");
                      if (modalElement) {
                        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                        modal.hide();
                      }
                    }}
                  >
                    <i className="ti ti-x" />
                  </button>
                </div>
                <form onSubmit={handleRespondConsent}>
                  <div className="modal-body">
                    {selectedResponse && (
                      <div>
                        <p><strong>Title:</strong> {selectedResponse.consentId.title}</p>
                        <p><strong>Student:</strong> {selectedResponse.studentId.name}</p>
                        <p><strong>Description:</strong> {selectedResponse.consentId.description}</p>
                        <div className="mb-3">
                          <label className="form-label">Response</label>
                          <select className="form-select" name="status" required>
                            <option value="">Select response</option>
                            <option value="approved">Approve</option>
                            <option value="rejected">Reject</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-light me-2"
                      onClick={() => {
                        setShowRespondModal(false);
                        const modalElement = document.getElementById("respond_consent");
                        if (modalElement) {
                          const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                          modal.hide();
                        }
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Submit Response
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Consents;