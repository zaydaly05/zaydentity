import { NextResponse } from 'next/server';
export const runtime='nodejs';
export async function POST(request:Request){
 const webhook=process.env.N8N_AI_WEBHOOK_URL;
 if(!webhook)return NextResponse.json({error:'N8N_AI_WEBHOOK_URL is not configured.'},{status:503});
 try{const payload=await request.json();const response=await fetch(webhook,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store'});const text=await response.text();if(!response.ok)return NextResponse.json({error:`n8n returned ${response.status}`,details:text.slice(0,500)},{status:502});try{return NextResponse.json(JSON.parse(text))}catch{return NextResponse.json({message:text})}}
 catch(error){return NextResponse.json({error:error instanceof Error?error.message:'AI workflow failed.'},{status:500})}
}
