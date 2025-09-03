import { response, request } from "express";
import { Usuario } from "../usuarios/usuarios.model.js";
import { Notificacion } from "./notifications.model.js";
import fetch from "node-fetch";
import { Cita } from "../citas/citas.model.js";
import { Servicio } from "../servicios/servicios.model.js";
import { Barbero } from "../barberos/barberos.model.js";
import { Cliente } from "../clientes/clientes.model.js";
import { UsuarioToken } from "./usuarios_tokens.model.js";

class NotificationsController {
    async saveToken(req = request, res = response) {
        try {
            const userId = req.user.id;
            const { token, dispositivo, sistemaOperativo } = req.body;
            
            if (!token) {
                return res.status(400).json({ 
                    success: false, 
                    message: "El token es requerido" 
                });
            }

            const usuario = await Usuario.findByPk(userId);
            if (!usuario) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Usuario no encontrado" 
                });
            }

            const [usuarioToken, created] = await UsuarioToken.findOrCreate({
                where: { usuarioID: userId, token },
                defaults: { dispositivo, sistemaOperativo }
            });

            if (!created) {
                await usuarioToken.update({ dispositivo, sistemaOperativo });
            }

            return res.json({ 
                success: true, 
                message: "Token guardado correctamente", 
                data: { userId, token } 
            });
        } catch (error) {
            console.error("Error guardando token:", error);
            return res.status(500).json({ 
                success: false, 
                message: "Error en el servidor", 
                error: process.env.NODE_ENV === "development" ? error.message : null 
            });
        }
    }

    async createNotification(req = request, res = response) {
        try {
            const { usuarioID, titulo, cuerpo, tipo, relacionId } = req.body;
            
            // Validar que el usuario existe
            const usuario = await Usuario.findByPk(usuarioID);
            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: "Usuario no encontrado"
                });
            }

            const notificacion = await Notificacion.create({
                usuarioID,
                titulo,
                cuerpo,
                tipo: tipo || "sistema",
                relacionId: relacionId || null,
                leido: false
            });

            // 👇 Nuevo: emitir evento socket
const io = req.app.get("io");
io.emit("newNotification", {
    usuarioID,
    titulo,
    cuerpo,
    notificacion
});


            return res.status(201).json({
                success: true,
                message: "Notificación creada exitosamente",
                data: notificacion
            });
        } catch (error) {
            console.error("Error creando notificación:", error);
            return res.status(500).json({
                success: false,
                message: "Error al crear notificación",
                error: process.env.NODE_ENV === "development" ? error.message : null
            });
        }
    }

