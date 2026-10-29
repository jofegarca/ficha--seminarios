import React, { useState, useRef } from 'react';
import SignaturePad from './components/SignaturePad';
import { generateAndDownloadPDF } from './services/pdfService';

const initialFormData = {
  // 1. Alumno
  alumno_nombre_completo: '',
  alumno_fecha_nacimiento: '',
  alumno_barrio_rama: '',
  alumno_estaca_distrito: '',
  alumno_sexo: '', // 'Hombre' | 'Mujer'
  alumno_religion: 'Miembro', // 'Miembro' | 'Otro'

  // 2. Contacto 1
  contacto1_nombre: '',
  contacto1_email: '',
  contacto1_direccion: '',
  contacto1_ciudad: '',
  contacto1_tel_celular: '',

  // 3. Contacto 2
  contacto2_nombre: '',
  contacto2_email: '',
  contacto2_direccion: '',
  contacto2_ciudad: '',
  contacto2_tel_celular: '',
};

function App() {
  const [formData, setFormData] = useState(initialFormData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTerms, setShowTerms] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const signatureAlumnoRef = useRef(null);
  const signatureTutorRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errorMessage) setErrorMessage('');
  };

  const handleReset = () => {
    if (window.confirm('¿Está seguro de que desea limpiar todos los campos del formulario y las firmas?')) {
      setFormData(initialFormData);
      signatureAlumnoRef.current?.clear();
      signatureTutorRef.current?.clear();
      setErrorMessage('');
      setSuccessMessage('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validaciones clave
    const missing = [];
    if (!formData.alumno_nombre_completo.trim()) missing.push('Nombre completo del alumno');
    if (!formData.alumno_fecha_nacimiento) missing.push('Fecha de nacimiento del alumno');
    if (!formData.alumno_barrio_rama.trim()) missing.push('Barrio o rama');
    if (!formData.alumno_estaca_distrito.trim()) missing.push('Estaca o distrito');
    if (!formData.alumno_sexo) missing.push('Sexo del alumno');
    if (!formData.alumno_religion) missing.push('Religión del alumno');
    if (!formData.contacto1_nombre.trim()) missing.push('Nombre del contacto principal');
    if (!formData.contacto1_tel_celular.trim()) missing.push('Teléfono celular del contacto principal');

    const alumnoSignatureData = signatureAlumnoRef.current?.getSignature();
    const tutorSignatureData = signatureTutorRef.current?.getSignature();

    if (!alumnoSignatureData) missing.push('Firma del alumno');
    if (!tutorSignatureData) missing.push('Firma del padre/madre o tutor legal');

    if (missing.length > 0) {
      setErrorMessage(`Por favor complete los siguientes campos requeridos antes de generar el documento:\n• ${missing.join('\n• ')}`);
      window.scrollTo({ top: 200, behavior: 'smooth' });
      return;
    }

    try {
      setIsGenerating(true);
      await generateAndDownloadPDF(formData, alumnoSignatureData, tutorSignatureData);
      setSuccessMessage('¡Ficha generada y descargada exitosamente en formato PDF!');
    } catch (err) {
      console.error(err);
      setErrorMessage(`Ocurrió un error al generar el PDF: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const todayStr = (() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  })();

  return (
    <div className="bg-body-tertiary min-vh-100 pb-5">
      {/* HEADER INSTITUCIONAL */}
      <header className="header-sei text-white py-4 shadow-sm mb-4">
        <div className="container">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <i className="bi bi-mortarboard-fill fs-3 text-warning"></i>
                <span className="text-uppercase tracking-wider small opacity-75 fw-semibold">
                  Seminarios e Institutos de Religión
                </span>
              </div>
              <h1 className="h3 mb-1 fw-bold">Inscripción en Seminario</h1>
              <p className="mb-0 text-white-50 small">Formulario digital</p>
            </div>
            <div className="text-md-end mt-2 mt-md-0">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                <i className="bi bi-calendar3 me-1"></i>Fecha: {todayStr}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL */}
      <main className="container" style={{ maxWidth: '960px' }}>
        {/* MENSAJES DE ALERTA */}
        {errorMessage && (
          <div className="alert alert-danger shadow-sm border-danger-subtle mb-4" role="alert">
            <div className="d-flex align-items-start gap-2">
              <i className="bi bi-exclamation-triangle-fill fs-5 mt-1 text-danger"></i>
              <div style={{ whiteSpace: 'pre-line' }}>{errorMessage}</div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success shadow-sm border-success-subtle mb-4 alert-dismissible fade show" role="alert">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill fs-5 text-success"></i>
              <div>{successMessage}</div>
            </div>
            <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* 1. INFORMACIÓN DEL ALUMNO */}
          <section className="card shadow-sm border-0 rounded-3 mb-4">
            <div className="card-header bg-white border-bottom py-3">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-primary rounded-circle p-2 px-2.5">1</span>
                <h2 className="h5 mb-0 fw-bold text-dark">Información del Alumno</h2>
              </div>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                {/* Nombre Completo */}
                <div className="col-12">
                  <label htmlFor="alumno_nombre_completo" className="form-label fw-semibold text-secondary">
                    Nombre Completo <span className="text-danger">*</span>
                    <small className="text-muted fw-normal ms-1">(Primer Nombre, Segundo Nombre, Apellidos)</small>
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg fs-6"
                    id="alumno_nombre_completo"
                    name="alumno_nombre_completo"
                    placeholder="Ej. Juan Carlos Pérez Morales"
                    value={formData.alumno_nombre_completo}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Fecha de Nacimiento */}
                <div className="col-md-4">
                  <label htmlFor="alumno_fecha_nacimiento" className="form-label fw-semibold text-secondary">
                    Fecha de Nacimiento <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="alumno_fecha_nacimiento"
                    name="alumno_fecha_nacimiento"
                    value={formData.alumno_fecha_nacimiento}
                    onChange={handleInputChange}
                    required
                  />
                  <div className="form-text small">Se registrará en formato DD/MM/AAAA</div>
                </div>

                {/* Barrio o Rama */}
                <div className="col-md-4">
                  <label htmlFor="alumno_barrio_rama" className="form-label fw-semibold text-secondary">
                    Barrio o Rama <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="alumno_barrio_rama"
                    name="alumno_barrio_rama"
                    placeholder="Ej. Barrio Los Olivos"
                    value={formData.alumno_barrio_rama}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Estaca o Distrito */}
                <div className="col-md-4">
                  <label htmlFor="alumno_estaca_distrito" className="form-label fw-semibold text-secondary">
                    Estaca o Distrito <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="alumno_estaca_distrito"
                    name="alumno_estaca_distrito"
                    placeholder="Ej. Estaca Norte"
                    value={formData.alumno_estaca_distrito}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Sexo */}
                <div className="col-md-6 pt-2">
                  <label className="form-label fw-semibold text-secondary d-block">
                    Sexo <span className="text-danger">*</span>
                  </label>
                  <div className="d-flex gap-4 mt-2">
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="alumno_sexo"
                        id="sexo_hombre"
                        value="Hombre"
                        checked={formData.alumno_sexo === 'Hombre'}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label fw-semibold" htmlFor="sexo_hombre">
                        Hombre
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="alumno_sexo"
                        id="sexo_mujer"
                        value="Mujer"
                        checked={formData.alumno_sexo === 'Mujer'}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label fw-semibold" htmlFor="sexo_mujer">
                        Mujer
                      </label>
                    </div>
                  </div>
                </div>

                {/* Religión */}
                <div className="col-md-6 pt-2">
                  <label className="form-label fw-semibold text-secondary d-block">
                    Religión <span className="text-danger">*</span>
                  </label>
                  <div className="d-flex gap-4 mt-2">
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="alumno_religion"
                        id="religion_miembro"
                        value="Miembro"
                        checked={formData.alumno_religion === 'Miembro'}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label fw-semibold" htmlFor="religion_miembro">
                        Miembro de la Iglesia
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="alumno_religion"
                        id="religion_otro"
                        value="Otro"
                        checked={formData.alumno_religion === 'Otro'}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label fw-semibold" htmlFor="religion_otro">
                        Otro
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. CONTACTO PRINCIPAL */}
          <section className="card shadow-sm border-0 rounded-3 mb-4">
            <div className="card-header bg-white border-bottom py-3">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-primary rounded-circle p-2 px-2.5">2</span>
                  <h2 className="h5 mb-0 fw-bold text-dark">
                    Información del Contacto Principal <span className="fw-normal text-muted small">(Padre/Madre o Tutor Legal)</span>
                  </h2>
                </div>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                  Obligatorio
                </span>
              </div>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                {/* Nombre */}
                <div className="col-md-6">
                  <label htmlFor="contacto1_nombre" className="form-label fw-semibold text-secondary">
                    Nombre <span className="text-danger">*</span>
                    <small className="text-muted fw-normal ms-1">(Primer nombre, apellido)</small>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="contacto1_nombre"
                    name="contacto1_nombre"
                    placeholder="Ej. Roberto Pérez Gómez"
                    value={formData.contacto1_nombre}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Email */}
                <div className="col-md-6">
                  <label htmlFor="contacto1_email" className="form-label fw-semibold text-secondary">
                    Dirección de correo electrónico
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="contacto1_email"
                    name="contacto1_email"
                    placeholder="ejemplo@correo.com"
                    value={formData.contacto1_email}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Dirección */}
                <div className="col-md-8">
                  <label htmlFor="contacto1_direccion" className="form-label fw-semibold text-secondary">
                    Dirección postal
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="contacto1_direccion"
                    name="contacto1_direccion"
                    placeholder="Calle, avenida, número, sector"
                    value={formData.contacto1_direccion}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Ciudad */}
                <div className="col-md-4">
                  <label htmlFor="contacto1_ciudad" className="form-label fw-semibold text-secondary">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="contacto1_ciudad"
                    name="contacto1_ciudad"
                    placeholder="Ej. Lima, Bogotá, etc."
                    value={formData.contacto1_ciudad}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Teléfono Celular */}
                <div className="col-md-6">
                  <label htmlFor="contacto1_tel_celular" className="form-label fw-semibold text-secondary">
                    Teléfono celular (móvil) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    id="contacto1_tel_celular"
                    name="contacto1_tel_celular"
                    placeholder="+00 000 000 000"
                    value={formData.contacto1_tel_celular}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Opción preferida fija */}
                <div className="col-md-6 d-flex align-items-center pt-md-4">
                  <div className="p-2 px-3 bg-light rounded border w-100">
                    <small className="text-muted d-block">Opción preferida de contacto (Fija en PDF):</small>
                    <span className="fw-semibold text-primary">
                      <i className="bi bi-check2-square me-1"></i>Celular (marcada automáticamente)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. CONTACTO SECUNDARIO */}
          <section className="card shadow-sm border-0 rounded-3 mb-4">
            <div className="card-header bg-white border-bottom py-3">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-secondary rounded-circle p-2 px-2.5">3</span>
                  <h2 className="h5 mb-0 fw-bold text-dark">
                    Información del Contacto Secundario <span className="fw-normal text-muted small">(Padre/Madre o Tutor Legal)</span>
                  </h2>
                </div>
                <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                  Opcional
                </span>
              </div>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                {/* Nombre */}
                <div className="col-md-6">
                  <label htmlFor="contacto2_nombre" className="form-label fw-semibold text-secondary">
                    Nombre <small className="text-muted fw-normal">(Primer nombre, apellido)</small>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="contacto2_nombre"
                    name="contacto2_nombre"
                    placeholder="Ej. Carmen Rosa Morales"
                    value={formData.contacto2_nombre}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Email */}
                <div className="col-md-6">
                  <label htmlFor="contacto2_email" className="form-label fw-semibold text-secondary">
                    Dirección de correo electrónico
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="contacto2_email"
                    name="contacto2_email"
                    placeholder="ejemplo@correo.com"
                    value={formData.contacto2_email}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Dirección */}
                <div className="col-md-8">
                  <label htmlFor="contacto2_direccion" className="form-label fw-semibold text-secondary">
                    Dirección postal
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="contacto2_direccion"
                    name="contacto2_direccion"
                    placeholder="Calle, avenida, número, sector"
                    value={formData.contacto2_direccion}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Ciudad */}
                <div className="col-md-4">
                  <label htmlFor="contacto2_ciudad" className="form-label fw-semibold text-secondary">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="contacto2_ciudad"
                    name="contacto2_ciudad"
                    placeholder="Ej. Lima, Bogotá, etc."
                    value={formData.contacto2_ciudad}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Teléfono Celular */}
                <div className="col-md-6">
                  <label htmlFor="contacto2_tel_celular" className="form-label fw-semibold text-secondary">
                    Teléfono celular (móvil)
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    id="contacto2_tel_celular"
                    name="contacto2_tel_celular"
                    placeholder="+00 000 000 000"
                    value={formData.contacto2_tel_celular}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Opción preferida fija */}
                <div className="col-md-6 d-flex align-items-center pt-md-4">
                  <div className="p-2 px-3 bg-light rounded border w-100">
                    <small className="text-muted d-block">Opción preferida de contacto (Fija en PDF):</small>
                    <span className="fw-semibold text-secondary">
                      <i className="bi bi-check2-square me-1"></i>Celular (marcada automáticamente al registrarse)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. FIRMAS DIGITALES */}
          <section className="card shadow-sm border-0 rounded-3 mb-4">
            <div className="card-header bg-white border-bottom py-3">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-primary rounded-circle p-2 px-2.5">4</span>
                  <h2 className="h5 mb-0 fw-bold text-dark">Firmas Digitales y Consentimiento</h2>
                </div>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                  Fecha automática: {todayStr}
                </span>
              </div>
            </div>
            <div className="card-body p-4">
              <div className="alert alert-info py-2 px-3 border-info-subtle mb-4 small">
                <i className="bi bi-info-circle-fill me-2"></i>
                Dibuje su firma en los recuadros usando su pantalla táctil, lápiz digital o mouse.
              </div>

              <div className="row g-4">
                <div className="col-md-6">
                  <SignaturePad
                    ref={signatureAlumnoRef}
                    label="Firma del Alumno"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <SignaturePad
                    ref={signatureTutorRef}
                    label="Firma del Padre/Madre (o Tutor Legal)"
                    required
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 5. ACUERDOS Y CONDICIONES (TEXTO ÍNTEGRO DEL PDF) */}
          <section className="card border-primary bg-light p-4 mb-4 rounded-3 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-file-earmark-text-fill text-primary fs-4"></i>
                <h3 className="h5 mb-0 fw-bold text-primary">Acuerdo de Inscripción en Seminario</h3>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => setShowTerms(!showTerms)}
              >
                <i className={`bi ${showTerms ? 'bi-chevron-up' : 'bi-chevron-down'} me-1`}></i>
                {showTerms ? 'Ocultar términos' : 'Ver términos completos'}
              </button>
            </div>

            {showTerms && (
              <div className="terms-body bg-white p-3 rounded border text-secondary" style={{ fontSize: '0.88rem', lineHeight: '1.6' }}>
                <p className="mb-3">
                  <strong>Permiso para participar en Seminario:</strong><br />
                  Participar en Seminario es un privilegio y les damos la bienvenida. Usted y su hijo o hija (en lo sucesivo, "ustedes") aceptan y autorizan su participación en los análisis, las actividades y las clases de Seminario, incluso durante un período de la jornada escolar en caso de que el alumno se matricule en Seminario integrado (el plan regular de enseñanza secundaria). Se comprometen a cumplir las normas de Seminario (incluso el requisito de asistir regularmente y con puntualidad a las clases) y también aceptan que Seminarios e Institutos de Religión, un departamento de La Iglesia de Jesucristo de los Santos de los Últimos Días, una corporación unipersonal de Utah, y sus entidades legales afiliadas (colectivamente, "nosotros"), no seremos responsables de ningún perjuicio que pudiera surgir del incumplimiento de estas normas por parte de ustedes.
                </p>

                <p className="mb-3">
                  <strong>Normas de privacidad de la información de los alumnos y los padres o tutores legales:</strong><br />
                  Aceptan que podremos recopilar y procesar su información personal de este formulario, de su cédula de miembro (si fueran miembros de La Iglesia de Jesucristo de los Santos de los Últimos Días) y del contenido recopilado durante sus actividades en Seminario, de conformidad con las condiciones establecidas en el Aviso de privacidad de la Iglesia (PrivacyNotice.ChurchofJesusChrist.org). Ustedes reconocen que ustedes, así como todas las personas cuya información personal ustedes proporcionen, han recibido el Aviso de privacidad de la Iglesia y que ustedes (y ellos) comprenden que este aviso regula la manera en la que la Iglesia procesa la información personal.
                </p>

                <p className="mb-3 ps-3 border-start border-3 border-primary-subtle text-muted">
                  <em>Encuestas y estudios de investigación:</em> En caso de que se les pidiera que participen en una encuesta o un estudio de investigación, entienden que la participación es completamente voluntaria y que podrán retirarse en cualquier momento. Cualquier información de contacto que proporcionen como parte de un estudio de investigación o una encuesta (por ejemplo, dirección de correo electrónico o número de teléfono celular) se usará exclusivamente para comunicarnos con ustedes con el fin de saber si desean participar en futuros estudios o encuestas. También podrán optar por no recibir tales comunicaciones. Es posible que algunos estudios o encuestas se realicen de manera totalmente anónima; en esos casos, no guardaremos ninguna información de identificación personal con sus respuestas.
                </p>

                <p className="mb-3">
                  <strong>Normas de uso de Internet y recursos en línea:</strong><br />
                  Proporcionamos diversos recursos electrónicos para facilitar su participación en Seminario. Pueden decidir si desean usarlos, pero en caso de hacerlo, aceptan las condiciones siguientes: Cuando ingresen en Internet utilizando nuestras instalaciones, equipos o tecnología inalámbrica, podremos recabar información de su navegador web. Esa información podrá incluir su dirección IP, el tipo de navegador, el sistema operativo y las preferencias de idioma, cualquier página web de referencia que hayan visitado antes de entrar en nuestro sitio, la fecha y la hora de cada visita y la información que busquen en nuestros sitios.
                </p>

                <p className="mb-3">
                  Los sitios web, el software, el contenido, los servidores y otras tecnologías y materiales que usemos para proporcionar los programas de Seminario (las "Herramientas de Seminario") son propiedad nuestra o poseemos las licencias correspondientes, y somos nosotros quienes los administramos. Podremos supervisar todas las comunicaciones (correo electrónico, mensajes de texto, redes sociales, etc.) que se usen o tengan lugar en las Herramientas de Seminario para detectar contenido inapropiado o ilegal, y podremos reenviarlos a líderes eclesiásticos u oficiales gubernamentales, según sea necesario, con el fin de proteger a los alumnos y los intereses de la Iglesia. Ustedes dan su consentimiento para que se realice esta actividad de supervisión y reenvío de información.
                </p>

                <p className="mb-0">
                  <strong>Disposiciones varias:</strong><br />
                  Este Acuerdo se rige por las leyes del estado de Utah, EE. UU., sin dar efecto a los principios de conflictos entre leyes. Cualquier acción legal emprendida para hacer cumplir este Acuerdo se llevará ante los tribunales del condado de Salt Lake, Utah, EE. UU. Al firmar este formulario de inscripción se da por sentado que aceptan las condiciones descritas anteriormente.
                </p>
              </div>
            )}
            <div className="mt-3 text-muted small">
              <i className="bi bi-shield-check text-primary me-1"></i>
              Al pulsar "Generar y Descargar Ficha PDF", se confirmará la aceptación de estos términos y se inyectarán los datos en el documento oficial.
            </div>
          </section>

          {/* BARRA DE ACCIONES */}
          <div className="card shadow-sm border-0 rounded-3 p-3 bg-white mb-5 sticky-bottom">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
              <button
                type="button"
                className="btn btn-outline-danger px-4 w-100 w-sm-auto"
                onClick={handleReset}
                disabled={isGenerating}
              >
                <i className="bi bi-trash3 me-1"></i>Limpiar Todo
              </button>

              <button
                type="submit"
                className="btn btn-primary btn-lg px-5 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 w-100 w-sm-auto"
                disabled={isGenerating}
                style={{ backgroundColor: '#002B49', borderColor: '#002B49' }}
              >
                {isGenerating ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Estampando y generando PDF...
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-pdf-fill fs-5"></i>
                    Generar y Descargar Ficha PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>

      {/* FOOTER */}
      <footer className="container text-center text-muted small mt-4 pt-3 border-top">
        <p className="mb-0">
          Seminarios e Institutos de Religión • Ficha de Inscripción Digital
        </p>
      </footer>
    </div>
  );
}

export default App;
