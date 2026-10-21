import type {RequestHandler} from 'express'; import {SignJWT,jwtVerify} from 'jose'; import {config} from './config.js';
const key=new TextEncoder().encode(config.JWT_SECRET); export type Role='teacher'|'student';
declare global{namespace Express{interface Request{auth?:{id:string;role:Role}}}}
export async function token(id:string,role:Role){return new SignJWT({role}).setProtectedHeader({alg:'HS256'}).setSubject(id).setIssuer('dream-classes').setAudience('android').setIssuedAt().setExpirationTime('15m').sign(key)}
export const authenticate:RequestHandler=async(req,res,next)=>{try{const h=req.headers.authorization;if(!h?.startsWith('Bearer '))throw 0;const {payload}=await jwtVerify(h.slice(7),key,{issuer:'dream-classes',audience:'android'});req.auth={id:String(payload.sub),role:payload.role as Role};next()}catch{res.status(401).json({error:'UNAUTHENTICATED'})}};
export const requireRole=(role:Role):RequestHandler=>(req,res,next)=>req.auth?.role===role?next():res.status(403).json({error:'FORBIDDEN'});
