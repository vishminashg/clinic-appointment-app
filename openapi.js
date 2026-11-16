const bearer = [{ bearerAuth: [] }];
const idParameter = {
  name: 'id', in: 'path', required: true,
  description: 'MongoDB ID returned by the corresponding list or create operation',
  schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' }
};
const string = { type: 'string' };
const email = { type: 'string', format: 'email' };
const password = { type: 'string', format: 'password', writeOnly: true };
const object = (properties, required = []) => ({
  type: 'object', properties, ...(required.length ? { required } : {})
});
const body = (schema, multipartSchema) => ({
  required: true,
  content: {
    'application/json': { schema },
    ...(multipartSchema && { 'multipart/form-data': { schema: multipartSchema } })
  }
});
const responses = (entries) => Object.fromEntries(
  Object.entries(entries).map(([code, description]) => [code, { description }])
);
const authenticated = { 401: 'Missing or invalid Bearer token' };
const adminOnly = { ...authenticated, 403: 'An admin account is required' };
const doctorOnly = { ...authenticated, 403: 'A linked doctor account is required' };
const doctorFields = {
  name: string,
  specialization: { ...string, example: 'Cardiology' },
  consultationFee: { type: 'number', example: 1500 },
  bio: string,
  availableDays: { type: 'array', items: string, description: 'Legacy weekly schedule labels' },
  availableDates: { type: 'array', items: { type: 'string', format: 'date' } },
  accountEmail: { ...email, description: 'Email of the clinic login to link or create' }
};
const doctorFormFields = {
  ...doctorFields,
  availableDays: { ...string, example: 'Monday,Wednesday' },
  availableDates: { ...string, description: 'Comma-separated YYYY-MM-DD dates' },
  profileImage: { type: 'string', format: 'binary' }
};
const createDoctorRequired = ['name', 'specialization', 'consultationFee'];
const accountPassword = { ...password, minLength: 8, description: 'Supply with accountEmail to create a new doctor login' };

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Clinic Appointments API',
    version: '1.0.0',
    description: 'Log in with a demo account, then paste the returned token into Authorize. Use the matching patient, doctor, or admin account for each operation.'
  },
  servers: [{ url: '/' }],
  components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Authentication'], summary: 'Register a patient account',
        requestBody: body(object({ name: string, email, password }, ['name', 'email', 'password'])),
        responses: responses({ 201: 'Account registered', 400: 'Missing fields or email already registered' })
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'], summary: 'Sign in and obtain a JWT',
        requestBody: body(object({ email, password }, ['email', 'password'])),
        responses: responses({ 200: 'Returns token and user profile with role flags', 400: 'Invalid credentials or missing fields' })
      }
    },
    '/api/auth/profile': {
      get: {
        tags: ['Authentication'], summary: 'Get the signed-in account and role flags', security: bearer,
        responses: responses({ 200: 'Signed-in profile', ...authenticated, 404: 'User not found' })
      }
    },
    '/api/doctors': {
      get: { tags: ['Doctors'], summary: 'List doctors and available dates', responses: responses({ 200: 'Doctor list' }) },
      post: {
        tags: ['Doctors'], summary: 'Create a doctor and optionally create or link a login (admin)', security: bearer,
        requestBody: body(
          object({ ...doctorFields, accountPassword }, createDoctorRequired),
          object({ ...doctorFormFields, accountPassword }, createDoctorRequired)
        ),
        responses: responses({ 201: 'Doctor created', 400: 'Invalid profile, availability or login details', ...adminOnly, 409: 'Email or account already in use' })
      }
    },
    '/api/doctors/{id}': {
      parameters: [idParameter],
      get: { tags: ['Doctors'], summary: 'View a doctor profile', responses: responses({ 200: 'Doctor profile', 404: 'Doctor not found' }) },
      put: {
        tags: ['Doctors'], summary: 'Edit a doctor profile, availability or linked account (admin)', security: bearer,
        requestBody: body(object(doctorFields), object(doctorFormFields)),
        responses: responses({ 200: 'Doctor updated', 400: 'Invalid availability or account', ...adminOnly, 404: 'Doctor not found', 409: 'Account already linked' })
      },
      delete: {
        tags: ['Doctors'], summary: 'Delete a doctor profile (admin)', security: bearer,
        responses: responses({ 200: 'Doctor deleted', ...adminOnly, 404: 'Doctor not found' })
      }
    },
    '/api/doctors/{id}/login': {
      parameters: [idParameter],
      get: {
        tags: ['Doctors'], summary: 'Get the linked doctor email (admin)', security: bearer,
        responses: responses({ 200: 'Linked email or null', 400: 'Invalid doctor ID', ...adminOnly, 404: 'Doctor not found' })
      }
    },
    '/api/appointments': {
      get: {
        tags: ['Patient appointments'], summary: 'List bookings owned by the signed-in patient', security: bearer,
        responses: responses({ 200: 'Patient bookings', ...authenticated })
      },
      post: {
        tags: ['Patient appointments'], summary: 'Book a doctor on an available date (patient)', security: bearer,
        requestBody: body(object({
          doctorId: { ...string, description: 'Copy _id from the doctor list' },
          appointmentDate: { type: 'string', format: 'date', description: 'Use an offered date today or later in Sri Lanka time' },
          timeSlot: { ...string, example: '9:00 AM' },
          reason: { ...string, example: 'Demo booking' }
        }, ['doctorId', 'appointmentDate', 'timeSlot'])),
        responses: responses({ 201: 'Pending booking created', 400: 'Invalid date, unavailable date, missing fields or duplicate slot', ...authenticated, 403: 'Only patients can book', 404: 'Doctor not found' })
      }
    },
    '/api/appointments/{id}': {
      parameters: [idParameter],
      get: {
        tags: ['Patient appointments'], summary: 'View your booking', security: bearer,
        responses: responses({ 200: 'Booking details', 400: 'Invalid appointment ID', ...authenticated, 404: 'Appointment not found for this account' })
      },
      delete: {
        tags: ['Patient appointments'], summary: 'Delete your booking', security: bearer,
        responses: responses({ 200: 'Booking deleted', 400: 'Invalid appointment ID', ...authenticated, 404: 'Appointment not found for this account' })
      }
    },
    '/api/appointments/{id}/status': {
      parameters: [idParameter],
      put: {
        tags: ['Patient appointments'], summary: 'Cancel your booking', security: bearer,
        requestBody: body(object({ status: { type: 'string', enum: ['Cancelled'] } }, ['status'])),
        responses: responses({ 200: 'Booking cancelled', 400: 'Invalid appointment ID or status', ...authenticated, 404: 'Appointment not found for this account', 409: 'Appointment can no longer be cancelled' })
      }
    },
    '/api/appointments/doctor': {
      get: {
        tags: ['Doctor appointments'], summary: 'List bookings assigned to your doctor profile', security: bearer,
        responses: responses({ 200: 'Doctor profile and assigned bookings', ...doctorOnly })
      }
    },
    '/api/appointments/doctor/{id}/decision': {
      parameters: [idParameter],
      put: {
        tags: ['Doctor appointments'], summary: 'Accept or reject an assigned pending booking', security: bearer,
        requestBody: body(object({ status: { type: 'string', enum: ['Confirmed', 'Rejected'] } }, ['status'])),
        responses: responses({ 200: 'Decision saved', 400: 'Invalid appointment ID or decision', ...doctorOnly, 404: 'Appointment not assigned to this doctor', 409: 'Appointment is no longer pending' })
      }
    }
  }
};
