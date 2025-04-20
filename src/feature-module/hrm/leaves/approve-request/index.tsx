import React, { useState, useEffect, useRef } from "react";
import { all_routes } from "../../../router/all_routes";
import { Link } from "react-router-dom";
import Table from "../../../../core/common/dataTable/index";
import CommonSelect from "../../../../core/common/commonSelect";
import { activeList, leaveType, MonthDate, Role } from "../../../../core/common/selectoption/selectoption";
import TooltipOption from "../../../../core/common/tooltipOption";
import axios from "axios";
import DateRangePicker from "react-bootstrap-daterangepicker";
import "bootstrap-daterangepicker/daterangepicker.css";
import { format } from "date-fns";
import { toast, Toaster } from "react-hot-toast";

// Interfaces
interface Leave {
  _id: string;
  studentId?: { _id: string; name: string };
  reason: { title: string; message: string };
  parentId: string;
  startDate: string;
  endDate: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: { _id: string; name: string };
  appliedAt: string;
  updatedAt: string;
  __v: number;
}

interface Class {
  _id: string;
  name: string;
}

interface CustomDateRangePickerProps {
  onChange: (range: [Date, Date] | null) => void;
}

interface TableData {
  id: string;
  submittedBy: string;
  leaveType: string;
  role: string;
  leaveDate: string;
  noofDays: string;
  appliedOn: string;
  authority: string;
  status: "Approved" | "Pending" | "Declined";
}

interface SelectOption {
  value: string;
  label: string;
}

interface User {
  userId: string;
  role: "admin" | "teacher" | "parent" | "student";
}

const CustomDateRangePicker: React.FC<CustomDateRangePickerProps> = ({ onChange }) => {
  const handleCallback = (start: any, end: any) => {
    const startDate = start.toDate();
    const endDate = end.toDate();
    onChange([startDate, endDate]);
  };

  return (
    <DateRangePicker
      onCallback={handleCallback}
      initialSettings={{
        autoUpdateInput: true,
        locale: { format: "MM/DD/YYYY" },
        placeholder: "Select date range",
      }}
    >
      <input type="text" className="form-control" placeholder="Select date range" />
    </DateRangePicker>
  );
};

