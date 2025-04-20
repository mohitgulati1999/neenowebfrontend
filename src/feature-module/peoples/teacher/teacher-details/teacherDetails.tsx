import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import TeacherModal from '../teacherModal';
import { all_routes } from '../../../router/all_routes';
import TeacherSidebar from './teacherSidebar';
import TeacherBreadcrumb from './teacherBreadcrumb';
const API_URL = process.env.REACT_APP_URL;

const TeacherDetails = () => {
  const routes = all_routes;
  const { id } = useParams<{ id: string }>(); // Get the teacher custom ID from URL (e.g., "T1002")
  const [teacher, setTeacher] = useState<any>(null); // Store fetched teacher data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch teacher data when component mounts
  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/teacher/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setTeacher(response.data);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch teacher details");
        setLoading(false);
      }
    };

    if (id) {
      fetchTeacher();
    }
  }, [id]);

  if (loading) {
    return <div className="page-wrapper"><div className="content">Loading...</div></div>;
  }

  if (error) {
    return <div className="page-wrapper"><div className="content"><div className="alert alert-danger">{error}</div></div></div>;
  }

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          <div className="row">
            {/* Page Header */}
            <TeacherBreadcrumb id={id || ''} />
            <TeacherSidebar teacher={teacher} />
            {/* /Teacher Information */}
            <div className="col-xxl-9 col-xl-8">
              <div className="row">
                <div className="col-md-12">
                  {/* List */}
                  <ul className="nav nav-tabs nav-tabs-bottom mb-4">
                    <li>
                      <Link
                        to={routes.teacherDetails.replace(":id", id || "")}
                        className="nav-link active"
                      >
                        <i className="ti ti-school me-2" />
                        Teacher Details
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={routes.teachersRoutine.replace(":id", id || "")}
                        className="nav-link"
                      >
                        <i className="ti ti-table-options me-2" />
                        Routine
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={routes.teacherLeaves.replace(":id", id || "")}
                        className="nav-link"
                      >
                        <i className="ti ti-calendar-due me-2" />
                        Leave & Attendance
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={routes.teacherSalary.replace(":id", id || "")}
                        className="nav-link"
                      >
                        <i className="ti ti-report-money me-2" />
                        Salary
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={routes.teacherLibrary.replace(":id", id || "")}
                        className="nav-link"
                      >
                        <i className="ti ti-bookmark-edit me-2" />
                        Library
                      </Link>
                    </li>
                  </ul>
                  {/* /List */}
                  {/* Profile Details */}
                  <div className="card">
                    <div className="card-header">
                      <h5>Profile Details</h5>
                    </div>
                    <div className="card-body">
                      <div className="border rounded p-3 pb-0">
                        <div className="row">
                          <div className="col-sm-6 col-lg-4">
                            <div className="mb-3">
                              <p className="text-dark fw-medium mb-1">Teacher ID</p>
                              <p>{teacher.id}</p>
                            </div>
                          </div>
                          <div className="col-sm-6 col-lg-4">
                            <div className="mb-3">
                              <p className="text-dark fw-medium mb-1">Name</p>
                              <p>{teacher.name}</p>
                            </div>
                          </div>
                          <div className="col-sm-6 col-lg-4">
                            <div className="mb-3">
                              <p className="text-dark fw-medium mb-1">DOB</p>
                              <p>{new Date(teacher.dateOfBirth).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="col-sm-6 col-lg-4">
                            <div className="mb-3">
                              <p className="text-dark fw-medium mb-1">Gender</p>
                              <p>{teacher.gender}</p>
                            </div>
                          </div>
                          <div className="col-sm-6 col-lg-4">
                            <div className="mb-3">
                              <p className="text-dark fw-medium mb-1">Qualifications</p>
                              <p>{teacher.qualifications.length > 0 ? teacher.qualifications.join(', ') : 'None'}</p>
                            </div>
                          </div>
                          <div className="col-sm-6 col-lg-4">
                            <div className="mb-3">
                              <p className="text-dark fw-medium mb-1">Experience</p>
                              <p>{teacher.experienceYears} Years</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* /Profile Details */}
                </div>
                {/* Documents */}
                <div className="col-xxl-6 d-flex">
                  <div className="card flex-fill">
                    <div className="card-header">
                      <h5>Documents</h5>
                    </div>
                    <div className="card-body">
                      <div className="bg-light-300 border rounded d-flex align-items-center justify-content-between mb-3 p-2">
                        <div className="d-flex align-items-center overflow-hidden">
                          <span className="avatar avatar-md bg-white rounded flex-shrink-0 text-default">
                            <i className="ti ti-pdf fs-15" />
                          </span>
                          <div className="ms-2">
                            <p className="text-truncate fw-medium text-dark">Resume.pdf</p>
                          </div>
                        </div>
                        <Link to="#" className="btn btn-dark btn-icon btn-sm">
                          <i className="ti ti-download" />
                        </Link>
                      </div>
                      <div className="bg-light-300 border rounded d-flex align-items-center justify-content-between p-2">
                        <div className="d-flex align-items-center overflow-hidden">
                          <span className="avatar avatar-md bg-white rounded flex-shrink-0 text-default">
                            <i className="ti ti-pdf fs-15" />
                          </span>
                          <div className="ms-2">
                            <p className="text-truncate fw-medium text-dark">Joining Letter.pdf</p>
                          </div>
                        </div>
                        <Link to="#" className="btn btn-dark btn-icon btn-sm">
                          <i className="ti ti-download" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                {/* /Documents */}
                {/* Address */}
                <div className="col-xxl-6 d-flex">
                  <div className="card flex-fill">
                    <div className="card-header">
                      <h5>Address</h5>
                    </div>
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-3">
                        <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                          <i className="ti ti-map-pin-up" />
                        </span>
                        <div>
                          <p className="text-dark fw-medium mb-1">Current Address</p>
                          <p>{`${teacher.address.street}, ${teacher.address.city}, ${teacher.address.state} ${teacher.address.postalCode}, ${teacher.address.country}`}</p>
                        </div>
                      </div>
                      <div className="d-flex align-items-center">
                        <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                          <i className="ti ti-map-pins" />
                        </span>
                        <div>
                          <p className="text-dark fw-medium mb-1">Permanent Address</p>
                          <p>{`${teacher.address.street}, ${teacher.address.city}, ${teacher.address.state} ${teacher.address.postalCode}, ${teacher.address.country}`}</p> {/* Assuming same as current for now */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* /Address */}
                {/* Previous School Details */}
                <div className="col-xxl-12">
                  <div className="card">
                    <div className="card-header">
                      <h5>Previous School Details</h5>
                    </div>
                    <div className="card-body pb-1">
                      <div className="row">
                        <div className="col-md-4">
                          <div className="mb-3">
                            <p className="mb-1 text-dark fw-medium">Previous School Name</p>
                            <p>Not Available</p> {/* Add field to schema if needed */}
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <p className="mb-1 text-dark fw-medium">School Address</p>
                            <p>Not Available</p>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <p className="mb-1 text-dark fw-medium">Phone Number</p>
                            <p>Not Available</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* /Previous School Details */}
                {/* Work Details */}
                <div className="col-xxl-6 d-flex">
                  <div className="card flex-fill">
                    <div className="card-header">
                      <h5>Work Details</h5>
                    </div>
                    <div className="card-body pb-1">
                      <div className="row">
                        <div className="col-md-4">
                          <div className="mb-3">
                            <p className="mb-1 text-dark fw-medium">Contract Type</p>
                            <p>{teacher.contractType}</p>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <p className="mb-1 text-dark fw-medium">Shift</p>
                            <p>{teacher.workShift}</p>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <p className="mb-1 text-dark fw-medium">Work Location</p>
                            <p>{teacher.workLocation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* /Work Details */}
                {/* Other Info */}
                <div className="col-xxl-12">
                  <div className="card">
                    <div className="card-header">
                      <h5>Other Info</h5>
                    </div>
                    <div className="card-body">
                      <p>{teacher.bio || 'No additional information provided.'}</p>
                    </div>
                  </div>
                </div>
                {/* /Other Info */}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Page Wrapper */}
      <TeacherModal />
    </>
  );
};

export default TeacherDetails;