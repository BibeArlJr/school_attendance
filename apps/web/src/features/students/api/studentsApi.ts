import type { ClassFormValues, StudentFormValues } from '../schema';
import type { Student, SchoolClass } from '../types';
import { apiClient } from '@/shared/lib/apiClient';
import { bsDateToString, toBs } from '@/shared/lib/bikramSambat';
import type { ApiSuccessResponse, PaginatedResponse } from '@/shared/types';

// BsDatePicker's value/onChange only ever speaks AD (Prompt 27's shared
// contract) — the BS value "as entered" is re-derived here from that AD
// string via toBs, which round-trips exactly (toBs/toAd are pure
// inverses), so this is not a lossy re-guess of what the user picked.
function dobBsFor(dob: string): string | null {
  return dob ? bsDateToString(toBs(dob)) : null;
}

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

  async get(uuid: string): Promise<Student> {
    const { data } = await apiClient.get<ApiSuccessResponse<Student>>(`/students/${uuid}`);
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
      dob_bs: dobBsFor(values.dob),
      // Not shown on Add anymore (Prompt 47 Part B) — values.gender is
      // always undefined here, which JSON.stringify drops entirely, so
      // this genuinely omits the field from the request rather than
      // silently sending a default choice nobody made.
      gender: values.gender,
      admission_date: values.admission_date,
      roll_no: values.roll_no?.trim() ? values.roll_no.trim() : null,
      address: values.address?.trim() ? values.address.trim() : null,
    });
    return data.data;
  },

  // Same explicit-fields shape as create() above, not `...values` — Edit
  // now also renders roll_no/address (Prompt 47), same trim-or-null
  // normalization as create(); guardian_name/guardian_phone stay Add-only
  // fields on the shared form schema and are never sent here.
  async update(uuid: string, values: StudentFormValues): Promise<Student> {
    const { data } = await apiClient.put<ApiSuccessResponse<Student>>(`/students/${uuid}`, {
      class_id: Number(values.class_id),
      first_name: values.first_name,
      last_name: values.last_name,
      dob: values.dob,
      dob_bs: dobBsFor(values.dob),
      gender: values.gender,
      admission_date: values.admission_date,
      roll_no: values.roll_no?.trim() ? values.roll_no.trim() : null,
      address: values.address?.trim() ? values.address.trim() : null,
    });
    return data.data;
  },

  async updateStatus(uuid: string, status: string): Promise<Student> {
    const { data } = await apiClient.patch<ApiSuccessResponse<Student>>(`/students/${uuid}/status`, {
      status,
    });
    return data.data;
  },

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`/students/${uuid}`);
  },
};

function toClassPayload(values: ClassFormValues) {
  return {
    ...values,
    class_teacher_name: values.class_teacher_name?.trim() ? values.class_teacher_name.trim() : null,
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

  async update(uuid: string, values: ClassFormValues): Promise<SchoolClass> {
    const { data } = await apiClient.put<ApiSuccessResponse<SchoolClass>>(
      `/classes/${uuid}`,
      toClassPayload(values),
    );
    return data.data;
  },

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`/classes/${uuid}`);
  },
};
