import React, { useRef, useState, useEffect } from "react";
import { all_routes } from "../../router/all_routes";
import { Link } from "react-router-dom";
import PredefinedDateRanges from "../../../core/common/datePicker";
import CommonSelect from "../../../core/common/commonSelect";
import { TableData } from "../../../core/data/interface";
import Table from "../../../core/common/dataTable/index";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import TooltipOption from "../../../core/common/tooltipOption";
import axios from "axios";
import toast from "react-hot-toast";
import { Modal, Form } from "react-bootstrap";

// Fee Reminder Notification Interface
interface FeeReminderNotification {
  _id: string;
  recipientId: string;
  recipientType: "student" | "parent";
  title: string;
  message: string;
  feePaymentId: string;
  dueDate: string;
  amountDue: number;
  status: "unread" | "read" | "dismissed";
  createdAt: string;
  updatedAt?: string;
}

interface ExtendedTableData extends TableData {
  paid?: string;
  studentId?: string;
}

interface FeeComponent {
  feesGroupId: string;
  feesGroupName: string;
  feesTypeId: string;
  feesTypeName: string;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  status: string;
  selected?: boolean;
}

const CollectFees = () => {
  const routes = all_routes;
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const [feePayments, setFeePayments] = useState<ExtendedTableData[]>([]);
  const [sessions, setSessions] = useState<{ label: string; value: string }[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ExtendedTableData | null>(null);
  const [feeComponents, setFeeComponents] = useState<FeeComponent[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<FeeComponent[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchFeePayments(selectedSession);
    }
  }, [selectedSession]);

  const fetchSessions = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/session/get", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const sessionOptions = response.data.map((session: any) => ({
        label: session.name,
        value: session._id,
      }));
      setSessions(sessionOptions);
      setSelectedSession(sessionOptions[0]?.value || "");
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to fetch sessions");
    }
  };

  const fetchFeePayments = async (sessionId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/feesPayment/fee-payments/${sessionId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      const data = response.data.data.map((item: any) => ({
        admNo: item.admNo,
        rollNo: item.rollNo || "N/A",
        student: item.studentName,
        studentClass: item.studentClass,
        studentSection: item.studentSection || "N/A",
        studentImage: item.studentImage || "assets/img/students/student-01.jpg",
        class: item.studentClass,
        section: item.studentSection || "N/A",
        amount: item.totalAmountDue.toString(),
        paid: item.totalAmountPaid.toString(),
        lastDate: item.lastDate ? new Date(item.lastDate).toLocaleDateString() : "N/A",
        status: item.status,
        studentId: item.student?._id || "",
      }));
      setFeePayments(data);
    } catch (error) {
      console.error("Error fetching fee payments:", error);
      toast.error("Failed to fetch fee payments");
      setFeePayments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeeComponents = async (studentId: string, sessionId: string) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/feesTemplate/student-fees/${studentId}/${sessionId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (!response.data || !response.data.customFees) {
        throw new Error("Invalid response structure");
      }

      const fees = response.data.customFees.flatMap((group: any) =>
        group.feeTypes.map((feeType: any) => ({
          feesGroupId: group.feesGroup._id,
          feesGroupName: group.feesGroup.name,
          feesTypeId: feeType.feesType._id,
          feesTypeName: feeType.feesType.name,
          amountDue: feeType.amount,
          amountPaid: feeType.amountPaid || 0, // Adjust based on your schema
          dueDate: feeType.dueDate || new Date().toISOString().split("T")[0], // Use actual dueDate if available
          status: feeType.amountPaid >= feeType.amount ? "Paid" : "Pending", // Dynamic status
          selected: feeType.amountPaid < feeType.amount, // Select unpaid fees by default
        }))
      );

      setFeeComponents(fees);
      updateSelectedComponents(fees.filter((fee:any) => fee.selected));
    } catch (error) {
      console.error("Error fetching fee components:", error);
      toast.error("Failed to fetch fee components");
      setFeeComponents([]);
      setSelectedComponents([]);
    }
  };

  const updateSelectedComponents = (selected: FeeComponent[]) => {
    setSelectedComponents(selected);
    const total = selected.reduce((sum, component) => sum + (component.amountDue - component.amountPaid), 0);
    setTotalAmount(total);
  };

  const handleComponentSelection = (component: FeeComponent, isSelected: boolean) => {
    const updatedComponents = feeComponents.map((fee) =>
      fee.feesTypeId === component.feesTypeId ? { ...fee, selected: isSelected } : fee
    );
    setFeeComponents(updatedComponents);
    const selected = updatedComponents.filter((fee) => fee.selected);
    updateSelectedComponents(selected);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isSelected = e.target.checked;
    const updatedComponents = feeComponents.map((fee) => ({
      ...fee,
      selected: fee.status === "Pending" ? isSelected : fee.selected,
    }));
    setFeeComponents(updatedComponents);
    const selected = isSelected
      ? updatedComponents.filter((fee) => fee.status === "Pending")
      : [];
    updateSelectedComponents(selected);
  };

  const handleApplyClick = () => {
    if (dropdownMenuRef.current) {
      dropdownMenuRef.current.classList.remove("show");
    }
  };

  const handleCollectFeesClick = (record: ExtendedTableData) => {
    setSelectedStudent(record);
    fetchFeeComponents(record.studentId!, selectedSession);
    setShowModal(true);
  };

  const handleCollectFees = async () => {
    if (!selectedStudent || selectedComponents.length === 0) {
      toast.error("Please select at least one fee component to send a reminder for");
      return;
    }

    setIsSending(true);
    try {
      // Send reminders for each selected fee component
      const reminderPromises = selectedComponents.map(async (component) => {
        const amountDue = component.amountDue - component.amountPaid;
        const response = await axios.post(
          "http://localhost:5000/api/feesPayment/send-reminder",
          {
            studentId: selectedStudent.studentId,
            sessionId: selectedSession,
            feesGroupId: component.feesGroupId,
            feesTypeId: component.feesTypeId,
          },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );

        // Log the created notification (optional, for debugging)
        console.log("Reminder Notification Sent:", response.data.notification);

        return response;
      });

      await Promise.all(reminderPromises);

      toast.success("Fee payment reminders sent successfully");
      setShowModal(false);
      fetchFeePayments(selectedSession); // Refresh table data
    } catch (error: any) {
      console.error("Error sending fee reminders:", error);
      toast.error(error.response?.data?.message || "Failed to send fee reminders");
    } finally {
      setIsSending(false);
    }
  };

  const mockOptions = [
    { label: "Select", value: "" },
    { label: "Option 1", value: "1" },
    { label: "Option 2", value: "2" },
  ];

  const columns = [
    {
      title: "Adm No",
      dataIndex: "admNo",
      render: (text: string) => (
        <Link to="#" className="link-primary">
          {text}
        </Link>
      ),
      sorter: (a: ExtendedTableData, b: ExtendedTableData) => a.admNo.length - b.admNo.length,
    },
    {
      title: "Roll No",
      dataIndex: "rollNo",
      sorter: (a: ExtendedTableData, b: ExtendedTableData) => a.rollNo.length - b.rollNo.length,
    },
    {
      title: "Student",
      dataIndex: "student",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center">
          <Link to={routes.studentDetail} className="avatar avatar-md">
            <ImageWithBasePath
              src={record.studentImage}
              className="img-fluid rounded-circle"
              alt="img"
            />
          </Link>
          <div className="ms-2">
            <p className="text-dark mb-0">
              <Link to={routes.studentDetail}>{text}</Link>
            </p>
          </div>
        </div>
      ),
      sorter: (a: ExtendedTableData, b: ExtendedTableData) =>
        a.student.length - b.student.length,
    },
    {
      title: "Class",
      dataIndex: "class",
      sorter: (a: ExtendedTableData, b: ExtendedTableData) => a.class.length - b.class.length,
    },
    {
      title: "Amount Due ($)",
      dataIndex: "amount",
      sorter: (a: ExtendedTableData, b: ExtendedTableData) => a.amount.length - b.amount.length,
    },
    {
      title: "Amount Paid ($)",
      dataIndex: "paid",
      sorter: (a: ExtendedTableData, b: ExtendedTableData) =>
        (a.paid || "").length - (b.paid || "").length,
    },
    {
      title: "Last Date",
      dataIndex: "lastDate",
      sorter: (a: ExtendedTableData, b: ExtendedTableData) =>
        a.lastDate.length - b.lastDate.length,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: string) => (
        <>
          {text === "Paid" ? (
            <span className="badge badge-soft-success d-inline-flex align-items-center">
              <i className="ti ti-circle-filled fs-5 me-1"></i>
              {text}
            </span>
          ) : (
            <span className="badge badge-soft-danger d-inline-flex align-items-center">
              <i className="ti ti-circle-filled fs-5 me-1"></i>
              {text}
            </span>
          )}
        </>
      ),
      sorter: (a: ExtendedTableData, b: ExtendedTableData) => a.status.length - b.status.length,
    },
    {
      title: "Action",
      dataIndex: "status",
      render: (text: string, record: ExtendedTableData) => (
        <>
          {text === "Paid" ? (
            <Link to={routes.studentFees} className="btn btn-light">
              View Details
            </Link>
          ) : (
            <button
              className="btn btn-light"
              onClick={() => handleCollectFeesClick(record)}
            >
              Send Reminder
            </button>
          )}
        </>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Fees Collection</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="#">Fees Collection</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Collect Fees
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <TooltipOption />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Select Session</label>
            <CommonSelect
              className="select"
              options={sessions}
              defaultValue={sessions.find((session) => session.value === selectedSession)}
              onChange={(option: { label: string; value: string } | null) => {
                setSelectedSession(option ? option.value : "");
              }}
            />
          </div>

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Fees List</h4>
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
                      <div className="p-3 border-bottom">
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label">Admission No</label>
                              <CommonSelect
                                className="select"
                                options={mockOptions}
                                defaultValue={mockOptions[0]}
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label">Roll No</label>
                              <CommonSelect
                                className="select"
                                options={mockOptions}
                                defaultValue={mockOptions[0]}
                              />
                            </div>
                          </div>
                          <div className="col-md-12">
                            <div className="mb-3">
                              <label className="form-label">Student</label>
                              <CommonSelect
                                className="select"
                                options={mockOptions}
                                defaultValue={mockOptions[0]}
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label">Class</label>
                              <CommonSelect
                                className="select"
                                options={mockOptions}
                                defaultValue={mockOptions[0]}
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-0">
                              <label className="form-label">Amount</label>
                              <CommonSelect
                                className="select"
                                options={mockOptions}
                                defaultValue={mockOptions[0]}
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-0">
                              <label className="form-label">Last Date</label>
                              <CommonSelect
                                className="select"
                                options={mockOptions}
                                defaultValue={mockOptions[0]}
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
                      <Link to="#" className="dropdown-item rounded-1">
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
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                </div>
              ) : feePayments.length > 0 ? (
                <Table dataSource={feePayments} columns={columns} Selection={true} />
              ) : (
                <div className="alert alert-warning text-center">
                  No fee payments found for this session
                </div>
              )}
            </div>
          </div>

          {/* Fee Collection Modal */}
          <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
            <Modal.Header closeButton>
              <Modal.Title>
                Send Fee Reminder for {selectedStudent?.student} (Adm No: {selectedStudent?.admNo})
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {feeComponents.length > 0 ? (
                <>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>
                            <Form.Check
                              type="checkbox"
                              onChange={handleSelectAll}
                              checked={
                                feeComponents.filter((f) => f.status === "Pending").length > 0 &&
                                feeComponents.filter((f) => f.status === "Pending").every((f) => f.selected)
                              }
                              disabled={feeComponents.filter((f) => f.status === "Pending").length === 0}
                            />
                          </th>
                          <th>Fee Group</th>
                          <th>Fee Type</th>
                          <th>Amount Due ($)</th>
                          <th>Amount Paid ($)</th>
                          <th>Balance ($)</th>
                          <th>Due Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feeComponents.map((fee) => (
                          <tr key={`${fee.feesGroupId}-${fee.feesTypeId}`}>
                            <td>
                              <Form.Check
                                type="checkbox"
                                checked={fee.selected || false}
                                onChange={(e) => handleComponentSelection(fee, e.target.checked)}
                                disabled={fee.status !== "Pending"}
                              />
                            </td>
                            <td>{fee.feesGroupName}</td>
                            <td>{fee.feesTypeName}</td>
                            <td>{fee.amountDue.toFixed(2)}</td>
                            <td>{fee.amountPaid.toFixed(2)}</td>
                            <td>{(fee.amountDue - fee.amountPaid).toFixed(2)}</td>
                            <td>{fee.dueDate}</td>
                            <td>
                              {fee.status === "Paid" ? (
                                <span className="badge bg-success">Paid</span>
                              ) : (
                                <span className="badge bg-warning text-dark">Pending</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 p-3 bg-light rounded">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Total Selected Amount:</h5>
                      <h4 className="mb-0 text-primary">${totalAmount.toFixed(2)}</h4>
                    </div>
                  </div>
                </>
              ) : (
                <div className="alert alert-info">No fee components assigned to this student.</div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
                disabled={isSending}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCollectFees}
                disabled={selectedComponents.length === 0 || isSending}
              >
                {isSending ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Sending...
                  </>
                ) : (
                  "Send Fee Reminder"
                )}
              </button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </>
  );
};

export default CollectFees;