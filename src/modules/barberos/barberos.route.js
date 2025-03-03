import { Router } from "express";
import { barberosController } from "./barberos.controller.js";
import { validaciones } from "../../middlewares/validaciones.middleware.js";

export const barberosRouter = Router();

barberosRouter.get("/", barberosController.get);
barberosRouter.post(
  "/",
  [
    validaciones.estaVacio("nombre", "El nombre debe de ser obligatorio", { max: 50 }),
    validaciones.estaVacio("telefono", "El telefono debe de ser obligatorio", { max: 10, esNumerico: true }),
    validaciones.estaVacio("direccion", "La direccion debe de ser obligatorio", { max: 100 }),
    validaciones.estaVacio("fecha_nacimiento", "La fecha de nacimiento debe de ser obligatorio"),
    validaciones.estaVacio("fecha_de_contratacion", "La fecha de contratacion debe de ser obligatorio"),
    validaciones.estaVacio("nivel_academico", "El nivel academico debe de ser obligatorio", { max: 50 }),
    validaciones.estaVacio("email", "El email debe ser obligatorio", { max: 255 }),
    validaciones.estaVacio("password", "La contraseña debe de ser obligatorio", { max: 20 }),
  ],
  barberosController.create
);
barberosRouter.put(
  "/:id",
  [
    validaciones.estaVacio("nombre", "El nombre debe de ser obligatorio", { max: 50 }),
    validaciones.estaVacio("telefono", "El telefono debe de ser obligatorio", { max: 10, esNumerico: true }),
    validaciones.estaVacio("direccion", "La direccion debe de ser obligatorio", { max: 100 }),
    validaciones.estaVacio("fecha_nacimiento", "La fecha de nacimiento debe de ser obligatorio"),
    validaciones.estaVacio("fecha_de_contratacion", "La fecha de contratacion debe de ser obligatorio"),
    validaciones.estaVacio("nivel_academico", "El nivel academico debe de ser obligatorio", { max: 50 }),
    validaciones.estaVacio("email" , "El email debe ser obligatorio" , { max : 255 }),
],
  barberosController.update
);
barberosRouter.delete("/:id", barberosController.delete);
