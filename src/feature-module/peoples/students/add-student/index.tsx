import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { all_routes } from "../../../router/all_routes";
import {
  bloodGroup,
  cast,
  gender,
  mothertongue,
  PickupPoint,
  religion,
  route,
  status,
  VehicleNumber,
} from "../../../../core/common/selectoption/selectoption";
import { TagsInput } from "react-tag-input-component";
import CommonSelect from "../../../../core/common/commonSelect";
import axios, { AxiosError } from "axios";
import toast, { Toaster } from "react-hot-toast"; // Import react-hot-toast

interface Option {
  value: string;
  label: string;
  sessionId?: string; // Optional for classes, required for filtering
}

interface FormData {
  admissionNumber: string;
  admissionDate: string;
  status: "active" | "inactive";
  sessionId: string;
  classId?: string;
  rollNumber?: string;
  profileImage?: undefined;
  name: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  bloodGroup: string;
  religion: string;
  category: string;
  motherTongue: string;
  languagesKnown: string[];
  fatherInfo: {
    name: string;
    email: string;
    phoneNumber: string;
    occupation: string;
    image?: undefined;
  };
  motherInfo: {
    name: string;
    email: string;
    phoneNumber: string;
    occupation: string;
    image?: undefined;
  };
  guardianInfo: {
    name: string;
    relation: string;
    phoneNumber: string;
    email: string;
    occupation: string;
    image?: undefined;
  };
  currentAddress: string;
  permanentAddress: string;
  transportInfo: {
    route: string;
    vehicleNumber: string;
    pickupPoint: string;
  };
  documents: {
    aadharCard?: undefined;
    medicalCondition?: undefined;
    transferCertificate?: undefined;
  };
  medicalHistory: {
    condition: "good" | "bad" | "other";
    allergies: string[];
    medications: string[];
  };
  previousSchool: {
    name: string;
    address: string;
  };
}
const API_URL = process.env.REACT_APP_URL;
const AddStudent = () => {
  const { regNo } = useParams();
  const routes = all_routes;

  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [languagesKnown, setLanguagesKnown] = useState<string[]>(["English"]);
  const [medications, setMedications] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [sessions, setSessions] = useState<Option[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Option[]>([]);

  const [formData, setFormData] = useState<FormData>({
    admissionNumber: "",
    admissionDate: "",
    status: "active",
    sessionId: "",
    classId: undefined,
    rollNumber: undefined,
    profileImage: undefined,
    name: "",
    dateOfBirth: "",
    gender: "male",
    bloodGroup: "",
    religion: "",
    category: "",
    motherTongue: "",
    languagesKnown: [],
    fatherInfo: { name: "", email: "", phoneNumber: "", occupation: "", image: undefined },
    motherInfo: { name: "", email: "", phoneNumber: "", occupation: "", image: undefined },
    guardianInfo: {
      name: "",
      relation: "",
      phoneNumber: "",
      email: "",
      occupation: "",
      image: undefined,
    },
    currentAddress: "",
    permanentAddress: "",
    transportInfo: { route: "", vehicleNumber: "", pickupPoint: "" },
    documents: { aadharCard: undefined, medicalCondition: undefined, transferCertificate: undefined },
    medicalHistory: { condition: "good", allergies: [], medications: [] },
    previousSchool: { name: "", address: "" },
  });

  useEffect(() => {
    // Fetch sessions
    axios
      .get(`${API_URL}/api/session/get`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => {
        console.log("Sessions fetched:", res.data); // Debug
        setSessions(res.data.map((s: any) => ({ value: s._id, label: s.name })));
      })
      .catch((err) => console.error("Error fetching sessions:", err));

    // Fetch classes
    axios
      .get(`${API_URL}/api/class`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => {
        console.log("Classes fetched:", res.data); // Debug
        setClasses(
          res.data.map((c: any) => ({
            value: c._id,
            label: c.name,
            sessionId: c.sessionId,
          }))
        );
      })
      .catch((err) => console.error("Error fetching classes:", err));

    // Fetch student data if editing
    if (regNo) {
      setIsEdit(true);
      axios
        .get(`${API_URL}/api/student/${regNo}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
        .then((res) => {
          const student = res.data;
          console.log("Student data fetched:", student); // Debug
          setFormData({
            ...formData,
            admissionNumber: student.admissionNumber,
            admissionDate: student.admissionDate ? dayjs(student.admissionDate).format("DD-MM-YYYY") : "",
            status: student.status,
            sessionId: student.sessionId || "",
            classId: student.classId || undefined,
            rollNumber: student.rollNumber || undefined,
            name: student.name,
            dateOfBirth: student.dateOfBirth ? dayjs(student.dateOfBirth).format("DD-MM-YYYY") : "",
            gender: student.gender,
            bloodGroup: student.bloodGroup || "",
            religion: student.religion || "",
            category: student.category || "",
            motherTongue: student.motherTongue || "",
            languagesKnown: student.languagesKnown || [],
            fatherInfo: student.fatherInfo || formData.fatherInfo,
            motherInfo: student.motherInfo || formData.motherInfo,
            guardianInfo: student.guardianInfo || formData.guardianInfo,
            currentAddress: student.currentAddress || "",
            permanentAddress: student.permanentAddress || "",
            transportInfo: student.transportInfo || formData.transportInfo,
            medicalHistory: student.medicalHistory || formData.medicalHistory,
            previousSchool: student.previousSchool || formData.previousSchool,
          });
          setLanguagesKnown(student.languagesKnown || ["English"]);
          setMedications(student.medicalHistory?.medications || []);
          setAllergies(student.medicalHistory?.allergies || []);
        })
        .catch((err) => console.error("Error fetching student:", err));
    }
  }, [regNo]);

  // Filter classes based on selected session
  useEffect(() => {
    // console.log("Current sessionId:", formData.sessionId); // Debug
    // console.log("All classes:", classes); // Debug
    if (formData.sessionId) {
      const filtered = classes.filter((c:any) => c.sessionId._id === formData.sessionId);
      console.log("Filtered classes:", filtered); // Debug
      setFilteredClasses([{ value: "", label: "None" }, ...filtered]);
      if (formData.classId && !filtered.some((c) => c.value === formData.classId)) {
        setFormData((prev) => ({ ...prev, classId: undefined }));
      }
    } else {
      setFilteredClasses([{ value: "", label: "None" }]);
      setFormData((prev) => ({ ...prev, classId: undefined }));
    }
  }, [formData.sessionId, classes]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNestedChange = (section: keyof FormData, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as object),
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!formData.sessionId) {
      console.error("Please Select a session.");
      toast.error("Please select a session");
      return;
    }
  
    if (!formData.name || !formData.admissionNumber || !formData.admissionDate) {
      toast.error("Please fill in all required fields.");
      return;
    }
  
    const admissionDateISO = formData.admissionDate
      ? dayjs(formData.admissionDate, "DD-MM-YYYY").format("YYYY-MM-DD")
      : "";
    const dateOfBirthISO = formData.dateOfBirth
      ? dayjs(formData.dateOfBirth, "DD-MM-YYYY").format("YYYY-MM-DD")
      : "";
  
    const updatedFormData = {
      ...formData,
      admissionDate: admissionDateISO,
      dateOfBirth: dateOfBirthISO,
      status: formData.status.toLowerCase() as "active" | "inactive",
      gender: formData.gender.toLowerCase() as "male" | "female" | "other",
      languagesKnown,
      medicalHistory: {
        ...formData.medicalHistory,
        allergies,
        medications,
      },
    };
  
    try {
      const token = localStorage.getItem("token");
      const url = isEdit
        ? `${API_URL}/api/student/${regNo}`
        : `${API_URL}/api/student/create`;
      const method = isEdit ? "put" : "post";
  
      const response = await axios({
        method,
        url,
        data: updatedFormData,
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
  
      toast.success(`${isEdit ? "Student updated" : "Student added"} successfully!`);
      
      // Reset form and navigate
      if (!isEdit) {
        // Reset all form state
        setFormData({
          admissionNumber: "",
          admissionDate: "",
          status: "active",
          sessionId: "",
          classId: undefined,
          rollNumber: undefined,
          profileImage: undefined,
          name: "",
          dateOfBirth: "",
          gender: "male",
          bloodGroup: "",
          religion: "",
          category: "",
          motherTongue: "",
          languagesKnown: [],
          fatherInfo: { name: "", email: "", phoneNumber: "", occupation: "", image: undefined },
          motherInfo: { name: "", email: "", phoneNumber: "", occupation: "", image: undefined },
          guardianInfo: {
            name: "",
            relation: "",
            phoneNumber: "",
            email: "",
            occupation: "",
            image: undefined,
          },
          currentAddress: "",
          permanentAddress: "",
          transportInfo: { route: "", vehicleNumber: "", pickupPoint: "" },
          documents: { aadharCard: undefined, medicalCondition: undefined, transferCertificate: undefined },
          medicalHistory: { condition: "good", allergies: [], medications: [] },
          previousSchool: { name: "", address: "" },
        });
        setLanguagesKnown(["English"]);
        setMedications([]);
        setAllergies([]);
      }
      
      // Navigate back to student list
      window.location.href = routes.studentList;
      
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error("Failed to submit student: " +
        (axiosError.response?.data?.message || axiosError.message || "Unknown error"));
    }
  };

  return (
    <>
   <Toaster position="top-right" reverseOrder={false} />
    <div className="page-wrapper">
      <div className="content content-two">
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="mb-1">{isEdit ? "Edit" : "Add"} Student</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to={routes.studentList}>Students</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {isEdit ? "Edit" : "Add"} Student
                </li>
              </ol>
            </nav>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <form onSubmit={handleSubmit}>
              <div className="card">
                <div className="card-header bg-light">
                  <h4 className="text-dark">Account Information</h4>
                </div>
                <div className="card-body pb-1">
                  <div className="row row-cols-xxl-5 row-cols-md-6">
                    <div className="col-xxl col-xl-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Session <span className="text-danger">*</span></label>
                        <CommonSelect
                          className="select"
                          options={sessions}
                          defaultValue={
                            formData.sessionId
                              ? sessions.find((s) => s.value === formData.sessionId)
                              : undefined
                          }
                          onChange={(option: Option | null) =>
                            setFormData((prev) => ({
                              ...prev,
                              sessionId: option?.value || "",
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-xxl col-xl-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Class</label>
                        <CommonSelect
                          className="select"
                          options={filteredClasses}
                          defaultValue={
                            filteredClasses.find((c) => c.value === formData.classId) || {
                              value: "",
                              label: "None",
                            }
                          }
                          onChange={(option: Option | null) =>
                            setFormData((prev) => ({
                              ...prev,
                              classId: option?.value || undefined,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-xxl col-xl-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Admission Number <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          name="admissionNumber"
                          value={formData.admissionNumber}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-xxl col-xl-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Admission Date <span className="text-danger">*</span></label>
                        <DatePicker
                          className="form-control datetimepicker"
                          format="DD-MM-YYYY"
                          value={
                            formData.admissionDate
                              ? dayjs(formData.admissionDate, "DD-MM-YYYY")
                              : null
                          }
                          onChange={(date) =>
                            setFormData((prev) => ({
                              ...prev,
                              admissionDate: date ? date.format("DD-MM-YYYY") : "",
                            }))
                          }
                          placeholder="Select Date"
                        />
                      </div>
                    </div>
                    <div className="col-xxl col-xl-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <CommonSelect
                          className="select"
                          options={status}
                          defaultValue={status.find((item) => item.value === formData.status)}
                          onChange={(option: Option | null) =>
                            setFormData((prev) => ({
                              ...prev,
                              status: (option?.value as "active" | "inactive") || "active",
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-xxl col-xl-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Roll Number (Optional)</label>
                        <input
                          type="text"
                          className="form-control"
                          name="rollNumber"
                          value={formData.rollNumber || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rest of the form remains unchanged */}
              <div className="card">
                <div className="card-header bg-light">
                  <h4 className="text-dark">Personal Information</h4>
                </div>
                <div className="card-body pb-1">
                  <div className="row row-cols-xxl-5 row-cols-md-6">
                    <div className="col-xxl col-xl-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-xxl col-xl-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Date of Birth <span className="text-danger">*</span></label>
                        <DatePicker
                          className="form-control datetimepicker"
                          format="DD-MM-YYYY"
                          value={
                            formData.dateOfBirth
                              ? dayjs(formData.dateOfBirth, "DD-MM-YYYY")
                              : null
                          }
                          onChange={(date) =>
                            setFormData((prev) => ({
                              ...prev,
                              dateOfBirth: date ? date.format("DD-MM-YYYY") : "",
                            }))
                          }
                          placeholder="Select Date"
                        />
                      </div>
                    </div>
                    <div className="col-xxl col-xl-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Gender <span className="text-danger">*</span></label>
                        <CommonSelect
                          className="select"
                          options={gender}
                          defaultValue={gender.find((gen) => gen.value === formData.gender)}
                          onChange={(option: Option | null) =>
                            setFormData((prev) => ({
                              ...prev,
                              gender: (option?.value as "male" | "female" | "other") || "male",
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-xxl col-xl-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Blood Group</label>
                        <CommonSelect
                          className="select"
                          options={bloodGroup}
                          defaultValue={
                            formData.bloodGroup
                              ? bloodGroup.find((bg) => bg.value === formData.bloodGroup)
                              : undefined
                          }
                          onChange={(option: Option | null) =>
                            setFormData((prev) => ({
                              ...prev,
                              bloodGroup: option?.value || "",
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-xxl col-xl-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Religion</label>
                        <CommonSelect
                          className="select"
                          options={religion}
                          defaultValue={
                            formData.religion
                              ? religion.find((rel) => rel.value === formData.religion)
                              : undefined
                          }
                          onChange={(option: Option | null) =>
                            setFormData((prev) => ({
                              ...prev,
                              religion: option?.value || "",
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-xxl col-xl-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Category</label>
                        <CommonSelect
                          className="select"
                          options={cast}
                          defaultValue={
                            formData.category
                              ? cast.find((c) => c.value === formData.category)
                              : undefined
                          }
                          onChange={(option: Option | null) =>
                            setFormData((prev) => ({
                              ...prev,
                              category: option?.value || "",
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-xxl col-xl-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Mother Tongue</label>
                        <CommonSelect
                          className="select"
                          options={mothertongue}
                          defaultValue={
                            formData.motherTongue
                              ? mothertongue.find((mt) => mt.value === formData.motherTongue)
                              : undefined
                          }
                          onChange={(option: Option | null) =>
                            setFormData((prev) => ({
                              ...prev,
                              motherTongue: option?.value || "",
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-xxl col-xl-3 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Languages Known</label>
                        <TagsInput value={languagesKnown} onChange={setLanguagesKnown} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Remaining form sections (Parents & Guardian, Address, Transport, Medical History, Previous School) */}
              <div className="card">
                <div className="card-header bg-light">
                  <h4 className="text-dark">Parents & Guardian Information</h4>
                </div>
                <div className="card-body pb-0">
                  <div className="border-bottom mb-3">
                    <h5 className="mb-3">Father’s Info</h5>
                    <div className="row">
                      <div className="col-lg-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Father Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.fatherInfo.name}
                            onChange={(e) =>
                              handleNestedChange("fatherInfo", "name", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="col-lg-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Email</label>
                          <input
                            type="email"
                            className="form-control"
                            value={formData.fatherInfo.email}
                            onChange={(e) =>
                              handleNestedChange("fatherInfo", "email", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="col-lg-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Phone Number</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.fatherInfo.phoneNumber}
                            onChange={(e) =>
                              handleNestedChange("fatherInfo", "phoneNumber", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="col-lg-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Occupation</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.fatherInfo.occupation}
                            onChange={(e) =>
                              handleNestedChange("fatherInfo", "occupation", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Mother and Guardian sections remain unchanged */}
                  <div className="border-bottom mb-3">
                    <h5 className="mb-3">Mother’s Info</h5>
                    <div className="row">
                      <div className="col-lg-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Mother Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.motherInfo.name}
                            onChange={(e) =>
                              handleNestedChange("motherInfo", "name", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="col-lg-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Email</label>
                          <input
                            type="email"
                            className="form-control"
                            value={formData.motherInfo.email}
                            onChange={(e) =>
                              handleNestedChange("motherInfo", "email", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="col-lg-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Phone Number</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.motherInfo.phoneNumber}
                            onChange={(e) =>
                              handleNestedChange("motherInfo", "phoneNumber", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="col-lg-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Occupation</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.motherInfo.occupation}
                            onChange={(e) =>
                              handleNestedChange("motherInfo", "occupation", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h5 className="mb-3">Guardian Details</h5>
                    <div className="row">
                      <div className="col-lg-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Guardian Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.guardianInfo.name}
                            onChange={(e) =>
                              handleNestedChange("guardianInfo", "name", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="col-lg-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Relation</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.guardianInfo.relation}
                            onChange={(e) =>
                              handleNestedChange("guardianInfo", "relation", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="col-lg-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Phone Number</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.guardianInfo.phoneNumber}
                            onChange={(e) =>
                              handleNestedChange("guardianInfo", "phoneNumber", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="col-lg-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Email</label>
                          <input
                            type="email"
                            className="form-control"
                            value={formData.guardianInfo.email}
                            onChange={(e) =>
                              handleNestedChange("guardianInfo", "email", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="col-lg-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Occupation</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.guardianInfo.occupation}
                            onChange={(e) =>
                              handleNestedChange("guardianInfo", "occupation", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header bg-light">
                  <h4 className="text-dark">Address</h4>
                </div>
                <div className="card-body pb-1">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Current Address</label>
                        <input
                          type="text"
                          className="form-control"
                          name="currentAddress"
                          value={formData.currentAddress}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Permanent Address</label>
                        <input
                          type="text"
                          className="form-control"
                          name="permanentAddress"
                          value={formData.permanentAddress}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header bg-light">
                  <h4 className="text-dark">Transport Information</h4>
                </div>
                <div className="card-body pb-1">
                  <div className="row">
                    <div className="col-lg-4 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Route</label>
                        <CommonSelect
                          className="select"
                          options={route}
                          defaultValue={
                            formData.transportInfo.route
                              ? route.find((r) => r.value === formData.transportInfo.route)
                              : undefined
                          }
                          onChange={(option: Option | null) =>
                            handleNestedChange("transportInfo", "route", option?.value || "")
                          }
                        />
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Vehicle Number</label>
                        <CommonSelect
                          className="select"
                          options={VehicleNumber}
                          defaultValue={
                            formData.transportInfo.vehicleNumber
                              ? VehicleNumber.find(
                                  (vn) => vn.value === formData.transportInfo.vehicleNumber
                                )
                              : undefined
                          }
                          onChange={(option: Option | null) =>
                            handleNestedChange("transportInfo", "vehicleNumber", option?.value || "")
                          }
                        />
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Pickup Point</label>
                        <CommonSelect
                          className="select"
                          options={PickupPoint}
                          defaultValue={
                            formData.transportInfo.pickupPoint
                              ? PickupPoint.find(
                                  (pp) => pp.value === formData.transportInfo.pickupPoint
                                )
                              : undefined
                          }
                          onChange={(option: Option | null) =>
                            handleNestedChange("transportInfo", "pickupPoint", option?.value || "")
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header bg-light">
                  <h4 className="text-dark">Medical History</h4>
                </div>
                <div className="card-body pb-1">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-2">
                        <label className="form-label">Medical Condition</label>
                        <div className="d-flex align-items-center flex-wrap">
                          <div className="form-check me-3 mb-2">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="medicalCondition"
                              id="good"
                              checked={formData.medicalHistory.condition === "good"}
                              onChange={() =>
                                handleNestedChange("medicalHistory", "condition", "good")
                              }
                            />
                            <label className="form-check-label" htmlFor="good">
                              Good
                            </label>
                          </div>
                          <div className="form-check me-3 mb-2">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="medicalCondition"
                              id="bad"
                              checked={formData.medicalHistory.condition === "bad"}
                              onChange={() =>
                                handleNestedChange("medicalHistory", "condition", "bad")
                              }
                            />
                            <label className="form-check-label" htmlFor="bad">
                              Bad
                            </label>
                          </div>
                          <div className="form-check mb-2">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="medicalCondition"
                              id="other"
                              checked={formData.medicalHistory.condition === "other"}
                              onChange={() =>
                                handleNestedChange("medicalHistory", "condition", "other")
                              }
                            />
                            <label className="form-check-label" htmlFor="other">
                              Other
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Allergies</label>
                        <TagsInput value={allergies} onChange={setAllergies} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Medications</label>
                        <TagsInput value={medications} onChange={setMedications} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header bg-light">
                  <h4 className="text-dark">Previous School Details</h4>
                </div>
                <div className="card-body pb-1">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">School Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.previousSchool.name}
                          onChange={(e) =>
                            handleNestedChange("previousSchool", "name", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Address</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.previousSchool.address}
                          onChange={(e) =>
                            handleNestedChange("previousSchool", "address", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-end">
                <button type="button" className="btn btn-light me-3">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEdit ? "Update Student" : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default AddStudent;