import { getApperClient } from "@/services/apperClient";

class ShortlistService {
  constructor() {
    this.tableName = "shortlist_request_c";
  }

  async getAll() {
    try {
      const apperClient = getApperClient();
      const response = await apperClient.fetchRecords(this.tableName, {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "Name"}},
          {"field": {"Name": "criteria_c"}},
          {"field": {"Name": "number_of_candidates_c"}},
          {"field": {"Name": "urgency_c"}},
          {"field": {"Name": "additional_notes_c"}},
          {"field": {"Name": "employer_id_c"}},
          {"field": {"Name": "request_date_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "job_id_c"}, "referenceField": {"field": {"Name": "title_c"}}},
          {"field": {"Name": "job_id_c"}, "referenceField": {"field": {"Name": "company_c"}}}
        ]
      });

      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return (response.data || []).map(req => this.transformFromDatabase(req));
    } catch (error) {
      console.error("Error fetching shortlist requests:", error?.message || error);
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
          {"field": {"Name": "criteria_c"}},
          {"field": {"Name": "number_of_candidates_c"}},
          {"field": {"Name": "urgency_c"}},
          {"field": {"Name": "additional_notes_c"}},
          {"field": {"Name": "employer_id_c"}},
          {"field": {"Name": "request_date_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "job_id_c"}}
        ]
      });

      if (!response.success) {
        console.error(response.message);
        return null;
      }

      return response.data ? this.transformFromDatabase(response.data) : null;
    } catch (error) {
      console.error("Error fetching shortlist request by ID:", error?.message || error);
      return null;
    }
  }

  async getByEmployerId(employerId) {
    try {
      const apperClient = getApperClient();
      const response = await apperClient.fetchRecords(this.tableName, {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "Name"}},
          {"field": {"Name": "criteria_c"}},
          {"field": {"Name": "number_of_candidates_c"}},
          {"field": {"Name": "urgency_c"}},
          {"field": {"Name": "employer_id_c"}},
          {"field": {"Name": "request_date_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "job_id_c"}}
        ],
        where: [{
          "FieldName": "employer_id_c",
          "Operator": "EqualTo",
          "Values": [employerId]
        }]
      });

      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return (response.data || []).map(req => this.transformFromDatabase(req));
    } catch (error) {
      console.error("Error fetching shortlist requests by employer:", error?.message || error);
      return [];
    }
  }

  async create(requestData) {
    try {
      const apperClient = getApperClient();
      const dbData = this.transformToDatabase(requestData);

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
          throw new Error(result.message || "Failed to create shortlist request");
        }
      }

      throw new Error("No response data received");
    } catch (error) {
      console.error("Error creating shortlist request:", error?.message || error);
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
          throw new Error(result.message || "Failed to update shortlist request");
        }
      }

      throw new Error("No response data received");
    } catch (error) {
      console.error("Error updating shortlist request:", error?.message || error);
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
      console.error("Error deleting shortlist request:", error?.message || error);
      throw error;
    }
  }

  transformFromDatabase(dbReq) {
    const jobInfo = dbReq.job_id_c || {};

    return {
      Id: dbReq.Id,
      criteria: dbReq.criteria_c || "",
      numberOfCandidates: dbReq.number_of_candidates_c || 0,
      urgency: dbReq.urgency_c || "",
      additionalNotes: dbReq.additional_notes_c || "",
      employerId: dbReq.employer_id_c || "",
      jobId: typeof jobInfo === 'object' ? jobInfo.Id : dbReq.job_id_c,
      requestDate: dbReq.request_date_c || new Date().toISOString(),
      status: dbReq.status_c || "pending"
    };
  }

  transformToDatabase(uiReq) {
    const dbReq = {
      Name: `Shortlist Request - ${uiReq.numberOfCandidates || 0} candidates`,
      criteria_c: uiReq.criteria,
      number_of_candidates_c: parseInt(uiReq.numberOfCandidates),
      urgency_c: uiReq.urgency,
      additional_notes_c: uiReq.additionalNotes,
      employer_id_c: uiReq.employerId,
      request_date_c: uiReq.requestDate || new Date().toISOString(),
      status_c: uiReq.status || "pending"
    };

    if (uiReq.jobId) {
      dbReq.job_id_c = parseInt(uiReq.jobId);
    }

    Object.keys(dbReq).forEach(key => {
      if (dbReq[key] === undefined || dbReq[key] === null || dbReq[key] === "") {
        delete dbReq[key];
      }
    });

    return dbReq;
  }
}

export const shortlistService = new ShortlistService();