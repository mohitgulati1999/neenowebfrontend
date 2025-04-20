import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../router/all_routes";
import { Modal } from "react-bootstrap";
import axios from "axios";
import toast from "react-hot-toast";
import { DatePicker } from "antd";
import dayjs from "dayjs";

interface FeeType {
  feesType: { _id: string; name: string };
  amount: number;
  originalAmount?: number;
  discount?: number;
  discountType?: "fixed" | "percentage";
  dueDate: string; // Due date is now compulsory
}

interface FeeGroup {
  feesGroup: { _id: string; name: string };
  feeTypes: FeeType[];
  selected?: boolean;
}

interface Student {
  _id: string;
  name: string;
  admissionNumber: string;
  class: string;
  section: string;
  gender: string;
  category: string;
  photo?: string;
}

interface ClassData {
  _id: string;
  name: string;
  sessionId: { _id: string; name: string; sessionId: string };
  templates: {
    _id: string;
    name: string;
    fees: FeeGroup[];
  }[];
}
const API_URL = process.env.REACT_APP_URL;

interface AssignModalProps {
  classData: ClassData;
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  refreshData: () => void;
}

const AssignModal: React.FC<AssignModalProps> = ({
  classData,
  sessionId,
  isOpen,
  onClose,
  refreshData,
}) => {
  const routes = all_routes;
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [alreadyAssignedStudents, setAlreadyAssignedStudents] = useState<string[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [studentFees, setStudentFees] = useState<{ [studentId: string]: FeeGroup[] }>({});
  const [showFeeEditor, setShowFeeEditor] = useState(false);
  const [templateFees, setTemplateFees] = useState<FeeGroup[]>([]);

  useEffect(() => {
    if (isOpen && classData) {
      fetchStudents();
      fetchAlreadyAssignedStudents();
      initializeTemplateFees();
    }
  }, [isOpen, classData]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/student/by-class-session/${classData._id}/${sessionId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setStudents(response.data.data);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const fetchAlreadyAssignedStudents = async () => {
    try {
      if (!classData?.templates?.[0]?._id) {
        setAlreadyAssignedStudents([]);
        return;
      }
      const response = await axios.get(
        `${API_URL}/api/feesTemplate/get-assigned-students/${classData.templates[0]._id}/${sessionId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      const assignedStudents = response.data.data;
      setAlreadyAssignedStudents(assignedStudents.map((s: Student) => s._id));

      const studentFeeData = await Promise.all(
        assignedStudents.map(async (student: Student) => {
          const feeResponse = await axios.get(
            `${API_URL}/api/feesTemplate/student-fees/${student._id}/${sessionId}`,
            {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            }
          );
          console.log(`Fees for ${student._id}:`, feeResponse.data.customFees);
          return { [student._id]: feeResponse.data.customFees || classData.templates[0].fees };
        })
      );
      console.log("Student Fee Data:", studentFeeData);
      setStudentFees(Object.assign({}, ...studentFeeData));
    } catch (error) {
      console.error("Error fetching assigned students:", error);
      setAlreadyAssignedStudents([]);
    }
  };

  const initializeTemplateFees = () => {
    if (classData?.templates?.[0]?.fees) {
      setTemplateFees(
        classData.templates[0].fees.map((group) => ({
          ...group,
          feeTypes: group.feeTypes.map((type) => ({
            ...type,
            dueDate: dayjs().format("YYYY-MM-DD"), // Default due date (compulsory)
          })),
          selected: false,
        }))
      );
    }
  };

  const handleStudentSelect = (studentId: string) => {
    if (alreadyAssignedStudents.includes(studentId)) {
      toast.error("This student already has fees assigned");
      return;
    }
    setSelectedStudents((prev) => {
      const newSelection = prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId];
      if (!studentFees[studentId]) {
        setStudentFees((prev) => ({
          ...prev,
          [studentId]: templateFees.map((group) => ({
            ...group,
            feeTypes: group.feeTypes.map((type) => ({
              ...type,
              originalAmount: type.amount,
              discount: 0,
              discountType: "fixed",
              dueDate: type.dueDate, // Include dueDate
            })),
            selected: group.selected,
          })),
        }));
      }
      return newSelection;
    });
  };

  const handleSelectAllStudents = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const eligibleStudents = students
        .filter((student) => !alreadyAssignedStudents.includes(student._id))
        .map((student) => student._id);
      setSelectedStudents(eligibleStudents);
      eligibleStudents.forEach((studentId) => {
        if (!studentFees[studentId]) {
          setStudentFees((prev) => ({
            ...prev,
            [studentId]: templateFees.map((group) => ({
              ...group,
              feeTypes: group.feeTypes.map((type) => ({
                ...type,
                originalAmount: type.amount,
                discount: 0,
                discountType: "fixed",
                dueDate: type.dueDate, // Include dueDate
              })),
              selected: group.selected,
            })),
          }));
        }
      });
    } else {
      setSelectedStudents([]);
    }
  };

  const handleFeeChange = (
    studentId: string,
    feesGroupId: string,
    feesTypeId: string,
    field: "discount" | "discountType",
    value: string | number
  ) => {
    setStudentFees((prev: any) => {
      const updatedFees = prev[studentId].map((group: any) => {
        if (group.feesGroup._id === feesGroupId) {
          return {
            ...group,
            feeTypes: group.feeTypes.map((type: any) => {
              if (type.feesType._id === feesTypeId) {
                const updatedType = { ...type };
                if (field === "discount") {
                  updatedType.discount = Number(value);
                  updatedType.amount =
                    updatedType.discountType === "percentage"
                      ? updatedType.originalAmount * (1 - updatedType.discount / 100)
                      : updatedType.originalAmount - updatedType.discount;
                } else if (field === "discountType") {
                  updatedType.discountType = value as "fixed" | "percentage";
                  updatedType.amount =
                    value === "percentage"
                      ? updatedType.originalAmount * (1 - updatedType.discount / 100)
                      : updatedType.originalAmount - updatedType.discount;
                }
                return updatedType;
              }
              return type;
            }),
          };
        }
        return group;
      });
      return { ...prev, [studentId]: updatedFees };
    });
  };

  const handleDueDateChange = (
    feesGroupId: string,
    feesTypeId: string,
    date: any
  ) => {
    const newDueDate = date ? date.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
    setTemplateFees((prev) =>
      prev.map((group) =>
        group.feesGroup._id === feesGroupId
          ? {
              ...group,
              feeTypes: group.feeTypes.map((type) =>
                type.feesType._id === feesTypeId
                  ? { ...type, dueDate: newDueDate }
                  : type
              ),
            }
          : group
      )
    );
    setStudentFees((prev) => {
      const updatedFees = { ...prev };
      Object.keys(updatedFees).forEach((studentId) => {
        updatedFees[studentId] = updatedFees[studentId].map((group) =>
          group.feesGroup._id === feesGroupId
            ? {
                ...group,
                feeTypes: group.feeTypes.map((type) =>
                  type.feesType._id === feesTypeId
                    ? { ...type, dueDate: newDueDate }
                    : type
                ),
              }
            : group
        );
      });
      return updatedFees;
    });
  };

  const handleFeeGroupSelect = (feesGroupId: string) => {
    setTemplateFees((prev) =>
      prev.map((group) =>
        group.feesGroup._id === feesGroupId ? { ...group, selected: !group.selected } : group
      )
    );
    setStudentFees((prev) => {
      const updatedFees = { ...prev };
      selectedStudents.forEach((studentId) => {
        updatedFees[studentId] = updatedFees[studentId].map((group) =>
          group.feesGroup._id === feesGroupId ? { ...group, selected: !group.selected } : group
        );
      });
      return updatedFees;
    });
  };

  const handleAssignFees = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }

    const selectedFeeGroups = templateFees.filter((group) => group.selected);
    if (selectedFeeGroups.length === 0) {
      toast.error("Please select at least one fee group to assign");
      return;
    }

    // Check if all selected fee types have a due date
    const missingDueDates = selectedFeeGroups.some((group) =>
      group.feeTypes.some((type) => !type.dueDate || type.dueDate === "")
    );
    if (missingDueDates) {
      toast.error("Please set a due date for all selected fee types");
      return;
    }

    setAssignLoading(true);
    try {
      const customFeesForStudents = selectedStudents.map((studentId) => ({
        studentId,
        customFees: studentFees[studentId]
          .filter((group) => group.selected)
          .map(({ feesGroup, feeTypes }) => ({
            feesGroup: feesGroup._id,
            feeTypes: feeTypes.map((type) => ({
              feesType: type.feesType._id,
              amount: type.amount,
              originalAmount: type.originalAmount,
              discount: type.discount,
              discountType: type.discountType,
              dueDate: type.dueDate, // Include dueDate in payload (compulsory)
            })),
          })),
      }));

      console.log("Custom Fees Payload:", JSON.stringify(customFeesForStudents, null, 2));

      await Promise.all(
        customFeesForStudents.map(({ studentId, customFees }) =>
          axios.post(
            `${API_URL}/api/feesTemplate/assign-fees-to-students`,
            {
              templateId: classData.templates[0]._id,
              sessionId,
              studentIds: [studentId],
              customFees: customFees.length > 0 ? customFees : null,
            },
            {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            }
          )
        )
      );

      toast.success("Fees assigned successfully");
      setAlreadyAssignedStudents((prev) => [
        ...prev,
        ...selectedStudents.filter((id) => !prev.includes(id)),
      ]);
      setSelectedStudents([]);
      refreshData();
    } catch (error: any) {
      console.error("Error assigning fees:", error);
      toast.error(error.response?.data?.message || "Failed to assign fees");
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onHide={onClose} centered size="xl">
      <div className="modal-header">
        <h4 className="modal-title">
          Assign Fees - {classData?.name} ({classData?.sessionId?.name})
        </h4>
        <button
          type="button"
          className="btn-close custom-btn-close"
          onClick={onClose}
          aria-label="Close"
        >
          <i className="ti ti-x" />
        </button>
      </div>
      <div className="modal-body">
        <div className="modal-card-table">
          <div className="modal-table-head">
            <h4>Fee Components (Template)</h4>
          </div>
          {classData?.templates?.length > 0 ? (
            <div className="table-responsive custom-table no-datatable_length">
              <table className="table datanew">
                <thead className="thead-light">
                  <tr>
                    <th>Select</th>
                    <th>Fees Group</th>
                    <th>Fees Type</th>
                    <th>Amount</th>
                    <th>Due Date</th> {/* Added compulsory Due Date column */}
                  </tr>
                </thead>
                <tbody>
                  {templateFees.flatMap((feeGroup: FeeGroup) =>
                    feeGroup.feeTypes.map((feeType: FeeType, idx: number) => (
                      <tr key={`${feeGroup.feesGroup._id}-${idx}`}>
                        {idx === 0 && (
                          <td rowSpan={feeGroup.feeTypes.length}>
                            <label className="checkboxs">
                              <input
                                type="checkbox"
                                checked={feeGroup.selected || false}
                                onChange={() => handleFeeGroupSelect(feeGroup.feesGroup._id)}
                              />
                              <span className="checkmarks" />
                            </label>
                          </td>
                        )}
                        <td>{feeGroup.feesGroup.name}</td>
                        <td>{feeType.feesType.name}</td>
                        <td>{feeType.amount}</td>
                        <td>
                          <DatePicker
                            value={dayjs(feeType.dueDate)}
                            onChange={(date) =>
                              handleDueDateChange(
                                feeGroup.feesGroup._id,
                                feeType.feesType._id,
                                date
                              )
                            }
                            format="YYYY-MM-DD"
                            className="form-control"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="alert alert-warning">No fee template assigned to this class</div>
          )}
        </div>

        <div className="modal-card-table">
          <div className="modal-table-head">
            <h4>Student Details</h4>
            <div className="status-legend">
              <span className="legend-item">
                <span className="legend-color assigned"></span> Assigned
              </span>
              <span className="legend-item">
                <span className="legend-color not-assigned"></span> Not Assigned
              </span>
              <button
                className="btn btn-secondary btn-sm ms-3"
                onClick={() => setShowFeeEditor(!showFeeEditor)}
                disabled={selectedStudents.length === 0}
              >
                {showFeeEditor ? "Hide Fee Editor" : "Edit Fees"}
              </button>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Loading students...</span>
              </div>
            </div>
          ) : students.length > 0 ? (
            <div className="table-responsive custom-table no-datatable_length">
              <table className="table datanew">
                <thead className="thead-light">
                  <tr>
                    <th className="no-sort">
                      <label className="checkboxs">
                        <input
                          type="checkbox"
                          id="select-all"
                          checked={
                            selectedStudents.length > 0 &&
                            selectedStudents.length ===
                              students.filter(
                                (student) => !alreadyAssignedStudents.includes(student._id)
                              ).length
                          }
                          onChange={handleSelectAllStudents}
                          disabled={students.length === alreadyAssignedStudents.length}
                        />
                        <span className="checkmarks" />
                      </label>
                    </th>
                    <th className="no-sort">Admission Number</th>
                    <th className="no-sort">Student</th>
                    <th className="no-sort">Gender</th>
                    <th className="no-sort">Status</th>
                    <th className="no-sort">Total Fees</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const isAssigned = alreadyAssignedStudents.includes(student._id);
                    const studentCustomFees = studentFees[student._id];
                    const totalFees = studentCustomFees
                      ? studentCustomFees.reduce(
                          (sum, group) =>
                            sum +
                            group.feeTypes.reduce((groupSum, type) => groupSum + type.amount, 0),
                          0
                        )
                      : null;
                    return (
                      <tr
                        key={student._id}
                        className={isAssigned ? "assigned-row" : ""}
                      >
                        <td>
                          <label className="checkboxs">
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student._id)}
                              onChange={() => handleStudentSelect(student._id)}
                              disabled={isAssigned}
                            />
                            <span className="checkmarks" />
                          </label>
                        </td>
                        <td>
                          <Link to="#" className="text-primary">
                            {student.admissionNumber}
                          </Link>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar avatar-md">
                              <ImageWithBasePath
                                src={
                                  student.photo || "assets/img/students/student-01.jpg"
                                }
                                className="img-fluid rounded-circle"
                                alt="img"
                              />
                            </div>
                            <div className="ms-2">
                              <p className="text-dark mb-0">{student.name}</p>
                            </div>
                          </div>
                        </td>
                        <td>{student.gender}</td>
                        <td>
                          {isAssigned ? (
                            <span className="badge bg-success">
                              <i className="ti ti-check me-1"></i> Assigned
                            </span>
                          ) : (
                            <span className="badge bg-warning">Not Assigned</span>
                          )}
                        </td>
                        <td>{totalFees !== null && isAssigned ? totalFees : "N/A"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="alert alert-warning">No students found in this class</div>
          )}
        </div>

        {showFeeEditor && selectedStudents.length > 0 && (
          <div className="modal-card-table">
            <div className="modal-table-head">
              <h4>Fee Editor for Selected Students</h4>
            </div>
            {selectedStudents.map((studentId: any) => {
              const student = students.find((s) => s._id === studentId);
              return (
                <div key={studentId} className="mb-3">
                  <h5>{student?.name} (Admission: {student?.admissionNumber})</h5>
                  <table className="table datanew">
                    <thead>
                      <tr>
                        <th>Fees Group</th>
                        <th>Fees Type</th>
                        <th>Original Amount</th>
                        <th>Discount</th>
                        <th>Discount Type</th>
                        <th>Adjusted Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentFees[studentId]
                        ?.filter((group) => group.selected)
                        .flatMap((feeGroup: FeeGroup) =>
                          feeGroup.feeTypes.map((feeType: FeeType, idx: number) => (
                            <tr key={`${feeGroup.feesGroup._id}-${idx}`}>
                              <td>{feeGroup.feesGroup.name}</td>
                              <td>{feeType.feesType.name}</td>
                              <td>{feeType.originalAmount}</td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={feeType.discount || 0}
                                  min={0}
                                  onChange={(e) =>
                                    handleFeeChange(
                                      studentId,
                                      feeGroup.feesGroup._id,
                                      feeType.feesType._id,
                                      "discount",
                                      e.target.value
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <select
                                  className="form-control"
                                  value={feeType.discountType || "fixed"}
                                  onChange={(e) =>
                                    handleFeeChange(
                                      studentId,
                                      feeGroup.feesGroup._id,
                                      feeType.feesType._id,
                                      "discountType",
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="fixed">Fixed</option>
                                  <option value="percentage">Percentage</option>
                                </select>
                              </td>
                              <td>{feeType.amount}</td>
                            </tr>
                          ))
                        )}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        <div className="student-pomote-note d-flex mb-0">
          <span className="info-icon">
            <i className="ti ti-info-circle" />
          </span>
          <p>
            Selected {selectedStudents.length} Students | Already Assigned:{" "}
            {alreadyAssignedStudents.length}/{students.length}
          </p>
        </div>
      </div>
      <div className="modal-footer">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-light me-2"
          disabled={assignLoading}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleAssignFees}
          className="btn btn-primary"
          disabled={assignLoading || selectedStudents.length === 0}
        >
          {assignLoading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-1"
                role="status"
                aria-hidden="true"
              ></span>
              Assigning...
            </>
          ) : (
            "Assign Fees"
          )}
        </button>
      </div>
    </Modal>
  );
};

export default AssignModal;