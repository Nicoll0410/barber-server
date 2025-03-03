import { response, request } from "express"
import { Cita } from "./citas.model.js"
import { Servicio } from "../servicios/servicios.model.js"
import { ServiciosPorInsumos } from "../servicios/servicios_insumos.model.js"
import { Barbero } from "../barberos/barberos.model.js"
import { Cliente } from "../clientes/clientes.model.js"
import { Usuario } from "../usuarios/usuarios.model.js"
import { Rol } from "../roles/roles.model.js"
import { filtros } from "../../utils/filtros.util.js"
import { BOOLEAN, literal, Op } from "sequelize"
import { add, addHours, isSaturday, isSunday, isToday, parse, parseISO } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import { format } from "mysql2"
import { correos } from "../../utils/correos.util.js"
import { sendEmail } from "../../utils/send-email.util.js"
import jwt from "jsonwebtoken"
import { Insumo } from "../insumos/insumos.model.js"

class CitasController {
    async get(req = request, res = response) {
        try {
            async function obtenerIdsRelacionados(Modelo, search) {
                const registros = await Modelo.findAll({
                    attributes: ["id"],
                    where: {
                        [Op.or]: [{
                            nombre: {
                                [Op.like]: `%${search}%`
                            }
                        }]
                    }
                });

                return registros.map(registro => registro["id"]);
            }

            // Obtener IDs de citas relacionadas desde los modelos Servicio, Cliente y Barbero
            const idsServicio = await obtenerIdsRelacionados(Servicio, req.query.search, 'id');
            const idsCliente = await obtenerIdsRelacionados(Cliente, req.query.search, 'id');
            const idsBarbero = await obtenerIdsRelacionados(Barbero, req.query.search, 'id');

            // Combinar todos los IDs obtenidos
            const allIds = Array.from(new Set([...idsServicio, ...idsCliente, ...idsBarbero]));

            // Obtener los filtros de la búsqueda en el modelo principal Cita
            const params = filtros.obtenerFiltros({
                busqueda: req.query.search,
                modelo: Cita,
                pagina: req.query.page
            });

            // Agregar los IDs obtenidos a las condiciones de búsqueda
            const whereConditions = params.where[Op.or];
            if (allIds.length > 0) {
                whereConditions.push({
                    [Op.or]: [
                        { servicioID: { [Op.in]: idsServicio } },
                        { pacienteID: { [Op.in]: idsCliente } },
                        { barberoID: { [Op.in]: idsBarbero } }
                    ]
                });
            }


            const citas = await Cita.findAll({
                ...params,
                order: [['fecha', 'DESC']],
                where: { [Op.or]: whereConditions },
                include: [
                    { model: Servicio, required: false, attributes: ["nombre", "descripcion", "duracionMaxima"] },
                    { model: Cliente, required: false, attributes: ["nombre", "avatar"] },
                    { model: Barbero, required: false, attributes: ["nombre", "avatar"] }
                ]
            });

            const total = await Cita.count({ ...params })

            return res.json({ citas, total })
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }
    async getAll(req = request, res = response) {
        try {
            async function obtenerIdsRelacionados(Modelo, search) {
                const registros = await Modelo.findAll({
                    attributes: ["id"],
                    where: {
                        [Op.or]: [{
                            nombre: {
                                [Op.like]: `%${search}%`
                            }
                        }]
                    }
                });

                return registros.map(registro => registro["id"]);
            }

            // Obtener IDs de citas relacionadas desde los modelos Servicio, Cliente y Barbero
            const idsServicio = await obtenerIdsRelacionados(Servicio, req.query.search, 'id');
            const idsCliente = await obtenerIdsRelacionados(Cliente, req.query.search, 'id');
            const idsBarbero = await obtenerIdsRelacionados(Barbero, req.query.search, 'id');

            // Combinar todos los IDs obtenidos
            const allIds = Array.from(new Set([...idsServicio, ...idsCliente, ...idsBarbero]));

            // Obtener los filtros de la búsqueda en el modelo principal Cita
            const params = filtros.obtenerFiltros({
                busqueda: req.query.search,
                modelo: Cita,
            });

            // Agregar los IDs obtenidos a las condiciones de búsqueda
            const whereConditions = params.where[Op.or];
            if (allIds.length > 0) {
                whereConditions.push({
                    [Op.or]: [
                        { servicioID: { [Op.in]: idsServicio } },
                        { pacienteID: { [Op.in]: idsCliente } },
                        { barberoID: { [Op.in]: idsBarbero } }
                    ]
                });
            }


            const citas = await Cita.findAll({
                ...params.where,
                order: [['fecha', 'DESC']],
                where: { [Op.or]: whereConditions },
                include: [
                    { model: Servicio, required: false, attributes: ["nombre", "descripcion", "duracionMaxima"] },
                    { model: Cliente, required: false, attributes: ["nombre", "avatar"] },
                    { model: Barbero, required: false, attributes: ["nombre", "avatar"] }
                ]
            });

            const total = await Cita.count({ ...params })

            return res.json({ citas, total })
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }


    async getByBarberID(req = request, res = response) {
        try {

            const authHeader = req.header("Authorization")

            if (!authHeader) throw new Error({ mensaje: "¡Ups! Parece que no tienes una sesión activa" })
            if (!authHeader.startsWith('Bearer ')) throw new Error({ mensaje: "Formato del token invalido" })
            const token = authHeader.split(' ')[1];

            const { email } = jwt.decode(token);

            const usuario = await Usuario.findOne({ where: { email } })
            const barbero = await Barbero.findOne({ where: { usuarioID: usuario.id } })

            async function obtenerIdsRelacionados(Modelo, search) {
                const registros = await Modelo.findAll({
                    attributes: ["id"],
                    where: {
                        [Op.or]: [{
                            nombre: {
                                [Op.like]: `%${search}%`
                            }
                        }]
                    }
                });

                return registros.map(registro => registro["id"]);
            }

            // Obtener IDs de citas relacionadas desde los modelos Servicio, Cliente y Barbero
            const idsServicio = await obtenerIdsRelacionados(Servicio, req.query.search, 'id');
            const idsCliente = await obtenerIdsRelacionados(Cliente, req.query.search, 'id');
            const idsBarbero = await obtenerIdsRelacionados(Barbero, req.query.search, 'id');

            // Combinar todos los IDs obtenidos
            const allIds = Array.from(new Set([...idsServicio, ...idsCliente, ...idsBarbero]));

            // Obtener los filtros de la búsqueda en el modelo principal Cita
            const params = filtros.obtenerFiltros({
                busqueda: req.query.search,
                modelo: Cita,
                pagina: req.query.page
            });

            // Agregar los IDs obtenidos a las condiciones de búsqueda
            const whereConditions = params.where[Op.or];
            if (allIds.length > 0) {
                whereConditions.push({
                    [Op.or]: [
                        { servicioID: { [Op.in]: idsServicio } },
                        { pacienteID: { [Op.in]: idsCliente } },
                        { barberoID: { [Op.in]: idsBarbero } }
                    ]
                });
            }


            const citas = await Cita.findAll({
                ...params,
                order: [['fecha', 'DESC']],
                where: { [Op.or]: whereConditions, barberoID: barbero.id },
                include: [
                    { model: Servicio, required: false, attributes: ["nombre", "descripcion", "duracionMaxima"] },
                    { model: Cliente, required: false, attributes: ["nombre", "avatar"] },
                    { model: Barbero, required: false, attributes: ["nombre", "avatar"] }
                ]
            });

            const total = await Cita.count({ ...params, where: { [Op.or]: whereConditions, barberoID: barbero.id }, })

            return res.json({ citas, total })
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }

    async getSells(req = request, res = response) {
        try {
            async function obtenerIdsRelacionados(Modelo, search) {
                const registros = await Modelo.findAll({
                    attributes: ["id"],
                    where: {
                        [Op.or]: [{
                            nombre: {
                                [Op.like]: `%${search}%`
                            }
                        }]
                    }
                });

                return registros.map(registro => registro["id"]);
            }

            const idsServicio = await obtenerIdsRelacionados(Servicio, req.query.search, 'id');
            const idsCliente = await obtenerIdsRelacionados(Cliente, req.query.search, 'id');
            const idsBarbero = await obtenerIdsRelacionados(Barbero, req.query.search, 'id');

            const allIds = Array.from(new Set([...idsServicio, ...idsCliente, ...idsBarbero]));

            const params = filtros.obtenerFiltros({
                busqueda: req.query.search,
                modelo: Cita,
                pagina: req.query.page
            });

            const whereConditions = params.where[Op.or];

            if (allIds.length > 0) {
                whereConditions.push({
                    [Op.or]: [
                        { servicioID: { [Op.in]: idsServicio } },
                        { pacienteID: { [Op.in]: idsCliente } },
                        { barberoID: { [Op.in]: idsBarbero } }
                    ]
                });
            }


            const citas = await Cita.findAll({
                ...params,
                order: [['fecha', 'DESC']],
                where: { [Op.or]: whereConditions, estado: "Completa" },
                include: [
                    { model: Servicio, required: false, attributes: ["nombre", "descripcion", "duracionMaxima", "precio"] },
                    { model: Cliente, required: false, attributes: ["nombre", "avatar"] },
                    { model: Barbero, required: false, attributes: ["nombre", "avatar"] }
                ]
            });

            const total = await Cita.count({ ...params, where: { [Op.or]: whereConditions, estado: "Completa" } })

            return res.json({ citas, total })
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }

    async getInformationToCreate(req = request, res = response) {
        try {

            const servicios = await Servicio.findAll()
            const barberos = await Barbero.findAll({
                include: {
                    model: Usuario,
                    required: true,
                    attributes: [],
                    where: { estaVerificado: true },
                    include: {
                        model: Rol,
                        where: { nombre: "Barbero" },
                        required: true,
                        attributes: [],
                    }

                }

            });

            const pacientes = await Cliente.findAll({
                include: [
                    {
                        model: Usuario,
                        where: { estaVerificado: true }
                    }
                ]
            })

            return res.status(201).json({
                mensaje: "Cita registrada correctamente",
                pacientes, barberos, servicios
            })

        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }

    async create(req = request, res = response) {
        try {
            const { duracionMaxima } = await Servicio.findByPk(req.body.servicioID, { attributes: ["duracionMaxima"] });
            let horaISO = addHours(parse(req.body.hora, 'h:mm a', new Date()), -5); // Hora colombiana


            if (process.env.ENVIRONMENT === "PROD") {
                horaISO = parse(req.body.hora, 'h:mm a', new Date())
            }


            const [hours, minutes, seconds] = duracionMaxima.split(':').map(Number);

            const horaFinSinFormatear = add(horaISO, { hours, minutes, seconds });

            const hora = new Date(format(horaISO, 'HH:mm:ss')).toISOString().split("T")[1].split(".")[0];
            const horaFin = new Date(format(horaFinSinFormatear, 'HH:mm:ss')).toISOString().split("T")[1].split(".")[0];

            const cita = await Cita.create({ ...req.body, hora, horaFin })

            return res.status(201).json({
                mensaje: "Cita registrada correctamente",
                cita
            });

        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }

    async createByPatient(req = request, res = response) {
        try {

            const authHeader = req.header("Authorization")

            if (!authHeader) throw new Error({ mensaje: "¡Ups! Parece que no tienes una sesión activa" })
            if (!authHeader.startsWith('Bearer ')) throw new Error({ mensaje: "Formato del token invalido" })
            const token = authHeader.split(' ')[1];

            const { email } = jwt.decode(token);

            const usuario = await Usuario.findOne({ where: { email } })
            const cliente = await Cliente.findOne({ where: { usuarioID: usuario.id } })



            const { duracionMaxima } = await Servicio.findByPk(req.body.servicioID, { attributes: ["duracionMaxima"] });

            let horaISO = addHours(parse(req.body.hora, 'h:mm a', new Date()), -5); // Hora colombiana


            if (process.env.ENVIRONMENT === "PROD") {
                horaISO = parse(req.body.hora, 'h:mm a', new Date())
            }


            const [hours, minutes, seconds] = duracionMaxima.split(':').map(Number);

            const horaFinSinFormatear = add(horaISO, { hours, minutes, seconds });

            const hora = new Date(format(horaISO, 'HH:mm:ss')).toISOString().split("T")[1].split(".")[0];
            const horaFin = new Date(format(horaFinSinFormatear, 'HH:mm:ss')).toISOString().split("T")[1].split(".")[0];

            const cita = await Cita.create({ ...req.body, pacienteID: cliente.id, hora, horaFin })

            return res.status(201).json({
                mensaje: "Cita registrada correctamente",
                cita
            });

        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }

    async update(req = request, res = response) {
        try {
            const citaExiste = await Cita.findByPk(req.params.id)
            if (!citaExiste) throw new Error("Ups, parece que no encontramos esta cita")

            const citaActualizada = await citaExiste.update(req.body)

            return res.json({
                mensaje: "Cita actualizada correctamente",
                citaActualizada
            })

        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }
    async delete(req = request, res = response) {
        try {

            const id = req.params.id
            const cita = await Cita.findByPk(id)
            if (!cita) throw new Error("Ups, parece que no encontramos esta cita")

            const citaEliminada = await cita.destroy({
                where: { id }
            })

            return res.json({
                mensaje: "Usuario eliminado correctamente",
                citaEliminada
            })
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }

    async getAvailabilityOfBarber(req = request, res = response) {
        try {
            const { servicioID, barberoID, fecha } = req.query;

            const fechaParsed = parseISO(fecha);
            if (isSaturday(fechaParsed) || isSunday(fechaParsed)) {
                return res.json([]);
            }

            const servicio = await Servicio.findOne({
                where: { id: servicioID },
                attributes: ["duracionMaxima"]
            });

            if (!servicio) {
                throw new Error("Servicio no encontrado");
            }

            const citasDelBarbero = await Cita.findAll({
                where: { barberoID, fecha },
                attributes: ["hora", "horaFin"]
            });

            const duracionMaxima = convertirDuracionAHoras(servicio.duracionMaxima);

            const citas = citasDelBarbero.map(({ hora, horaFin }) => ({
                horaInicial: convertirHoraAFraccion(hora),
                horaFinal: convertirHoraAFraccion(horaFin)
            }));

            const horasDisponibles = calcularHorasDisponibles(citas, duracionMaxima, fecha);

            return res.json(horasDisponibles);
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            });
        }
    }

    async confirmDate(req = request, res = response) {
        try {
            const { id } = req.params

            const cita = await Cita.findByPk(id)


            if (!cita) throw new Error("Ups, no encontramos esta cita")

            const serviciosPorInsumo = await ServiciosPorInsumos.findAll({ where: { servicioID: cita.servicioID } })

            serviciosPorInsumo.forEach(async ({ insumoID, unidades }) => {
                const insumo = await Insumo.findByPk(insumoID)
                await insumo.decrement({ cantidad: unidades })

                if (insumo.cantidad < 0) {
                    insumo.cantidad = 0
                    insumo.save()
                }

            })

            await cita.update({ estado: "Completa" })

            return res.json({
                mensaje: "Cita confirmada correctamente",
            })
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            });
        }
    }

    async expireDate(req = request, res = response) {
        try {
            const { id } = req.params

            const cita = await Cita.findByPk(id)


            if (!cita) throw new Error("Ups, no encontramos esta cita")

            await cita.update({ estado: "Expirada" })

            return res.json({
                mensaje: "Cita expirada correctamente",
            })
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            });
        }
    }


    async cancelDate(req = request, res = response) {
        try {
            const { id } = req.params

            const cita = await Cita.findByPk(id)

            if (!cita) throw new Error("Ups, no encontramos esta cita")

            const { email: emailUsuario } = await Usuario.findOne({ include: { model: Cliente, where: { id: cita.pacienteID }, as: "cliente" } })
            const { email: emailBarbero } = await Usuario.findOne({ include: { model: Barbero, where: { id: cita.barberoID } } })


            await cita.update({ estado: "Cancelada" })

            await sendEmail({ to: emailUsuario, subject: "Cancelación de cita", html: correos.citaCancelada({ fecha: cita.fecha, hora: cita.hora, razon: req.body.razon }) })
            await sendEmail({ to: emailBarbero, subject: "Cancelación de cita", html: correos.citaCancelada({ fecha: cita.fecha, hora: cita.hora, razon: req.body.razon }) })


            return res.json({
                mensaje: "Cita cancelada correctamente"
            })
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            });
        }
    }

    async getPatientDates(req = request, res = response) {
        try {

            const authHeader = req.header("Authorization")

            if (!authHeader) throw new Error({ mensaje: "¡Ups! Parece que no tienes una sesión activa" })
            if (!authHeader.startsWith('Bearer ')) throw new Error({ mensaje: "Formato del token invalido" })
            const token = authHeader.split(' ')[1];

            const { email } = jwt.decode(token);

            const usuario = await Usuario.findOne({ where: { email } })
            const cliente = await Cliente.findOne({ where: { usuarioID: usuario.id } })
            const citas = await Cita.findAll({
                where: { pacienteID: cliente.id }, include: [{ model: Cliente, include: Usuario }, { model: Barbero }, { model: Servicio }],
                order: [
                    [literal("estado='Expirada', estado='Cancelada', estado='Completa', estado='Pendiente'")],
                    ['fecha', 'ASC'],
                    ['hora', 'ASC'],
                ]
            }
            )



            return res.json({
                citas
            })
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            });
        }
    }

    async getDiary(req = request, res = response) {
        try {
            const { fecha } = req.query;

            if (!fecha) {
                return res.status(400).json({ error: "La fecha es requerida" });
            }



            const barberos = await Barbero.findAll({
                attributes: ['id', 'nombre', "avatar"],
                include: [
                    {
                        model: Cita,
                        required: false, // Esto asegura que los cosmetólogos sin citas también se incluyan
                        where: { fecha },
                        include: [{ model: Servicio }, { model: Barbero }, { model: Cliente }]
                    },
                    {
                        model: Usuario,
                        required: true,
                        attributes: [],
                        where: { estaVerificado: true },
                        include: {
                            model: Rol,
                            where: { nombre: "Barbero" },
                            required: true,
                            attributes: [],
                        }

                    }
                ],
                order: [["nombre", "ASC"]]
            });



            const response = barberos.map(barbero => {
                const citas = barbero.cita || [];
                const schedule = citas.map(cita => {
                    const timeToDecimal = (time) => {
                        const [hours, minutes] = time.split(':').map(Number);
                        return hours + minutes / 60;
                    };

                    const start = timeToDecimal(cita.hora);
                    const end = timeToDecimal(cita.horaFin);
                    return {
                        start,
                        end,
                        barberId: barbero.id,
                        ...cita.dataValues,
                    };
                });

                return {
                    id: barbero.id,
                    name: barbero.nombre,
                    avatar: barbero.avatar,
                    schedule
                };
            });

            res.status(200).json(response);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Ocurrió un error al obtener las citas" });
        }
    };

    getAvailableServices = async (req, res) => {
        let { fecha, hora, barberoID } = req.query;
        hora = Number(hora);

        if (!fecha || !hora || !barberoID) {
            return res.status(400).json({ error: "fecha, hora y barberoID son requeridos" });
        }

        const hourDecimal = parseFloat(hora);
        const startHour = Math.floor(hourDecimal) >= 10 ? Math.floor(hourDecimal) : "0" + Math.floor(hourDecimal);
        const startMinutes = (hourDecimal % 1) * 60;
        const startTime = `${startHour}:${startMinutes === 0 ? '00' : startMinutes}:00`;

        try {
            const citas = await Cita.findAll({
                where: {
                    fecha,
                    barberoID
                },
                include: [{ model: Servicio }]
            });

            const barbero = await Barbero.findByPk(barberoID);

            const serviciosNoFiltrados = await Servicio.findAll();

            if (citas.length === 0) {
                const servicios = serviciosNoFiltrados.filter(({ duracionMaxima }) => {
                    const duracion = convertirHoraAFraccion(duracionMaxima);
                    const posibleHoraFinal = hora + duracion;
                    return posibleHoraFinal <= 17;
                });

                return res.json({ servicios, barbero });
            }

            const servicios = serviciosNoFiltrados.filter(({ duracionMaxima }) => {
                const duracion = convertirHoraAFraccion(duracionMaxima);
                const posibleHoraFinal = hora + duracion;

                const noExisteConflicto = citas.every(({ hora: horaInicio, horaFin }) => {
                    const horaEnFraccion = convertirHoraAFraccion(horaInicio);
                    const horaFinEnFraccion = convertirHoraAFraccion(horaFin);

                    return (posibleHoraFinal <= horaEnFraccion || hora >= horaFinEnFraccion) && posibleHoraFinal <= 17;
                });

                return noExisteConflicto;
            });

            return res.status(200).json({ servicios, barbero });
        } catch (error) {
            console.log({ error });
            return res.status(400).json({ mensaje: error.message });
        }
    };

}


