import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import CommonSelect from "../../../../core/common/commonSelect";
import {
  allClass,
  names,
  status,
} from "../../../../core/common/selectoption/selectoption";
import TeacherModal from "../teacherModal";
import PredefinedDateRanges from "../../../../core/common/datePicker";
import Table from "../../../../core/common/dataTable/index";
import ImageWithBasePath from "../../../../core/common/imageWithBasePath";
import TooltipOption from "../../../../core/common/tooltipOption";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast"; 

interface Teacher {
  _id: string; // MongoDB ID
  id: string;  // Custom ID for display (e.g., "T001")
  name: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phoneNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  joiningDate: string;
  qualifications: any[];
  experienceYears: number;
  subjects: string[];
  contractType: string;
  workShift: string;
  workLocation: string;
  languagesSpoken: string[];
  emergencyContact: string;
  bio: string;
  createdAt: string;
  updatedAt: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
  };
  status?: string;
  class?: string;
}

const TeacherList = () => {
  const routes = all_routes;
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await axios.get<Teacher[]>("http://localhost:5000/api/teacher", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setTeachers(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch teachers");
        setLoading(false);
        console.error("Error fetching teachers:", err);
      }
    };

    fetchTeachers();
  }, []);

  const handleDeleteTeacher = async () => {
    if (!teacherToDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/teacher/${teacherToDelete}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      // Remove the deleted teacher from the state using _id
      setTeachers(teachers.filter((teacher) => teacher._id !== teacherToDelete));
      setTeacherToDelete(null); // Reset the teacher to delete
      toast.success("Teacher deleted successfully")
    } catch (err) {
      setError("Failed to delete teacher");
      console.error("Error deleting teacher:", err);
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id", // Display the custom ID
      render: (text: string) => (
        <Link to={routes.teacherDetails.replace(":id", text)} className="link-primary">
          {text}
        </Link>
      ),
      sorter: (a: Teacher, b: Teacher) => a.id.localeCompare(b.id),
    },
    {
      title: "Name",
      dataIndex: "name",
      render: (text: string, record: Teacher) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar avatar-md">
            <ImageWithBasePath
              src="assets/img/teachers/teacher-01.jpg"
              className="img-fluid rounded-circle"
              alt="img"
            />
          </Link>
          <div className="ms-2">
            <p className="text-dark mb-0">
              <Link to={routes.teacherDetails.replace(":id", record.id)}>{text}</Link>
            </p>
          </div>
        </div>
      ),
      sorter: (a: Teacher, b: Teacher) => a.name.localeCompare(b.name),
    },
    {
      title: "Subject",
      dataIndex: "subjects",
      render: (subjects: string[]) => (subjects ? subjects.join(", ") : "N/A"),
      sorter: (a: Teacher, b: Teacher) =>
        (a.subjects[0] || "").localeCompare(b.subjects[0] || ""),
    },
    {
      title: "Email",
      dataIndex: ["userId", "email"],
      sorter: (a: Teacher, b: Teacher) => a.userId.email.localeCompare(b.userId.email),
    },
    {
      title: "Phone",
      dataIndex: "phoneNumber",
      sorter: (a: Teacher, b: Teacher) => a.phoneNumber.localeCompare(b.phoneNumber),
    },
    {
      title: "Date Of Join",
      dataIndex: "joiningDate",
      render: (date: string) => new Date(date).toLocaleDateString("en-GB"),
      sorter: (a: Teacher, b: Teacher) =>
        new Date(a.joiningDate).getTime() - new Date(b.joiningDate).getTime(),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text?: string) => (
        <>
          {text === "active" || !text ? (
            <span className="badge badge-soft-success d-inline-flex align-items-center">
              <i className="ti ti-circle-filled fs-5 me-1"></i>
              Active
            </span>
          ) : (
            <span className="badge badge-soft-danger d-inline-flex align-items-center">
              <i className="ti ti-circle-filled fs-5 me-1"></i>
              Inactive
            </span>
          )}
        </>
      ),
      sorter: (a: Teacher, b: Teacher) =>
        (a.status || "active").localeCompare(b.status || "active"),
    },
    {
      title: "Action",
      dataIndex: "_id", // Use _id for actions, since DELETE uses MongoDB _id
      render: (mongoId: string, record: Teacher) => (
        <div className="dropdown">
          <button
            className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="ti ti-dots-vertical fs-14" />
          </button>
          <ul className="dropdown-menu dropdown-menu-right p-3">
            <li>
              <Link
                className="dropdown-item rounded-1"
                to={routes.teacherDetails.replace(":id", record.id)} // Use custom id for navigation
              >
                <i className="ti ti-eye me-2" />
                View Details
              </Link>
            </li>
            <li>
              <Link
                className="dropdown-item rounded-1"
                to={routes.editTeacher.replace(":id", record.id)} // Use custom id for navigation
              >
                <i className="ti ti-edit-circle me-2" />
                Edit
              </Link>
            </li>
            <li>
              <button
                className="dropdown-item rounded-1"
                type="button"
                data-bs-toggle="modal"
                data-bs-target="#login_detail"
                onClick={() => setSelectedTeacherId(record.id)} // Use custom id for login details
              >
                <i className="ti ti-lock me-2" />
                Login Details
              </button>
            </li>
            <li>
              <button
                className="dropdown-item rounded-1"
                type="button"
                data-bs-toggle="modal"
                data-bs-target="#delete-modal"
                onClick={() => setTeacherToDelete(mongoId)} // Use _id for deletion
              >
                <i className="ti ti-trash-x me-2" />
                Delete
              </button>
            </li>
          </ul>
        </div>
      ),
    },
  ];

  const dropdownMenuRef = useRef<HTMLDivElement>(null);

  const handleApplyClick = () => {
    if (dropdownMenuRef.current) {
      dropdownMenuRef.current.classList.remove("show");
    }
  };

  return (
    <>    <Toaster position="top-right" reverseOrder={false} />
    
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Teacher List</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="#">Peoples</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Teacher List
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <TooltipOption />
            <div className="mb-2">
              <Link
                to={routes.addTeacher}
                className="btn btn-primary d-flex align-items-center"
              >
                <i className="ti ti-square-rounded-plus me-2" />
                Add Teacher
              </Link>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Teachers List</h4>
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
                            <label className="form-label">Name</label>
                            <CommonSelect
                              className="select"
                              options={names}
                              defaultValue={names[0]}
                            />
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Class</label>
                            <CommonSelect
                              className="select"
                              options={allClass}
                              defaultValue={allClass[0]}
                            />
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Status</label>
                            <CommonSelect
                              className="select"
                              options={status}
                              defaultValue={status[0]}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 d-flex align-items-center justify-content-end">
                      <Link to="#" className="btn btn-light me-3">
                        Reset
                      </Link>
                      <Link to="#" className="btn btn-primary" onClick={handleApplyClick}>
                        Apply
                      </Link>
                    </div>
                  </form>
                </div>
              </div>
              <div className="d-flex align-items-center bg-white border rounded-2 p-1 mb-3 me-2">
                <Link to="#" className="active btn btn-icon btn-sm me-1 primary-hover">
                  <i className="ti ti-list-tree" />
                </Link>
                <Link
                  to={routes.teacherGrid}
                  className="btn btn-icon btn-sm bg-light primary-hover"
                >
                  <i className="ti ti-grid-dots" />
                </Link>
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
            {loading ? (
              <p>Loading teachers...</p>
            ) : error ? (
              <p className="text-danger">{error}</p>
            ) : (
              <Table dataSource={teachers} columns={columns} Selection={true} />
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <div
        className="modal fade"
        id="delete-modal"
        tabIndex={-1}
        aria-labelledby="deleteModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="deleteModalLabel">
                Confirm Deletion
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              Are you sure you want to delete this teacher? This action cannot be undone.
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-light"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                data-bs-dismiss="modal"
                onClick={handleDeleteTeacher}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <TeacherModal selectedTeacherId={selectedTeacherId} />
    </div>
    </>
  );
};

export default TeacherList;