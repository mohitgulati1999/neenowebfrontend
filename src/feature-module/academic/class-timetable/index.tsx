import React, { useState, useEffect } from "react";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import TooltipOption from "../../../core/common/tooltipOption";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Class {
  _id: string;
  id: string;
  name: string;
  teacherId: { _id: string; name: string; email: string }[];
  sessionId: { _id: string; name: string; sessionId: string };
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface TimetableSlot {
  subject: string;
  timeFrom: string;
  timeTo: string;
}

const ClassTimetable = () => {
  const routes = all_routes;
  const [timetableData, setTimetableData] = useState<any>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date | null>(null);

  // Modal-specific states
  const [modalClass, setModalClass] = useState<string>("");
  const [modalWeekStart, setModalWeekStart] = useState<Date | null>(null);
  const [mondayContents, setMondayContents] = useState<TimetableSlot[]>([{ subject: "", timeFrom: "", timeTo: "" }]);
  const [tuesdayContents, setTuesdayContents] = useState<TimetableSlot[]>([{ subject: "", timeFrom: "", timeTo: "" }]);
  const [wednesdayContents, setWednesdayContents] = useState<TimetableSlot[]>([{ subject: "", timeFrom: "", timeTo: "" }]);
  const [thursdayContents, setThursdayContents] = useState<TimetableSlot[]>([{ subject: "", timeFrom: "", timeTo: "" }]);
  const [fridayContents, setFridayContents] = useState<TimetableSlot[]>([{ subject: "", timeFrom: "", timeTo: "" }]);

  const apiBaseUrl = "http://localhost:5000/api";

  // Get current week's start date (Monday)
  const getCurrentWeekStart = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const diff = today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1); // Adjust to Monday
    return new Date(today.setDate(diff));
  };

  // Fetch classes assigned to the teacher
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/class/teacher`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setClasses(response.data);
        if (response.data.length > 0) setSelectedClass(response.data[0]._id);
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };
    fetchClasses();
  }, []);

  // Fetch timetable when class or week changes for main view
  useEffect(() => {
    const fetchTimetable = async () => {
      if (!selectedClass || !selectedWeekStart) return;
      try {
        const weekStartString = selectedWeekStart.toISOString().split("T")[0];
        const response = await axios.get(`${apiBaseUrl}/timetable/${selectedClass}/${weekStartString}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setTimetableData(response.data);
      } catch (error) {
        console.error("Error fetching timetable:", error);
        setTimetableData(null);
      }
    };
    fetchTimetable();
  }, [selectedClass, selectedWeekStart]);

  // Set default week start to current week
  useEffect(() => {
    setSelectedWeekStart(getCurrentWeekStart());
  }, []);

  // Fetch and pre-fill timetable data in modal when opened
  const handleModalOpen = async () => {
    // Initialize modal states with current selections if not already set
    if (!modalClass || !modalWeekStart) {
      setModalClass(selectedClass);
      setModalWeekStart(selectedWeekStart);
    }

    // Reset to a single empty slot as a fallback
    setMondayContents([{ subject: "", timeFrom: "", timeTo: "" }]);
    setTuesdayContents([{ subject: "", timeFrom: "", timeTo: "" }]);
    setWednesdayContents([{ subject: "", timeFrom: "", timeTo: "" }]);
    setThursdayContents([{ subject: "", timeFrom: "", timeTo: "" }]);
    setFridayContents([{ subject: "", timeFrom: "", timeTo: "" }]);

    // Fetch existing timetable data for the selected class and week
    if (modalClass && modalWeekStart) {
      try {
        const weekStartString = modalWeekStart.toISOString().split("T")[0];
        const response = await axios.get(`${apiBaseUrl}/timetable/${modalClass}/${weekStartString}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = response.data;
        if (data && data.days) {
          const daysMap = {
            "Monday": setMondayContents,
            "Tuesday": setTuesdayContents,
            "Wednesday": setWednesdayContents,
            "Thursday": setThursdayContents,
            "Friday": setFridayContents,
          };

          data.days.forEach((day: any) => {
            const slots = day.slots.map((s: any) => ({
              subject: s.activity,
              timeFrom: s.startTime,
              timeTo: s.endTime,
            }));
            const setter = daysMap[day.day as keyof typeof daysMap];
            if (setter && slots.length > 0) {
              setter(slots); // Pre-fill with existing slots
            }
          });
        }
      } catch (error) {
        console.error("No existing timetable found for this week, starting with empty slots:", error);
      }
    }
  };

  // Add/remove timetable slots
  const addContent = (setter: React.Dispatch<React.SetStateAction<TimetableSlot[]>>) =>
    setter((prev) => [...prev, { subject: "", timeFrom: "", timeTo: "" }]);

  const removeContent = (setter: React.Dispatch<React.SetStateAction<TimetableSlot[]>>, index: number) =>
    setter((prev) => prev.filter((_, i) => i !== index));

  // Handle input changes
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<TimetableSlot[]>>, index: number, field: string, value: string) => {
    setter((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Submit timetable to backend
  const handleSubmitTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalClass || !modalWeekStart) {
      alert("Please select a class and week start date.");
      return;
    }

    const weekStart = new Date(modalWeekStart);
    const token = localStorage.getItem("token");
    const decodedToken = token ? JSON.parse(atob(token.split(".")[1])) : null;
    const teacherId = decodedToken?.userId;

    if (!teacherId) {
      alert("Unable to determine teacher ID. Please log in again.");
      return;
    }

    const timetablePayload = {
      classId: modalClass,
      weekStartDate: modalWeekStart.toISOString().split("T")[0],
      weekEndDate: new Date(weekStart.setDate(weekStart.getDate() + 4)).toISOString().split("T")[0],
      days: [
        { day: "Monday", date: modalWeekStart.toISOString().split("T")[0], slots: mondayContents.map(c => ({ startTime: c.timeFrom, endTime: c.timeTo, activity: c.subject, teacherId })) },
        { day: "Tuesday", date: new Date(weekStart.setDate(weekStart.getDate() + 1)).toISOString().split("T")[0], slots: tuesdayContents.map(c => ({ startTime: c.timeFrom, endTime: c.timeTo, activity: c.subject, teacherId })) },
        { day: "Wednesday", date: new Date(weekStart.setDate(weekStart.getDate() + 1)).toISOString().split("T")[0], slots: wednesdayContents.map(c => ({ startTime: c.timeFrom, endTime: c.timeTo, activity: c.subject, teacherId })) },
        { day: "Thursday", date: new Date(weekStart.setDate(weekStart.getDate() + 1)).toISOString().split("T")[0], slots: thursdayContents.map(c => ({ startTime: c.timeFrom, endTime: c.timeTo, activity: c.subject, teacherId })) },
        { day: "Friday", date: new Date(weekStart.setDate(weekStart.getDate() + 1)).toISOString().split("T")[0], slots: fridayContents.map(c => ({ startTime: c.timeFrom, endTime: c.timeTo, activity: c.subject, teacherId })) },
      ],
    };

    try {
      const response = await axios.post(`${apiBaseUrl}/timetable`, timetablePayload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTimetableData(response.data);
      console.log("Timetable saved:", response.data);
      alert("Timetable successfully saved!");
    } catch (error) {
      console.error("Error saving timetable:", error);
      alert("Failed to save timetable. Please try again.");
    }
  };

  return (
    <div>
      <div className="page-wrapper">
        <div className="content content-two">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Time Table</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item"><Link to={routes.adminDashboard}>Dashboard</Link></li>
                  <li className="breadcrumb-item">Academic</li>
                  <li className="breadcrumb-item active" aria-current="page">Time Table</li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <TooltipOption />
              <div className="mb-2">
                <Link to="#" className="btn btn-primary d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#add_time_table" onClick={handleModalOpen}>
                  <i className="ti ti-square-rounded-plus me-2" /> Add Time Table
                </Link>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Time Table</h4>
              <div className="d-flex align-items-center flex-wrap">
                <div className="mb-3 me-2">
                  <label className="form-label">Select Week</label>
                  <DatePicker
                    selected={selectedWeekStart}
                    onChange={(date: Date) => {
                      const dayOfWeek = date.getDay();
                      const monday = new Date(date);
                      monday.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
                      setSelectedWeekStart(monday);
                    }}
                    className="form-control"
                    dateFormat="MMMM d, yyyy"
                    showWeekNumbers
                    filterDate={(date) => date.getDay() === 1} // Restrict to Mondays
                  />
                </div>
                <div className="mb-3 me-2">
                  <label className="form-label">Class</label>
                  <select
                    className="form-control"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                  >
                    <option value="">Select Class</option>
                    {classes.map((classObj) => (
                      <option key={classObj._id} value={classObj._id}>
                        {classObj.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="card-body pb-0">
              <div className="d-flex flex-nowrap overflow-auto">
                {timetableData && timetableData.days.map((day: any, index: number) => (
                  <div key={index} className="d-flex flex-column me-4 flex-fill">
                    <div className="mb-3"><h6>{day.day}</h6></div>
                    {day.slots.map((slot: any, slotIndex: number) => (
                      <div key={slotIndex} className={`bg-transparent-${slotIndex % 7} rounded p-3 mb-4`}>
                        <p className="d-flex align-items-center text-nowrap mb-1">
                          <i className="ti ti-clock me-1" /> {slot.startTime} - {slot.endTime}
                        </p>
                        <p className="text-dark">Subject: {slot.activity}</p>
                        <div className="bg-white rounded p-1 mt-3">
                          <Link to={routes.teacherDetails} className="text-muted d-flex align-items-center">
                            <span className="avatar avatar-sm me-2">
                              <ImageWithBasePath src="assets/img/teachers/teacher-01.jpg" alt="Img" />
                            </span>
                            {slot.teacherId?.name || "You"}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Class Time Table Modal */}
      <div className="modal fade" id="add_time_table">
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Time Table</h4>
              <button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleSubmitTimetable}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">Class</label>
                      <select
                        className="form-control"
                        value={modalClass}
                        onChange={(e) => setModalClass(e.target.value)}
                      >
                        <option value="">Select Class</option>
                        {classes.map((classObj) => (
                          <option key={classObj._id} value={classObj._id}>
                            {classObj.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">Week Start Date</label>
                      <DatePicker
                        selected={modalWeekStart}
                        onChange={(date: Date) => {
                          const dayOfWeek = date.getDay();
                          const monday = new Date(date);
                          monday.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
                          setModalWeekStart(monday);
                          handleModalOpen(); // Re-fetch data when week changes
                        }}
                        className="form-control"
                        dateFormat="MMMM d, yyyy"
                        showWeekNumbers
                        filterDate={(date) => date.getDay() === 1}
                      />
                    </div>
                  </div>
                </div>
                <div className="add-more-timetable">
                  <ul className="tab-links nav nav-pills" id="pills-tab2" role="tablist">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, index) => (
                      <li
                        key={day}
                        className={`nav-link ${index === 0 ? "active" : ""}`}
                        id={`pills-${day.toLowerCase()}-tab`}
                        data-bs-toggle="pill"
                        data-bs-target={`#pills-${day.toLowerCase()}`}
                        role="tab"
                        aria-controls={`pills-${day.toLowerCase()}`}
                        aria-selected={index === 0}
                      >
                        <Link to="#">{day}</Link>
                      </li>
                    ))}
                  </ul>
                  <div className="tab-content pt-0 dashboard-tab">
                    {/* Monday */}
                    <div className="tab-pane fade show active" id="pills-monday" role="tabpanel" aria-labelledby="pills-monday-tab">
                      {mondayContents.map((content, index) => (
                        <div key={index} className="add-timetable-row">
                          <div className="row timetable-count">
                            <div className="col-lg-4">
                              <div className="mb-3">
                                <label className="form-label">Subject</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={content.subject}
                                  onChange={(e) => handleInputChange(setMondayContents, index, "subject", e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="col-lg-4">
                              <div className="mb-3">
                                <label className="form-label">Time From</label>
                                <input
                                  type="time"
                                  className="form-control"
                                  value={content.timeFrom}
                                  onChange={(e) => handleInputChange(setMondayContents, index, "timeFrom", e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="col-lg-4">
                              <div className="d-flex align-items-end">
                                <div className="mb-3 flex-fill">
                                  <label className="form-label">Time To</label>
                                  <input
                                    type="time"
                                    className="form-control"
                                    value={content.timeTo}
                                    onChange={(e) => handleInputChange(setMondayContents, index, "timeTo", e.target.value)}
                                  />
                                </div>
                                {mondayContents.length > 1 && (
                                  <div className="mb-3 ms-2">
                                    <Link to="#" className="delete-time-table" onClick={() => removeContent(setMondayContents, index)}>
                                      <i className="ti ti-trash" />
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Link to="#" className="btn btn-primary add-new-timetable" onClick={() => addContent(setMondayContents)}>
                        <i className="ti ti-square-rounded-plus-filled me-2" /> Add New
                      </Link>
                    </div>

                    {/* Tuesday */}
                    <div className="tab-pane fade" id="pills-tuesday" role="tabpanel" aria-labelledby="pills-tuesday-tab">
                      {tuesdayContents.map((content, index) => (
                        <div key={index} className="add-timetable-row">
                          <div className="row timetable-count">
                            <div className="col-lg-4">
                              <div className="mb-3">
                                <label className="form-label">Subject</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={content.subject}
                                  onChange={(e) => handleInputChange(setTuesdayContents, index, "subject", e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="col-lg-4">
                              <div className="mb-3">
                                <label className="form-label">Time From</label>
                                <input
                                  type="time"
                                  className="form-control"
                                  value={content.timeFrom}
                                  onChange={(e) => handleInputChange(setTuesdayContents, index, "timeFrom", e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="col-lg-4">
                              <div className="d-flex align-items-end">
                                <div className="mb-3 flex-fill">
                                  <label className="form-label">Time To</label>
                                  <input
                                    type="time"
                                    className="form-control"
                                    value={content.timeTo}
                                    onChange={(e) => handleInputChange(setTuesdayContents, index, "timeTo", e.target.value)}
                                  />
                                </div>
                                {tuesdayContents.length > 1 && (
                                  <div className="mb-3 ms-2">
                                    <Link to="#" className="delete-time-table" onClick={() => removeContent(setTuesdayContents, index)}>
                                      <i className="ti ti-trash" />
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Link to="#" className="btn btn-primary add-new-timetable" onClick={() => addContent(setTuesdayContents)}>
                        <i className="ti ti-square-rounded-plus-filled me-2" /> Add New
                      </Link>
                    </div>

                    {/* Wednesday */}
                    <div className="tab-pane fade" id="pills-wednesday" role="tabpanel" aria-labelledby="pills-wednesday-tab">
                      {wednesdayContents.map((content, index) => (
                        <div key={index} className="add-timetable-row">
                          <div className="row timetable-count">
                            <div className="col-lg-4">
                              <div className="mb-3">
                                <label className="form-label">Subject</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={content.subject}
                                  onChange={(e) => handleInputChange(setWednesdayContents, index, "subject", e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="col-lg-4">
                              <div className="mb-3">
                                <label className="form-label">Time From</label>
                                <input
                                  type="time"
                                  className="form-control"
                                  value={content.timeFrom}
                                  onChange={(e) => handleInputChange(setWednesdayContents, index, "timeFrom", e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="col-lg-4">
                              <div className="d-flex align-items-end">
                                <div className="mb-3 flex-fill">
                                  <label className="form-label">Time To</label>
                                  <input
                                    type="time"
                                    className="form-control"
                                    value={content.timeTo}
                                    onChange={(e) => handleInputChange(setWednesdayContents, index, "timeTo", e.target.value)}
                                  />
                                </div>
                                {wednesdayContents.length > 1 && (
                                  <div className="mb-3 ms-2">
                                    <Link to="#" className="delete-time-table" onClick={() => removeContent(setWednesdayContents, index)}>
                                      <i className="ti ti-trash" />
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Link to="#" className="btn btn-primary add-new-timetable" onClick={() => addContent(setWednesdayContents)}>
                        <i className="ti ti-square-rounded-plus-filled me-2" /> Add New
                      </Link>
                    </div>

                    {/* Thursday */}
                    <div className="tab-pane fade" id="pills-thursday" role="tabpanel" aria-labelledby="pills-thursday-tab">
                      {thursdayContents.map((content, index) => (
                        <div key={index} className="add-timetable-row">
                          <div className="row timetable-count">
                            <div className="col-lg-4">
                              <div className="mb-3">
                                <label className="form-label">Subject</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={content.subject}
                                  onChange={(e) => handleInputChange(setThursdayContents, index, "subject", e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="col-lg-4">
                              <div className="mb-3">
                                <label className="form-label">Time From</label>
                                <input
                                  type="time"
                                  className="form-control"
                                  value={content.timeFrom}
                                  onChange={(e) => handleInputChange(setThursdayContents, index, "timeFrom", e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="col-lg-4">
                              <div className="d-flex align-items-end">
                                <div className="mb-3 flex-fill">
                                  <label className="form-label">Time To</label>
                                  <input
                                    type="time"
                                    className="form-control"
                                    value={content.timeTo}
                                    onChange={(e) => handleInputChange(setThursdayContents, index, "timeTo", e.target.value)}
                                  />
                                </div>
                                {thursdayContents.length > 1 && (
                                  <div className="mb-3 ms-2">
                                    <Link to="#" className="delete-time-table" onClick={() => removeContent(setThursdayContents, index)}>
                                      <i className="ti ti-trash" />
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Link to="#" className="btn btn-primary add-new-timetable" onClick={() => addContent(setThursdayContents)}>
                        <i className="ti ti-square-rounded-plus-filled me-2" /> Add New
                      </Link>
                    </div>

                    {/* Friday */}
                    <div className="tab-pane fade" id="pills-friday" role="tabpanel" aria-labelledby="pills-friday-tab">
                      {fridayContents.map((content, index) => (
                        <div key={index} className="add-timetable-row">
                          <div className="row timetable-count">
                            <div className="col-lg-4">
                              <div className="mb-3">
                                <label className="form-label">Subject</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={content.subject}
                                  onChange={(e) => handleInputChange(setFridayContents, index, "subject", e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="col-lg-4">
                              <div className="mb-3">
                                <label className="form-label">Time From</label>
                                <input
                                  type="time"
                                  className="form-control"
                                  value={content.timeFrom}
                                  onChange={(e) => handleInputChange(setFridayContents, index, "timeFrom", e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="col-lg-4">
                              <div className="d-flex align-items-end">
                                <div className="mb-3 flex-fill">
                                  <label className="form-label">Time To</label>
                                  <input
                                    type="time"
                                    className="form-control"
                                    value={content.timeTo}
                                    onChange={(e) => handleInputChange(setFridayContents, index, "timeTo", e.target.value)}
                                  />
                                </div>
                                {fridayContents.length > 1 && (
                                  <div className="mb-3 ms-2">
                                    <Link to="#" className="delete-time-table" onClick={() => removeContent(setFridayContents, index)}>
                                      <i className="ti ti-trash" />
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Link to="#" className="btn btn-primary add-new-timetable" onClick={() => addContent(setFridayContents)}>
                        <i className="ti ti-square-rounded-plus-filled me-2" /> Add New
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Link to="#" className="btn btn-light me-2" data-bs-dismiss="modal">Cancel</Link>
                <button type="submit" className="btn btn-primary" data-bs-dismiss="modal">Add Time Table</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassTimetable;