/* ────────────────────────────────────────────────────────────
   src/modules/servicios/servicios.controller.js
   Controlador completo y funcional – insumos ahora opcionales
   ──────────────────────────────────────────────────────────── */
import { request, response } from "express";
import { Servicio } from "./servicios.model.js";
import { filtros } from "../../utils/filtros.util.js";
import { ServiciosPorInsumos } from "./servicios_insumos.model.js";
import { CategoriaProducto } from "../categoria-insumos/categoria_insumos.model.js";
import { Insumo } from "../insumos/insumos.model.js";

class ServiciosController {
  /* ───────────── Listar con filtros y paginación ───────────── */
  async get(req = request, res = response) {
    try {
      const { offset, where, limit, order } = filtros.obtenerFiltros({
        busqueda: req.query.search,
        modelo: Servicio,
        pagina: req.query.page,
      });

      const servicios = await Servicio.findAll({ offset, where, limit, order });
      const total = await Servicio.count({ where });

      return res.json({ servicios, total });
    } catch (error) {
      return res.status(400).json({ mensaje: error.message });
    }
  }

  /* ─────────────── Buscar uno por ID (incluye insumos) ─────────────── */
  async findByPk(req = request, res = response) {
    try {
      const { id } = req.params;

      const servicio = await Servicio.findByPk(id);
      const serviciosPorInsumo = await ServiciosPorInsumos.findAll({
        where: { servicioID: id },
        include: { model: Insumo, include: { model: CategoriaProducto } },
      });

      return res.json({ servicio, serviciosPorInsumo });
    } catch (error) {
      return res.status(400).json({ mensaje: error.message });
    }
  }

/* ─────────────── Crear ─── ahora insumos son opcionales ─────────────── */
async create(req = request, res = response) {
  try {
    /* ───── Formatear duración CORREGIDO ───── */
    function formatTimeToDatabase(timeString) {
      // Convertir "00:30" o "1:30" a formato TIME "00:30:00"
      const [hours, minutes] = timeString.split(':').map(Number);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    }

    function formatTimeToDisplay(timeString) {
      // Convertir "00:30:00" a texto "30 minutos" para mostrar
      const [hours, minutes] = timeString.split(':').map(Number);
      let formatted = "";
      if (hours > 0) formatted += `${hours} hora${hours !== 1 ? "s" : ""}`;
      if (minutes > 0) formatted += `${hours > 0 ? " y " : ""}${minutes} minuto${minutes !== 1 ? "s" : ""}`;
      return formatted || "0 minutos";
    }

    /* ───── Validación de nombre único ───── */
    const existePorNombre = await Servicio.findOne({ where: { nombre: req.body.nombre } });
    if (existePorNombre) throw new Error("Ups, parece que ya existe un servicio con este nombre");

    // ✅ CORREGIDO: Usar formato TIME para la base de datos
    const duracionMaximaConvertido = formatTimeToDatabase(req.body.duracionMaxima);
    // ✅ Mantener el formato original para mostrar
    const duracionDisplay = formatTimeToDisplay(req.body.duracionMaxima);

    /* ───── Crear servicio ───── */
    const servicio = await Servicio.create({ 
      ...req.body, 
      duracionMaximaConvertido, // Formato TIME: "00:30:00"
      duracionMaxima: duracionDisplay // Formato texto: "30 minutos" 
    });

    /* ───── Crear insumos SOLO si se enviaron ───── */
    const insumosData = Array.isArray(req.body.insumos) ? req.body.insumos : [];
    if (insumosData.length > 0) {
      const serviciosPorInsumos = insumosData.map((insumo) => ({
        ...insumo,
        servicioID: servicio.id,
      }));
      await ServiciosPorInsumos.bulkCreate(serviciosPorInsumos);
    }

    return res.status(201).json({
      mensaje: "Servicio registrado correctamente",
      servicio,
    });
  } catch (error) {
    console.log({ error });
    return res.status(400).json({ mensaje: error.message });
  }
}

/* ─────────────── Actualizar (insumos opcionales) ─────────────── */
async update(req = request, res = response) {
  try {
    const servicioExiste = await Servicio.findByPk(req.params.id);
    if (!servicioExiste) throw new Error("Ups, parece que no encontramos este servicio");

    const existePorNombre = await Servicio.findOne({ where: { nombre: req.body.nombre } });
    if (existePorNombre && existePorNombre.id !== req.params.id)
      throw new Error("Ups, parece que ya existe un servicio con este nombre");

    /* ───── Formatear duración si se envía ───── */
    let datosActualizados = { ...req.body };
    
    if (req.body.duracionMaxima) {
      function formatTimeToDatabase(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      }

      function formatTimeToDisplay(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        let formatted = "";
        if (hours > 0) formatted += `${hours} hora${hours !== 1 ? "s" : ""}`;
        if (minutes > 0) formatted += `${hours > 0 ? " y " : ""}${minutes} minuto${minutes !== 1 ? "s" : ""}`;
        return formatted || "0 minutos";
      }

      datosActualizados.duracionMaximaConvertido = formatTimeToDatabase(req.body.duracionMaxima);
      datosActualizados.duracionMaxima = formatTimeToDisplay(req.body.duracionMaxima);
    }

    /* ───── Actualizar datos principales ───── */
    const servicioActualizado = await servicioExiste.update(datosActualizados);

    /* ───── Si se envía el array de insumos, se re‑sincroniza ───── */
    if (Array.isArray(req.body.insumos)) {
      await ServiciosPorInsumos.destroy({ where: { servicioID: req.params.id } });

      if (req.body.insumos.length > 0) {
        const nuevosInsumos = req.body.insumos.map((insumo) => ({
          ...insumo,
          servicioID: servicioActualizado.id,
        }));
        await ServiciosPorInsumos.bulkCreate(nuevosInsumos);
      }
    }

    return res.json({
      mensaje: "Servicio actualizado correctamente",
      servicioActualizado,
    });
  } catch (error) {
    return res.status(400).json({ mensaje: error.message });
  }
}

  /* ─────────────── Eliminar ─────────────── */
  async delete(req = request, res = response) {
    try {
      const { id } = req.params;
      const servicio = await Servicio.findByPk(id);
      if (!servicio) throw new Error("Ups, parece que no encontramos este servicio");

      await ServiciosPorInsumos.destroy({ where: { servicioID: id } });
      const servicioEliminado = await servicio.destroy();

      return res.json({ mensaje: "Servicio eliminado correctamente", servicioEliminado });
    } catch (error) {
      return res.status(400).json({ mensaje: error.message });
    }
  }
}

export const serviciosController = new ServiciosController();