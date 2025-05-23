import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ImageWithBasePath from "../../../../core/common/imageWithBasePath";
import { all_routes } from "../../../router/all_routes";
import Table from "../../../../core/common/dataTable/index";
import { TableData } from "../../../../core/data/interface";
import CommonSelect from '../../../../core/common/commonSelect';
import { status, promotion, academicYear, allClass, allSection } from '../../../../core/common/selectoption/selectoption';
import PredefinedDateRanges from '../../../../core/common/datePicker';
import TooltipOption from '../../../../core/common/tooltipOption';
import axios from "axios";
const API_URL = process.env.REACT_APP_URL;

interface Student {
  _id: string;
  admissionNumber: string;
  rollNumber?: string;
  name: string;
  class?: string;
  section?: string;
  result?: string; // Pass/Fail
}

const StudentPromotion = () => {
  const [isPromotion, setIsPromotion] = useState<boolean>(false);
  const [students, setStudents] = useState<Student[]>([]);
  const routes = all_routes;

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/student`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      // Map API response to match expected table data structure
      const mappedData = res.data.map((student: any) => ({
        _id: student._id,
        admissionNumber: student.admissionNumber,
        rollNumber: student.rollNumber || "N/A",
        name: student.name,
        class: student.classId?.name || "N/A",
        section: student.section || "N/A", // Adjust if section isn't in your schema
        result: "Pass" // Placeholder; replace with actual data if available
      }));
      setStudents(mappedData);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const columns = [
    {
      title: "Admission No",
      dataIndex: "admissionNumber",
      render: (text: string) => (
        <Link to={routes.studentDetail.replace(":admissionNumber", text)} className="link-primary">
          {text}
        </Link>
      ),
      sorter: (a: Student, b: Student) => a.admissionNumber.localeCompare(b.admissionNumber),
    },
    {
      title: "Roll No",
      dataIndex: "rollNumber",
      sorter: (a: Student, b: Student) => (a.rollNumber || "").localeCompare(b.rollNumber || ""),
    },
    {
      title: "Name",
      dataIndex: "name",
      render: (text: string) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar avatar-md">
            <ImageWithBasePath
              src="assets/img/students/student-01.jpg" // Static for now
              className="img-fluid rounded-circle"
              alt="img"
            />
          </Link>
          <div className="ms-2">
            <p className="text-dark mb-0">
              <Link to="#">{text}</Link>
            </p>
          </div>
        </div>
      ),
      sorter: (a: Student, b: Student) => a.name.localeCompare(b.name),
    },
    {
      title: "Class",
      dataIndex: "class",
      sorter: (a: Student, b: Student) => (a.class || "").localeCompare(b.class || ""),
    },
    {
      title: "Section",
      dataIndex: "section",
      sorter: (a: Student, b: Student) => (a.section || "").localeCompare(b.section || ""),
    },
    {
      title: "Exam Result",
      dataIndex: "result",
      render: (text: string) => (
        <>
          {text === "Pass" ? (
            <span className="badge badge-soft-success d-inline-flex align-items-center">
              <i className='ti ti-circle-filled fs-5 me-1'></i>{text}
            </span>
          ) : (
            <span className="badge badge-soft-danger d-inline-flex align-items-center">
              <i className='ti ti-circle-filled fs-5 me-1'></i>{text}
            </span>
          )}
        </>
      ),
      sorter: (a: Student, b: Student) => (a.result || "").localeCompare(b.result || ""),
    },
    {
      title: "Action",
      dataIndex: "promotion",
      render: () => (
        <div className="table-select mb-0">
          <CommonSelect
            className="select"
            options={promotion}
            defaultValue={promotion[0]} // Default to "Promote"
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="row">
            <div className="col-md-12">
              <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
                <div className="my-auto mb-2">
                  <h3 className="page-title mb-1">Student Promotion</h3>
                  <nav>
                    <ol className="breadcrumb mb-0">
                      <li className="breadcrumb-item">
                        <Link to={routes.adminDashboard}>Dashboard</Link>
                      </li>
                      <li className="breadcrumb-item">
                        <Link to="#">Students</Link>
                      </li>
                      <li className="breadcrumb-item active" aria-current="page">
                        Student Promotion
                      </li>
                    </ol>
                  </nav>
                </div>
                <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
                  <TooltipOption />
                </div>
              </div>
              <div className="alert alert-outline-primary bg-primary-transparent p-2 d-flex align-items-center flex-wrap row-gap-2 mb-4">
                <i className="ti ti-info-circle me-1" />
                <strong>Note :</strong> Prompting Student from the Present class to
                the Next Class will Create an enrollment of the student to the next
                Session
              </div>
              <div className="card">
                <div className="card-header border-0 pb-0">
                  <div className="bg-light-gray p-3 rounded">
                    <h4>Promotion</h4>
                    <p>Select a Class to Promote next session and new class</p>
                  </div>
                </div>
                <div className="card-body">
                  <form>
                    <div className="d-md-flex align-items-center justify-content-between">
                      <div className="card flex-fill w-100">
                        <div className="card-body">
                          <div className="mb-3">
                            <label className="form-label">
                              Current Session <span className="text-danger">*</span>
                            </label>
                            <div className="form-control-plaintext p-0">
                              2024 - 2025
                            </div>
                          </div>
                          <div>
                            <label className="form-label mb-2">
                              Promotion from Class
                              <span className="text-danger"> *</span>
                            </label>
                            <div className="d-block d-md-flex">
                              <div className="flex-fill me-md-3 me-0 mb-0">
                                <label className="form-label">Class</label>
                                <CommonSelect
                                  className="select"
                                  options={allClass}
                                  defaultValue={allClass[0]}
                                />
                              </div>
                              <div className="flex-fill mb-0">
                                <label className="form-label">Section</label>
                                <CommonSelect
                                  className="select"
                                  options={allSection}
                                  defaultValue={allSection[0]}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Link
                        to="#"
                        className="badge bg-primary badge-xl exchange-link text-white d-flex align-items-center justify-content-center mx-md-4 mx-auto my-md-0 my-4 flex-shrink-0"
                      >
                        <span>
                          <i className="ti ti-arrows-exchange fs-16" />
                        </span>
                      </Link>
                      <div className="card flex-fill w-100">
                        <div className="card-body">
                          <div className="mb-3">
                            <label className="form-label">
                              Promote to Session{" "}
                              <span className="text-danger"> *</span>
                            </label>
                            <CommonSelect
                              className="select"
                              options={academicYear}
                              defaultValue={academicYear[0]}
                            />
                          </div>
                          <div>
                            <label className="form-label mb-2">
                              Promotion from Class
                              <span className="text-danger"> *</span>
                            </label>
                            <div className="d-block d-md-flex">
                              <div className="flex-fill me-md-3 me-0 mb-0">
                                <label className="form-label">Class</label>
                                <CommonSelect
                                  className="select"
                                  options={allClass}
                                  defaultValue={allClass[0]}
                                />
                              </div>
                              <div className="flex-fill">
                                <label className="form-label">Section</label>
                                <CommonSelect
                                  className="select"
                                  options={allSection}
                                  defaultValue={allSection[0]}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="manage-promote-btn d-flex justify-content-center flex-wrap row-gap-2">
                        <button
                          type="reset"
                          className="btn btn-light reset-promote me-3"
                          onClick={() => setIsPromotion(false)}
                        >
                          Reset Promotion
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary promote-students-btn"
                          onClick={() => setIsPromotion(true)}
                        >
                          Manage Promotion
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
              <div className={`promote-card-main ${isPromotion && 'promote-card-main-show'}`}>
                <div className="card">
                  <div className="card-header border-0 pb-0">
                    <div className="bg-light-gray p-3 rounded">
                      <h4>Map Class Sections</h4>
                      <p>Select section mapping of old class to new class</p>
                    </div>
                  </div>
                  <div className="card-body pb-2">
                    <form>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="card w-100">
                          <div className="card-body">
                            <div className="mb-3">
                              <label className="form-label">
                                From Class<span className="text-danger">*</span>
                              </label>
                              <div className="form-control-plaintext p-0">III</div>
                            </div>
                            <div className="mb-0">
                              <label className="form-label d-block mb-3">
                                Promotion from Section
                                <span className="text-danger"> *</span>
                              </label>
                              <label className="form-label d-block mb-2">
                                Student From Section
                                <span className="text-danger"> *</span>
                              </label>
                              <div className="form-control-plaintext p-0">A</div>
                            </div>
                          </div>
                        </div>
                        <Link
                          to="#"
                          className="badge bg-primary badge-xl exchange-link text-white d-flex align-items-center justify-content-center mx-md-4 mx-auto my-md-0 my-4 flex-shrink-0"
                        >
                          <span>
                            <i className="ti ti-arrows-exchange fs-16" />
                          </span>
                        </Link>
                        <div className="card w-100">
                          <div className="card-body">
                            <div className="mb-3">
                              <label className="form-label">
                                Promote to Session{" "}
                                <span className="text-danger"> *</span>
                              </label>
                              <div className="form-control-plaintext p-0">IV</div>
                            </div>
                            <div>
                              <label className="form-label mb-2">
                                Assign to Section
                                <span className="text-danger"> *</span>
                              </label>
                              <div className="d-block d-md-flex">
                                <div className="flex-fill me-0">
                                  <label className="form-label">Class</label>
                                  <CommonSelect
                                    className="select"
                                    options={allClass}
                                    defaultValue={allClass[0]}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                    <h4 className="mb-3">Students List</h4>
                    <div className="d-flex align-items-center flex-wrap">
                      <div className="input-icon-start mb-3 me-2 position-relative">
                        <PredefinedDateRanges />
                      </div>
                      <div className="dropdown mb-3">
                        <Link
                          to="#"
                          className="btn btn-outline-light bg-white dropdown-toggle"
                          data-bs-toggle="dropdown"
                        >
                          <i className="ti ti-sort-ascending-2 me-2" />
                          Sort by A-Z{" "}
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
                    <Table dataSource={students} columns={columns} Selection={true} />
                  </div>
                </div>
                <div className="promoted-year text-center">
                  <p>
                    Selected Students will be promoted to 2025 - 2026 Academic
                    Session
                  </p>
                  <Link
                    to="#"
                    className="btn btn-primary"
                    data-bs-toggle="modal"
                    data-bs-target="#student_promote"
                  >
                    Promote Students
                  </Link>
                </div>
                <div className="toast-container success-msg-toast position-fixed">
                  <div
                    id="topright-Toast"
                    className="toast"
                    role="alert"
                    aria-live="assertive"
                    aria-atomic="true"
                  >
                    <div className="toast-header">
                      <p className="me-auto">
                        <span>
                          <i className="ti ti-square-check-filled text-success" />
                        </span>
                        Successfully Promoted
                      </p>
                      <Link
                        to="#"
                        className="toast-close"
                        data-bs-dismiss="toast"
                        aria-label="Close"
                      >
                        <span>
                          <i className="ti ti-x" />
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="modal fade" id="student_promote">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center">
              <h4>Confirm Promotion</h4>
              <p>
                Are you Sure, want to promote all 57 selected students to the next
                academic session
              </p>
              <div className="d-flex justify-content-center">
                <Link
                  to="#"
                  className="btn btn-light me-3"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </Link>
                <Link
                  to="#"
                  className="btn btn-danger"
                  id="toprightToastBtn"
                  data-bs-dismiss="modal"
                >
                  Promote
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentPromotion;