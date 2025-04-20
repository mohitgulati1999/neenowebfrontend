import React, { useEffect, useState } from "react";
import { all_routes } from "../../router/all_routes";
import { Link } from "react-router-dom";
import CommonSelect from "../../../core/common/commonSelect";
import Table from "../../../core/common/dataTable/index";
import AssignModal from "./assignModal";
import axios from "axios";
import { toast } from "react-toastify";
const API_URL = process.env.REACT_APP_URL;

interface Option {
  value: string;
  label: string;
}

interface FeeType {
  feesType: { _id: string; name: string };
  amount: number;
  dueDate: string; // Add dueDate to match AssignModal
}

interface FeeGroup {
  feesGroup: { _id: string; name: string };
  feeTypes: FeeType[];
}

interface ClassWithTemplates {
  _id: string;
  id: string;
  name: string;
  sessionId: {
    _id: string;
    name: string;
    sessionId: string;
  };
  templates: {
    _id: string;
    name: string;
    fees: FeeGroup[];
  }[];
}
interface ApiResponse {
  session: {
    _id: string;
    name: string;
    sessionId: string;
  };
  classes: ClassWithTemplates[];
}

const FeesAssign: React.FC = () => {
  const routes = all_routes;
  const [sessions, setSessions] = useState<Option[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassWithTemplates | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchClassesWithTemplates();
    } else {
      setApiData(null);
    }
  }, [selectedSession]);

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/session/get`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setSessions(
        response.data.map((s: any) => ({
          value: s._id,
          label: s.name,
        }))
      );
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to fetch sessions");
    }
  };

  const fetchClassesWithTemplates = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/feesTemplate/getTemplateInfoByClass/${selectedSession}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setApiData(response.data);
    } catch (error) {
      console.error("Error fetching classes with templates:", error);
      toast.error("Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  };

  const handleSessionChange = (selectedOption: Option | null) => {
    setSelectedSession(selectedOption?.value || "");
  };

  const handleClassClick = (classData: ClassWithTemplates) => {
    setSelectedClass(classData);
    setShowAssignModal(true);
  };

  const columns = [
    {
      title: "Class ID",
      dataIndex: "id",
      sorter: (a: ClassWithTemplates, b: ClassWithTemplates) => a.id.localeCompare(b.id),
    },
    {
      title: "Class Name",
      dataIndex: "name",
      sorter: (a: ClassWithTemplates, b: ClassWithTemplates) => a.name.localeCompare(b.name),
    },
    {
      title: "Templates",
      dataIndex: "templates",
      render: (templates: any[]) => (
        <div className="template-names">
          {templates?.map((template) => (
            <span key={template._id} className="badge bg-primary me-1 mb-1">
              {template.name}
            </span>
          ))}
        </div>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_: any, record: ClassWithTemplates) => (
        <button
          className="btn btn-primary btn-sm"
          onClick={() => handleClassClick(record)}
        >
          View/Assign Fees
        </button>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Fees Assignment</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="#">Fees Management</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Assign Fees to Students
                </li>
              </ol>
            </nav>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="row align-items-center">
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Select Session</label>
                  <CommonSelect
                    className="select"
                    options={sessions}
                    defaultValue={
                      selectedSession
                        ? {
                            value: selectedSession,
                            label: sessions.find((s) => s.value === selectedSession)?.label || "",
                          }
                        : undefined
                    }
                    onChange={handleSessionChange}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="card-body">
            {!selectedSession ? (
              <div className="text-center py-5">
                <div className="alert alert-info">
                  No session selected. Please select a session to view classes.
                </div>
              </div>
            ) : loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
              </div>
            ) : !apiData?.classes?.length ? (
              <div className="text-center py-5">
                <div className="alert alert-warning">
                  No classes found for the selected session.
                </div>
              </div>
            ) : (
              <Table dataSource={apiData.classes} columns={columns} />
            )}
          </div>
        </div>
      </div>

      {selectedClass && (
        <AssignModal
          classData={selectedClass}
          sessionId={selectedSession}
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          refreshData={fetchClassesWithTemplates}
        />
      )}
    </div>
  );
};

export default FeesAssign;