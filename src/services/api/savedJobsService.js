import { getApperClient } from "@/services/apperClient";

export const getAll = async () => {
  try {
    const apperClient = getApperClient();
    const response = await apperClient.fetchRecords("saved_job_c", {
      fields: [
        {"field": {"Name": "Id"}},
        {"field": {"Name": "Name"}},
        {"field": {"Name": "saved_at_c"}},
        {"field": {"Name": "job_id_c"}, "referenceField": {"field": {"Name": "title_c"}}},
        {"field": {"Name": "job_id_c"}, "referenceField": {"field": {"Name": "company_c"}}},
        {"field": {"Name": "job_id_c"}, "referenceField": {"field": {"Name": "location_c"}}}
      ]
    });

    if (!response.success) {
      console.error(response.message);
      return [];
    }

    return (response.data || []).map(saved => ({
      Id: saved.Id,
      JobId: typeof saved.job_id_c === 'object' ? saved.job_id_c.Id : saved.job_id_c,
      SavedAt: saved.saved_at_c || new Date().toISOString()
    }));
  } catch (error) {
    console.error("Error fetching saved jobs:", error?.message || error);
    return [];
  }
};

export const getById = async (id) => {
  try {
    const apperClient = getApperClient();
    const response = await apperClient.getRecordById("saved_job_c", parseInt(id), {
      fields: [
        {"field": {"Name": "Id"}},
        {"field": {"Name": "saved_at_c"}},
        {"field": {"Name": "job_id_c"}}
      ]
    });

    if (!response.success || !response.data) {
      return null;
    }

    return {
      Id: response.data.Id,
      JobId: typeof response.data.job_id_c === 'object' ? response.data.job_id_c.Id : response.data.job_id_c,
      SavedAt: response.data.saved_at_c
    };
  } catch (error) {
    console.error("Error fetching saved job by ID:", error?.message || error);
    return null;
  }
};

export const isJobSaved = async (jobId) => {
  try {
    const apperClient = getApperClient();
    const response = await apperClient.fetchRecords("saved_job_c", {
      fields: [
        {"field": {"Name": "Id"}},
        {"field": {"Name": "job_id_c"}}
      ],
      where: [{
        "FieldName": "job_id_c",
        "Operator": "EqualTo",
        "Values": [parseInt(jobId)]
      }]
    });

    if (!response.success) {
      return false;
    }

    return (response.data || []).length > 0;
  } catch (error) {
    console.error("Error checking if job is saved:", error?.message || error);
    return false;
  }
};

export const create = async (jobId) => {
  try {
    const alreadySaved = await isJobSaved(jobId);
    if (alreadySaved) {
      throw new Error('Job already saved');
    }

    const apperClient = getApperClient();
    const response = await apperClient.createRecord("saved_job_c", {
      records: [{
        Name: `Saved Job ${jobId}`,
        job_id_c: parseInt(jobId),
        saved_at_c: new Date().toISOString()
      }]
    });

    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results && response.results.length > 0) {
      const result = response.results[0];
      if (result.success) {
        return {
          Id: result.data.Id,
          JobId: parseInt(jobId),
          SavedAt: result.data.saved_at_c
        };
      } else {
        throw new Error(result.message || "Failed to save job");
      }
    }

    throw new Error("No response data received");
  } catch (error) {
    console.error("Error saving job:", error?.message || error);
    throw error;
  }
};

export const deleteSavedJob = async (jobId) => {
  try {
    const apperClient = getApperClient();
    
    const checkResponse = await apperClient.fetchRecords("saved_job_c", {
      fields: [{"field": {"Name": "Id"}}],
      where: [{
        "FieldName": "job_id_c",
        "Operator": "EqualTo",
        "Values": [parseInt(jobId)]
      }]
    });

    if (!checkResponse.success || !checkResponse.data || checkResponse.data.length === 0) {
      throw new Error('Saved job not found');
    }

    const savedJobId = checkResponse.data[0].Id;

    const deleteResponse = await apperClient.deleteRecord("saved_job_c", {
      RecordIds: [savedJobId]
    });

    if (!deleteResponse.success) {
      console.error(deleteResponse.message);
      throw new Error(deleteResponse.message);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting saved job:", error?.message || error);
    throw error;
  }
};

export default {
  getAll,
  getById,
  isJobSaved,
  create,
  delete: deleteSavedJob
};