import React, { useRef, useState, useEffect } from "react";
import { all_routes } from "../../router/all_routes";
import { Link } from "react-router-dom";
import PredefinedDateRanges from "../../../core/common/datePicker";
import CommonSelect from "../../../core/common/commonSelect";
import { ids, names, status, feeGroup } from "../../../core/common/selectoption/selectoption";
import Table from "../../../core/common/dataTable/index";
import FeesModal from "./feesModal";
import TooltipOption from "../../../core/common/tooltipOption";
import axios from "axios";
import toast from "react-hot-toast";

interface FeesGroup {
  _id: string;
  id: string;
  name: string;
  description?: string;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

interface FeesType {
  _id: string;
  id: string;
  name: string;
  feesGroup: { _id: string; name: string }; // Updated to match populated object
  description?: string;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}
const FeesGroup: React.FC = () => {
  const routes = all_routes;
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const [feesGroups, setFeesGroups] = useState<FeesGroup[]>([]);
  const [feesTypes, setFeesTypes] = useState<FeesType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editModalId, setEditModalId] = useState<string | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupsResponse, typesResponse] = await Promise.all([
          axios.get<FeesGroup[]>("http://localhost:5000/api/feesGroup", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            }}),
          axios.get<FeesType[]>("http://localhost:5000/api/feesType", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            }}),
        ]);
        setFeesGroups(groupsResponse.data);
        setFeesTypes(typesResponse.data);
        setLoading(false);
      } catch (err) {
        setError((err as Error).message);
        setLoading(false);
        toast.error("Failed to fetch data");
      }
    };
    fetchData();
  }, []);

  const handleApplyClick = () => {
    if (dropdownMenuRef.current) {
      dropdownMenuRef.current.classList.remove("show");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      render: (text: string) => <Link to="#" className="link-primary">{text}</Link>,
      sorter: (a: FeesGroup, b: FeesGroup) => a.id.localeCompare(b.id),
    },
    {
      title: "Fees Group",
      dataIndex: "name",
      sorter: (a: FeesGroup, b: FeesGroup) => a.name.localeCompare(b.name),
    },
    {
      title: "Description",
      dataIndex: "description",
      sorter: (a: FeesGroup, b: FeesGroup) => (a.description || "").localeCompare(b.description || ""),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: string) => (
        <>
          {text === "Active" ? (
            <span className="badge badge-soft-success d-inline-flex align-items-center">
              <i className="ti ti-circle-filled fs-5 me-1"></i>
              {text}
            </span>
          ) : (
            <span className="badge badge-soft-danger d-inline-flex align-items-center">
              <i className="ti ti-circle-filled fs-5 me-1"></i>
              {text}
            </span>
          )}
        </>
      ),
      sorter: (a: FeesGroup, b: FeesGroup) => a.status.localeCompare(b.status),
    },
    {
      title: "Action",
      dataIndex: "_id",
      render: (id: string) => (
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
                  onClick={() => setEditModalId(id)}
                >
                  <i className="ti ti-edit-circle me-2" />
                  Edit
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item rounded-1"
                  to="#"
                  onClick={() => setDeleteModalId(id)}
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Fees Collection</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="#">Fees Collection</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Fees Group
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <TooltipOption />
              <div className="mb-2">
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                  <i className="ti ti-square-rounded-plus me-2" />
                  Add Fees Group
                </button>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Fees Groups</h4>
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
                      <div className="p-3 border-bottom">
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label">ID</label>
                              <CommonSelect className="select" options={ids} defaultValue={ids[0]} />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label">Name</label>
                              <CommonSelect className="select" options={names} defaultValue={names[0]} />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label">Fees Group</label>
                              <CommonSelect
                                className="select"
                                options={feesGroups.map((group) => ({ value: group._id, label: group.name }))}
                                defaultValue={feesGroups[0] ? { value: feesGroups[0]._id, label: feesGroups[0].name } : undefined}
                              />
                            </div>
                          </div>
                          <div className="col-md-12">
                            <div className="mb-0">
                              <label className="form-label">Status</label>
                              <CommonSelect className="select" options={status} defaultValue={status[0]} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 d-flex align-items-center justify-content-end">
                        <Link to="#" className="btn btn-light me-3">Reset</Link>
                        <Link to="#" className="btn btn-primary" onClick={handleApplyClick}>Apply</Link>
                      </div>
                    </form>
                  </div>
                </div>
                <div className="dropdown mb-3">
                  <Link to="#" className="btn btn-outline-light bg-white dropdown-toggle" data-bs-toggle="dropdown">
                    <i className="ti ti-sort-ascending-2 me-2" />
                    Sort by A-Z
                  </Link>
                  <ul className="dropdown-menu p-3">
                    <li><Link to="#" className="dropdown-item rounded-1">Ascending</Link></li>
                    <li><Link to="#" className="dropdown-item rounded-1">Descending</Link></li>
                    <li><Link to="#" className="dropdown-item rounded-1">Recently Viewed</Link></li>
                    <li><Link to="#" className="dropdown-item rounded-1">Recently Added</Link></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body p-0 py-3">
              <Table dataSource={feesGroups} columns={columns} Selection={true} />
            </div>
          </div>
        </div>
      </div>
      <FeesModal
        feesGroups={feesGroups}
        setFeesGroups={setFeesGroups}
        feesTypes={feesTypes}
        setFeesTypes={setFeesTypes}
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        editModalId={editModalId}
        setEditModalId={setEditModalId}
        deleteModalId={deleteModalId}
        setDeleteModalId={setDeleteModalId}
      />
    </>
  );
};

export default FeesGroup;