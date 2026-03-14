import * as mariadb from 'mariadb';

export const mdbConnection: {
  pool?: mariadb.Pool
} = {};

export async function createPool() {
  mdbConnection.pool = await mariadb.createPool({
    host: process.env.MYSQL_SERVER,
    port: (process.env.MYSQL_PORT) ? Number(process.env.MYSQL_PORT) : 3306,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: 'scheduler',
    connectionLimit: 5
  });
  console.log('Connected to mariadb');
}