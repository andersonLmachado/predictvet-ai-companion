export interface EditForm {
  name: string;
  owner_name: string;
  species: string;
  breed: string;
  age: string;
}

export interface PatientUpdatePayload {
  name: string;
  owner_name: string;
  species: string;
  breed: string;
  age: number | null;
}

export function buildPatientUpdatePayload(form: EditForm): PatientUpdatePayload {
  return {
    name: form.name,
    owner_name: form.owner_name,
    species: form.species,
    breed: form.breed,
    age: form.age !== '' && !isNaN(Number(form.age)) ? Number(form.age) : null,
  };
}

export function validatePatientEdit(form: EditForm): string | null {
  if (!form.name.trim()) return 'O nome do animal é obrigatório.';
  if (!form.owner_name.trim()) return 'O nome do tutor é obrigatório.';
  return null;
}
