import { response, request } from "express"
import { Barbero } from "../barberos/barberos.model.js"
import { filtros } from "../../utils/filtros.util.js"
import { Usuario } from "../usuarios/usuarios.model.js"
import { passwordUtils } from "../../utils/password.util.js"
import { customAlphabet } from "nanoid"
import { CodigosVerificacion } from "../usuarios/codigos_verificacion.model.js"
import { sendEmail } from "../../utils/send-email.util.js"
import { correos } from "../../utils/correos.util.js"
import { Rol } from "../roles/roles.model.js"
import { Cita } from "../citas/citas.model.js"

class BarberosController {
    async get(req = request, res = response) {
        try {
            const { offset, search, where, limit } = filtros.obtenerFiltros({ busqueda: req.query.search, modelo: Barbero, pagina: req.query.page })

            const barberos = await Barbero.findAll({ offset, limit, where, search, include: { model: Usuario, attributes: ["email", "estaVerificado"], include: { model: Rol, attributes: ["nombre", "id", "avatar"] } } })
            const total = await Barbero.count({ where })
            return res.json({ barberos, total })
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


            const usuario = await Usuario.create({ ...req.body, password })

            const codigo = (customAlphabet("0123456789", 6))()
            await CodigosVerificacion.create({ usuarioID: usuario.id, codigo })


            const barbero = await Barbero.create({ ...req.body, usuarioID: usuario.id })

            await sendEmail({ to: email, subject: "Confirmación de identidad", html: correos.envioCredenciales({ codigo, email, password: plainPassword }) })

            return res.status(201).json({
                mensaje: "Barbero registrado correctamente",
                barbero
            })

        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }

    async update(req = request, res = response) {
        try {
            const barberoExiste = await Barbero.findByPk(req.params.id)
            if (!barberoExiste) throw new Error("Ups, parece que no encontramos este barbero")

            const usuario = await Usuario.findByPk(barberoExiste.usuarioID)
            await usuario.update({ rolID: req.body.rolID })
            const barberoActualizado = await barberoExiste.update(req.body)


            return res.json({
                mensaje: "Barbero actualizado correctamente",
                barberoActualizado
            })

        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }

    async delete(req = request, res = response) {
        try {
            const barberoExiste = await Barbero.findByPk(req.params.id)
            if (!barberoExiste) throw new Error("Ups, parece que no encontramos este barbero")

            const citasDeBarbero = await Cita.count({ where: { barberoID: barberoExiste.id } })

            if (citasDeBarbero > 0) throw new Error("Lo sentimos, no es posible eliminar a este barbero porque tiene citas relacionadas")

            const barberoActualizado = await barberoExiste.destroy({ where: { id: req.params.id } })

            await Usuario.destroy({ where: { id: barberoActualizado.usuarioID } })
            return res.json({
                mensaje: "Barbero actualizado correctamente",
                barberoActualizado
            })

        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }

    }
}

export const barberosController = new BarberosController();