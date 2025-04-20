import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import axios from "axios";
import { all_routes } from "../../../router/all_routes";
import { Contract, Shift, gender } from "../../../../core/common/selectoption/selectoption";
import { TagsInput } from "react-tag-input-component";
import CommonSelect from "../../../../core/common/commonSelect";
import toast, { Toaster } from "react-hot-toast"; 

interface Option {
  value: string;
  label: string;
}
const API_URL = process.env.REACT_APP_URL;

interface TeacherFormData {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  joiningDate: string;
  experienceYears: number;
  subjects: string[];
  payroll: {
    epfNo: string;
    basicSalary: number;
  };
  contractType: "permanent" | "temporary" | "part-time" | "contract";
  workShift: "morning" | "afternoon" | "full-day" | "flexible";
  workLocation: string;
  dateOfLeaving: string | null;
  languagesSpoken: string[];
  emergencyContact: string;
  bio: string;
}

const TeacherForm: React.FC = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>(); // :id from /teacher/edit-teacher/:id or /teacher/teacher-details/:id
  const isEditMode = !!id;

  const initialFormData: TeacherFormData = {
    id: "",
    name: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "male",
    address: { street: "", city: "", state: "", postalCode: "", country: "USA" },
    joiningDate: "",
    experienceYears: 0,
    subjects: [],
    payroll: { epfNo: "", basicSalary: 0 },
    contractType: "permanent",
    workShift: "morning",
    workLocation: "",
    dateOfLeaving: null,
    languagesSpoken: [],
    emergencyContact: "",
    bio: "",
  };

  const [formData, setFormData] = useState<TeacherFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedTeacherId, setSubmittedTeacherId] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && id) {
      const fetchTeacher = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`${API_URL}/api/teacher/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          });
          const teacherData = response.data;
          setFormData({
            ...teacherData,
            dateOfBirth: teacherData.dateOfBirth
              ? dayjs(teacherData.dateOfBirth).format("DD-MM-YYYY")
              : "",
            joiningDate: teacherData.joiningDate
              ? dayjs(teacherData.joiningDate).format("DD-MM-YYYY")
              : "",
            dateOfLeaving: teacherData.dateOfLeaving
              ? dayjs(teacherData.dateOfLeaving).format("DD-MM-YYYY")
              : null,
            email: teacherData.userId.email,
          });
          setSubmittedTeacherId(id); // Pre-set for edit mode actions
        } catch (err) {
          setError("Failed to fetch teacher data");
          console.error("Error fetching teacher:", err);
          toast.error("Error fetching teacher")
        } finally {
          setLoading(false);
        }
      };
      fetchTeacher();
    }
  }, [id, isEditMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (section: keyof TeacherFormData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...(prev[section] as object), [field]: value },
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.id || !formData.name || !formData.email || !formData.phoneNumber) {
      setError("Please fill in all required fields (ID, Name, Email, Phone Number)");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email");
      return false;
    }
    if (!formData.joiningDate) {
      setError("Please select a joining date");
      return false;
    }
    if (!formData.emergencyContact) {
      setError("Please provide an emergency contact");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      id: formData.id,
      name: formData.name,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      password: isEditMode ? undefined : "password", // Default password for new teachers
      dateOfBirth: formData.dateOfBirth
        ? dayjs(formData.dateOfBirth, "DD-MM-YYYY").toISOString()
        : "",
      gender: formData.gender,
      address: formData.address,
      joiningDate: formData.joiningDate
        ? dayjs(formData.joiningDate, "DD-MM-YYYY").toISOString()
        : "",
      experienceYears: Number(formData.experienceYears),
      subjects: formData.subjects,
      payroll: {
        epfNo: formData.payroll.epfNo,
        basicSalary: Number(formData.payroll.basicSalary),
      },
      contractType: formData.contractType,
      workShift: formData.workShift,
      workLocation: formData.workLocation,
      dateOfLeaving: formData.dateOfLeaving
        ? dayjs(formData.dateOfLeaving, "DD-MM-YYYY").toISOString()
        : null,
      languagesSpoken: formData.languagesSpoken,
      emergencyContact: formData.emergencyContact,
      bio: formData.bio,
    };
    console.log("Payload:", payload);

    try {
      setLoading(true);
      setError(null);

      if (isEditMode) {
        const response = await axios.put(
          `${API_URL}/api/teacher/${id}`,
          payload,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        console.log("Updated teacher:", response.data);
        toast.success("Updated teacher Successfully")
        setSubmittedTeacherId(id);
      } else {
        const response = await axios.post(
          `${API_URL}/api/teacher/create`,
          payload,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        console.log("Created teacher:", response.data);
        toast.success("Added teacher Successfully")
        setSubmittedTeacherId(response.data.teacher.id); // Assuming response includes teacher object with id
      }
    } catch (error: any) {
      setError(error.response?.data?.message || `Failed to ${isEditMode ? "update" : "add"} teacher`);
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Toaster position="top-right" reverseOrder={false} />

    <div className="page-wrapper">
      <div className="content content-two">
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="mb-1">{isEditMode ? "Edit Teacher" : "Add Teacher"}</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to={routes.teacherList}>Teacher</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {isEditMode ? "Edit Teacher" : "Add Teacher"}
                </li>
              </ol>
            </nav>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {loading && <p>{isEditMode ? "Loading teacher data..." : "Saving..."}</p>}

        {!loading && (
          <div className="row">
            <div className="col-md-12">
              <form onSubmit={handleSubmit}>
                {/* Personal Information */}
                <div className="card">
                  <div className="card-header bg-light">
                    <h4 className="text-dark">Personal Information</h4>
                  </div>
                  <div className="card-body pb-1">
                    <div className="row row-cols-xxl-5 row-cols-md-6">
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Teacher ID *</label>
                          <input
                            type="text"
                            className="form-control"
                            name="id"
                            value={formData.id}
                            onChange={handleInputChange}
                            required
                            placeholder="e.g., T001"
                            disabled={isEditMode}
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Full Name *</label>
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
                          <label className="form-label">Email *</label>
                          <input
                            type="email"
                            className="form-control"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Phone Number *</label>
                          <input
                            type="text"
                            className="form-control"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Date of Birth</label>
                          <DatePicker
                            className="form-control datetimepicker"
                            format="DD-MM-YYYY"
                            value={formData.dateOfBirth ? dayjs(formData.dateOfBirth, "DD-MM-YYYY") : null}
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
                          <label className="form-label">Gender</label>
                          <CommonSelect
                            className="select"
                            options={gender}
                            defaultValue={gender.find((g) => g.value === formData.gender)}
                            onChange={(option) =>
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
                          <label className="form-label">Street *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.address.street}
                            onChange={(e) => handleNestedChange("address", "street", e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">City *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.address.city}
                            onChange={(e) => handleNestedChange("address", "city", e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">State *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.address.state}
                            onChange={(e) => handleNestedChange("address", "state", e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Postal Code *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.address.postalCode}
                            onChange={(e) => handleNestedChange("address", "postalCode", e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Country *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.address.country}
                            onChange={(e) => handleNestedChange("address", "country", e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Languages Spoken</label>
                          <TagsInput
                            value={formData.languagesSpoken}
                            onChange={(tags) => setFormData((prev) => ({ ...prev, languagesSpoken: tags }))}
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Emergency Contact Phone *</label>
                          <input
                            type="text"
                            className="form-control"
                            name="emergencyContact"
                            value={formData.emergencyContact}
                            onChange={handleInputChange}
                            required
                            placeholder="e.g., +1-555-123-4567"
                          />
                        </div>
                      </div>
                      <div className="col-xxl-12 col-xl-12">
                        <div className="mb-3">
                          <label className="form-label">Bio</label>
                          <textarea
                            className="form-control"
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            rows={4}
                            maxLength={500}
                            placeholder="Short description (max 500 characters)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Details */}
                <div className="card">
                  <div className="card-header bg-light">
                    <h4 className="text-dark">Professional Details</h4>
                  </div>
                  <div className="card-body pb-1">
                    <div className="row row-cols-xxl-5 row-cols-md-6">
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Joining Date *</label>
                          <DatePicker
                            className="form-control datetimepicker"
                            format="DD-MM-YYYY"
                            value={formData.joiningDate ? dayjs(formData.joiningDate, "DD-MM-YYYY") : null}
                            onChange={(date) =>
                              setFormData((prev) => ({
                                ...prev,
                                joiningDate: date ? date.format("DD-MM-YYYY") : "",
                              }))
                            }
                            placeholder="Select Date"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Experience (Years)</label>
                          <input
                            type="number"
                            className="form-control"
                            name="experienceYears"
                            value={formData.experienceYears}
                            onChange={handleInputChange}
                            min="0"
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Subjects</label>
                          <TagsInput
                            value={formData.subjects}
                            onChange={(tags) => setFormData((prev) => ({ ...prev, subjects: tags }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payroll */}
                <div className="card">
                  <div className="card-header bg-light">
                    <h4 className="text-dark">Payroll</h4>
                  </div>
                  <div className="card-body pb-1">
                    <div className="row row-cols-xxl-5 row-cols-md-6">
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">EPF No</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.payroll.epfNo}
                            onChange={(e) => handleNestedChange("payroll", "epfNo", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Basic Salary *</label>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.payroll.basicSalary}
                            onChange={(e) => handleNestedChange("payroll", "basicSalary", Number(e.target.value))}
                            min="0"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Contract Type</label>
                          <CommonSelect
                            className="select"
                            options={Contract}
                            defaultValue={Contract.find((c) => c.value === formData.contractType)}
                            onChange={(option) =>
                              setFormData((prev) => ({
                                ...prev,
                                contractType: (option?.value as "permanent" | "temporary" | "part-time" | "contract") || "permanent",
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Work Shift</label>
                          <CommonSelect
                            className="select"
                            options={Shift}
                            defaultValue={Shift.find((s) => s.value === formData.workShift)}
                            onChange={(option) =>
                              setFormData((prev) => ({
                                ...prev,
                                workShift: (option?.value as "morning" | "afternoon" | "full-day" | "flexible") || "morning",
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Work Location *</label>
                          <input
                            type="text"
                            className="form-control"
                            name="workLocation"
                            value={formData.workLocation}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Date of Leaving</label>
                          <DatePicker
                            className="form-control datetimepicker"
                            format="DD-MM-YYYY"
                            value={formData.dateOfLeaving ? dayjs(formData.dateOfLeaving, "DD-MM-YYYY") : null}
                            onChange={(date) =>
                              setFormData((prev) => ({
                                ...prev,
                                dateOfLeaving: date ? date.format("DD-MM-YYYY") : null,
                              }))
                            }
                            placeholder="Select Date"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="text-end mb-3">
                  <button
                    type="button"
                    className="btn btn-light me-3"
                    onClick={() => navigate(routes.teacherList)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Saving..." : isEditMode ? "Update Teacher" : "Add Teacher"}
                  </button>
                </div>

                {/* Actions Section */}
                {(isEditMode || submittedTeacherId) && (
                  <div className="card">
                    <div className="card-header bg-light">
                      <h4 className="text-dark">Actions</h4>
                    </div>
                    <div className="card-body">
                      <div className="d-flex justify-content-start gap-3">
                        <Link
                          to={routes.teacherDetails.replace(":id", submittedTeacherId || id || "")}
                          className="btn btn-outline-primary"
                        >
                          <i className="ti ti-eye me-2" />
                          View Details
                        </Link>
                        <Link
                          to={routes.editTeacher.replace(":id", submittedTeacherId || id || "")}
                          className="btn btn-outline-primary"
                        >
                          <i className="ti ti-edit-circle me-2" />
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default TeacherForm;