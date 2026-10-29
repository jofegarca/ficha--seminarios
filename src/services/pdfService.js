import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Formatea una fecha YYYY-MM-DD a DD/MM/AAAA.
 * Si ya viene en formato de texto libre o DD/MM/AAAA, se preserva.
 */
const formatDateToDDMMAAAA = (value) => {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [yyyy, mm, dd] = trimmed.split('-');
    return `${dd}/${mm}/${yyyy}`;
  }
  return trimmed;
};

/**
 * Genera y descarga el PDF de Ficha de Seminario estampado con los datos y firmas
 * @param {Object} formData Datos ingresados en el formulario
 * @param {string|null} signatureAlumnoDataUrl PNG DataURL de la firma del alumno
 * @param {string|null} signatureTutorDataUrl PNG DataURL de la firma del tutor legal
 */
export const generateAndDownloadPDF = async (formData, signatureAlumnoDataUrl, signatureTutorDataUrl) => {
  // 1. Cargar el PDF plantilla usando fetch con soporte para base URL (GitHub Pages / Local)
  const baseUrl = import.meta.env.BASE_URL || '/';
  const pdfUrl = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}Ficha_de_Seminario_Editable.pdf`;
  const response = await fetch(pdfUrl);
  if (!response.ok) {
    throw new Error('No se pudo cargar la plantilla base (/Ficha_de_Seminario_Editable.pdf)');
  }
  const existingPdfBytes = await response.arrayBuffer();

  // Cargar el documento PDF
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  // 2. Obtener la primera página
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  // 3. Incrustar fuentes Helvetica y Helvetica-Bold
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // 4. Definir el color de lápiz azul solicitado
  const penColor = rgb(0.08, 0.28, 0.62);

  // Helper para inyectar texto en azul lapicero
  const drawText = (text, x, y, size = 9, font = helvetica) => {
    if (text === undefined || text === null || String(text).trim() === '') return;
    firstPage.drawText(String(text).trim(), {
      x,
      y,
      size,
      font,
      color: penColor,
    });
  };

  // Helper para dibujar marcas 'X' en negrita
  const drawX = (x, y) => {
    firstPage.drawText('X', {
      x,
      y,
      size: 10,
      font: helveticaBold,
      color: penColor,
    });
  };

  // -------------------------------------------------------------
  // A. INFORMACIÓN DEL ALUMNO
  // -------------------------------------------------------------
  // 1. Nombre completo: x: 38, y: 635, size: 9
  drawText(formData.alumno_nombre_completo, 38, 635, 9);

  // 2. Fecha de nacimiento: x: 38, y: 611, size: 9 (formato DD/MM/AAAA)
  drawText(formatDateToDDMMAAAA(formData.alumno_fecha_nacimiento), 38, 611, 9);

  // 3. Barrio o rama: x: 269, y: 611, size: 9
  drawText(formData.alumno_barrio_rama, 269, 611, 9);

  // 4. Estaca o distrito: x: 436, y: 611, size: 9
  drawText(formData.alumno_estaca_distrito, 436, 611, 9);

  // 5. Sexo (Hombre: x: 38.5, y: 586.5 / Mujer: x: 84.0, y: 586.5)
  if (formData.alumno_sexo === 'Hombre') {
    drawX(38.5, 586.5);
  } else if (formData.alumno_sexo === 'Mujer') {
    drawX(84.0, 586.5);
  }

  // 6. Religión (Miembro: x: 139.5, y: 586.5 / Otro: x: 227.0, y: 586.5)
  if (formData.alumno_religion === 'Miembro') {
    drawX(139.5, 586.5);
  } else if (formData.alumno_religion === 'Otro') {
    drawX(227.0, 586.5);
  }

  // -------------------------------------------------------------
  // B. CONTACTO PRINCIPAL (Padre/Madre o Tutor Legal)
  // -------------------------------------------------------------
  // 1. Nombre: x: 38, y: 547, size: 9
  drawText(formData.contacto1_nombre, 38, 547, 9);

  // 2. Correo electrónico: x: 308, y: 547, size: 9
  drawText(formData.contacto1_email, 308, 547, 9);

  // 3. Dirección postal: x: 38, y: 523, size: 9
  drawText(formData.contacto1_direccion, 38, 523, 9);

  // 4. Ciudad: x: 188, y: 523, size: 9
  drawText(formData.contacto1_ciudad, 188, 523, 9);

  // 5. Teléfono celular: x: 188, y: 500, size: 9
  drawText(formData.contacto1_tel_celular, 188, 500, 9);

  // 6. Opción preferida de contacto: Fija "Celular" en x: 522.5, y: 486.5
  drawX(522.5, 486.5);

  // -------------------------------------------------------------
  // C. CONTACTO SECUNDARIO (Padre/Madre o Tutor Legal)
  // -------------------------------------------------------------
  // 1. Nombre: x: 38, y: 438, size: 9
  drawText(formData.contacto2_nombre, 38, 438, 9);

  // 2. Correo electrónico: x: 308, y: 438, size: 9
  drawText(formData.contacto2_email, 308, 438, 9);

  // 3. Dirección postal: x: 38, y: 414, size: 9
  drawText(formData.contacto2_direccion, 38, 414, 9);

  // 4. Ciudad: x: 188, y: 414, size: 9
  drawText(formData.contacto2_ciudad, 188, 414, 9);

  // 5. Teléfono celular: x: 188, y: 391, size: 9
  drawText(formData.contacto2_tel_celular, 188, 391, 9);

  // 6. Opción preferida de contacto: Fija "Celular" en x: 522.5, y: 376.5
  drawX(522.5, 376.5);

  // -------------------------------------------------------------
  // D. FIRMAS Y FECHAS (CENTRADO EN EL RECUADRO DE FIRMA)
  // -------------------------------------------------------------
  // El recuadro del campo de firma se extiende desde x: 36.5 con un ancho de 410pt (centro: 241.5)
  const fieldX = 36.5;
  const fieldWidth = 410;
  const fieldCenter = fieldX + fieldWidth / 2; // 241.5
  const maxSigWidth = 220;
  const maxSigHeight = 22;

  // 1. Firma Alumno (Centrada en el campo)
  if (signatureAlumnoDataUrl) {
    const pngAlumno = await pdfDoc.embedPng(signatureAlumnoDataUrl);
    const aspect = pngAlumno.width / pngAlumno.height;
    let drawW = maxSigWidth;
    let drawH = drawW / aspect;
    if (drawH > maxSigHeight) {
      drawH = maxSigHeight;
      drawW = drawH * aspect;
    }
    const drawXPos = fieldCenter - drawW / 2;
    const drawYPos = 326 + (maxSigHeight - drawH) / 2;

    firstPage.drawImage(pngAlumno, {
      x: drawXPos,
      y: drawYPos,
      width: drawW,
      height: drawH,
    });
  }

  // Fecha actual en tiempo real en formato DD/MM/AAAA
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const currentDateStr = `${dd}/${mm}/${yyyy}`;

  // 2. Fecha Firma Alumno: x: 452, y: 328, size: 9
  drawText(currentDateStr, 452, 328, 9);

  // 3. Firma Tutor (Centrada en el campo)
  if (signatureTutorDataUrl) {
    const pngTutor = await pdfDoc.embedPng(signatureTutorDataUrl);
    const aspect = pngTutor.width / pngTutor.height;
    let drawW = maxSigWidth;
    let drawH = drawW / aspect;
    if (drawH > maxSigHeight) {
      drawH = maxSigHeight;
      drawW = drawH * aspect;
    }
    const drawXPos = fieldCenter - drawW / 2;
    const drawYPos = 302 + (maxSigHeight - drawH) / 2;

    firstPage.drawImage(pngTutor, {
      x: drawXPos,
      y: drawYPos,
      width: drawW,
      height: drawH,
    });
  }

  // 4. Fecha Firma Tutor: x: 452, y: 304, size: 9
  drawText(currentDateStr, 452, 304, 9);

  // Aplanar el formulario para que el PDF sea estático y no muestre cajas de edición interactivas
  try {
    const form = pdfDoc.getForm();
    form.flatten();
  } catch (err) {
    // Si la plantilla no tuviera campos de formulario interactivos o ya estuviera plana
  }

  // 5. Guardar los bytes generados y activar descarga
  const pdfBytes = await pdfDoc.save();

  // Generar nombre de archivo descriptivo: Ficha_Seminario_[Nombre_del_Alumno].pdf
  const rawName = formData.alumno_nombre_completo || 'Alumno';
  const sanitizedName = rawName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina tildes para compatibilidad de archivo
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .trim()
    .replace(/\s+/g, '_') || 'Alumno';

  const filename = `Ficha_Seminario_${sanitizedName}.pdf`;

  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 2000);
};