async createAppointmentNotification(citaId, tipo, options = {}) {
    try {
        console.log("🔔 CREANDO NOTIFICACIÓN - Cita ID:", citaId, "Tipo:", tipo, "Destinatario:", options.destinatario);
        
        const cita = await Cita.findByPk(citaId, {
            include: [
                { 
                    model: Servicio, 
                    as: "servicio" 
                },
                { 
                    model: Barbero, 
                    as: "barbero",
                    include: [{ 
                        model: Usuario, 
                        as: "usuario",
                        attributes: ['id', 'email'] // Especificar campos necesarios
                    }] 
                },
                { 
                    model: Cliente, 
                    as: "cliente",
                    include: [{
                        model: Usuario,
                        as: "usuario",
                        attributes: ['id', 'email']
                    }]
                }
            ],
            transaction: options.transaction
        });

        if (!cita) {
            console.error("❌ Cita no encontrada");
            return null;
        }

        // Determinar el usuario destinatario según el rol
        let usuarioId = null;
        let titulo, cuerpo;

        const fechaFormateada = new Date(cita.fecha).toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long"
        });
        
        const horaFormateada = cita.hora.substring(0, 5);
        const clienteNombre = cita.cliente?.nombre || cita.pacienteTemporalNombre || "un cliente";
        const barberoNombre = cita.barbero?.nombre || "un barbero";

        switch (options.destinatario) {
            case "barbero":
                // CORRECCIÓN: Verificar correctamente la estructura del barbero
                if (!cita.barbero || !cita.barbero.usuarioID) {
                    console.log("❌ Barbero no tiene usuario asociado o no se cargó correctamente");
                    return null;
                }
                
                // Buscar el usuario del barbero directamente por ID
                const usuarioBarbero = await Usuario.findByPk(cita.barbero.usuarioID, {
                    transaction: options.transaction
                });
                
                if (!usuarioBarbero) {
                    console.log("❌ Usuario del barbero no encontrado");
                    return null;
                }
                
                usuarioId = usuarioBarbero.id;
                
                if (tipo === "creacion") {
                    titulo = "📅 Nueva cita agendada";
                    cuerpo = `El cliente ${clienteNombre} ha agendado una cita para el ${fechaFormateada} a las ${horaFormateada}`;
                } else if (tipo === "cancelacion") {
                    titulo = "❌ Cita cancelada";
                    cuerpo = `La cita del ${fechaFormateada} a las ${horaFormateada} ha sido cancelada`;
                }
                break;

            case "admin":
                // Buscar todos los administradores
                const administradores = await Usuario.findAll({
                    include: [{
                        model: Rol,
                        as: "rol",
                        where: { nombre: "Administrador" }
                    }],
                    attributes: ['id'],
                    transaction: options.transaction
                });
                
                // Crear notificación para cada administrador
                for (const admin of administradores) {
                    await this._createSingleNotification({
                        usuarioId: admin.id,
                        citaId,
                        tipo,
                        fechaFormateada,
                        horaFormateada,
                        clienteNombre,
                        barberoNombre,
                        options
                    });
                }
                return administradores.length > 0 ? { multiple: true } : null;

            case "cliente":
                if (!cita.cliente || !cita.cliente.usuarioID) {
                    console.log("❌ Cliente no tiene usuario asociado");
                    return null;
                }
                
                // Buscar el usuario del cliente directamente por ID
                const usuarioCliente = await Usuario.findByPk(cita.cliente.usuarioID, {
                    transaction: options.transaction
                });
                
                if (!usuarioCliente) {
                    console.log("❌ Usuario del cliente no encontrado");
                    return null;
                }
                
                usuarioId = usuarioCliente.id;
                
                if (tipo === "creacion") {
                    titulo = "📅 Cita confirmada";
                    cuerpo = `Tu cita con ${barberoNombre} ha sido agendada para el ${fechaFormateada} a las ${horaFormateada}`;
                } else if (tipo === "cancelacion") {
                    titulo = "❌ Cita cancelada";
                    cuerpo = `Tu cita del ${fechaFormateada} a las ${horaFormateada} ha sido cancelada`;
                }
                break;

            default:
                console.error("❌ Tipo de destinatario no válido:", options.destinatario);
                return null;
        }

        // Para destinatarios individuales (no administradores)
        if (usuarioId) {
            return await this._createSingleNotification({
                usuarioId,
                citaId,
                tipo,
                fechaFormateada,
                horaFormateada,
                clienteNombre,
                barberoNombre,
                titulo,
                cuerpo,
                options
            });
        }

        return null;
    } catch (error) {
        console.error("❌ Error en createAppointmentNotification:", error);
        throw error;
    }
}

