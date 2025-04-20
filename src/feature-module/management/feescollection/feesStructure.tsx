import React, { useRef, useState, useEffect } from "react";
import { all_routes } from "../../router/all_routes";
import { Link } from "react-router-dom";
import Table from "../../../core/common/dataTable/index";
import TooltipOption from "../../../core/common/tooltipOption";
import axios from "axios";
import toast from "react-hot-toast";
import { Modal, Button } from "react-bootstrap";

interface Session {
  _id: string;
  name: string;
  sessionId: string;
  status: "active" | "inactive" | "completed";
}

interface Class {
  _id: string;
  id: string;
  name: string;
  sessionId: string;
  teacherId?: { _id: string; name: string }[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}
const API_URL = process.env.REACT_APP_URL;

interface FeesGroup {
  _id: string;
  id: string;
  name: string;
  description?: string;
  status: "Active" | "Inactive";
}

interface FeesType {
  _id: string;
  id: string;
  name: string;
  feesGroup: string | { _id: string; name: string };
  description?: string;
  status: "Active" | "Inactive";
}

interface FeeDetail {
  feesGroup: string | { _id: string; name: string };
  feeTypes: { feesType: string | { _id: string; name: string }; amount: number }[];
}

interface FeeTemplate {
  _id: string;
  templateId: string;
  name: string;
  sessionId: string | { _id: string; name: string; sessionId: string };
  classIds: Array<string | { _id: string; id: string; name: string }>;
  fees: FeeDetail[];
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

const FeeTemplateManager: React.FC = () => {
  const routes = all_routes;
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [feesGroups, setFeesGroups] = useState<FeesGroup[]>([]);
  const [feesTypes, setFeesTypes] = useState<FeesType[]>([]);
  const [templates, setTemplates] = useState<FeeTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<FeeTemplate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const config = {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  };
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [sessionsResponse, groupsResponse, typesResponse, templatesResponse] = await Promise.all([
          axios.get<Session[]>(`${API_URL}/api/session/get`, config).catch(() => ({ data: [] })),
          axios.get<FeesGroup[]>(`${API_URL}/api/feesGroup`, config).catch(() => ({ data: [] })),
          axios.get<FeesType[]>(`${API_URL}/api/feesType`, config).catch(() => ({ data: [] })),
          axios.get<FeeTemplate[]>(`${API_URL}/api/feesTemplate`, config).catch(() => ({ data: [] })), 
        ]);

        // Add fallbacks for null or incomplete data
        setSessions(sessionsResponse.data.map(session => ({
          _id: session._id || "",
          name: session.name || "Unknown Session",
          sessionId: session.sessionId || "",
          status: session.status || "inactive"
        })));
        setFeesGroups(groupsResponse.data.map(group => ({
          _id: group._id || "",
          id: group.id || "",
          name: group.name || "Unknown Group",
          description: group.description || "",
          status: group.status || "Inactive"
        })));
        setFeesTypes(typesResponse.data.map(type => ({
          _id: type._id || "",
          id: type.id || "",
          name: type.name || "Unknown Type",
          feesGroup: type.feesGroup || "",
          description: type.description || "",
          status: type.status || "Inactive"
        })));
        setTemplates(templatesResponse.data.map(template => ({
          _id: template._id || "",
          templateId: template.templateId || "Unknown ID",
          name: template.name || "Unknown Template",
          sessionId: template.sessionId || "",
          classIds: template.classIds || [],
          fees: template.fees || [],
          status: template.status || "Inactive",
          createdAt: template.createdAt || "",
          updatedAt: template.updatedAt || ""
        })));
        setLoading(false);
      } catch (err) {
        setError((err as Error).message || "Unknown error occurred");
        setLoading(false);
        toast.error("Failed to fetch initial data");
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchClassesForSession(selectedSession);
    } else {
      setClasses([]);
      setSelectedClass("");
      setSelectedTemplate(null);
    }
  }, [selectedSession]);

  const fetchClassesForSession = async (sessionId: string) => {
    try {
      const response = await axios
  .get<Class[]>(`${API_URL}/api/class/session/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  })
  .catch(() => ({ data: [] }));

      setClasses(response.data.map(cls => ({
        _id: cls._id || "",
        id: cls.id || "",
        name: cls.name || "Unknown Class",
        sessionId: cls.sessionId || "",
        teacherId: cls.teacherId || [],
        createdAt: cls.createdAt || "",
        updatedAt: cls.updatedAt || "",
        __v: cls.__v || 0
      })));
    } catch (err) {
      console.error("Error fetching classes:", err);
      setClasses([]);
      toast.error("Failed to fetch classes");
    }
  };

  useEffect(() => {
    if (selectedClass) {
      const template = templates.find((t) => t.classIds.some((id) => (typeof id === "string" ? id : id?._id || "") === selectedClass));
      setSelectedTemplate(template || null);
    } else {
      setSelectedTemplate(null);
    }
  }, [selectedClass, templates]);

  const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSession(e.target.value);
    setSelectedClass("");
    setSelectedTemplate(null);
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClass(e.target.value);
  };

  const handleTemplateSelect = (template: FeeTemplate) => {
    setSelectedTemplate(template);
    setShowViewModal(true);
  };

  const handleApplyClick = () => {
    if (dropdownMenuRef.current) {
      dropdownMenuRef.current.classList.remove("show");
    }
  };

  const templateColumns = [
    {
      title: "Template ID",
      dataIndex: "templateId",
      render: (templateId: string) => <span>{templateId || "N/A"}</span>,
    },
    {
      title: "Name",
      dataIndex: "name",
      render: (name: string) => <span>{name || "N/A"}</span>,
    },
    {
      title: "Session",
      dataIndex: "sessionId",
      render: (sessionId: string | { _id: string; name: string; sessionId: string }) => (
        <span>{typeof sessionId === "string" ? sessionId : sessionId?.name || "N/A"}</span>
      ),
    },
    {
      title: "Assigned Classes",
      dataIndex: "classIds",
      render: (classIds: Array<string | { _id: string; id: string; name: string }>) => (
        <span>{classIds.length > 0 ? classIds.map((c) => (typeof c === "string" ? c : c?.name || "N/A")).join(", ") : "Not Assigned"}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string) => <span>{status || "N/A"}</span>,
    },
    {
      title: "Action",
      render: (_: any, record: FeeTemplate) => (
        <div>
          <button
            className="btn btn-sm btn-primary me-1"
            onClick={() => handleTemplateSelect(record)}
          >
            View Details
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => {
              setSelectedTemplate(record);
              setShowAssignModal(true);
            }}
          >
            Assign to Classes
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Class Fee Structure</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="#">Fees Collection</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Class Fee Structure
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <TooltipOption />
            </div>
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Fee Templates</h4>
              <div className="d-flex align-items-center flex-wrap">
                <div className="mb-3 me-2">
                  <select
                    className="form-select"
                    value={selectedSession}
                    onChange={handleSessionChange}
                  >
                    <option value="">Select Session</option>
                    {sessions.map((session) => (
                      <option key={session._id} value={session._id}>
                        {session.name} ({session.sessionId})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="btn btn-primary mb-3 me-2"
                  onClick={() => setShowAddTemplateModal(true)}
                  disabled={!selectedSession}
                >
                  Add Template
                </button>
                <button
                  className="btn btn-primary mb-3 me-2"
                  onClick={() => setShowEditTemplateModal(true)}
                  disabled={!selectedSession}
                >
                  Edit Template
                </button>
              </div>
            </div>
            <div className="card-body p-0 py-3">
              <Table
                dataSource={templates.filter((t) =>
                  selectedSession
                    ? (typeof t.sessionId === "string" ? t.sessionId : t.sessionId?._id || "") === selectedSession
                    : true
                )}
                columns={templateColumns}
                Selection={false}
              />
            </div>
          </div>
        </div>
      </div>

      <AddFeeTemplateModal
        show={showAddTemplateModal}
        onHide={() => setShowAddTemplateModal(false)}
        templates={templates}
        setTemplates={setTemplates}
        feesGroups={feesGroups}
        feesTypes={feesTypes}
        sessionId={selectedSession}
        setSelectedTemplate={setSelectedTemplate}
        openAssignModal={() => setShowAssignModal(true)}
      />

      <EditFeeTemplateModal
        show={showEditTemplateModal}
        onHide={() => setShowEditTemplateModal(false)}
        templates={templates}
        setTemplates={setTemplates}
        feesGroups={feesGroups}
        feesTypes={feesTypes}
        sessionId={selectedSession}
        classes={classes}
        setSelectedTemplate={setSelectedTemplate}
      />

      <AssignTemplateModal
        show={showAssignModal}
        onHide={() => setShowAssignModal(false)}
        classes={classes}
        selectedTemplate={selectedTemplate}
        setTemplates={setTemplates}
      />

      <ViewFeeTemplateModal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        selectedTemplate={selectedTemplate}
      />
    </>
  );
};

// Add Fee Template Modal
interface AddFeeTemplateModalProps {
  show: boolean;
  onHide: () => void;
  templates: FeeTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<FeeTemplate[]>>;
  feesGroups: FeesGroup[];
  feesTypes: FeesType[];
  sessionId: string;
  setSelectedTemplate: React.Dispatch<React.SetStateAction<FeeTemplate | null>>;
  openAssignModal: () => void;
}

const AddFeeTemplateModal: React.FC<AddFeeTemplateModalProps> = ({
  show,
  onHide,
  templates,
  setTemplates,
  feesGroups,
  feesTypes,
  sessionId,
  setSelectedTemplate,
  openAssignModal,
}) => {
  const [templateForm, setTemplateForm] = useState({
    templateId: "",
    name: "",
    fees: [] as FeeDetail[],
    status: "Active" as "Active" | "Inactive",
  });
  const [collapsedGroups, setCollapsedGroups] = useState<boolean[]>([]);

  useEffect(() => {
    if (show) {
      setTemplateForm({
        templateId: "",
        name: "",
        fees: [],
        status: "Active",
      });
      setCollapsedGroups([]);
    }
  }, [show]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTemplateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFeeChange = (
    index: number,
    field: "feesGroup" | "feeTypes",
    value: string | { feesType: string; amount: number }[]
  ) => {
    const newFees = [...templateForm.fees];
    if (field === "feesGroup") {
      newFees[index] = { feesGroup: value as string, feeTypes: newFees[index]?.feeTypes?.length ? newFees[index].feeTypes : [{ feesType: "", amount: 0 }] };
    } else {
      newFees[index].feeTypes = value as { feesType: string; amount: number }[];
    }
    setTemplateForm((prev) => ({ ...prev, fees: newFees }));
  };

  const addFeeGroup = () => {
    setTemplateForm((prev) => ({
      ...prev,
      fees: [...prev.fees, { feesGroup: "", feeTypes: [{ feesType: "", amount: 0 }] }],
    }));
    setCollapsedGroups((prev) => [...prev, false]);
  };

  const toggleCollapse = (index: number) => {
    setCollapsedGroups((prev) => {
      const newCollapsed = [...prev];
      newCollapsed[index] = !newCollapsed[index];
      return newCollapsed;
    });
  };

  const handleFeeTypeChange = (
    feeIndex: number,
    typeIndex: number,
    field: "feesType" | "amount",
    value: string | number
  ) => {
    const newFees = [...templateForm.fees];
    const feeType = newFees[feeIndex]?.feeTypes[typeIndex] || { feesType: "", amount: 0 };
    newFees[feeIndex].feeTypes[typeIndex] = {
      ...feeType,
      [field]: field === "amount" ? Number(value) : value,
    };
    setTemplateForm((prev) => ({ ...prev, fees: newFees }));
  };

  const addFeeType = (feeIndex: number) => {
    const newFees = [...templateForm.fees];
    newFees[feeIndex].feeTypes.push({ feesType: "", amount: 0 });
    setTemplateForm((prev) => ({ ...prev, fees: newFees }));
  };

  const deleteFeeType = (feeIndex: number, typeIndex: number) => {
    const newFees = [...templateForm.fees];
    if (newFees[feeIndex]?.feeTypes.length > 1) {
      newFees[feeIndex].feeTypes.splice(typeIndex, 1);
      setTemplateForm((prev) => ({ ...prev, fees: newFees }));
    } else {
      toast.error("At least one fee type is required per fee group");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const payload = {
        ...templateForm,
        sessionId,
      };
      const response = await axios.post<FeeTemplate>(
        `${API_URL}/api/feesTemplate`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );      
      setTemplates((prev) => [...prev, response.data]);
      setSelectedTemplate(response.data);
      toast.success("Fee Template created successfully");
      onHide();
    } catch (error) {
      console.error("Error saving fee template:", (error as Error).message);
      toast.error("Error saving fee template");
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Add New Fee Template</Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label">Template ID <span className="text-danger">*</span></label>
            <input
              type="text"
              className="form-control"
              name="templateId"
              value={templateForm.templateId}
              onChange={handleInputChange}
              placeholder="e.g., FT-2023-001"
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Template Name <span className="text-danger">*</span></label>
            <input
              type="text"
              className="form-control"
              name="name"
              value={templateForm.name}
              onChange={handleInputChange}
              placeholder="e.g., Kindergarten Fee Template 2023"
              required
            />
          </div>
          <h5>School Fee Components</h5>
          <div style={{ maxHeight: "300px", overflowY: "auto", paddingRight: "10px" }}>
            {templateForm.fees.map((fee, feeIndex) => (
              <div key={feeIndex} className="mb-2 border p-2 rounded">
                <div
                  className="d-flex justify-content-between align-items-center"
                  onClick={() => toggleCollapse(feeIndex)}
                  style={{ cursor: "pointer" }}
                >
                  <label className="form-label mb-0">
                    {feesGroups.find((fg) => fg._id === (typeof fee.feesGroup === "string" ? fee.feesGroup : fee.feesGroup?._id || ""))?.name || "Select Fee Component"}
                  </label>
                  <i className={`ti ti-chevron-${collapsedGroups[feeIndex] ? "down" : "up"}`} />
                </div>
                {!collapsedGroups[feeIndex] && (
                  <div className="mt-2 d-flex align-items-start">
                    <div style={{ flex: 1, marginRight: "10px" }}>
                      <select
                        className="form-select mb-2"
                        value={typeof fee.feesGroup === "string" ? fee.feesGroup : fee.feesGroup?._id || ""}
                        onChange={(e) => handleFeeChange(feeIndex, "feesGroup", e.target.value)}
                        required
                      >
                        <option value="">Add Fee Group</option>
                        {feesGroups.map((group) => (
                          <option key={group._id} value={group._id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 2 }}>
                      {fee.feeTypes.map((ft, typeIndex) => (
                        <div key={typeIndex} className="d-flex mb-1 align-items-center">
                          <select
                            className="form-select me-1"
                            value={typeof ft.feesType === "string" ? ft.feesType : ft.feesType?._id || ""}
                            onChange={(e) =>
                              handleFeeTypeChange(feeIndex, typeIndex, "feesType", e.target.value)
                            }
                            required
                            style={{ flex: 2 }}
                          >
                            <option value="">Select Fee Type</option>
                            {feesTypes
                              .filter((type) => {
                                const feesGroupId = typeof type.feesGroup === "string" ? type.feesGroup : type.feesGroup?._id || "";
                                const currentFeeGroupId = typeof fee.feesGroup === "string" ? fee.feesGroup : fee.feesGroup?._id || "";
                                return feesGroupId === currentFeeGroupId;
                              })
                              .map((type) => (
                                <option key={type._id} value={type._id}>
                                  {type.name}
                                </option>
                              ))}
                          </select>
                          <input
                            type="text"
                            className="form-control me-1"
                            placeholder="Amount"
                            value={ft.amount === 0 ? "" : ft.amount}
                            onChange={(e) =>
                              handleFeeTypeChange(feeIndex, typeIndex, "amount", e.target.value)
                            }
                            onKeyPress={(e) => {
                              if (!/[0-9]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            required
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteFeeType(feeIndex, typeIndex)}
                          >
                            <i className="ti ti-trash" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm mt-1"
                        onClick={() => addFeeType(feeIndex)}
                      >
                        Add More Fee Type
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-primary btn-sm mt-2" onClick={addFeeGroup}>
            Add Fee Group
          </button>
          <div className="d-flex align-items-center justify-content-between mt-3">
            <div className="status-title">
              <h5>Status</h5>
              <p>Change the Status by toggle</p>
            </div>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={templateForm.status === "Active"}
                onChange={(e) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    status: e.target.checked ? "Active" : "Inactive",
                  }))
                }
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button variant="primary" type="submit">Add New Template</Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

// Edit Fee Template Modal
interface EditFeeTemplateModalProps {
  show: boolean;
  onHide: () => void;
  templates: FeeTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<FeeTemplate[]>>;
  feesGroups: FeesGroup[];
  feesTypes: FeesType[];
  sessionId: string;
  classes: Class[];
  setSelectedTemplate: React.Dispatch<React.SetStateAction<FeeTemplate | null>>;
}

const EditFeeTemplateModal: React.FC<EditFeeTemplateModalProps> = ({
  show,
  onHide,
  templates,
  setTemplates,
  feesGroups,
  feesTypes,
  sessionId,
  classes,
  setSelectedTemplate,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templateForm, setTemplateForm] = useState({
    templateId: "",
    name: "",
    classIds: [] as string[],
    fees: [] as FeeDetail[],
    status: "Active" as "Active" | "Inactive",
  });
  const [collapsedGroups, setCollapsedGroups] = useState<boolean[]>([]);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t._id === templateId);
    if (template) {
      setTemplateForm({
        templateId: template.templateId || "",
        name: template.name || "",
        classIds: template.classIds.map((c) => (typeof c === "string" ? c : c?._id || "")),
        fees: template.fees.length ? template.fees : [{ feesGroup: "", feeTypes: [{ feesType: "", amount: 0 }] }],
        status: template.status || "Active",
      });
      setCollapsedGroups(new Array(template.fees.length || 1).fill(false));
    } else {
      setTemplateForm({
        templateId: "",
        name: "",
        classIds: [],
        fees: [],
        status: "Active",
      });
      setCollapsedGroups([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTemplateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClassIdsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedIds: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedIds.push(options[i].value);
      }
    }
    setTemplateForm((prev) => ({ ...prev, classIds: selectedIds }));
  };

  const handleFeeChange = (
    index: number,
    field: "feesGroup" | "feeTypes",
    value: string | { feesType: string; amount: number }[]
  ) => {
    const newFees = [...templateForm.fees];
    if (field === "feesGroup") {
      newFees[index] = { feesGroup: value as string, feeTypes: newFees[index]?.feeTypes?.length ? newFees[index].feeTypes : [{ feesType: "", amount: 0 }] };
    } else {
      newFees[index].feeTypes = value as { feesType: string; amount: number }[];
    }
    setTemplateForm((prev) => ({ ...prev, fees: newFees }));
  };

  const addFeeGroup = () => {
    setTemplateForm((prev) => ({
      ...prev,
      fees: [...prev.fees, { feesGroup: "", feeTypes: [{ feesType: "", amount: 0 }] }],
    }));
    setCollapsedGroups((prev) => [...prev, false]);
  };

  const toggleCollapse = (index: number) => {
    setCollapsedGroups((prev) => {
      const newCollapsed = [...prev];
      newCollapsed[index] = !newCollapsed[index];
      return newCollapsed;
    });
  };

  const handleFeeTypeChange = (
    feeIndex: number,
    typeIndex: number,
    field: "feesType" | "amount",
    value: string | number
  ) => {
    const newFees = [...templateForm.fees];
    const feeType = newFees[feeIndex]?.feeTypes[typeIndex] || { feesType: "", amount: 0 };
    newFees[feeIndex].feeTypes[typeIndex] = {
      ...feeType,
      [field]: field === "amount" ? Number(value) : value,
    };
    setTemplateForm((prev) => ({ ...prev, fees: newFees }));
  };

  const addFeeType = (feeIndex: number) => {
    const newFees = [...templateForm.fees];
    newFees[feeIndex].feeTypes.push({ feesType: "", amount: 0 });
    setTemplateForm((prev) => ({ ...prev, fees: newFees }));
  };

  const deleteFeeType = (feeIndex: number, typeIndex: number) => {
    const newFees = [...templateForm.fees];
    if (newFees[feeIndex]?.feeTypes.length > 1) {
      newFees[feeIndex].feeTypes.splice(typeIndex, 1);
      setTemplateForm((prev) => ({ ...prev, fees: newFees }));
    } else {
      toast.error("At least one fee type is required per fee group");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTemplateId) {
      toast.error("Please select a template to edit");
      return;
    }
    try {
      const payload = {
        ...templateForm,
        sessionId,
      };
      const response = await axios.put<FeeTemplate>(
        `${API_URL}/api/feesTemplate/${selectedTemplateId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      setTemplates((prev) => prev.map((t) => (t._id === selectedTemplateId ? response.data : t)));
      setSelectedTemplate(response.data);
      toast.success("Fee Template updated successfully");
      onHide();
    } catch (error) {
      console.error("Error saving fee template:", (error as Error).message);
      toast.error("Error saving fee template");
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplateId) {
      toast.error("Please select a template to delete");
      return;
    }
    try {
      await axios.delete(`${API_URL}/api/feesTemplate/${selectedTemplateId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setTemplates((prev) => prev.filter((t) => t._id !== selectedTemplateId));
      setSelectedTemplate(null);
      setSelectedTemplateId("");
      setTemplateForm({ templateId: "", name: "", classIds: [], fees: [], status: "Active" });
      setCollapsedGroups([]);
      toast.success("Fee Template deleted successfully");
      onHide();
    } catch (error) {
      console.error("Error deleting fee template:", (error as Error).message);
      toast.error("Error deleting fee template");
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit Fee Template</Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label">Select Template <span className="text-danger">*</span></label>
            <select
              className="form-select"
              value={selectedTemplateId}
              onChange={handleTemplateChange}
              required
            >
              <option value="">Select Template</option>
              {templates
                .filter((t) => (typeof t.sessionId === "string" ? t.sessionId : t.sessionId?._id || "") === sessionId)
                .map((template) => (
                  <option key={template._id} value={template._id}>
                    {template.name} ({template.templateId})
                  </option>
                ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">Template ID <span className="text-danger">*</span></label>
            <input
              type="text"
              className="form-control"
              name="templateId"
              value={templateForm.templateId}
              onChange={handleInputChange}
              placeholder="e.g., FT-2023-001"
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Template Name <span className="text-danger">*</span></label>
            <input
              type="text"
              className="form-control"
              name="name"
              value={templateForm.name}
              onChange={handleInputChange}
              placeholder="e.g., Kindergarten Fee Template 2023"
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Assigned Classes</label>
            <select
              className="form-select"
              name="classIds"
              multiple
              value={templateForm.classIds}
              onChange={handleClassIdsChange}
            >
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <small className="form-text text-muted">Hold Ctrl (Windows) or Cmd (Mac) to select multiple classes</small>
          </div>
          <h5>School Fee Components</h5>
          <div style={{ maxHeight: "300px", overflowY: "auto", paddingRight: "10px" }}>
            {templateForm.fees.map((fee, feeIndex) => (
              <div key={feeIndex} className="mb-2 border p-2 rounded">
                <div
                  className="d-flex justify-content-between align-items-center"
                  onClick={() => toggleCollapse(feeIndex)}
                  style={{ cursor: "pointer" }}
                >
                  <label className="form-label mb-0">
                    {feesGroups.find((fg) => fg._id === (typeof fee.feesGroup === "string" ? fee.feesGroup : fee.feesGroup?._id || ""))?.name || "Select Fee Component"}
                  </label>
                  <i className={`ti ti-chevron-${collapsedGroups[feeIndex] ? "down" : "up"}`} />
                </div>
                {!collapsedGroups[feeIndex] && (
                  <div className="mt-2 d-flex align-items-start">
                    <div style={{ flex: 1, marginRight: "10px" }}>
                      <select
                        className="form-select mb-2"
                        value={typeof fee.feesGroup === "string" ? fee.feesGroup : fee.feesGroup?._id || ""}
                        onChange={(e) => handleFeeChange(feeIndex, "feesGroup", e.target.value)}
                        required
                      >
                        <option value="">Add Fee Group</option>
                        {feesGroups.map((group) => (
                          <option key={group._id} value={group._id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 2 }}>
                      {fee.feeTypes.map((ft, typeIndex) => (
                        <div key={typeIndex} className="d-flex mb-1 align-items-center">
                          <select
                            className="form-select me-1"
                            value={typeof ft.feesType === "string" ? ft.feesType : ft.feesType?._id || ""}
                            onChange={(e) =>
                              handleFeeTypeChange(feeIndex, typeIndex, "feesType", e.target.value)
                            }
                            required
                            style={{ flex: 2 }}
                          >
                            <option value="">Select Fee Type</option>
                            {feesTypes
                              .filter((type) => {
                                const feesGroupId = typeof type.feesGroup === "string" ? type.feesGroup : type.feesGroup?._id || "";
                                const currentFeeGroupId = typeof fee.feesGroup === "string" ? fee.feesGroup : fee.feesGroup?._id || "";
                                return feesGroupId === currentFeeGroupId;
                              })
                              .map((type) => (
                                <option key={type._id} value={type._id}>
                                  {type.name}
                                </option>
                              ))}
                          </select>
                          <input
                            type="text"
                            className="form-control me-1"
                            placeholder="Amount"
                            value={ft.amount === 0 ? "" : ft.amount}
                            onChange={(e) =>
                              handleFeeTypeChange(feeIndex, typeIndex, "amount", e.target.value)
                            }
                            onKeyPress={(e) => {
                              if (!/[0-9]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            required
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteFeeType(feeIndex, typeIndex)}
                          >
                            <i className="ti ti-trash" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm mt-1"
                        onClick={() => addFeeType(feeIndex)}
                      >
                        Add More Fee Type
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-primary btn-sm mt-2" onClick={addFeeGroup}>
            Add Fee Group
          </button>
          <div className="d-flex align-items-center justify-content-between mt-3">
            <div className="status-title">
              <h5>Status</h5>
              <p>Change the Status by toggle</p>
            </div>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={templateForm.status === "Active"}
                onChange={(e) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    status: e.target.checked ? "Active" : "Inactive",
                  }))
                }
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button variant="primary" onClick={handleDelete}>Delete Template</Button>
          <Button variant="primary" type="submit">Edit Template</Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

// Assign Template Modal
interface AssignTemplateModalProps {
  show: boolean;
  onHide: () => void;
  classes: Class[];
  selectedTemplate: FeeTemplate | null;
  setTemplates: React.Dispatch<React.SetStateAction<FeeTemplate[]>>;
}

const AssignTemplateModal: React.FC<AssignTemplateModalProps> = ({
  show,
  onHide,
  classes,
  selectedTemplate,
  setTemplates,
}) => {
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  useEffect(() => {
    if (selectedTemplate) {
      setSelectedClassIds(selectedTemplate.classIds.map((c) => (typeof c === "string" ? c : c?._id || "")));
    }
  }, [selectedTemplate]);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedIds: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedIds.push(options[i].value);
      }
    }
    setSelectedClassIds(selectedIds);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTemplate) {
      toast.error("No template selected");
      return;
    }
    try {
      const updatedTemplate = { ...selectedTemplate, classIds: selectedClassIds };
      const response = await axios.put<FeeTemplate>(
        `${API_URL}/api/feesTemplate/${selectedTemplate._id}`,
        updatedTemplate,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      setTemplates((prev) =>
        prev.map((t) => (t._id === selectedTemplate._id ? response.data : t))
      );
      toast.success("Template assigned to classes successfully");
      onHide();
    } catch (error) {
      console.error("Error assigning template:", (error as Error).message);
      toast.error("Error assigning template");
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Assign Fee Template to Classes</Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label">Selected Template</label>
            <input
              type="text"
              className="form-control"
              value={selectedTemplate ? `${selectedTemplate.name} (${selectedTemplate.templateId})` : "N/A"}
              readOnly
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Select Classes</label>
            <select
              className="form-select"
              multiple
              value={selectedClassIds}
              onChange={handleClassChange}
            >
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <small className="form-text text-muted">Hold Ctrl (Windows) or Cmd (Mac) to select multiple classes</small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button variant="primary" type="submit">Assign</Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

// View Fee Template Modal
interface ViewFeeTemplateModalProps {
  show: boolean;
  onHide: () => void;
  selectedTemplate: FeeTemplate | null;
}

const ViewFeeTemplateModal: React.FC<ViewFeeTemplateModalProps> = ({
  show,
  onHide,
  selectedTemplate,
}) => {
  const feeStructureColumns = [
    {
      title: "Fee Components",
      dataIndex: "name",
      render: (name: string) => <span>{name || "N/A"}</span>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      render: (amount: number) => <span>{amount !== undefined ? amount : "N/A"}</span>,
    },
  ];

  const feeStructureData = selectedTemplate?.fees.flatMap((fee) => {
    const groupName = typeof fee.feesGroup === "string" ? fee.feesGroup : fee.feesGroup?.name || "Unknown Group";
    return fee.feeTypes.map((ft) => ({
      key: `${typeof fee.feesGroup === "string" ? fee.feesGroup : fee.feesGroup?._id || ""}-${typeof ft.feesType === "string" ? ft.feesType : ft.feesType?._id || ""}`,
      name: `${groupName} - ${typeof ft.feesType === "string" ? ft.feesType : ft.feesType?.name || "Unknown Type"}`,
      amount: ft.amount,
    }));
  }) || [];

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Fee Template Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedTemplate ? (
          <>
            <div className="mb-3">
              <label className="form-label">Template Name</label>
              <input
                type="text"
                className="form-control"
                value={selectedTemplate.name || "N/A"}
                readOnly
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Template ID</label>
              <input
                type="text"
                className="form-control"
                value={selectedTemplate.templateId || "N/A"}
                readOnly
              />
            </div>
            <h5>Fee Structure Details</h5>
            <Table
              dataSource={feeStructureData}
              columns={feeStructureColumns}
              Selection={false}
            />
          </>
        ) : (
          <p>No template selected.</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FeeTemplateManager;