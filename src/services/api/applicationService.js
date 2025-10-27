import applicationsData from "@/services/mockData/applications.json";
import { jobService } from "@/services/api/jobService";
class ApplicationService {
constructor() {
    this.applications = [...applicationsData];
    this.statusOrder = ['submitted', 'under-review', 'shortlisted', 'interviewed', 'offered', 'rejected'];
  }

async getAll() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Enrich with job details
    const jobs = await jobService.getAll();
    return this.applications.map(app => ({
      ...app,
      job: jobs.find(j => j.Id === parseInt(app.jobId))
    }));
  }

async getById(id) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const application = this.applications.find(app => app.Id === parseInt(id));
    if (!application) return null;

    // Enrich with job details
    const jobs = await jobService.getAll();
    const job = jobs.find(j => j.Id === parseInt(application.jobId));
    
    return { ...application, job };
  }

  async getByStatus(status) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 250));
    
    if (status === 'all') {
      return this.getAll();
    }
    
    const jobs = await jobService.getAll();
    return this.applications
      .filter(app => app.status === status)
      .map(app => ({
        ...app,
        job: jobs.find(j => j.Id === parseInt(app.jobId))
      }));
  }

async getByJobId(jobId) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 250));
    
    const jobs = await jobService.getAll();
    return this.applications
      .filter(app => parseInt(app.jobId) === parseInt(jobId))
      .map(app => ({
        ...app,
        job: jobs.find(j => j.Id === parseInt(app.jobId))
      }));
  }

  async create(applicationData) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newApplication = {
      Id: Math.max(...this.applications.map(app => app.Id)) + 1,
      ...applicationData
    };
    
    this.applications.push(newApplication);
    return { ...newApplication };
  }

async update(id, updates) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const appIndex = this.applications.findIndex(app => app.Id === parseInt(id));
    if (appIndex === -1) {
      throw new Error("Application not found");
    }
    
    this.applications[appIndex] = {
      ...this.applications[appIndex],
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    
    const jobs = await jobService.getAll();
    return {
      ...this.applications[appIndex],
      job: jobs.find(j => j.Id === parseInt(this.applications[appIndex].jobId))
    };
  }

  async withdraw(id) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const appIndex = this.applications.findIndex(app => app.Id === parseInt(id));
    if (appIndex === -1) {
      throw new Error("Application not found");
    }

    if (this.applications[appIndex].status === 'withdrawn') {
      throw new Error("Application already withdrawn");
    }

    this.applications[appIndex] = {
      ...this.applications[appIndex],
      status: 'withdrawn',
      withdrawnDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    return { ...this.applications[appIndex] };
  }

  async updateInterview(id, interviewDetails) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const appIndex = this.applications.findIndex(app => app.Id === parseInt(id));
    if (appIndex === -1) {
      throw new Error("Application not found");
    }

    this.applications[appIndex] = {
      ...this.applications[appIndex],
      interviewDetails,
      status: 'interviewed',
      lastUpdated: new Date().toISOString()
    };
    
    return { ...this.applications[appIndex] };
  }

  async addFeedback(id, feedback) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const appIndex = this.applications.findIndex(app => app.Id === parseInt(id));
    if (appIndex === -1) {
      throw new Error("Application not found");
    }

    this.applications[appIndex] = {
      ...this.applications[appIndex],
      feedback,
      lastUpdated: new Date().toISOString()
    };
    
    return { ...this.applications[appIndex] };
  }

  async getStatistics() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 250));
    
    const total = this.applications.length;
    const responded = this.applications.filter(app => 
      ['under-review', 'shortlisted', 'interviewed', 'offered', 'rejected'].includes(app.status)
    ).length;
    const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

    return {
      total,
      responded,
      responseRate,
      byStatus: {
        submitted: this.applications.filter(app => app.status === 'submitted').length,
        underReview: this.applications.filter(app => app.status === 'under-review').length,
        shortlisted: this.applications.filter(app => app.status === 'shortlisted').length,
        interviewed: this.applications.filter(app => app.status === 'interviewed').length,
        offered: this.applications.filter(app => app.status === 'offered').length,
        rejected: this.applications.filter(app => app.status === 'rejected').length,
        withdrawn: this.applications.filter(app => app.status === 'withdrawn').length
      }
    };
  }

  async delete(id) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const appIndex = this.applications.findIndex(app => app.Id === parseInt(id));
    if (appIndex === -1) {
      throw new Error("Application not found");
    }
    
    this.applications.splice(appIndex, 1);
    return true;
  }
}

export const applicationService = new ApplicationService();