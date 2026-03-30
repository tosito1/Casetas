export const ROLES = {
  GLOBAL_ADMIN: 'Administrador Global',
  PRESIDENTE: 'Presidente de Caseta',
  TESORERO: 'Tesorero de Caseta',
  NORMAL: 'Socio de Caseta'
};

export const CASETAS = [];

export const SOCIOS = [
  {
    id: 1,
    nombre: 'Admin Global',
    email: 'admin@feria.com',
    telefono: '000000000',
    rol: ROLES.GLOBAL_ADMIN,
    casetaId: null,
    cuotaAlDia: true
  }
];
