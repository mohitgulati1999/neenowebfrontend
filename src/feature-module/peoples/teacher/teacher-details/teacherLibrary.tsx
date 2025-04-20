import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { all_routes } from "../../../router/all_routes";
import ImageWithBasePath from "../../../../core/common/imageWithBasePath";
import TeacherModal from "../teacherModal";
import TeacherSidebar from "./teacherSidebar";
import TeacherBreadcrumb from "./teacherBreadcrumb";
const TeacherLibrary = () => {
  const routes = all_routes;
  const { id } = useParams<{ id: string }>();
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/teacher/${id}`, {
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

  if (loading) return <div className="page-wrapper"><div className="content">Loading...</div></div>;
  if (error) return <div className="page-wrapper"><div className="content"><div className="alert alert-danger">{error}</div></div></div>;
  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          <div className="row">
            {/* Page Header */}
            <TeacherBreadcrumb id={id}/>
            {/* /Page Header */}
          </div>
          <div className="row">
            {/* Student Information */}
            <TeacherSidebar teacher={teacher} />
            {/* /Student Information */}
            <div className="col-xxl-9 col-xl-8">
              <div className="row">
                <div className="col-md-12">
                  {/* List */}
                  <ul className="nav nav-tabs nav-tabs-bottom mb-4">
                  <li>
                      <Link to={routes.teacherDetails.replace(":id", id || "")} className="nav-link">
                        <i className="ti ti-school me-2" />
                        Teacher Details
                      </Link>
                    </li>
                    <li>
                      <Link to={routes.teachersRoutine.replace(":id", id || "")} className="nav-link">
                        <i className="ti ti-table-options me-2" />
                        Routine
                      </Link>
                    </li>
                    <li>
                      <Link to={routes.teacherLeaves.replace(":id", id || "")} className="nav-link">
                        <i className="ti ti-calendar-due me-2" />
                        Leave & Attendance
                      </Link>
                    </li>
                    <li>
                      <Link to={routes.teacherSalary.replace(":id", id || "")} className="nav-link">
                        <i className="ti ti-report-money me-2" />
                        Salary
                      </Link>
                    </li>
                    <li>
                      <Link to={routes.teacherLibrary.replace(":id", id || "")} className="nav-link active">
                        <i className="ti ti-bookmark-edit me-2" />
                        Library
                      </Link>
                    </li>
                  </ul>
                  {/* /List */}
                  <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                      <h5>Library</h5>
                      <div className="dropdown">
                        <Link
                          to="#"
                          className="btn btn-outline-light border-white bg-white dropdown-toggle shadow-md"
                          data-bs-toggle="dropdown"
                        >
                          <i className="ti ti-calendar-due me-2" />
                          This Year
                        </Link>
                        <ul className="dropdown-menu p-3">
                          <li>
                            <Link to="#" className="dropdown-item rounded-1">
                              This Year
                            </Link>
                          </li>
                          <li>
                            <Link to="#" className="dropdown-item rounded-1">
                              This Month
                            </Link>
                          </li>
                          <li>
                            <Link to="#" className="dropdown-item rounded-1">
                              This Week
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="card-body pb-1">
                      <div className="row">
                        {/* Book List */}
                        <div className="col-xxl-4 col-md-6 d-flex">
                          <div className="card mb-3 flex-fill">
                            <div className="card-body pb-1">
                              <span className="avatar avatar-xl mb-3">
                                <ImageWithBasePath
                                  src="assets/img/books/book-01.jpg"
                                  className="img-fluid rounded"
                                  alt="img"
                                />
                              </span>
                              <h6 className="mb-3">The Small-Town Library</h6>
                              <div className="row">
                                <div className="col-sm-6">
                                  <div className="mb-3">
                                    <span className="fs-12 mb-1">
                                      Book taken on{" "}
                                    </span>
                                    <p className="text-dark">25 Jan 2024</p>
                                  </div>
                                </div>
                                <div className="col-sm-6">
                                  <div className="mb-3">
                                    <span className="fs-12 mb-1">
                                      Last Date
                                    </span>
                                    <p className="text-dark">25 Jan 2024</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* /Book List */}
                        {/* Book List */}
                        <div className="col-xxl-4 col-md-6 d-flex">
                          <div className="card mb-3 flex-fill">
                            <div className="card-body pb-1">
                              <span className="avatar avatar-xl mb-3">
                                <ImageWithBasePath
                                  src="assets/img/books/book-02.jpg"
                                  className="img-fluid rounded"
                                  alt="img"
                                />
                              </span>
                              <h6 className="mb-3">Apex Time</h6>
                              <div className="row">
                                <div className="col-sm-6">
                                  <div className="mb-3">
                                    <span className="fs-12 mb-1">
                                      Book taken on{" "}
                                    </span>
                                    <p className="text-dark">22 Jan 2024</p>
                                  </div>
                                </div>
                                <div className="col-sm-6">
                                  <div className="mb-3">
                                    <span className="fs-12 mb-1">
                                      Last Date
                                    </span>
                                    <p className="text-dark">25 Jan 2024</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* /Book List */}
                        {/* Book List */}
                        <div className="col-xxl-4 col-md-6 d-flex">
                          <div className="card mb-3 flex-fill">
                            <div className="card-body pb-1">
                              <span className="avatar avatar-xl mb-3">
                                <ImageWithBasePath
                                  src="assets/img/books/book-03.jpg"
                                  className="img-fluid rounded"
                                  alt="img"
                                />
                              </span>
                              <h6 className="mb-3">The Cobalt Guitar</h6>
                              <div className="row">
                                <div className="col-sm-6">
                                  <div className="mb-3">
                                    <span className="fs-12 mb-1">
                                      Book taken on{" "}
                                    </span>
                                    <p className="text-dark">30 Jan 2024</p>
                                  </div>
                                </div>
                                <div className="col-sm-6">
                                  <div className="mb-3">
                                    <span className="fs-12 mb-1">
                                      Last Date
                                    </span>
                                    <p className="text-dark">10 Feb 2024</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* /Book List */}
                        {/* Book List */}
                        <div className="col-xxl-4 col-md-6 d-flex">
                          <div className="card mb-3 flex-fill">
                            <div className="card-body pb-1">
                              <span className="avatar avatar-xl mb-3">
                                <ImageWithBasePath
                                  src="assets/img/books/book-04.jpg"
                                  className="img-fluid rounded"
                                  alt="img"
                                />
                              </span>
                              <h6 className="mb-3">Shard and the Tomb</h6>
                              <div className="row">
                                <div className="col-sm-6">
                                  <div className="mb-3">
                                    <span className="fs-12 mb-1">
                                      Book taken on{" "}
                                    </span>
                                    <p className="text-dark">10 Feb 2024</p>
                                  </div>
                                </div>
                                <div className="col-sm-6">
                                  <div className="mb-3">
                                    <span className="fs-12 mb-1">
                                      Last Date
                                    </span>
                                    <p className="text-dark">20 Feb 2024</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* /Book List */}
                        {/* Book List */}
                        <div className="col-xxl-4 col-md-6 d-flex">
                          <div className="card mb-3 flex-fill">
                            <div className="card-body pb-1">
                              <span className="avatar avatar-xl mb-3">
                                <ImageWithBasePath
                                  src="assets/img/books/book-05.jpg"
                                  className="img-fluid rounded"
                                  alt="img"
                                />
                              </span>
                              <h6 className="mb-3">Shard and the Tomb 2</h6>
                              <div className="row">
                                <div className="col-sm-6">
                                  <div className="mb-3">
                                    <span className="fs-12 mb-1">
                                      Book taken on{" "}
                                    </span>
                                    <p className="text-dark">12 Feb 2024</p>
                                  </div>
                                </div>
                                <div className="col-sm-6">
                                  <div className="mb-3">
                                    <span className="fs-12 mb-1">
                                      Last Date
                                    </span>
                                    <p className="text-dark">22 Feb 2024</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* /Book List */}
                        {/* Book List */}
                        <div className="col-xxl-4 col-md-6 d-flex">
                          <div className="card mb-3 flex-fill">
                            <div className="card-body pb-1">
                              <span className="avatar avatar-xl mb-3">
                                <ImageWithBasePath
                                  src="assets/img/books/book-06.jpg"
                                  className="img-fluid rounded"
                                  alt="img"
                                />
                              </span>
                              <h6 className="mb-3">Plague of Fear</h6>
                              <div className="row">
                                <div className="col-sm-6">
                                  <div className="mb-3">
                                    <span className="fs-12 mb-1">
                                      Book taken on{" "}
                                    </span>
                                    <p className="text-dark">15 Feb 2024</p>
                                  </div>
                                </div>
                                <div className="col-sm-6">
                                  <div className="mb-3">
                                    <span className="fs-12 mb-1">
                                      Last Date
                                    </span>
                                    <p className="text-dark">25 Feb 2024</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* /Book List */}
                      </div>
                    </div>
                  </div>
                </div>
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

export default TeacherLibrary;
