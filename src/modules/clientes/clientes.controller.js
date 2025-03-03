import { response, request } from "express"
import { Cliente } from "./clientes.model.js"
import { filtros } from "../../utils/filtros.util.js"
import { Usuario } from "../usuarios/usuarios.model.js"
import { passwordUtils } from "../../utils/password.util.js"
import { customAlphabet } from "nanoid"
import { CodigosVerificacion } from "../usuarios/codigos_verificacion.model.js"
import { sendEmail } from "../../utils/send-email.util.js"
import { correos } from "../../utils/correos.util.js"
import { Rol } from "../roles/roles.model.js"
import { Cita } from "../citas/citas.model.js"

class ClientesController {
    async get(req = request, res = response) {
        try {
            const { offset, limit, where, order } = filtros.obtenerFiltros({ busqueda: req.query.search, modelo: Cliente, pagina: req.query.page })

            const clientes = await Cliente.findAll({ offset, limit, where, order, include: { model: Usuario, attributes: ["email", "estaVerificado"] } })
            const total = await Cliente.count({ where })
            return res.json({ clientes, total })
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }

    async create(req = request, res = response) {
        try {

            const { email, password: plainPassword } = req.body

            const usuarioYaExiste = await Usuario.findOne({ where: { email } })

            if (usuarioYaExiste) throw new Error("Este email ya se encuentra registrado")
            const password = await passwordUtils.encrypt(plainPassword)

            const patientRole = await Rol.findOne({ where: { nombre: "Paciente" } })


            const usuario = await Usuario.create({ ...req.body, password, rolID: patientRole.id })

            const codigo = (customAlphabet("0123456789", 6))()
            await CodigosVerificacion.create({ usuarioID: usuario.id, codigo })

            await sendEmail({ to: email, subject: "Confirmación de identidad", html: correos.envioCredenciales({ codigo, email, password: plainPassword }) })

            const cliente = await Cliente.create({ ...req.body, usuarioID: usuario.id })

            return res.status(201).json({
                mensaje: "Cliente registrado correctamente",
                cliente
            })

        } catch (error) {
            console.log({ error });
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }

    async update(req = request, res = response) {
        try {
            const clienteExistente = await Cliente.findByPk(req.params.id)
            if (!clienteExistente) throw new Error("Ups, parece que no encontramos este cliente")

            const clienteActualizado = await clienteExistente.update(req.body)

            return res.json({
                mensaje: "Cliente actualizado correctamente",
                clienteActualizado
            })

        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }

    async updateByEmail(req = request, res = response) {
        try {
            const usuarioExiste = await Usuario.findOne({ where: { email: req.body.email } })
            if (!usuarioExiste) throw new Error("Ups, parece que no encontramos este usuario")


            const clienteExiste = await Cliente.findOne({ where: { usuarioID: usuarioExiste.id } })
            if (!clienteExiste) throw new Error("Ups, parece que no encontramos este cliente")

            const clienteActualizado = await clienteExiste.update(req.body)

            return res.json({
                mensaje: "Cliente actualizado correctamente",
                cliente: clienteActualizado,
                usuario: usuarioExiste
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
            const cliente = await Cliente.findByPk(id)
            if (!cliente) throw new Error("Ups, parece que no encontramos este cliente")


            const citasDePaciente = await Cita.count({ where: { pacienteID: cliente.id } })

            if (citasDePaciente > 0) throw new Error("Lo sentimos, no es posible eliminar a este cliente porque tiene citas relacionadas")


            const clienteEliminado = await cliente.destroy({
                where: { id }
            })

            await Usuario.destroy({ where: { id: clienteEliminado.usuarioID } })

            return res.json({
                clienteEliminado
            })
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }
}

export const clientesController = new ClientesController()