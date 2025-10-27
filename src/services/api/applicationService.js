import { jobService } from "@/services/api/jobService";
import React from "react";
import { getApperClient } from "@/services/apperClient";
import { create, getAll, getById } from "@/services/api/savedJobsService";
import Error from "@/components/ui/Error";

class ApplicationService {
  constructor() {
    this.tableName = "application_c";
}

  async getAll() {
    try {
      const apperClient = getApperClient();
      const response = await apperClient.fetchRecords(this.tableName, {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "Name"}},
          {"field": {"Name": "candidate_name_c"}},
          {"field": {"Name": "email_c"}},
          {"field": {"Name": "phone_c"}},
          {"field": {"Name": "cover_letter_c"}},
          {"field": {"Name": "resume_url_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "submitted_date_c"}},
          {"field": {"Name": "feedback_c"}},
          {"field": {"Name": "interview_details_c"}},
          {"field": {"Name": "job_id_c"}, "referenceField": {"field": {"Name": "title_c"}}},
          {"field": {"Name": "job_id_c"}, "referenceField": {"field": {"Name": "company_c"}}},
          {"field": {"Name": "job_id_c"}, "referenceField": {"field": {"Name": "location_c"}}}
        ]
      });

      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return (response.data || []).map(app => this.transformFromDatabase(app));
    } catch (error) {
      console.error("Error fetching applications:", error?.message || error);
return [];
    }
  }

  async getById(id) {
    try {
      const apperClient = getApperClient();
      const response = await apperClient.getRecordById(this.tableName, parseInt(id), {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "Name"}},
          {"field": {"Name": "candidate_name_c"}},
          {"field": {"Name": "email_c"}},
          {"field": {"Name": "phone_c"}},
          {"field": {"Name": "cover_letter_c"}},
          {"field": {"Name": "resume_url_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "submitted_date_c"}},
          {"field": {"Name": "feedback_c"}},
          {"field": {"Name": "interview_details_c"}},
          {"field": {"Name": "job_id_c"}, "referenceField": {"field": {"Name": "title_c"}}},
          {"field": {"Name": "job_id_c"}, "referenceField": {"field": {"Name": "company_c"}}},
          {"field": {"Name": "job_id_c"}, "referenceField": {"field": {"Name": "location_c"}}}
        ]
      });

      if (!response.success) {
        console.error(response.message);
        return null;
      }

      return response.data ? this.transformFromDatabase(response.data) : null;
    } catch (error) {
      console.error("Error fetching application by ID:", error?.message || error);
      return null;
return null;
    }
  }

  async getByStatus(status) {
    try {
      const apperClient = getApperClient();
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "Name"}},
          {"field": {"Name": "candidate_name_c"}},
          {"field": {"Name": "email_c"}},
          {"field": {"Name": "phone_c"}},
          {"field": {"Name": "cover_letter_c"}},
          {"field": {"Name": "resume_url_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "submitted_date_c"}},
          {"field": {"Name": "feedback_c"}},
          {"field": {"Name": "interview_details_c"}},
          {"field": {"Name": "job_id_c"}, "referenceField": {"field": {"Name": "title_c"}}},
          {"field": {"Name": "job_id_c"}, "referenceField": {"field": {"Name": "company_c"}}}
        ],
        where: [{
          "FieldName": "status_c",
          "Operator": "EqualTo",
          "Values": [status]
        }]
      });

      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return (response.data || []).map(app => this.transformFromDatabase(app));
    } catch (error) {
      console.error("Error fetching applications by status:", error?.message || error);
      return [];
    }
  }

async getByJobId(jobId) {
    try {
      const apperClient = getApperClient();
      const response = await apperClient.fetchRecords(this.tableName, {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "Name"}},
          {"field": {"Name": "candidate_name_c"}},
          {"field": {"Name": "email_c"}},
          {"field": {"Name": "phone_c"}},
          {"field": {"Name": "cover_letter_c"}},
          {"field": {"Name": "resume_url_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "submitted_date_c"}},
          {"field": {"Name": "job_id_c"}}
        ],
        where: [{
          "FieldName": "job_id_c",
          "Operator": "EqualTo",
          "Values": [parseInt(jobId)]
        }]
      });

      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return (response.data || []).map(app => this.transformFromDatabase(app));
    } catch (error) {
      console.error("Error fetching applications by job ID:", error?.message || error);
      return [];
    }
  }

async create(applicationData) {
    try {
      const apperClient = getApperClient();
      const dbData = this.transformToDatabase(applicationData);

      const response = await apperClient.createRecord(this.tableName, {
        records: [dbData]
      });

      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results && response.results.length > 0) {
        const result = response.results[0];
        if (result.success) {
          return this.transformFromDatabase(result.data);
        } else {
          throw new Error(result.message || "Failed to create application");
        }
      }

      throw new Error("No response data received");
    } catch (error) {
      console.error("Error creating application:", error?.message || error);
      throw error;
}
  }

  async update(id, updates) {
    try {
      const apperClient = getApperClient();
      const dbData = this.transformToDatabase(updates);
      dbData.Id = parseInt(id);

      const response = await apperClient.updateRecord(this.tableName, {
        records: [dbData]
      });

      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results && response.results.length > 0) {
        const result = response.results[0];
        if (result.success) {
          return this.transformFromDatabase(result.data);
        } else {
          throw new Error(result.message || "Failed to update application");
        }
      }

      throw new Error("No response data received");
    } catch (error) {
      console.error("Error updating application:", error?.message || error);
      throw error;
    }
  }

