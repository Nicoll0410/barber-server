import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

class Correos {
    confirmarIdentidad({ codigo, email }) {
        const url = `${process.env.FRONTEND_URL}/home?modal=verify_email&email=${email}`

        return `
        <div style="font-family: 'Nunito', Arial, sans-serif; width: 100%; padding: 40px 0; margin: 0 auto; background-color: #f4f4f4; padding: 40px 0;">
            <table class="email-container" cellpadding="0" cellspacing="0" border="0" align="center" style="width: 100%; max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 32px 24px; border-radius: 8px">
                <tr>
                    <td class="logo" style="text-align: center; padding: 20px;">
                        <img src="https://i.postimg.cc/L54TXQw4/new-York-Barber.jpg" alt="Logo" width="200">
                    </td>
                </tr>
                <tr>
                    <td class="content" style="padding: 20px;">
                        <h2 style="font-size: 24px; margin: 0 0 10px;">Confirmación de Identidad</h2>
                        <p style="line-height: 1.6; margin: 10px 0;">Hola,</p>
                        <p style="line-height: 1.6; margin: 10px 0;">Gracias por registrarte en nuestra aplicación. Para completar el proceso de registro, por favor utiliza el siguiente código de verificación en nuestra app:</p>
                        <div class="verification-code" style="text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold; color: #333333;">
                            ${codigo}
                        </div>
                        <p style="line-height: 1.6; margin: 10px 0;">Si te has perdido, también puedes validar tu cuenta haciendo clic en el siguiente enlace:</p>
                        <a href="${url}" style="color: #000; text-decoration: none;">Verificar cuenta</a>
                        <p style="line-height: 1.6; margin: 10px 0;">Gracias,<br>El equipo de New York Barber</p>
                    </td>
                </tr>
            </table>
        </div>               
        `
    }
    recuperarPassword({ codigo, email }) {
        const url = `${process.env.FRONTEND_URL}/auth/verify-recover-password?email=${email}&codigo=${codigo}`

        return `
        <div style="font-family: 'Nunito', Arial, sans-serif; width: 100%; padding: 40px 0; margin: 0 auto; background-color: #f4f4f4; padding: 40px 0;">
            <table class="email-container" cellpadding="0" cellspacing="0" border="0" align="center" style="width: 100%; max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 32px 24px; border-radius: 8px">
                <tr>
                    <td class="logo" style="text-align: center; padding: 20px;">
                        <img src="https://i.postimg.cc/L54TXQw4/new-York-Barber.jpg" alt="Logo" width="200">
                    </td>
                </tr>
                <tr>
                    <td class="content" style="padding: 20px;">
                        <h2 style="font-size: 24px; margin: 0 0 10px;">Recuperación de contraseña</h2>
                        <p style="line-height: 1.6; margin: 10px 0;">Hola,</p>
                        <p style="line-height: 1.6; margin: 10px 0;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Si no has realizado esta solicitud, puedes ignorar este correo electrónico</p>
                        <p style="line-height: 1.6; margin: 10px 0;">Para restablecer tu contraseña, utiliza el siguiente código en nuestra app:</p>
                        <div class="verification-code" style="text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold; color: #333333;">
                            ${codigo}
                        </div>
                        
                        <p style="line-height: 1.6; margin: 10px 0;">Gracias,<br>El equipo de New York Barber</p>
                    </td>
                </tr>
            </table>
        </div>               
        `
    }

    envioCredenciales({ codigo, email, password }) {
        const url = `${process.env.FRONTEND_URL}/auth/verify-account?email=${email}&codigo=${codigo}`
        return `
        <div style="font-family: 'Nunito', Arial, sans-serif; width: 100%; padding: 40px 0; margin: 0 auto; background-color: #f4f4f4;">
            <table class="email-container" cellpadding="0" cellspacing="0" border="0" align="center" style="width: 100%; max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 32px 24px; border-radius: 8px">
                <tr>
                    <td class="logo" style="text-align: center; padding: 20px;">
                        <img src="https://i.postimg.cc/L54TXQw4/new-York-Barber.jpg" alt="Logo" width="200">
                    </td>
                </tr>
                <tr>
                    <td class="content" style="padding: 20px;">
                        <h2 style="font-size: 24px; margin: 0 0 10px;">Confirmación de Identidad</h2>
                        <p style="line-height: 1.6; margin: 10px 0;">Hola,</p>
                        <p style="line-height: 1.6; margin: 10px 0;">Un administrador ha creado una cuenta para ti en nuestra aplicación. Para completar el proceso de registro y activar tu cuenta, por favor ve al siguiente enlace:</p>
                        <p style="text-align: center;">
                            <a href="${url}" style="text-decoration: none; padding: 10px 16px;font-size: .9rem; cursor: pointer; border-radius: 8px; align-items: center; gap: 8px; justify-content: center;  background-color: #000;color: #FDFDFD;">Verificar cuenta</a>
                        </p>
                        
                        
                        <p style="line-height: 1.6; margin: 10px 0;">Tu código de verificación de cuenta es:</p>
                        <div class="verification-code" style="text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold; color: #333333;">${codigo} </div>
                        
                        <p style="line-height: 1.6; margin: 10px 0;">Una vez que hayas confirmado tu identidad, podrás iniciar sesión con las siguientes credenciales:</p>
                        <p style="line-height: 1.6; margin: 10px 0;">
                            <strong>Email:</strong> ${email}<br>
                            <strong>Contraseña:</strong> ${password}
                        </p>
                        <p style="line-height: 1.6; margin: 10px 0"><strong>Por seguridad, te recomendamos que cambies tu contraseña después de iniciar sesión.</strong></p>
                        <p style="line-height: 1.6; margin: 10px 0;">Gracias,<br>El equipo de New York Barber</p>
                    </td>
                </tr>
            </table>
        </div>
        `
    }

    citaCancelada({ fecha, hora, razon }) {
        const fechaFormateada = format(parseISO(fecha), "d 'de' MMMM 'de' yyyy", { locale: es });
        const horaFormateada = format(parseISO(`1970-01-01T${hora}`), 'hh:mm a', { locale: es });

        return `
        <div style="font-family: 'Nunito', Arial, sans-serif; width: 100%; padding: 40px 0; margin: 0 auto; background-color: #f4f4f4;">
            <table class="email-container" cellpadding="0" cellspacing="0" border="0" align="center" style="width: 100%; max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 32px 24px; border-radius: 8px">
                <tr>
                    <td class="logo" style="text-align: center; padding: 20px;">
                        <img src="https://i.postimg.cc/L54TXQw4/new-York-Barber.jpg" alt="Logo" width="200">
                    </td>
                </tr>
                <tr>
                    <td class="content" style="padding: 20px;">
                        <h2 style="font-size: 24px; margin: 0 0 10px;">Cita Cancelada</h2>
                        <p style="line-height: 1.6; margin: 10px 0;">Hola,</p>
                        <p style="line-height: 1.6; margin: 10px 0;">Tu cita agendada para el ${fechaFormateada} a las ${horaFormateada} ha sido cancelada.</p>
                        <p style="line-height: 1.6; margin: 10px 0;">Razón: ${razon}</p>
                        <p style="line-height: 1.6; margin: 10px 0;">Si tienes dudas o comentarios, puedes contactarnos a través de este correo electrónico.</p>
                        <p style="line-height: 1.6; margin: 10px 0;">Gracias,<br>El equipo de New York Barber</p>
                    </td>
                </tr>
            </table>
        </div>               
        `;
    }
}

export const correos = new Correos()