// Nueva función helper para crear notificaciones individuales
async _createSingleNotification({
    usuarioId,
    citaId,
    tipo,
    fechaFormateada,
    horaFormateada,
    clienteNombre,
    barberoNombre,
    titulo,
    cuerpo,
    options
}) {
    // Generar título y cuerpo si no se proporcionaron
    if (!titulo || !cuerpo) {
        if (tipo === "creacion") {
            titulo = "📅 Nueva cita agendada";
            cuerpo = `Cita agendada para el ${fechaFormateada} a las ${horaFormateada}`;
        } else if (tipo === "cancelacion") {
            titulo = "❌ Cita cancelada";
            cuerpo = `Cita del ${fechaFormateada} a las ${horaFormateada} cancelada`;
        }
    }

    // Verificar si ya existe una notificación similar (pero permitir múltiples para diferentes eventos)
    const notificacionExistente = await Notificacion.findOne({
        where: {
            usuarioID: usuarioId,
            relacionId: citaId,
            tipo: "cita",
            titulo: titulo // Solo prevenir duplicados exactos
        },
        transaction: options.transaction
    });

    if (notificacionExistente) {
        console.log("⚠️ Notificación similar ya existe, evitando duplicado");
        return notificacionExistente;
    }

    console.log("📝 Creando notificación para usuario:", usuarioId);

    const notificacion = await Notificacion.create({
        usuarioID: usuarioId,
        titulo,
        cuerpo,
        tipo: "cita",
        relacionId: citaId,
        leido: false
    }, { transaction: options.transaction });

    // Emitir evento de socket si está disponible
    if (options.io) {
        options.io.emit("newNotification", {
            usuarioID: usuarioId,
            titulo,
            cuerpo,
            notificacion
        });
        console.log("📡 Evento de socket emitido para usuario:", usuarioId);
    }

    // Enviar push notification si existe token
    try {
        const usuario = await Usuario.findByPk(usuarioId);
        if (usuario?.expo_push_token) {
            console.log("📱 Enviando push notification a usuario:", usuarioId);
            await this.sendPushNotification({
                userId: usuario.id,
                titulo,
                cuerpo,
                data: {
                    type: "cita",
                    citaId: citaId,
                    notificacionId: notificacion.id,
                    screen: "DetalleCita"
                }
            });
        }
    } catch (pushError) {
        console.error("❌ Error enviando push notification:", pushError);
    }

    return notificacion;
}

    async sendPushNotification({ userId, titulo, cuerpo, data = {} }) {
        try {
            const tokens = await UsuarioToken.findAll({
                where: { usuarioID: userId }
            });

            if (!tokens.length) {
                console.log(`Usuario ${userId} no tiene tokens registrados`);
                return { 
                    success: false, 
                    message: "Usuario sin tokens registrados" 
                };
            }

            const messages = tokens.map(t => ({
                to: t.token,
                sound: "default",
                title: titulo,
                body: cuerpo,
                data: { ...data },
                channelId: "default"
            }));

            const response = await fetch("https://exp.host/--/api/v2/push/send", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Accept-encoding": "gzip, deflate",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(messages)
            });

            const result = await response.json();
            return { success: true, data: result };
        } catch (error) {
            console.error("Error enviando notificación push:", error);
            return { success: false, error: error.message };
        }
    }

    async getUserNotifications(req = request, res = response) {
        try {
            const userId = req.user.id;
            
            if (!userId) {
                return res.status(400).json({ 
                    success: false, 
                    message: "ID de usuario no proporcionado en el token" 
                });
            }

            const notifications = await Notificacion.findAll({
                where: { usuarioID: userId },
                order: [["createdAt", "DESC"]],
                limit: 50
            });

            const unreadCount = await Notificacion.count({
                where: { 
                    usuarioID: userId, 
                    leido: false 
                }
            });

            return res.json({ 
                success: true, 
                data: { notifications, unreadCount } 
            });
        } catch (error) {
            console.error("Error obteniendo notificaciones:", error);
            return res.status(500).json({ 
                success: false, 
                message: "Error al obtener notificaciones", 
                error: process.env.NODE_ENV === "development" ? error.message : null 
            });
        }
    }

    async getUnreadCount(req = request, res = response) {
        try {
            const userId = req.user.id;
            const count = await Notificacion.count({
                where: { 
                    usuarioID: userId, 
                    leido: false 
                }
            });

            return res.json({ 
                success: true, 
                count 
            });
        } catch (error) {
            console.error("Error getting unread count:", error);
            return res.status(500).json({ 
                success: false, 
                message: "Error al obtener conteo de no leídas" 
            });
        }
    }

    async markAllAsRead(req = request, res = response) {
        try {
            const userId = req.user.id;
            
            await Notificacion.update(
                { leido: true },
                { 
                    where: { 
                        usuarioID: userId, 
                        leido: false 
                    } 
                }
            );

            return res.json({ 
                success: true, 
                message: "Notificaciones marcadas como leídas" 
            });
        } catch (error) {
            console.error("Error marking notifications as read:", error);
            return res.status(500).json({ 
                success: false, 
                message: "Error al marcar notificaciones como leídas" 
            });
        }
    }

    async sendTestNotification(req = request, res = response) {
        try {
            const { userId, title, body } = req.body;
            
            if (!userId || !title || !body) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Se requieren userId, title y body" 
                });
            }

            const usuario = await Usuario.findByPk(userId);
            
            if (!usuario) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Usuario no encontrado" 
                });
            }

            const result = await this.sendPushNotification({
                userId,
                titulo: title,
                cuerpo: body,
                data: { 
                    type: "test", 
                    screen: "Home" 
                }
            });

            if (!result.success) {
                return res.status(500).json(result);
            }

            return res.json({ 
                success: true, 
                message: "Notificación de prueba enviada", 
                data: result.data 
            });
        } catch (error) {
            console.error("Error sending test notification:", error);
            return res.status(500).json({ 
                success: false, 
                message: "Error al enviar notificación de prueba", 
                error: error.message 
            });
        }
    }
}

export default new NotificationsController();