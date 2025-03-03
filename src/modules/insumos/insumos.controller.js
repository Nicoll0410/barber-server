import { response, request } from "express"
import { Insumo } from "./insumos.model.js"
import { filtros } from "../../utils/filtros.util.js"
import { CategoriaProducto } from "../categoria-insumos/categoria_insumos.model.js"

class InsumosController {
    async get(req = request, res = response) {
        try {

            const { offset, where, limit } = filtros.obtenerFiltros({ busqueda: req.query.search, modelo: Insumo, pagina: req.query.page })

            const insumos = await Insumo.findAll({ offset, limit, where, include: { model: CategoriaProducto } })
            const total = await Insumo.count({ where })

            return res.json({ insumos, total })
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }

    async getAll(req = request, res = response) {
        try {
            const insumos = await Insumo.findAll({ include: { model: CategoriaProducto } })
            return res.json({ insumos })
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }


    async create(req = request, res = response) {
        try {
            const existeInsumoConMismoNombre = await Insumo.findOne({ where: { nombre: req.body.nombre } })
            if (existeInsumoConMismoNombre) throw new Error("Ups, parece que ya existe un insumo con este mismo nombre")

            console.log(req.body);

            const insumo = await Insumo.create(req.body)

            return res.status(201).json({
                mensaje: "Insumo registrado correctamente",
                insumo
            })

        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }

    async update(req = request, res = response) {
        try {

            const insumoExiste = await Insumo.findByPk(req.params.id)
            if (!insumoExiste) throw new Error("Ups, parece que no encontramos este insumo")

            const existeInsumoConMismoNombre = await Insumo.findOne({ where: { nombre: req.body.nombre } })
            if (existeInsumoConMismoNombre && existeInsumoConMismoNombre.id !== req.params.id) throw new Error("Ups, parece que ya existe un insumo con este mismo nombre")

            const usuarioActualizado = await insumoExiste.update(req.body)

            return res.json({
                mensaje: "Insumo actualizado correctamente",
                usuarioActualizado
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
            const insumo = await Insumo.findByPk(id)
            if (!insumo) throw new Error("Ups, parece que no encontramos este insumo")

            const insumoEliminado = await insumo.destroy({
                where: { id }
            })

            return res.json({
                mensaje: "insumo eliminado correctamente",
                insumoEliminado
            })
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }
}

export const insumosController = new InsumosController()