function convertirDuracionAHoras(duracion) {
    const [horas, minutos, segundos] = duracion.split(":").map(Number);
    return horas + minutos / 60 + segundos / 3600;
}

function convertirHoraAFraccion(hora) {
    const [horas, minutos] = hora.split(":").map(Number);
    return horas + minutos / 60;
}

function convertirHora24a12(hora24) {
    const [hora, minutos] = hora24.split(':').map(Number);
    const period = hora >= 12 ? 'PM' : 'AM';
    const hora12 = hora % 12 || 12;
    return `${hora12}:${minutos.toString().padStart(2, '0')} ${period}`;
}

function calcularHorasDisponibles(citas, duracionMaxima, fecha) {
    const horasDisponibles = [];
    const HORA_INICIAL = 8;
    let horaActual = HORA_INICIAL;
    const HORA_FINAL = 17;
    const TIEMPO_IMPREVISTOS = 1; // 1 hora
    const isProduction = process.env.ENVIRONMENT === 'PROD';
    const esHoy = isToday(parseISO(fecha));


    if (esHoy) {
        horaActual = new Date().getHours() + (TIEMPO_IMPREVISTOS * 2);

        // Si es hoy y estamos en producción, sumar 5 horas a la hora actual
        if (isProduction) {
            horaActual += 5;
        }
    }


    while (horaActual < HORA_FINAL) {
        const horaFormateada = Number.isInteger(horaActual) ? convertirHora24a12(`${horaActual}:00`) : convertirHora24a12(`${Math.floor(horaActual)}:${horaActual % 1 * 60}`);

        const tieneCita = citas.some(({ horaInicial, horaFinal }) => {
            return (horaActual >= horaInicial - TIEMPO_IMPREVISTOS && horaActual < horaFinal + TIEMPO_IMPREVISTOS) ||
                (horaActual + duracionMaxima > horaInicial - TIEMPO_IMPREVISTOS && horaActual + duracionMaxima <= horaFinal + TIEMPO_IMPREVISTOS) ||
                (horaActual <= horaInicial - TIEMPO_IMPREVISTOS && horaActual + duracionMaxima >= horaFinal + TIEMPO_IMPREVISTOS);
        });

        if (!tieneCita && (horaActual + duracionMaxima <= HORA_FINAL)) {
            horasDisponibles.push(horaFormateada);
        }

        horaActual += 0.5;
    }

    console.log({ esHoy });
    console.log({ horaActual });
    console.log({ horasDisponibles });
    return horasDisponibles;
}


export const citasController = new CitasController()