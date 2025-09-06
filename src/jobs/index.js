import { CitasAVentasJob } from "./citasAVentas.job.js";
import { RecordatoriosCitasJob } from "./recordatoriosCitas.job.js";

export class JobsManager {
    static iniciarTodos() {
        CitasAVentasJob.iniciar();
        RecordatoriosCitasJob.iniciar()
        console.log('✅ Todos los jobs programados iniciados');
    }
}