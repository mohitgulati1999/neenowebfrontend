import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import { all_routes } from "../../router/all_routes";

// Interfaces
interface Meal {
  _id?: string; // Added for edit/delete
  name: string;
  description: string;
  picture: string | null;
}

interface MealPlan {
  Monday: { breakfast: Meal | null; lunch: Meal | null };
  Tuesday: { breakfast: Meal | null; lunch: Meal | null };
  Wednesday: { breakfast: Meal | null; lunch: Meal | null };
  Thursday: { breakfast: Meal | null; lunch: Meal | null };
  Friday: { breakfast: Meal | null; lunch: Meal | null };
}

interface User {
  userId: string;
  role: "admin" | "teacher" | "parent" | "student";
}

interface MealFormData {
  _id?: string; // For edit
  day: string;
  mealType: string;
  name: string;
  description: string;
}

// Custom Tooltip Component
const CustomTooltip: React.FC = () => {
  return (
    <span
      className="btn btn-sm btn-outline-info ms-2"
      data-bs-toggle="tooltip"
      data-bs-placement="top"
      title="Meal Plan Management Help"
    >
      <i className="ti ti-help fs-14" />
    </span>
  );
};

const MealPlan: React.FC = () => {
  const routes = all_routes;
  const apiBaseUrl = "http://localhost:5000/api";
  const [mealPlan, setMealPlan] = useState<MealPlan>({
    Monday: { breakfast: null, lunch: null },
    Tuesday: { breakfast: null, lunch: null },
    Wednesday: { breakfast: null, lunch: null },
    Thursday: { breakfast: null, lunch: null },
    Friday: { breakfast: null, lunch: null }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newMeal, setNewMeal] = useState<MealFormData>({
    day: "",
    mealType: "",
    name: "",
    description: ""
  });
  const [editMeal, setEditMeal] = useState<MealFormData | null>(null);
  const [deleteMealId, setDeleteMealId] = useState<string | null>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);

  // Decode JWT token
  const decodeToken = (token: string): { userId: string; role: string } | null => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  // Fetch meal plan
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please log in to view meal plan.");
          return;
        }

        const decoded = decodeToken(token);
        if (decoded) {
          setCurrentUser({ userId: decoded.userId, role: decoded.role as User["role"] });
        }

        if (decoded?.role !== "admin") {
          toast.error("Only admins can access this page.");
          return;
        }

        const response = await axios.get<MealPlan>(`${apiBaseUrl}/meals/plan`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Raw API Response:", response.data);
        setMealPlan(response.data);
      } catch (error: any) {
        console.error("Error fetching meal plan:", error);
        toast.error(`Failed to fetch meal plan: ${error.response?.data.message || "Please try again."}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (editMeal) {
      setEditMeal((prev) => (prev ? { ...prev, [name]: value } : null));
    } else {
      setNewMeal((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle add meal
  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to add a meal.");
        return;
      }

      if (!newMeal.day || !newMeal.mealType || !newMeal.name || !newMeal.description) {
        toast.error("All fields are required.");
        return;
      }

      const response = await axios.post(
        `${apiBaseUrl}/meals/add`,
        newMeal,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMealPlan((prev) => ({
        ...prev,
        [newMeal.day]: {
          ...prev[newMeal.day as keyof MealPlan],
          [newMeal.mealType]: {
            _id: response.data.meal._id,
            name: newMeal.name,
            description: newMeal.description,
            picture: null
          }
        }
      }));

      setNewMeal({ day: "", mealType: "", name: "", description: "" });
      toast.success("Meal added successfully.");
    } catch (error: any) {
      console.error("Error adding meal:", error);
      toast.error(`Failed to add meal: ${error.response?.data?.message || "Please try again."}`);
    }
  };

  // Handle edit meal
  const handleEditMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMeal) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to edit a meal.");
        return;
      }

      if (!editMeal.day || !editMeal.mealType || !editMeal.name || !editMeal.description) {
        toast.error("All fields are required.");
        return;
      }

      const response = await axios.put(
        `${apiBaseUrl}/meals/${editMeal._id}`,
        {
          day: editMeal.day,
          mealType: editMeal.mealType,
          name: editMeal.name,
          description: editMeal.description
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMealPlan((prev) => ({
        ...prev,
        [editMeal.day]: {
          ...prev[editMeal.day as keyof MealPlan],
          [editMeal.mealType]: {
            _id: editMeal._id,
            name: editMeal.name,
            description: editMeal.description,
            picture: null
          }
        }
      }));

      setEditMeal(null);
      toast.success("Meal updated successfully.");
    } catch (error: any) {
      console.error("Error editing meal:", error);
      toast.error(`Failed to edit meal: ${error.response?.data?.message || "Please try again."}`);
    }
  };

  // Handle delete meal
  const handleDeleteMeal = async () => {
    if (!deleteMealId) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to delete a meal.");
        return;
      }

      await axios.delete(`${apiBaseUrl}/meals/${deleteMealId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Find and remove the meal from mealPlan
      setMealPlan((prev) => {
        const updated = { ...prev };
        for (const day of Object.keys(updated) as (keyof MealPlan)[]) {
          if (updated[day].breakfast?._id === deleteMealId) {
            updated[day].breakfast = null;
          }
          if (updated[day].lunch?._id === deleteMealId) {
            updated[day].lunch = null;
          }
        }
        return updated;
      });

      setDeleteMealId(null);
      toast.success("Meal deleted successfully.");
    } catch (error: any) {
      console.error("Error deleting meal:", error);
      toast.error(`Failed to delete meal: ${error.response?.data?.message || "Please try again."}`);
    }
  };

  const handleApplyClick = () => {
    if (dropdownMenuRef.current) {
      dropdownMenuRef.current.classList.remove("show");
    }
  };

  if (currentUser?.role !== "admin") {
    return (
      <div className="page-wrapper">
        <div className="content">
          <h3 className="page-title mb-1">Access Denied</h3>
          <p>Only admins can access the meal plan management page.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: "#363636",
            color: "#fff",
          }
        }}
      />
      <div className="page-wrapper">
        <div className="content">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Meal Plan</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Meal Plan
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <CustomTooltip />
              <button
                className="btn btn-primary ms-2"
                data-bs-toggle="modal"
                data-bs-target="#add_meal"
              >
                <i className="ti ti-plus me-2" />
                Add Meal
              </button>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">Weekly Meal Plan</h4>
            </div>
            <div className="card-body p-3">
              {isLoading ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="accordion" id="mealPlanAccordion">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, index) => (
                    <div className="accordion-item" key={day}>
                      <h2 className="accordion-header" id={`heading-${day}`}>
                        <button
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target={`#collapse-${day}`}
                          aria-expanded="false"
                          aria-controls={`collapse-${day}`}
                        >
                          <strong>{day}</strong>
                        </button>
                      </h2>
                      <div
                        id={`collapse-${day}`}
                        className="accordion-collapse collapse"
                        aria-labelledby={`heading-${day}`}
                        data-bs-parent="#mealPlanAccordion"
                      >
                        <div className="accordion-body p-0">
                          <div className="table-responsive">
                            <table className="table table-striped mb-0">
                              <tbody>
                                {["breakfast", "lunch"].map((mealType) => {
                                  const meal = mealPlan[day as keyof MealPlan][mealType as "breakfast" | "lunch"];
                                  return (
                                    <tr key={`${day}-${mealType}`}>
                                      <td style={{ width: "20%" }}>
                                        <i className={`ti ti-${mealType === "breakfast" ? "egg" : "salad"} me-2`} />
                                        {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                                      </td>
                                      <td style={{ width: "25%" }}>
                                        {meal ? meal.name : <span className="text-muted">No {mealType} planned</span>}
                                      </td>
                                      <td style={{ width: "35%" }}>
                                        {meal ? meal.description : <span className="text-muted">-</span>}
                                      </td>
                                      <td style={{ width: "20%" }}>
                                        {meal ? (
                                          <div className="d-flex">
                                            <button
                                              className="btn btn-sm btn-outline-primary me-2"
                                              data-bs-toggle="modal"
                                              data-bs-target="#edit_meal"
                                              onClick={() =>
                                                setEditMeal({
                                                  _id: meal._id,
                                                  day,
                                                  mealType,
                                                  name: meal.name,
                                                  description: meal.description
                                                })
                                              }
                                            >
                                              <i className="ti ti-edit me-1" />
                                              Edit
                                            </button>
                                            <button
                                              className="btn btn-sm btn-outline-danger"
                                              data-bs-toggle="modal"
                                              data-bs-target="#delete_meal"
                                              onClick={() => setDeleteMealId(meal._id || "")}
                                            >
                                              <i className="ti ti-trash me-1" />
                                              Delete
                                            </button>
                                          </div>
                                        ) : (
                                          <span className="text-muted">-</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Add Meal Modal */}
      <div className="modal fade" id="add_meal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Meal</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleAddMeal}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Day</label>
                  <select
                    className="form-select"
                    name="day"
                    value={newMeal.day}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Day</option>
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Meal Type</label>
                  <select
                    className="form-select"
                    name="mealType"
                    value={newMeal.mealType}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Meal Type</option>
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={newMeal.name}
                    onChange={handleInputChange}
                    placeholder="Enter meal name"
                  />
                </div>
                <div className="mb-0">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    name="description"
                    value={newMeal.description}
                    onChange={handleInputChange}
                    placeholder="Enter meal description"
                    rows={4}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <Link
                  to="#"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </Link>
                <button type="submit" className="btn btn-primary" data-bs-dismiss="modal">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* Edit Meal Modal */}
      <div className="modal fade" id="edit_meal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Meal</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleEditMeal}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Day</label>
                  <select
                    className="form-select"
                    name="day"
                    value={editMeal?.day || ""}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Day</option>
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Meal Type</label>
                  <select
                    className="form-select"
                    name="mealType"
                    value={editMeal?.mealType || ""}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Meal Type</option>
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={editMeal?.name || ""}
                    onChange={handleInputChange}
                    placeholder="Enter meal name"
                  />
                </div>
                <div className="mb-0">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    name="description"
                    value={editMeal?.description || ""}
                    onChange={handleInputChange}
                    placeholder="Enter meal description"
                    rows={4}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <Link
                  to="#"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                  onClick={() => setEditMeal(null)}
                >
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
      {/* Delete Confirmation Modal */}
      <div className="modal fade" id="delete_meal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Delete Meal</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => setDeleteMealId(null)}
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this meal? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <Link
                to="#"
                className="btn btn-light me-2"
                data-bs-dismiss="modal"
                onClick={() => setDeleteMealId(null)}
              >
                Cancel
              </Link>
              <button
                className="btn btn-danger"
                data-bs-dismiss="modal"
                onClick={handleDeleteMeal}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlan;