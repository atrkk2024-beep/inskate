import { DataProvider, fetchUtils } from 'react-admin';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const httpClient = (url: string, options: fetchUtils.Options = {}) => {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  return fetchUtils.fetchJson(url, { ...options, headers });
};

// Transform response to react-admin format
const transformResponse = (resource: string, response: any) => {
  if (response.json.data === undefined) {
    return response;
  }

  const data = response.json.data;
  const meta = response.json.meta;

  // For list responses
  if (Array.isArray(data)) {
    return {
      ...response,
      json: data,
      total: meta?.total || data.length,
    };
  }

  // For single item
  return {
    ...response,
    json: data,
  };
};

export const dataProvider: DataProvider = {
  getList: async (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    
    const query = new URLSearchParams({
      page: String(page),
      limit: String(perPage),
      sortBy: field,
      sortOrder: order.toLowerCase(),
      ...Object.entries(params.filter).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '') {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>),
    });

    const url = `${API_URL}/${resource}?${query}`;
    const response = await httpClient(url);
    const transformed = transformResponse(resource, response);

    return {
      data: transformed.json,
      total: transformed.total || 0,
    };
  },

  getOne: async (resource, params) => {
    const url = `${API_URL}/${resource}/${params.id}`;
    const response = await httpClient(url);
    const transformed = transformResponse(resource, response);

    return { data: transformed.json };
  },

  getMany: async (resource, params) => {
    const data = await Promise.all(
      params.ids.map(async (id) => {
        const response = await httpClient(`${API_URL}/${resource}/${id}`);
        return transformResponse(resource, response).json;
      })
    );

    return { data };
  },

  getManyReference: async (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    
    const query = new URLSearchParams({
      page: String(page),
      limit: String(perPage),
      sortBy: field,
      sortOrder: order.toLowerCase(),
      [params.target]: String(params.id),
      ...params.filter,
    });

    const url = `${API_URL}/${resource}?${query}`;
    const response = await httpClient(url);
    const transformed = transformResponse(resource, response);

    return {
      data: transformed.json,
      total: transformed.total || 0,
    };
  },

  create: async (resource, params) => {
    const url = `${API_URL}/${resource}`;
    const response = await httpClient(url, {
      method: 'POST',
      body: JSON.stringify(params.data),
    });
    const transformed = transformResponse(resource, response);

    return { data: transformed.json };
  },

  update: async (resource, params) => {
    const url = `${API_URL}/${resource}/${params.id}`;
    const response = await httpClient(url, {
      method: 'PATCH',
      body: JSON.stringify(params.data),
    });
    const transformed = transformResponse(resource, response);

    return { data: transformed.json };
  },

  updateMany: async (resource, params) => {
    const responses = await Promise.all(
      params.ids.map((id) =>
        httpClient(`${API_URL}/${resource}/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(params.data),
        })
      )
    );

    return { data: params.ids };
  },

  delete: async (resource, params) => {
    const url = `${API_URL}/${resource}/${params.id}`;
    await httpClient(url, { method: 'DELETE' });

    return { data: params.previousData as any };
  },

  deleteMany: async (resource, params) => {
    await Promise.all(
      params.ids.map((id) =>
        httpClient(`${API_URL}/${resource}/${id}`, { method: 'DELETE' })
      )
    );

    return { data: params.ids };
  },
};

