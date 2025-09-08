import nodemailer from "nodemailer";
import "dotenv/config.js";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === "true", // SSL 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // NUEVO: Agregar estas opciones para mejor rendimiento
  connectionTimeout: 30000, // 30 segundos máximo para conectar
  socketTimeout: 30000, // 30 segundos máximo por operación
  greetingTimeout: 30000, // 30 segundos máximo para saludo SMTP
  pool: true, // Usar conexiones persistentes
  maxConnections: 5, // Máximo 5 conexiones simultáneas
  maxMessages: 100, // Máximo 100 emails por conexión
});

transporter.verify((err) => {
  if (err) {
    console.error("❌  Error SMTP:", err);
  } else {
    console.log("📧  SMTP listo para enviar correos");
  }
});

// FUNCIÓN MEJORADA con reintentos PERO que mantiene compatibilidad
export async function sendEmail({ to, subject, text, html }, options = {}) {
  const { maxRetries = 3, retryDelay = 2000 } = options;
  const mailOptions = {
    from: `"NY Barber" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  // Intentar enviar con reintentos
  for (let intento = 1; intento <= maxRetries; intento++) {
    try {
      await transporter.sendMail(mailOptions);
      console.log("✅ Correo enviado a:", to);
      return { success: true, attempt: intento };
    } catch (error) {
      console.error(`❌ Intento ${intento} fallido para ${to}:`, error.message);
      
      // Si es el último intento, devolver error
      if (intento === maxRetries) {
        return { 
          success: false, 
          error: error.message,
          attempt: intento
        };
      }
      
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

// NUEVA: Función para enviar inmediatamente (para reenvíos)
export async function sendEmailImmediate({ to, subject, text, html }) {
  return sendEmail({ to, subject, text, html }, { maxRetries: 1 });
}

// NUEVA: Función para enviar con cola (para nuevos registros)
export async function sendEmailQueued({ to, subject, text, html }) {
  // Aquí iría la lógica de cola si decides implementarla después
  return sendEmail({ to, subject, text, html }, { maxRetries: 3 });
}
