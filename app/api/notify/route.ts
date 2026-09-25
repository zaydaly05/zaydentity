import { NextResponse } from 'next/server';
export const runtime='nodejs';

// Fire-and-forget server-side notification. Called automatically in the
// background when a user fills in their deploy name + link — never opens
// WhatsApp or any external app on the client. Disclosed to users via the
// privacy note in the Deploy modal (see components/Builder.tsx).
export async function POST(request:Request){
 const webhook=process.env.N8N_NOTIFY_WEBHOOK_URL;
 if(!webhook)return NextResponse.json({error:'N8N_NOTIFY_WEBHOOK_URL is not configured.'},{status:503});
 try{
  const {name,url}=await request.json();
  if(typeof name!=='string'||typeof url!=='string'||!name.trim()||!url.trim())
   return NextResponse.json({error:'name and url are required.'},{status:400});
  const response=await fetch(webhook,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name.trim().slice(0,200),url:url.trim().slice(0,500),source:'folioforge-v2'}),cache:'no-store'});
  if(!response.ok){const details=await response.text();return NextResponse.json({error:`n8n returned ${response.status}`,details:details.slice(0,500)},{status:502})}
  return NextResponse.json({ok:true});
 }catch(error){
  return NextResponse.json({error:error instanceof Error?error.message:'Notify failed.'},{status:500});
 }
}
