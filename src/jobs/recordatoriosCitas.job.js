import { Op } from "sequelize";
import { format, addMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { Cita } from "../modules/citas/citas.model.js";
import { Barbero } from "../modules/barberos/barberos.model.js";
import { Cliente } from "../modules/clientes/clientes.model.js";
import { Servicio } from "../modules/servicios/servicios.model.js";
import { Usuario } from "../modules/usuarios/usuarios.model.js";
import { sendEmail } from "../utils/send-email.util.js";
import { correos } from "../utils/correos.util.js";
import cron from "node-cron";

export class RecordatoriosCitasJob {
    static iniciar() {
        // Job que se ejecuta cada 5 minutos
        cron.schedule('*/5 * * * *', async () => {
            try {
                console.log('🔄 Ejecutando job de recordatorios de citas...');
                
                const ahora = new Date();
                const mediaHoraDespues = addMinutes(ahora, 30);
                
                console.log('⏰ Hora actual:', ahora.toLocaleString('es-ES'));
                console.log('⏰ Recordatorio para:', mediaHoraDespues.toLocaleString('es-ES'));

                // Buscar citas confirmadas que empiecen en 30 minutos y no tengan recordatorio enviado
                const citas = await Cita.findAll({
                    where: {
                        estado: "Confirmada",
                        recordatorio_enviado: false,
                        fecha: format(ahora, 'yyyy-MM-dd'),
                        hora: {
                            [Op.between]: [
                                format(ahora, 'HH:mm:ss'),
                                format(mediaHoraDespues, 'HH:mm:ss')
                            ]
                        }
                    },
                    include: [
                        {
                            model: Cliente,
                            as: "cliente",
                            attributes: ["id", "nombre", "telefono"],
                            include: [{
                                model: Usuario,
                                attributes: ["id", "email", "estaVerificado"]
                            }]
                        },
                        {
                            model: Barbero,
                            as: "barbero",
                            attributes: ["id", "nombre"],
                            include: [{
                                model: Usuario,
                                attributes: ["id", "email", "estaVerificado"]
                            }]
                        },
                        {
                            model: Servicio,
                            as: "servicio",
                            attributes: ["id", "nombre", "duracionMaxima"]
                        }
                    ]
                });

                console.log(`📋 ${citas.length} citas encontradas para recordatorio`);

                for (const cita of citas) {
                    try {
                        // Verificar que tanto el cliente como el barbero tengan email
                        const emailCliente = cita.cliente?.usuario?.email;
                        const emailBarbero = cita.barbero?.usuario?.email;

                        if (!emailCliente && !emailBarbero) {
                            console.log(`⚠️ Cita ${cita.id} sin emails válidos, saltando...`);
                            continue;
                        }

                        const fechaHoraCita = new Date(`${cita.fecha}T${cita.hora}`);
                        const fechaFormateada = format(fechaHoraCita, "d 'de' MMMM 'de' yyyy", { locale: es });
                        const horaFormateada = format(fechaHoraCita, "hh:mm a", { locale: es });

                        // Enviar recordatorio al cliente si tiene email
                        if (emailCliente && cita.cliente.usuario.estaVerificado) {
                            const emailContent = correos.recordatorioCitaCliente({
                                cliente_nombre: cita.cliente.nombre,
                                servicio_nombre: cita.servicio.nombre,
                                barbero_nombre: cita.barbero.nombre,
                                fecha: fechaFormateada,
                                hora: horaFormateada,
                                direccion: cita.direccion,
                                duracion: cita.servicio.duracionMaxima
                            });

                            await sendEmail({
                                to: emailCliente,
                                subject: 'Recordatorio de cita - NY Barber',
                                html: emailContent
                            });

                            console.log(`📧 Recordatorio enviado al cliente: ${emailCliente}`);
                        }

                        // Enviar recordatorio al barbero si tiene email
                        if (emailBarbero && cita.barbero.usuario.estaVerificado) {
                            const emailContent = correos.recordatorioCitaBarbero({
                                barbero_nombre: cita.barbero.nombre,
                                cliente_nombre: cita.cliente.nombre,
                                servicio_nombre: cita.servicio.nombre,
                                fecha: fechaFormateada,
                                hora: horaFormateada,
                                telefono_cliente: cita.cliente.telefono,
                                duracion: cita.servicio.duracionMaxima
                            });

                            await sendEmail({
                                to: emailBarbero,
                                subject: 'Recordatorio de cita - NY Barber',
                                html: emailContent
                            });

                            console.log(`📧 Recordatorio enviado al barbero: ${emailBarbero}`);
                        }

                        // Marcar como recordatorio enviado
                        await cita.update({ recordatorio_enviado: true });
                        console.log(`✅ Recordatorio procesado para cita ${cita.id}`);

                    } catch (error) {
                        console.error(`❌ Error procesando cita ${cita.id}:`, error);
                    }
                }

                console.log('✅ Proceso de recordatorios completado');
            } catch (error) {
                console.error('❌ Error en job de recordatorios:', error);
            }
        });

        console.log('✅ Job de recordatorios de citas programado (cada 5 minutos)');
    }
}

export default RecordatoriosCitasJob;