import React, { useEffect, useRef, useState } from "react";
import Table from "../../../core/common/dataTable/index";
import PredefinedDateRanges from "../../../core/common/datePicker";
import { activeList } from "../../../core/common/selectoption/selectoption";
import CommonSelect from "../../../core/common/commonSelect";
import { Link } from "react-router-dom";
import TooltipOption from "../../../core/common/tooltipOption";
import { all_routes } from "../../router/all_routes";
import axios from "axios";
import Select from "react-select";
import toast, { Toaster } from "react-hot-toast";

const Classes = () => {
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const route = all_routes;

  const [fetclass, setFetclass] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    teacherId: [] as string[],
    sessionId: "",
  });

  const [sessions, setSessions] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const columns = [
    {
      title: "Class ID",
      dataIndex: "id",
      render: (text: string) => (
        <Link to="#" className="link-primary">
          {text}
        </Link>
      ),
    },
    {
      title: "Class Name",
      dataIndex: "name",
      sorter: (a: any, b: any) => a.name.length - b.name.length,
    },
    {
      title: "Session",
      dataIndex: "sessionId",
      render: (session: any) => (session?.name ? session.name : "N/A"),
    },
    {
      title: "Teacher",
      dataIndex: "teacherId",
      render: (teachers: any[]) => (
        <>
          {teachers && teachers.length > 0
            ? teachers.map((teacher) => teacher.name || "Unknown").join(", ")
            : "N/A"}
        </>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center">
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
                  onClick={() => setSelectedClass(record)}
                  data-bs-toggle="modal"
                  data-bs-target="#edit_class"
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
                  onClick={() => {
                    setSelectedClass(record);
                    setIsDeleteModalOpen(true);
                  }}
                >
                  <i className="ti ti-trash-x me-2" />
                  Delete
                </Link>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const fetchClasses = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/class", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const formattedData = res.data.map((item: any) => ({
        ...item,
        key: item._id,
      }));
      setFetclass(formattedData);
      console.log("Fetched Classes:", formattedData);
    } catch (error) {
      console.log("Error fetching classes:", error);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/session/get", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setSessions(res.data);
    } catch (error) {
      console.log("Error fetching sessions:", error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/teacher", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setTeachers(res.data);
    } catch (error) {
      console.log("Error fetching teachers:", error);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchSessions();
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      setFormData({
        id: selectedClass.id || "",
        name: selectedClass.name || "",
        teacherId: selectedClass.teacherId?.map((t: any) => t._id) || [],
        sessionId: selectedClass.sessionId?._id || "",
      });
    }
  }, [selectedClass]);

  const addClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, teacherId: formData.teacherId };
      const res = await axios.post("http://localhost:5000/api/class", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      // Map the sessionId and teacherId to their full objects
      const session = sessions.find((s) => s._id === res.data.sessionId);
      const selectedTeachers = teachers.filter((t) => res.data.teacherId.includes(t._id));

      // Construct the new class with the same structure as fetched data
      const newClass = {
        ...res.data,
        key: res.data._id,
        sessionId: session || { _id: res.data.sessionId, name: "N/A" }, // Fallback if session not found
        teacherId: selectedTeachers.length > 0 ? selectedTeachers : [], // Fallback to empty array
      };

      setFetclass((prev) => [...prev, newClass]);
      setFormData({ id: "", name: "", teacherId: [], sessionId: "" });
      toast.success("Class Added Successfully");
    } catch (error) {
      console.log("Error adding class:", error);
      toast.error("Error adding class");
    }
  };

  const updateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClass) {
      try {
        const payload = { ...formData, teacherId: formData.teacherId };
        const res = await axios.put(
          `http://localhost:5000/api/class/${selectedClass.key}`,
          payload,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );

        // Map the sessionId and teacherId to their full objects
        const session = sessions.find((s) => s._id === res.data.sessionId);
        const selectedTeachers = teachers.filter((t) => res.data.teacherId.includes(t._id));

        const updatedClass = {
          ...res.data,
          key: res.data._id,
          sessionId: session || { _id: res.data.sessionId, name: "N/A" },
          teacherId: selectedTeachers.length > 0 ? selectedTeachers : [],
        };

        setFetclass((prev) =>
          prev.map((item) => (item.key === selectedClass.key ? updatedClass : item))
        );
        toast.success("Class Updated Successfully");
      } catch (error) {
        console.log("Error updating class:", error);
        toast.error("Error Updating class");
      }
    }
  };

  const deleteClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClass) {
      try {
        await axios.delete(`http://localhost:5000/api/class/${selectedClass.key}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setFetclass((prev) => prev.filter((item) => item.key !== selectedClass.key));
        toast.success("Class deleted Successfully");
      } catch (error) {
        console.log("Error deleting class:", error);
        toast.error("Error deleting class");
      }
    }
  };

  const handleApplyClick = () => {
    if (dropdownMenuRef.current) {
      dropdownMenuRef.current.classList.remove("show");
    }
  };

  const handleTeacherChange = (selectedOptions: any) => {
    const teacherIds = selectedOptions.map((option: any) => option.value);
    setFormData({ ...formData, teacherId: teacherIds });
  };

  const getSelectedTeacherOptions = () => {
    return formData.teacherId.map((id) => {
      const teacher = teachers.find((t) => t._id === id);
      return { value: teacher?._id, label: teacher?.name };
    });
  };

  const resetForm = () => {
    setFormData({ id: "", name: "", teacherId: [], sessionId: "" });
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div>
        <div className="page-wrapper">
          <div className="content">
            <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
              <div className="my-auto mb-2">
                <h3 className="page-title mb-1">Classes List</h3>
                <nav>
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to={route.adminDashboard}>Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="#">Classes</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      All Classes
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
                    data-bs-target="#add_class"
                    onClick={resetForm}
                  >
                    <i className="ti ti-square-rounded-plus-filled me-2" />
                    Add Class
                  </Link>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                <h4 className="mb-3">Classes List</h4>
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
                                  className="select custom-select"
                                  options={activeList}
                                  defaultValue={activeList[0]}
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
                </div>
              </div>
              <div className="card-body p-0 py-3">
                <Table columns={columns} dataSource={fetclass} Selection={true} />
              </div>
            </div>
          </div>
        </div>

        {/* Add Class Modal */}
        <div className="modal fade" id="add_class">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Class</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                  onClick={resetForm}
                >
                  <i className="ti ti-x" />
                </button>
              </div>
              <form onSubmit={addClass}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Class ID</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter Class ID (e.g., KIND-A-2023)"
                          value={formData.id}
                          onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Class Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter Class Name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Session</label>
                        <CommonSelect
                          className="select custom-select"
                          options={sessions.map((s) => ({ label: s.name, value: s._id }))}
                          onChange={(option) =>
                            setFormData({
                              ...formData,
                              sessionId: option ? option.value : "",
                            })
                          }
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Teachers</label>
                        <Select
                          isMulti
                          options={teachers.map((teacher) => ({
                            value: teacher._id,
                            label: teacher.name,
                          }))}
                          value={getSelectedTeacherOptions()}
                          onChange={handleTeacherChange}
                          placeholder="Select Teachers"
                          className="basic-multi-select"
                          classNamePrefix="react-select"
                          classNames={{
                            control: (state) =>
                              state.isFocused
                                ? "border-gray-400 shadow-gray"
                                : "border-gray-300",
                            option: (state) =>
                              state.isSelected
                                ? "bg-gray-200 text-gray-800"
                                : state.isFocused
                                ? "bg-gray-100"
                                : "",
                            multiValue: () => "bg-gray-200",
                            multiValueLabel: () => "text-gray-800",
                            multiValueRemove: () => "text-gray-600 hover:bg-gray-300",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <Link to="#" className="btn btn-light me-2" data-bs-dismiss="modal">
                    Cancel
                  </Link>
                  <button type="submit" className="btn btn-primary" data-bs-dismiss="modal">
                    Add Class
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Edit Class Modal */}
        <div className="modal fade" id="edit_class">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Class</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <i className="ti ti-x" />
                </button>
              </div>
              <form onSubmit={updateClass}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Class ID</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter Class ID"
                          value={formData.id}
                          onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Class Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter Class Name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Session</label>
                        <CommonSelect
                          className="select custom-select"
                          options={sessions.map((s) => ({ label: s.name, value: s._id }))}
                          defaultValue={sessions
                            .map((s) => ({ label: s.name, value: s._id }))
                            .find((s) => s.value === formData.sessionId)}
                          onChange={(option) =>
                            setFormData({
                              ...formData,
                              sessionId: option ? option.value : "",
                            })
                          }
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Teachers</label>
                        <Select
                          isMulti
                          options={teachers.map((teacher) => ({
                            value: teacher._id,
                            label: teacher.name,
                          }))}
                          value={getSelectedTeacherOptions()}
                          onChange={handleTeacherChange}
                          placeholder="Select Teachers"
                          className="basic-multi-select"
                          classNamePrefix="react-select"
                          classNames={{
                            control: (state) =>
                              state.isFocused
                                ? "border-gray-400 shadow-gray"
                                : "border-gray-300",
                            option: (state) =>
                              state.isSelected
                                ? "bg-gray-200 text-gray-800"
                                : state.isFocused
                                ? "bg-gray-100"
                                : "",
                            multiValue: () => "bg-gray-200",
                            multiValueLabel: () => "text-gray-800",
                            multiValueRemove: () => "text-gray-600 hover:bg-gray-300",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <Link to="#" className="btn btn-light me-2" data-bs-dismiss="modal">
                    Cancel
                  </Link>
                  <button type="submit" className="btn btn-primary" data-bs-dismiss="modal">
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
              <form onSubmit={deleteClass}>
                <div className="modal-body text-center">
                  <span className="delete-icon">
                    <i className="ti ti-trash-x" />
                  </span>
                  <h4>Confirm Deletion</h4>
                  <p>
                    Are you sure you want to delete {selectedClass?.name}? This cannot be undone.
                  </p>
                  <div className="d-flex justify-content-center">
                    <Link to="#" className="btn btn-light me-3" data-bs-dismiss="modal">
                      Cancel
                    </Link>
                    <button type="submit" className="btn btn-primary" data-bs-dismiss="modal">
                      Yes, Delete
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Classes;