import nodemailer from "nodemailer";
import "dotenv/config.js";

// ✅ CORRECTO: createTransport (SIN la 'e' final)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: "false",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // ✅ AGREGAR ESTAS CONFIGURACIONES CRÍTICAS:
  connectionTimeout: 30000, // 30 segundos
  greetingTimeout: 30000,
  socketTimeout: 30000,
  dnsTimeout: 10000,
  pool: true, // Usar pool de conexiones
  maxConnections: 3,
  maxMessages: 100,
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  }
});

// Verificar conexión al iniciar
transporter.verify(function (error, success) {
  if (error) {
    console.error("❌ Error SMTP:", error);
  } else {
    console.log("✅ SMTP listo para enviar correos");
  }
});

// Función simplificada y funcional
export async function sendEmail({ to, subject, text, html }) {
  const maxRetries = 2; // Solo 2 reintentos
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const mailOptions = {
        from: `"NY Barber" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text: text || html?.replace(/<[^>]*>/g, '') || "",
        html,
        headers: {
          'X-Priority': '3',
          'X-Mailer': 'NodeMailer'
        },
        timeout: 30000 // Timeout por envío
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("✅ Correo enviado a:", to);
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      console.error(`❌ Intento ${attempt} - Error email:`, error.message);
      
      // Solo reintentar por errores de conexión
      if ((error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') && attempt < maxRetries) {
        const delay = attempt * 3000; // 3s, 6s
        console.log(`⏳ Reintentando en ${delay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return { success: false, error: error.message };
    }
  }
}