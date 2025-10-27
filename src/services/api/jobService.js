import { getApperClient } from "@/services/apperClient";

class JobService {
  constructor() {
    this.tableName = "job_c";
  }

  async getAll() {
    try {
      const apperClient = getApperClient();
      const response = await apperClient.fetchRecords(this.tableName, {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "Name"}},
          {"field": {"Name": "title_c"}},
          {"field": {"Name": "company_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "experience_level_c"}},
          {"field": {"Name": "industry_c"}},
          {"field": {"Name": "job_type_c"}},
          {"field": {"Name": "location_c"}},
          {"field": {"Name": "posted_date_c"}},
          {"field": {"Name": "salary_range_c"}},
          {"field": {"Name": "status_c"}}
        ]
      });

      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return (response.data || []).map(job => this.transformFromDatabase(job));
    } catch (error) {
      console.error("Error fetching jobs:", error?.message || error);
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
          {"field": {"Name": "title_c"}},
          {"field": {"Name": "company_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "experience_level_c"}},
          {"field": {"Name": "industry_c"}},
          {"field": {"Name": "job_type_c"}},
          {"field": {"Name": "location_c"}},
          {"field": {"Name": "posted_date_c"}},
          {"field": {"Name": "salary_range_c"}},
          {"field": {"Name": "status_c"}}
        ]
      });

      if (!response.success) {
        console.error(response.message);
        return null;
      }

      return response.data ? this.transformFromDatabase(response.data) : null;
    } catch (error) {
      console.error("Error fetching job by ID:", error?.message || error);
      return null;
    }
  }

  async create(jobData) {
    try {
      const apperClient = getApperClient();
      const dbData = this.transformToDatabase(jobData);
      
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
          throw new Error(result.message || "Failed to create job");
        }
      }

      throw new Error("No response data received");
    } catch (error) {
      console.error("Error creating job:", error?.message || error);
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
          throw new Error(result.message || "Failed to update job");
        }
      }

      throw new Error("No response data received");
    } catch (error) {
      console.error("Error updating job:", error?.message || error);
      throw error;
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
      console.error("Error deleting job:", error?.message || error);
      throw error;
    }
  }

  transformFromDatabase(dbJob) {
    return {
      Id: dbJob.Id,
      title: dbJob.title_c || "",
      company: dbJob.company_c || "",
      description: dbJob.description_c || "",
      experienceLevel: dbJob.experience_level_c || "",
      industry: dbJob.industry_c || "",
      jobType: dbJob.job_type_c || "",
      location: dbJob.location_c || "",
      postedDate: dbJob.posted_date_c || new Date().toISOString(),
      salaryRange: dbJob.salary_range_c || "",
      status: dbJob.status_c || "active",
      requirements: [],
      benefits: []
    };
  }

  transformToDatabase(uiJob) {
    const dbJob = {
      Name: uiJob.title || "Untitled Job",
      title_c: uiJob.title,
      company_c: uiJob.company,
      description_c: uiJob.description,
      experience_level_c: uiJob.experienceLevel,
      industry_c: uiJob.industry,
      job_type_c: uiJob.jobType,
      location_c: uiJob.location,
      posted_date_c: uiJob.postedDate || new Date().toISOString(),
      salary_range_c: uiJob.salaryRange,
      status_c: uiJob.status || "active"
    };

    Object.keys(dbJob).forEach(key => {
      if (dbJob[key] === undefined || dbJob[key] === null || dbJob[key] === "") {
        delete dbJob[key];
      }
    });

    return dbJob;
  }
}

export const jobService = new JobService();