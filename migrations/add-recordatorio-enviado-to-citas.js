import { QueryTypes } from 'sequelize';
import { sequelize } from '../src/database';

export async function up() {
  try {
    console.log('🔄 Ejecutando migración: añadiendo campo recordatorio_enviado a tabla cita...');
    
    // Verificar si la columna ya existe
    const columnCheck = await sequelize.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'cita' 
       AND COLUMN_NAME = 'recordatorio_enviado'`,
      { type: QueryTypes.SELECT }
    );

    if (columnCheck.length === 0) {
      // Añadir la columna si no existe
      await sequelize.query(`
        ALTER TABLE cita 
        ADD COLUMN recordatorio_enviado BOOLEAN NOT NULL DEFAULT FALSE
      `);
      console.log('✅ Columna recordatorio_enviado añadida a la tabla cita');
    } else {
      console.log('✅ La columna recordatorio_enviado ya existe');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  }
}

export async function down() {
  try {
    console.log('🔄 Revirtiendo migración: eliminando campo recordatorio_enviado...');
    
    await sequelize.query(`
      ALTER TABLE cita 
      DROP COLUMN recordatorio_enviado
    `);
    
    console.log('✅ Columna recordatorio_enviado eliminada');
    return true;
  } catch (error) {
    console.error('❌ Error al revertir migración:', error);
    throw error;
  }
}