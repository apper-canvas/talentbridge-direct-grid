import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import SearchBar from "@/components/molecules/SearchBar";
import FilterSidebar from "@/components/molecules/FilterSidebar";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import Card from "@/components/atoms/Card";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import { applicationService } from "@/services/api/applicationService";
import savedJobsService from "@/services/api/savedJobsService";
import { jobService } from "@/services/api/jobService";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/utils/cn";

const Candidates = () => {
  const [activeTab, setActiveTab] = useState("applications");
  const [activeSubTab, setActiveSubTab] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [detailsModal, setDetailsModal] = useState(null);
  
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    dateRange: "all",
    status: "",
    location: "",
    jobType: "",
    minSalary: "",
    maxSalary: ""
  });

  const subTabs = [
    { key: "all", label: "All", count: stats?.total || 0 },
    { key: "submitted", label: "Applied", count: stats?.byStatus?.submitted || 0 },
    { key: "under-review", label: "In Review", count: stats?.byStatus?.underReview || 0 },
    { key: "shortlisted", label: "Shortlisted", count: stats?.byStatus?.shortlisted || 0 },
    { key: "interviewed", label: "Interviewed", count: stats?.byStatus?.interviewed || 0 },
    { key: "offered", label: "Offered", count: stats?.byStatus?.offered || 0 },
    { key: "rejected", label: "Rejected", count: stats?.byStatus?.rejected || 0 }
  ];

  useEffect(() => {
    loadData();
  }, [activeTab, activeSubTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [appsData, statsData] = await Promise.all([
        activeSubTab === "all" 
          ? applicationService.getAll() 
          : applicationService.getByStatus(activeSubTab),
        applicationService.getStatistics()
      ]);

      setApplications(appsData);
      setStats(statsData);

      if (activeTab === "saved") {
        const savedJobIds = await savedJobsService.getAll();
        const allJobs = await jobService.getAll();
        const savedJobsWithDetails = savedJobIds.map(saved => {
          const job = allJobs.find(j => j.Id === saved.JobId);
          return job ? { ...job, savedAt: saved.SavedAt } : null;
        }).filter(Boolean);
        setSavedJobs(savedJobsWithDetails);
      }
    } catch (err) {
      setError(err.message || "Failed to load data");
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (value, name) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      dateRange: "all",
      status: "",
      location: "",
      jobType: "",
      minSalary: "",
      maxSalary: ""
    });
  };

  const handleWithdraw = async (appId) => {
    if (!confirm("Are you sure you want to withdraw this application?")) return;

    try {
      await applicationService.withdraw(appId);
      toast.success("Application withdrawn successfully");
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to withdraw application");
    }
  };

  const handleViewDetails = (application) => {
    setDetailsModal(application);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    if (!confirm(`Delete ${selectedItems.length} selected items?`)) return;

    try {
      if (activeTab === "applications") {
        await Promise.all(selectedItems.map(id => applicationService.withdraw(id)));
        toast.success(`${selectedItems.length} applications withdrawn`);
      } else {
        await Promise.all(selectedItems.map(id => savedJobsService.delete(id)));
        toast.success(`${selectedItems.length} jobs removed from saved`);
      }
      setSelectedItems([]);
      setBulkMode(false);
      loadData();
    } catch (err) {
      toast.error("Failed to delete items");
    }
  };

  const handleBulkExport = () => {
    const data = activeTab === "applications" 
      ? applications.filter(app => selectedItems.includes(app.Id))
      : savedJobs.filter(job => selectedItems.includes(job.Id));
    
    const csv = [
      Object.keys(data[0] || {}).join(","),
      ...data.map(item => Object.values(item).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTab}_export.csv`;
    a.click();
    toast.success("Export completed");
  };

  const toggleItemSelection = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: "bg-blue-100 text-blue-800",
      "under-review": "bg-yellow-100 text-yellow-800",
      shortlisted: "bg-purple-100 text-purple-800",
      interviewed: "bg-indigo-100 text-indigo-800",
      offered: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      withdrawn: "bg-gray-100 text-gray-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status) => {
    const labels = {
      submitted: "Applied",
      "under-review": "In Review",
      shortlisted: "Shortlisted",
      interviewed: "Interviewed",
      offered: "Offered",
      rejected: "Rejected",
      withdrawn: "Withdrawn"
    };
    return labels[status] || status;
  };

  const filteredData = () => {
    let data = activeTab === "applications" ? applications : savedJobs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(item => {
        if (activeTab === "applications") {
          return item.job?.title?.toLowerCase().includes(query) ||
                 item.job?.company?.toLowerCase().includes(query);
        } else {
          return item.title?.toLowerCase().includes(query) ||
                 item.company?.toLowerCase().includes(query);
        }
      });
    }

    if (filters.location) {
      data = data.filter(item => {
        const location = activeTab === "applications" ? item.job?.location : item.location;
        return location?.toLowerCase().includes(filters.location.toLowerCase());
      });
    }

    if (filters.jobType) {
      data = data.filter(item => {
        const jobType = activeTab === "applications" ? item.job?.jobType : item.jobType;
        return jobType === filters.jobType;
      });
    }

    if (filters.minSalary) {
      data = data.filter(item => {
        const salary = activeTab === "applications" 
          ? parseInt(item.job?.salaryRange?.split("-")[0]?.replace(/\D/g, "") || 0)
          : parseInt(item.salaryRange?.split("-")[0]?.replace(/\D/g, "") || 0);
        return salary >= parseInt(filters.minSalary);
      });
    }

    if (filters.maxSalary) {
      data = data.filter(item => {
        const salary = activeTab === "applications"
          ? parseInt(item.job?.salaryRange?.split("-")[1]?.replace(/\D/g, "") || 999999)
          : parseInt(item.salaryRange?.split("-")[1]?.replace(/\D/g, "") || 999999);
        return salary <= parseInt(filters.maxSalary);
      });
    }

    return data;
  };

  const calculateSavedJobsApplications = () => {
    if (!savedJobs.length || !applications.length) return 0;
    const savedJobIds = savedJobs.map(j => j.Id);
    const appliedFromSaved = applications.filter(app => 
      savedJobIds.includes(parseInt(app.jobId))
    ).length;
    return Math.round((appliedFromSaved / savedJobs.length) * 100);
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadData} />;

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
          <p className="text-gray-600">Track your applications and manage saved jobs</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Applications</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.total || 0}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <ApperIcon name="FileText" className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Response Rate</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.responseRate || 0}%</p>
              </div>
              <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
                <ApperIcon name="TrendingUp" className="h-6 w-6 text-accent" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Saved Jobs</p>
                <p className="text-3xl font-bold text-gray-900">{savedJobs.length}</p>
              </div>
              <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                <ApperIcon name="Bookmark" className="h-6 w-6 text-warning" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">From Saved Jobs</p>
                <p className="text-3xl font-bold text-gray-900">{calculateSavedJobsApplications()}%</p>
              </div>
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                <ApperIcon name="Target" className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("applications")}
                className={cn(
                  "py-4 px-2 border-b-2 font-medium text-sm transition-colors",
                  activeTab === "applications"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                My Applications
              </button>
              <button
                onClick={() => setActiveTab("saved")}
                className={cn(
                  "py-4 px-2 border-b-2 font-medium text-sm transition-colors",
                  activeTab === "saved"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                Saved Jobs
              </button>
            </div>
          </div>

          {/* Sub Tabs - Only for Applications */}
          {activeTab === "applications" && (
            <div className="border-b border-gray-200 overflow-x-auto">
              <div className="flex space-x-1 px-6 py-2 min-w-max">
                {subTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveSubTab(tab.key)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                      activeSubTab === tab.key
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {tab.label}
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs",
                      activeSubTab === tab.key ? "bg-white/20" : "bg-gray-200"
                    )}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Controls Bar */}
          <div className="p-6 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex-1 w-full lg:max-w-md">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={`Search ${activeTab === "applications" ? "applications" : "saved jobs"}...`}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="lg:hidden"
                >
                  <ApperIcon name="Filter" className="h-4 w-4 mr-2" />
                  Filters
                </Button>

                <Button
                  variant={viewMode === "grid" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <ApperIcon name="Grid3x3" className="h-4 w-4" />
                </Button>

                <Button
                  variant={viewMode === "list" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <ApperIcon name="List" className="h-4 w-4" />
                </Button>

                <Button
                  variant={bulkMode ? "primary" : "outline"}
                  size="sm"
                  onClick={() => {
                    setBulkMode(!bulkMode);
                    setSelectedItems([]);
                  }}
                >
                  <ApperIcon name="CheckSquare" className="h-4 w-4 mr-2" />
                  Select
                </Button>

                {bulkMode && selectedItems.length > 0 && (
                  <>
                    <Button variant="outline" size="sm" onClick={handleBulkExport}>
                      <ApperIcon name="Download" className="h-4 w-4 mr-2" />
                      Export ({selectedItems.length})
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                      <ApperIcon name="Trash2" className="h-4 w-4 mr-2" />
                      Delete ({selectedItems.length})
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            isOpen={filterOpen}
            onClose={() => setFilterOpen(false)}
            showStatusFilter={activeTab === "applications"}
            showDateRange={activeTab === "applications"}
          />

          {/* Main Content */}
          <div className="flex-1">
            {filteredData().length === 0 ? (
              <Empty
                title={`No ${activeTab === "applications" ? "applications" : "saved jobs"} found`}
                description={searchQuery || Object.values(filters).some(v => v) 
                  ? "Try adjusting your search or filters"
                  : activeTab === "applications"
                    ? "You haven't applied to any jobs yet"
                    : "You haven't saved any jobs yet"
                }
                actionLabel={activeTab === "applications" ? "Browse Jobs" : null}
                onAction={() => window.location.href = "/jobs"}
              />
            ) : (
              <div className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              )}>
                {activeTab === "applications" ? (
                  filteredData().map(app => (
                    <ApplicationCard
                      key={app.Id}
                      application={app}
                      viewMode={viewMode}
                      bulkMode={bulkMode}
                      selected={selectedItems.includes(app.Id)}
                      onSelect={() => toggleItemSelection(app.Id)}
                      onViewDetails={() => handleViewDetails(app)}
                      onWithdraw={() => handleWithdraw(app.Id)}
                      getStatusColor={getStatusColor}
                      getStatusLabel={getStatusLabel}
                    />
                  ))
                ) : (
                  filteredData().map(job => (
                    <SavedJobCard
                      key={job.Id}
                      job={job}
                      viewMode={viewMode}
                      bulkMode={bulkMode}
                      selected={selectedItems.includes(job.Id)}
                      onSelect={() => toggleItemSelection(job.Id)}
                      onUnsave={async () => {
                        try {
                          await savedJobsService.delete(job.Id);
                          toast.success("Job removed from saved");
                          loadData();
                        } catch (err) {
                          toast.error("Failed to remove job");
                        }
                      }}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Application Details Modal */}
      {detailsModal && (
        <ApplicationDetailsModal
          application={detailsModal}
          onClose={() => setDetailsModal(null)}
          getStatusColor={getStatusColor}
          getStatusLabel={getStatusLabel}
        />
      )}
    </div>
  );
};

// Application Card Component
const ApplicationCard = ({ 
  application, 
  viewMode, 
  bulkMode, 
  selected, 
  onSelect, 
  onViewDetails, 
  onWithdraw,
  getStatusColor,
  getStatusLabel 
}) => {
  const job = application.job || {};
  
  const CardContent = () => (
    <>
      {bulkMode && (
        <div className="absolute top-4 left-4 z-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
          />
        </div>
      )}

      <div className={cn("flex", viewMode === "grid" ? "flex-col" : "flex-row items-start gap-4")}>
        {/* Company Logo */}
        <div className={cn(
          "flex-shrink-0 flex items-center justify-center rounded-lg font-bold text-white text-2xl",
          viewMode === "grid" ? "w-full h-32 mb-4" : "w-20 h-20",
          "bg-gradient-to-br from-primary to-secondary"
        )}>
          {job.company?.[0] || "?"}
        </div>

        <div className="flex-1 min-w-0">
          {/* Job Title & Company */}
          <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
            {job.title || "Untitled Position"}
          </h3>
          <p className="text-gray-600 mb-2 flex items-center gap-1">
            <ApperIcon name="Building2" size={14} />
            {job.company || "Unknown Company"}
          </p>

          {/* Application Date */}
          <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
            <ApperIcon name="Calendar" size={14} />
            Applied {formatDistanceToNow(new Date(application.submittedDate), { addSuffix: true })}
          </p>

          {/* Status Badge */}
          <Badge className={cn("mb-4", getStatusColor(application.status))}>
            {getStatusLabel(application.status)}
          </Badge>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" onClick={onViewDetails}>
              <ApperIcon name="Eye" className="h-4 w-4 mr-1" />
              View Details
            </Button>

            {application.status !== "withdrawn" && application.status !== "rejected" && (
              <Button variant="outline" size="sm" onClick={onWithdraw}>
                <ApperIcon name="X" className="h-4 w-4 mr-1" />
                Withdraw
              </Button>
            )}

            {application.feedback && (
              <Button variant="outline" size="sm" onClick={onViewDetails}>
                <ApperIcon name="MessageSquare" className="h-4 w-4 mr-1" />
                View Feedback
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <Card className={cn("relative p-6 hover:shadow-lg transition-shadow", bulkMode && "pl-12")}>
      <CardContent />
    </Card>
  );
};

// Saved Job Card Component
const SavedJobCard = ({ job, viewMode, bulkMode, selected, onSelect, onUnsave }) => {
  const CardContent = () => (
    <>
      {bulkMode && (
        <div className="absolute top-4 left-4 z-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
          />
        </div>
      )}

      <div className={cn("flex", viewMode === "grid" ? "flex-col" : "flex-row items-start gap-4")}>
        <div className={cn(
          "flex-shrink-0 flex items-center justify-center rounded-lg font-bold text-white text-2xl",
          viewMode === "grid" ? "w-full h-32 mb-4" : "w-20 h-20",
          "bg-gradient-to-br from-accent to-primary"
        )}>
          {job.company?.[0] || "?"}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">{job.title}</h3>
          <p className="text-gray-600 mb-2 flex items-center gap-1">
            <ApperIcon name="Building2" size={14} />
            {job.company}
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="secondary">{job.jobType}</Badge>
            <Badge variant="outline">{job.location}</Badge>
          </div>

          <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
            <ApperIcon name="Bookmark" size={14} />
            Saved {formatDistanceToNow(new Date(job.savedAt), { addSuffix: true })}
          </p>

          <div className="flex gap-2">
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => window.location.href = `/jobs/${job.Id}`}
            >
              <ApperIcon name="ExternalLink" className="h-4 w-4 mr-1" />
              View Job
            </Button>
            <Button variant="outline" size="sm" onClick={onUnsave}>
              <ApperIcon name="BookmarkMinus" className="h-4 w-4 mr-1" />
              Unsave
            </Button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <Card className={cn("relative p-6 hover:shadow-lg transition-shadow", bulkMode && "pl-12")}>
      <CardContent />
    </Card>
  );
};

// Application Details Modal Component
const ApplicationDetailsModal = ({ application, onClose, getStatusColor, getStatusLabel }) => {
  const job = application.job || {};

  const handleDownloadResume = () => {
    toast.success("Resume download started");
  };

  const handleAddToCalendar = () => {
    if (application.interviewDetails?.meetingLink) {
      window.open(application.interviewDetails.meetingLink, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{job.title}</h2>
            <p className="text-gray-600 flex items-center gap-2">
              <ApperIcon name="Building2" size={16} />
              {job.company}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ApperIcon name="X" className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Current Status */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Status</h3>
            <Badge className={cn("text-base px-4 py-2", getStatusColor(application.status))}>
              {getStatusLabel(application.status)}
            </Badge>
          </div>

          {/* Application Timeline */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Timeline</h3>
            <div className="space-y-4">
              {(application.statusHistory || []).map((history, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      index === 0 ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
                    )}>
                      <ApperIcon name="Check" size={18} />
                    </div>
                    {index < (application.statusHistory?.length || 0) - 1 && (
                      <div className="w-0.5 h-12 bg-gray-200 my-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium text-gray-900">{getStatusLabel(history.status)}</p>
                    <p className="text-sm text-gray-600">{history.note}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(history.date), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resume Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Submitted Resume</h3>
            <Card className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <ApperIcon name="FileText" className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {application.resumeUrl?.split("/").pop() || "resume.pdf"}
                  </p>
                  <p className="text-sm text-gray-500">PDF Document</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadResume}>
                <ApperIcon name="Download" className="h-4 w-4 mr-2" />
                Download
              </Button>
            </Card>
          </div>

          {/* Cover Letter */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Cover Letter</h3>
            <Card className="p-6">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {application.coverLetter}
              </p>
            </Card>
          </div>

          {/* Interview Details */}
          {application.interviewDetails && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Interview Details</h3>
              <Card className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Date & Time</p>
                    <p className="font-medium text-gray-900">
                      {new Date(application.interviewDetails.date).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Type</p>
                    <p className="font-medium text-gray-900">{application.interviewDetails.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Duration</p>
                    <p className="font-medium text-gray-900">{application.interviewDetails.duration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Interviewer</p>
                    <p className="font-medium text-gray-900">{application.interviewDetails.interviewer}</p>
                  </div>
                </div>

                {application.interviewDetails.meetingLink && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        onClick={() => window.open(application.interviewDetails.meetingLink, "_blank")}
                      >
                        <ApperIcon name="Video" className="h-4 w-4 mr-2" />
                        Join Meeting
                      </Button>
                      <Button variant="outline" onClick={handleAddToCalendar}>
                        <ApperIcon name="Calendar" className="h-4 w-4 mr-2" />
                        Add to Calendar
                      </Button>
                    </div>
                  </div>
                )}

                {application.interviewDetails.notes && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Notes</p>
                    <p className="text-gray-700">{application.interviewDetails.notes}</p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Employer Feedback */}
          {application.feedback && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Employer Feedback</h3>
              <Card className={cn(
                "p-6",
                application.feedback.type === "offer" ? "border-2 border-green-200 bg-green-50" : "border-2 border-gray-200"
              )}>
                {application.feedback.type === "offer" && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <ApperIcon name="Award" className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-xl font-bold text-green-800">Congratulations!</p>
                  </div>
                )}

                <p className="text-gray-700 mb-4 leading-relaxed">
                  {application.feedback.message}
                </p>

                {application.feedback.type === "offer" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-green-200">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Offered Salary</p>
                      <p className="font-semibold text-gray-900">{application.feedback.offeredSalary}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Start Date</p>
                      <p className="font-semibold text-gray-900">{application.feedback.startDate}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 mb-1">Benefits</p>
                      <p className="text-gray-700">{application.feedback.benefits}</p>
                    </div>
                  </div>
                )}

                {application.feedback.encouragement && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">{application.feedback.encouragement}</p>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Candidates;