import type { ClassFormValues, StudentFormValues } from '../schema';
import type { Student, SchoolClass } from '../types';
import { apiClient } from '@/shared/lib/apiClient';
import type { ApiSuccessResponse, PaginatedResponse } from '@/shared/types';

export interface StudentListParams {
  page?: number;
  per_page?: number;
  search?: string;
  class_id?: number;
  status?: string;
}

export const studentsApi = {
  async list(params: StudentListParams): Promise<PaginatedResponse<Student>> {
    const { data } = await apiClient.get<ApiSuccessResponse<PaginatedResponse<Student>>>(
      '/students',
      {
        params,
      },
    );
    return data.data;
  },

  async get(id: number): Promise<Student> {
    const { data } = await apiClient.get<ApiSuccessResponse<Student>>(`/students/${id}`);
    return data.data;
  },

  // Deliberately not `...values` — guardian_name/guardian_phone live on the
  // same form schema (see schema.ts) but are handled entirely client-side
  // via the separate guardian-link endpoint, never sent to this one.
  async create(values: StudentFormValues): Promise<Student> {
    const { data } = await apiClient.post<ApiSuccessResponse<Student>>('/students', {
      class_id: Number(values.class_id),
      first_name: values.first_name,
      last_name: values.last_name,
      dob: values.dob,
      gender: values.gender,
      admission_date: values.admission_date,
      roll_no: values.roll_no?.trim() ? values.roll_no.trim() : null,
      address: values.address?.trim() ? values.address.trim() : null,
    });
    return data.data;
  },

  async update(id: number, values: StudentFormValues): Promise<Student> {
    const { data } = await apiClient.put<ApiSuccessResponse<Student>>(`/students/${id}`, {
      ...values,
      class_id: Number(values.class_id),
    });
    return data.data;
  },

  async updateStatus(id: number, status: string): Promise<Student> {
    const { data } = await apiClient.patch<ApiSuccessResponse<Student>>(`/students/${id}/status`, {
      status,
    });
    return data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/students/${id}`);
  },
};

function toClassPayload(values: ClassFormValues) {
  return {
    ...values,
    class_teacher_id:
      values.class_teacher_id && values.class_teacher_id !== 'none'
        ? Number(values.class_teacher_id)
        : null,
  };
}

export const classesApi = {
  async list(): Promise<SchoolClass[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<SchoolClass[]>>('/classes');
    return data.data;
  },

  async create(values: ClassFormValues): Promise<SchoolClass> {
    const { data } = await apiClient.post<ApiSuccessResponse<SchoolClass>>(
      '/classes',
      toClassPayload(values),
    );
    return data.data;
  },

  async update(id: number, values: ClassFormValues): Promise<SchoolClass> {
    const { data } = await apiClient.put<ApiSuccessResponse<SchoolClass>>(
      `/classes/${id}`,
      toClassPayload(values),
    );
    return data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/classes/${id}`);
  },
};