const ApproveRequest: React.FC = () => {
  const routes = all_routes;
  const apiBaseUrl = process.env.REACT_APP_URL;
  const [leaves, setLeaves] = useState<TableData[]>([]);
  const [filteredLeaves, setFilteredLeaves] = useState<TableData[]>([]);
  const [responseData, setResponseData] = useState<Leave[]>([]); // Store raw API response
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);

  const statusOptions: SelectOption[] = [
    { value: "", label: "All Statuses" },
    { value: "Pending", label: "Pending" },
    { value: "Approved", label: "Approved" },
    { value: "Declined", label: "Declined" },
  ];

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

  // Fetch user role and classes (for admins)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please log in to view leave requests.");
          return;
        }

        const decoded = decodeToken(token);
        if (decoded) {
          setCurrentUser({ userId: decoded.userId, role: decoded.role as User["role"] });
        }

        if (decoded?.role === "admin") {
          const classResponse = await axios.get<Class[]>(`${apiBaseUrl}/api/class`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setClasses(classResponse.data);
        }
      } catch (error: any) {
        console.error("Error fetching initial data:", error);
        toast.error("Failed to fetch classes.");
      }
    };
    fetchInitialData();
  }, []);

  // Fetch leave requests
  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No JWT token found in localStorage");
          toast.error("Please log in to view leave requests.");
          return;
        }

        let endpoint = "";
        let params = {};
        if (currentUser?.role === "admin") {
          endpoint = `${apiBaseUrl}/api/leaves`;
          if (selectedClass) {
            params = { classId: selectedClass };
          }
        } else if (currentUser?.role === "teacher") {
          endpoint = `${apiBaseUrl}/api/leaves/teacher`;
        } else {
          console.error("Invalid role:", currentUser?.role);
          toast.error("Unauthorized access.");
          return;
        }

        const response = await axios.get<Leave[]>(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });

        console.log("Raw API Response:", response.data);
        if (Array.isArray(response.data)) {
          setResponseData(response.data); // Store raw response
          const mappedData: TableData[] = response.data
            .filter((leave: Leave) => {
              if (!leave.studentId?.name) {
                console.warn(`Leave ${leave._id} has invalid studentId:`, leave.studentId);
                return false;
              }
              return true;
            })
            .map((leave: Leave) => ({
              id: leave._id,
              submittedBy: leave.studentId?.name || "Unknown",
              leaveType: leave.reason.title,
              role: "Student",
              leaveDate: `${format(new Date(leave.startDate), "MM/dd/yyyy")} - ${format(
                new Date(leave.endDate),
                "MM/dd/yyyy"
              )}`,
              noofDays: Math.ceil(
                (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) /
                  (1000 * 60 * 60 * 24)
              ).toString(),
              appliedOn: format(new Date(leave.appliedAt), "MM/dd/yyyy"),
              authority: leave.approvedBy?.name || "N/A",
              status:
                leave.status === "approved"
                  ? "Approved"
                  : leave.status === "rejected"
                  ? "Declined"
                  : "Pending",
            }));
          setLeaves(mappedData);
          setFilteredLeaves(mappedData);
        } else {
          console.error("Unexpected API response format:", response.data);
          setResponseData([]);
          setLeaves([]);
          setFilteredLeaves([]);
          toast.error("Unexpected data format received from server");
        }
      } catch (error: any) {
        console.error("Error fetching leaves:", error);
        if (error.response) {
          console.error("Error Response:", error.response.data);
          toast.error(`Failed to fetch leaves: ${error.response.data.message || "Please try again."}`);
        } else {
          toast.error("Failed to connect to the server. Please check your network or server status.");
        }
        setResponseData([]);
        setLeaves([]);
        setFilteredLeaves([]);
      } finally {
        setIsLoading(false);
      }
    };
    if (currentUser) {
      fetchLeaves();
    }
  }, [currentUser, selectedClass]);

  // Handle status filter and date range changes
  useEffect(() => {
    let filtered = leaves;
    if (statusFilter) {
      filtered = filtered.filter((leave) => leave.status === statusFilter);
    }
    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = new Date(dateRange[0]).setHours(0, 0, 0, 0);
      const end = new Date(dateRange[1]).setHours(23, 59, 59, 999);
      filtered = filtered.filter((leave) => {
        const leaveStart = new Date(leave.leaveDate.split(" - ")[0]).getTime();
        return leaveStart >= start && leaveStart <= end;
      });
    }
    setFilteredLeaves(filtered);
    console.log("Filtered Leaves:", filtered);
  }, [statusFilter, dateRange, leaves]);

  // Handle approve/reject actions
  const handleStatusUpdate = async (leaveId: string, status: "approved" | "rejected") => {
    try {
      const response = await axios.put(
        `${apiBaseUrl}/api/leaves/update`,
        { leaveId, status },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      const updatedStatus = status === "approved" ? "Approved" : "Declined";
      setLeaves((prev) =>
        prev.map((leave) =>
          leave.id === leaveId
            ? { ...leave, status: updatedStatus, authority: response.data.leave.approvedBy?.name || "N/A" }
            : leave
        )
      );
      setFilteredLeaves((prev) =>
        prev.map((leave) =>
          leave.id === leaveId
            ? { ...leave, status: updatedStatus, authority: response.data.leave.approvedBy?.name || "N/A" }
            : leave
        )
      );
      setResponseData((prev) =>
        prev.map((leave) =>
          leave._id === leaveId
            ? { ...leave, status, approvedBy: response.data.leave.approvedBy }
            : leave
        )
      );
      toast.success(`Leave ${status} successfully.`);
    } catch (error: any) {
      console.error("Error updating leave status:", error);
      toast.error(
        `Failed to update leave status: ${
          error.response?.data?.message || "Please try again."
        }`
      );
    }
  };

  const handleApplyClick = () => {
    if (dropdownMenuRef.current) {
      dropdownMenuRef.current.classList.remove("show");
    }
  };

  const columns = [
    {
      title: "Submitted By",
      dataIndex: "submittedBy",
      sorter: (a: TableData, b: TableData) => a.submittedBy.localeCompare(b.submittedBy),
    },
    {
      title: "Leave Type",
      dataIndex: "leaveType",
      sorter: (a: TableData, b: TableData) => a.leaveType.localeCompare(b.leaveType),
    },
    {
      title: "Role",
      dataIndex: "role",
      sorter: (a: TableData, b: TableData) => a.role.localeCompare(b.role),
    },
    {
      title: "Leave Date",
      dataIndex: "leaveDate",
      sorter: (a: TableData, b: TableData) =>
        new Date(a.leaveDate.split(" - ")[0]).getTime() -
        new Date(b.leaveDate.split(" - ")[0]).getTime(),
    },
    {
      title: "No of Days",
      dataIndex: "noofDays",
      sorter: (a: TableData, b: TableData) => parseInt(a.noofDays) - parseInt(b.noofDays),
    },
    {
      title: "Applied On",
      dataIndex: "appliedOn",
      sorter: (a: TableData, b: TableData) =>
        new Date(a.appliedOn).getTime() - new Date(b.appliedOn).getTime(),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: string) => (
        <span
          className={`badge badge-soft-${
            text === "Approved" ? "success" : text === "Pending" ? "pending" : "danger"
          } d-inline-flex align-items-center`}
        >
          <i className="ti ti-circle-filled fs-5 me-1"></i>
          {text}
        </span>
      ),
      sorter: (a: TableData, b: TableData) => a.status.localeCompare(b.status),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_: any, record: TableData) => {
        const leave = leaves.find((l) => l.id === record.id);
        if (!leave) return null;
        return (
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
                  data-bs-target="#leave_request"
                  onClick={() => {
                    const selected = responseData.find((l: Leave) => l._id === record.id);
                    if (selected) {
                      setSelectedLeave(selected);
                    } else {
                      console.warn(`Leave with ID ${record.id} not found in responseData`);
                      toast.error("Leave data not found.");
                    }
                  }}
                >
                  <i className="ti ti-menu me-2" />
                  Leave Request
                </Link>
              </li>
              {record.status === "Pending" && (
                <>
                  <li>
                    <Link
                      className="dropdown-item rounded-1"
                      to="#"
                      onClick={() => handleStatusUpdate(record.id, "approved")}
                    >
                      <i className="ti ti-check-circle me-2" />
                      Approve
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="dropdown-item rounded-1"
                      to="#"
                      onClick={() => handleStatusUpdate(record.id, "rejected")}
                    >
                      <i className="ti ti-x-circle me-2" />
                      Reject
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />
      <div className="page-wrapper">
        <div className="content">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Approved Leave Request</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="#">HRM</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Approved Leave Request
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <TooltipOption />
            </div>
          </div>
          {/* Class Selection for Admins */}
          {currentUser?.role === "admin" && (
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
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Approved Leave Request List</h4>
              <div className="d-flex align-items-center flex-wrap">
                <div className="input-icon-start mb-3 me-2 position-relative">
                  <CustomDateRangePicker onChange={(range) => setDateRange(range)} />
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
                      <div className="p-3 border-bottom">
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label">Leave Type</label>
                              <CommonSelect className="select" options={leaveType} />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label">Role</label>
                              <CommonSelect className="select" options={Role} />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-0">
                              <label className="form-label">From - To Date</label>
                              <CommonSelect className="select" options={MonthDate} />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-0">
                              <label className="form-label">Status</label>
                              <CommonSelect
                                className="select"
                                options={statusOptions}
                                defaultValue={statusOptions[0]}
                                onChange={(option) => setStatusFilter(option?.value || "")}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 d-flex align-items-center justify-content-end">
                        <Link
                          to="#"
                          className="btn btn-light me-3"
                          onClick={() => setStatusFilter("")}
                        >
                          Reset
                        </Link>
                        <Link to="#" className="btn btn-primary" onClick={handleApplyClick}>
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
              {isLoading ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : filteredLeaves.length === 0 ? (
                <div className="text-center py-3">
                  <p>{selectedClass ? "No leave requests found for this class." : "No leave requests found."}</p>
                </div>
              ) : (
                <Table dataSource={filteredLeaves} columns={columns} Selection={true} />
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Leave Request Modal */}
      <div className="modal fade" id="leave_request">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Leave Request</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form>
              <div className="modal-body">
                {selectedLeave ? (
                  <div className="student-leave-info">
                    <ul>
                      <li>
                        <span>Submitted By</span>
                        <h6>{selectedLeave.studentId?.name || "Unknown Student"}</h6>
                      </li>
                      <li>
                        <span>Role</span>
                        <h6>Student</h6>
                      </li>
                      <li>
                        <span>Leave Type</span>
                        <h6>{selectedLeave.reason.title || "N/A"}</h6>
                      </li>
                      <li>
                        <span>No of Days</span>
                        <h6>
                          {selectedLeave
                            ? Math.ceil(
                                (new Date(selectedLeave.endDate).getTime() -
                                  new Date(selectedLeave.startDate).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            : "N/A"}
                        </h6>
                      </li>
                      <li>
                        <span>Applied On</span>
                        <h6>
                          {selectedLeave
                            ? format(new Date(selectedLeave.appliedAt), "MM/dd/yyyy")
                            : "N/A"}
                        </h6>
                      </li>
                      <li>
                        <span>Authority</span>
                        <h6>{selectedLeave.approvedBy?.name || "N/A"}</h6>
                      </li>
                      <li>
                        <span>Leave</span>
                        <h6>
                          {selectedLeave
                            ? `${format(new Date(selectedLeave.startDate), "MM/dd/yyyy")} - ${format(
                                new Date(selectedLeave.endDate),
                                "MM/dd/yyyy"
                              )}`
                            : "N/A"}
                        </h6>
                      </li>
                    </ul>
                  </div>
                ) : (
                  <div className="text-center">
                    <p>Leave request data not available.</p>
                  </div>
                )}
                <div className="mb-3 leave-reason">
                  <h6 className="mb-1">Reason</h6>
                  <span>{selectedLeave?.reason.message || "Not provided"}</span>
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
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApproveRequest;