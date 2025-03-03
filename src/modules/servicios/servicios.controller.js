import { response, request } from "express"
import { Servicio } from "./servicios.model.js"
import { filtros } from "../../utils/filtros.util.js";
import { ServiciosPorInsumos } from "./servicios_insumos.model.js";
import { CategoriaProducto } from "../categoria-insumos/categoria_insumos.model.js";
import { Insumo } from "../insumos/insumos.model.js";

class ServiciosController {
    async get(req = request, res = response) {
        try {
            const { offset, where, limit, order } = filtros.obtenerFiltros({ busqueda: req.query.search, modelo: Servicio, pagina: req.query.page })
            const servicios = await Servicio.findAll({ offset, where, limit, order });
            const total = await Servicio.count({ where })

            return res.json({ servicios, total })
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }
    async findByPk(req = request, res = response) {
        try {
            const { id } = req.params
            const servicio = await Servicio.findByPk(id);
            const serviciosPorInsumo = await ServiciosPorInsumos.findAll({ where: { servicioID: id }, include: { model: Insumo, include: { model: CategoriaProducto } } })


            return res.json({ servicio, serviciosPorInsumo })
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }




    async create(req = request, res = response) {
        try {

            function formatTime(timeString) {
                const [hours, minutes, seconds] = timeString.split(':').map(Number);

                let formattedTime = ``;

                if (hours > 0) formattedTime += `${hours} horas`
                if (minutes > 0 && hours > 0) formattedTime += ` y ${minutes} minutos`
                if (minutes > 0 && hours == 0) formattedTime += `${minutes} minutos`

                return formattedTime;
            }

            const existePorNombre = await Servicio.findOne({ where: { nombre: req.body.nombre } })
            if (existePorNombre) throw new Error("Ups, parece que ya existe un servicio con este nombre")

            const duracionMaximaConvertido = formatTime(req.body.duracionMaxima)
            const servicio = await Servicio.create({...req.body, duracionMaximaConvertido})
            const serviciosPorInsumos = req.body.insumos.map((insumo) => ({ ...insumo, servicioID: servicio.id }))
            await ServiciosPorInsumos.bulkCreate(serviciosPorInsumos)

            return res.status(201).json({
                mensaje: "Servicio registrado correctamente",
                servicio
            })

        } catch (error) {
            console.log({error});
            
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }

    async update(req = request, res = response) {
        try {

            const servicioExiste = await Servicio.findByPk(req.params.id)
            if (!servicioExiste) throw new Error("Ups, parece que no encontramos este servicio")

            const existePorNombre = await Servicio.findOne({ where: { nombre: req.body.nombre } })
            if (existePorNombre && existePorNombre.id !== req.params.id) throw new Error("Ups, parece que ya existe un servicio con este nombre")

            await ServiciosPorInsumos.destroy({ where: { servicioID: req.params.id } })
            const servicioActualizado = await servicioExiste.update(req.body)

            const serviciosPorInsumos = req.body.insumos.map((insumo) => ({ ...insumo, servicioID: servicioActualizado.id }))
            await ServiciosPorInsumos.bulkCreate(serviciosPorInsumos)

            return res.json({
                mensaje: "Servicio actualizado correctamente",
                servicioActualizado
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
            const servicio = await Servicio.findByPk(id)

            if (!servicio) throw new Error("Ups, parece que no encontramos este servicio")

            await ServiciosPorInsumos.destroy({ where: { servicioID: id } })
            const servicioEliminado = await servicio.destroy({ where: { id } })

            return res.json({
                mensaje: "Usuario eliminado correctamente",
                servicioEliminado
            })
        } catch (error) {
            return res.status(400).json({
                mensaje: error.message
            })
        }
    }
}

export const serviciosController = new ServiciosController()