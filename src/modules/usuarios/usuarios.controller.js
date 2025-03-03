import { response, request } from "express"
import { Usuario } from "./usuarios.model.js"
import { passwordUtils } from "../../utils/password.util.js"
import { Op } from "sequelize";
import { filtros } from "../../utils/filtros.util.js";
import { correos } from "../../utils/correos.util.js";
import { customAlphabet } from "nanoid";
import { CodigosVerificacion } from "./codigos_verificacion.model.js";
import { sendEmail } from "../../utils/send-email.util.js";
import { Cliente } from "../clientes/clientes.model.js";
import { Barbero } from "../barberos/barberos.model.js";
import jwt from "jsonwebtoken"

import { Rol } from "../roles/roles.model.js";

class UsuarioController {
    async get(req = request, res = response) {
        try {
            const { offset, where } = filtros.obtenerFiltros({ busqueda: req.query.search, modelo: Usuario, pagina: req.query.page })

            const usuarios = await Usuario.findAll({ offset, limit: 5, where, order: [['createdAt', 'DESC']], include: { model: Rol, attributes: ["nombre", "avatar"] } })
            const total = await Usuario.count({ where })
            return res.json({ usuarios, total })
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }

    async getUserInfo(req = request, res = response) {
        try {
            const authHeader = req.header("Authorization")

            if (!authHeader) throw new Error({ mensaje: "¡Ups! Parece que no tienes una sesión activa" })
            if (!authHeader.startsWith('Bearer ')) throw new Error({ mensaje: "Formato del token invalido" })
            const token = authHeader.split(' ')[1];

            const { email } = jwt.decode(token);
            const usuario = await Usuario.findOne({ where: { email } })
            const rolPaciente = await Rol.findOne({ where: { nombre: "Paciente" } })
            const modelType = usuario.rolID === rolPaciente.id ? Cliente : Barbero
            const data = await modelType.findOne({ where: { usuarioID: usuario.id }, include: Usuario })

            return res.json(data)
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }

    async getPatientWithoutInformation(req = request, res = response) {
        try {
            const usuarios = await Usuario.findAll({
                include: [
                    { model: Cliente, required: false, attributes: ["id"], as: "cliente" },
                    { model: Rol, required: true, attributes: [], where: { nombre: "Paciente" }, }
                ],
                order: [["email", "ASC"]],
                where: { '$cliente.id$': null }
            });

            return res.json({ usuarios });
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            });
        }
    }
    async getBarberWithoutInformation(req = request, res = response) {
        try {
            const usuarios = await Usuario.findAll({
                include: [
                    { model: Barbero, required: false, attributes: ["id"] },
                    { model: Rol, required: true, attributes: [], where: { nombre: "Barbero" }, }
                ],
                order: [["email", "ASC"]],
                where: { '$barberos.id$': null }
            });

            return res.json({ usuarios });
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            });
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

            await sendEmail({ to: email, subject: "Confirmación de identidad", html: correos.envioCredenciales({ codigo, email, password: plainPassword }) })

            return res.status(201).json({
                mensaje: "Usuario registrado correctamente",
                usuario
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
            const usuario = await Usuario.findByPk(id)
            if (!usuario) throw new Error("Ups, parece que no encontramos este usuario")

            const clienteExiste = await Cliente.findOne({ where: { usuarioID: id } })
            if (clienteExiste) throw new Error("Ups, parece que este usuario está asociado a un paciente")

            const usuarioEliminado = await usuario.destroy({
                where: { id }
            })

            return res.json({
                mensaje: "Usuario eliminado correctamente",
                usuarioEliminado
            })
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }

    async resendEmail(req = request, res = response) {
        try {
            const { email } = req.body

            const usuario = await Usuario.findOne({ where: { email } })
            if (!usuario) throw new Error("¡Ups! Parece que este usuario no existe")
            if (usuario.estaVerificado) throw new Error("Este usuario ya está verificado")

            await CodigosVerificacion.destroy({ where: { usuarioID: usuario.id } })

            const codigo = (customAlphabet("0123456789", 6))()
            await CodigosVerificacion.create({ usuarioID: usuario.id, codigo })

            await sendEmail({ to: email, subject: "Confirmación de identidad", html: correos.confirmarIdentidad({ codigo, email }) })

            return res.status(201).json({ mensaje: "Correo reenviado correctamente" })

        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }

    async userHasCompletedSignup(req = request, res = response, next) {

        try {

            const authHeader = req.header("Authorization")

            if (!authHeader) throw new Error({ mensaje: "¡Ups! Parece que no tienes una sesión activa" })
            if (!authHeader.startsWith('Bearer ')) throw new Error({ mensaje: "Formato del token invalido" })
            const token = authHeader.split(' ')[1];

            const { email } = jwt.decode(token);
            const usuario = await Usuario.findOne({ where: { email } })
            const cliente = await Cliente.findOne({ where: { usuarioID: usuario.id } })

            if (!cliente) throw new Error("El usuario no ha completado su información")

            return res.json({ cliente });
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }

    }
    async completeSignup(req = request, res = response, next) {

        try {

            const authHeader = req.header("Authorization")

            if (!authHeader) throw new Error({ mensaje: "¡Ups! Parece que no tienes una sesión activa" })
            if (!authHeader.startsWith('Bearer ')) throw new Error({ mensaje: "Formato del token invalido" })
            const token = authHeader.split(' ')[1];

            const { email } = jwt.decode(token);
            const usuario = await Usuario.findOne({ where: { email } })


            const cliente = await Cliente.create({ usuarioID: usuario.id, ...req.body })

            return res.json({ mensaje: "Cliente creado correctamente", cliente });
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }

    }

    async updatePassword(req = request, res = response) {
        try {
            const usuario = await Usuario.findOne({ where: { email: req.body.email } })
            if (!usuario) throw new Error("¡Ups! No encontramos ningún usuario con estas credenciales")

            const esPasswordCorrecta = await passwordUtils.isValidPassword(req.body.old_password, usuario.getDataValue("password"))
            if (!esPasswordCorrecta) throw new Error("¡Ups! Esta contraseña está incorrecta")

            const newPassword = await passwordUtils.encrypt(req.body.password)
            await usuario.update({ password: newPassword })

            return res.json({ mensaje: "Tu contraseña ha sido actualizada" })

        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }
}

export const usuarioController = new UsuarioController()