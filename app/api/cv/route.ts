import { NextResponse } from 'next/server';
export const runtime='nodejs';
export async function POST(request:Request){
 const webhook=process.env.N8N_CV_WEBHOOK_URL;if(!webhook)return NextResponse.json({error:'N8N_CV_WEBHOOK_URL is not configured.'},{status:503});
 try{const incoming=await request.formData();const file=incoming.get('file');if(!(file instanceof File))return NextResponse.json({error:'A CV file is required.'},{status:400});if(file.size>10*1024*1024)return NextResponse.json({error:'Maximum CV size is 10 MB.'},{status:413});if(file.type!=='application/pdf')return NextResponse.json({error:'This v2 workflow accepts PDF CVs. Add DOCX/TXT extraction nodes in n8n if you want those formats.'},{status:415});const body=new FormData();body.append('file',file,file.name);body.append('source','folioforge-v2');const response=await fetch(webhook,{method:'POST',body,cache:'no-store'});const text=await response.text();if(!response.ok)return NextResponse.json({error:`n8n returned ${response.status}`,details:text.slice(0,500)},{status:502});try{return NextResponse.json(JSON.parse(text))}catch{return NextResponse.json({error:'n8n returned invalid JSON.'},{status:502})}}
 catch(error){return NextResponse.json({error:error instanceof Error?error.message:'CV processing failed.'},{status:500})}
}
