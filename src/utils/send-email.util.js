import nodemailer from "nodemailer";
import "dotenv/config.js";

// Configuración optimizada para mejor deliverability
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587, // Cambiar a 587
    secure: process.env.EMAIL_SECURE === "true", // false para puerto 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Configuraciones críticas para mejorar entrega
    tls: {
      rejectUnauthorized: false // Para evitar problemas de certificado
    },
    connectionTimeout: 10000, // 10 segundos timeout
    greetingTimeout: 10000,
    socketTimeout: 10000,
    // Pooling para conexiones persistentes
    pool: true,
    maxConnections: 5,
    maxMessages: 100
  });
};

// Verificar conexión SMTP al iniciar
const verifySMTP = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("✅ SMTP configurado correctamente");
    return true;
  } catch (error) {
    console.error("❌ Error SMTP:", error);
    return false;
  }
};

// Función mejorada con reintentos y timeout
export async function sendEmail({ to, subject, text, html }, retries = 3) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"NY Barber" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
      // Headers importantes para deliverability
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'NodeMailer',
        'List-Unsubscribe': '<mailto:${process.env.EMAIL_USER}?subject=Unsubscribe>'
      }
    };

    // Timeout para evitar que se quede colgado
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout sending email')), 15000);
    });

    const info = await Promise.race([sendPromise, timeoutPromise]);
    
    console.log("✅ Correo enviado a:", to);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error("❌ Error enviando email:", error);
    
    // Reintento automático en caso de error de conexión
    if (retries > 0 && (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT')) {
      console.log(`🔄 Reintentando (${retries} intentos restantes)...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return sendEmail({ to, subject, text, html }, retries - 1);
    }
    
    return { success: false, error: error.message };
  }
}

// Verificar la conexión al iniciar
verifySMTP();