async withdraw(id) {
    try {
      await this.update(id, { status: "withdrawn" });
      return true;
    } catch (error) {
      console.error("Error withdrawing application:", error?.message || error);
      throw error;
    }
  }

  async updateInterview(id, interviewDetails) {
    try {
      await this.update(id, { 
interviewDetails: JSON.stringify(interviewDetails) 
      });
      return true;
    } catch (error) {
      console.error("Error updating interview details:", error?.message || error);
      throw error;
    }
  }

  async addFeedback(id, feedback) {
    try {
      const updates = { 
        feedback: JSON.stringify(feedback) 
      };
      
      if (feedback.type === 'offer') {
        updates.status = 'offered';
      } else if (feedback.type === 'rejection') {
        updates.status = 'rejected';
      }
await this.update(id, updates);
      return true;
    } catch (error) {
      console.error("Error adding feedback:", error?.message || error);
      throw error;
    }
  }

async getStatistics() {
    try {
      const all = await this.getAll();
      const total = all.length;

      const byStatus = {
        submitted: all.filter(app => app.status === 'submitted').length,
        'under-review': all.filter(app => app.status === 'under-review').length,
        shortlisted: all.filter(app => app.status === 'shortlisted').length,
        interviewed: all.filter(app => app.status === 'interviewed').length,
        offered: all.filter(app => app.status === 'offered').length,
        rejected: all.filter(app => app.status === 'rejected').length,
        withdrawn: all.filter(app => app.status === 'withdrawn').length
      };

      const responseRate = total > 0 
        ? Math.round(((byStatus['under-review'] + byStatus.shortlisted + byStatus.interviewed + byStatus.offered) / total) * 100)
        : 0;

      return {
        total,
        byStatus,
        responseRate
      };
    } catch (error) {
      console.error("Error getting statistics:", error?.message || error);
      return {
        total: 0,
        byStatus: {},
responseRate: 0
      };
    }
  }
async delete(id) {
    try {
      const apperClient = getApperClient();
      const response = await apperClient.deleteRecord(this.tableName, {
        RecordIds: [parseInt(id)]
      });

      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      return true;
    } catch (error) {
      console.error("Error deleting application:", error?.message || error);
      throw error;
    }
  }

  transformFromDatabase(dbApp) {
    let feedback = null;
    if (dbApp.feedback_c) {
      try {
        feedback = typeof dbApp.feedback_c === 'string' ? JSON.parse(dbApp.feedback_c) : dbApp.feedback_c;
      } catch (e) {
        console.error("Error parsing feedback:", e);
      }
    }

    let interviewDetails = null;
    if (dbApp.interview_details_c) {
      try {
        interviewDetails = typeof dbApp.interview_details_c === 'string' ? JSON.parse(dbApp.interview_details_c) : dbApp.interview_details_c;
      } catch (e) {
        console.error("Error parsing interview details:", e);
      }
    }

    const jobInfo = dbApp.job_id_c || {};

    return {
      Id: dbApp.Id,
      candidateName: dbApp.candidate_name_c || "",
      email: dbApp.email_c || "",
      phone: dbApp.phone_c || "",
      coverLetter: dbApp.cover_letter_c || "",
      resumeUrl: dbApp.resume_url_c || "",
      status: dbApp.status_c || "submitted",
      submittedDate: dbApp.submitted_date_c || new Date().toISOString(),
      jobId: typeof jobInfo === 'object' ? jobInfo.Id : dbApp.job_id_c,
      feedback: feedback,
      interviewDetails: interviewDetails,
      statusHistory: [],
      job: typeof jobInfo === 'object' ? {
        Id: jobInfo.Id,
        title: jobInfo.title_c || "",
        company: jobInfo.company_c || "",
        location: jobInfo.location_c || ""
      } : null
    };
  }

  transformToDatabase(uiApp) {
    const dbApp = {
      Name: uiApp.candidateName || "Application",
      candidate_name_c: uiApp.candidateName,
      email_c: uiApp.email,
      phone_c: uiApp.phone,
      cover_letter_c: uiApp.coverLetter,
      resume_url_c: uiApp.resumeUrl,
      status_c: uiApp.status || "submitted",
      submitted_date_c: uiApp.submittedDate || new Date().toISOString()
    };

    if (uiApp.jobId) {
      dbApp.job_id_c = parseInt(uiApp.jobId);
    }

    if (uiApp.feedback) {
      dbApp.feedback_c = typeof uiApp.feedback === 'string' ? uiApp.feedback : JSON.stringify(uiApp.feedback);
    }

    if (uiApp.interviewDetails) {
      dbApp.interview_details_c = typeof uiApp.interviewDetails === 'string' ? uiApp.interviewDetails : JSON.stringify(uiApp.interviewDetails);
    }

    Object.keys(dbApp).forEach(key => {
      if (dbApp[key] === undefined || dbApp[key] === null || dbApp[key] === "") {
        delete dbApp[key];
      }
    });
return dbApp;
  }
}

export const applicationService = new ApplicationService();