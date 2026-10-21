import pg from 'pg'; import {config} from './config.js';
export const db=new pg.Pool({connectionString:config.DATABASE_URL,ssl:process.env.NODE_ENV==='production'?{rejectUnauthorized:true}:undefined,max:10});
export async function tx<T>(fn:(c:pg.PoolClient)=>Promise<T>){const c=await db.connect();try{await c.query('begin');const x=await fn(c);await c.query('commit');return x}catch(e){await c.query('rollback');throw e}finally{c.release()}}
