import { response, request } from "express"
import { CategoriaProducto } from "./categoria_insumos.model.js"
import { Insumo } from "../insumos/insumos.model.js"
import { filtros } from "../../utils/filtros.util.js"
import { fn, col } from "sequelize"

class Categorias_ProductosController {
    async get(req = request, res = response) {
        try {
            const { offset, where, limit } = filtros.obtenerFiltros({ busqueda: req.query.search, modelo: CategoriaProducto, pagina: req.query.page })

            const categorias = await CategoriaProducto.findAll({
                offset, limit, where,
                attributes: {
                    include: [
                        [fn('COUNT', col('insumos.id')), 'insumosAsociados']
                    ]
                },
                include: [
                    {
                        model: Insumo,
                        attributes: [],
                    }
                ],
                group: ['categorias_insumo.id'],
                subQuery: false
            })

            const total = await CategoriaProducto.count({ where })
            return res.json({ categorias, total })
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }

    async getAll(req = request, res = response) {
        try {

            const categorias = await CategoriaProducto.findAll()
            return res.json({ categorias })
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }


    async create(req = request, res = response) {
        try {

            const existeCategoriaPorNombre = await CategoriaProducto.findOne({ where: { nombre: req.body.nombre } })
            if (existeCategoriaPorNombre) throw new Error("Ups, parece que ya existe una categoría con este nombre")

            const categorias_productos = await CategoriaProducto.create(req.body)

            return res.status(201).json({
                mensaje: "Categoria de producto registrada correctamente",
                categorias_productos
            })

        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }

    async update(req = request, res = response) {
        try {
            const categorias_productosExistente = await CategoriaProducto.findByPk(req.params.id)
            if (!categorias_productosExistente) throw new Error("Ups, parece que no encontramos esta categoria de producto")

            const existeCategoriaPorNombre = await CategoriaProducto.findOne({ where: { nombre: req.body.nombre } })
            if (existeCategoriaPorNombre && existeCategoriaPorNombre.id !== req.params.id) throw new Error("Ups, parece que ya existe una categoría con este nombre")

            const categorias_prudoctospActualizado = await categorias_productosExistente.update(req.body)

            return res.json({
                mensaje: "Categoria del producto actualizada correctamente",
                categorias_prudoctospActualizado
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
            const categorias_productos = await CategoriaProducto.findByPk(id)
            if (!categorias_productos) throw new Error("Ups, parece que no encontramos esta categoria de producto")

            const categorias_productosEliminado = await CategoriaProducto.destroy({
                where: { id }
            })

            return res.json({
                categorias_productosEliminado
            })
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }
}

export const categorias_productoscontroller = new Categorias_ProductosController()