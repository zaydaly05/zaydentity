import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Returns a production-ready n8n Workflow Blueprint JSON for FolioForge CV & Portfolio Automation.
 * Users can import this JSON directly into any self-hosted or cloud n8n instance.
 */
export async function GET() {
  const workflowBlueprint = {
    name: "FolioForge AI Portfolio & CV Automation Pipeline",
    nodes: [
      {
        parameters: {
          httpMethod: "POST",
          path: "folioforge-cv-upload",
          responseMode: "lastNode",
          options: {}
        },
        id: "node-webhook-1",
        name: "Webhook Trigger",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: [250, 300]
      },
      {
        parameters: {
          method: "POST",
          url: "https://zaydentity.vercel.app/api/n8n",
          sendHeaders: true,
          headerParameters: {
            parameters: [
              {
                name: "Content-Type",
                value: "application/json"
              }
            ]
          },
          sendBody: true,
          bodyParameters: {
            parameters: [
              {
                name: "cvText",
                value: "={{ $json.body.cvText || $json.body.rawText || 'Full Stack Engineer with React, Node.js and TypeScript' }}"
              }
            ]
          },
          options: {}
        },
        id: "node-http-folioforge-2",
        name: "FolioForge AI Engine",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.1,
        position: [480, 300]
      },
      {
        parameters: {
          jsCode: "// n8n Transformer Node: Enrich Portfolio Metadata\nconst portfolio = $input.first().json.portfolio;\n\nreturn [{\n  json: {\n    status: 'success',\n    portfolioName: portfolio.personal.name,\n    portfolioTitle: portfolio.personal.title,\n    skillsCount: portfolio.skills.length,\n    detectedSkills: portfolio.skills,\n    generatedAt: new Date().toISOString()\n  }\n}];"
        },
        id: "node-code-transform-3",
        name: "Portfolio Data Transformer",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [710, 300]
      }
    ],
    connections: {
      "Webhook Trigger": {
        main: [
          [
            {
              node: "FolioForge AI Engine",
              type: "main",
              index: 0
            }
          ]
        ]
      },
      "FolioForge AI Engine": {
        main: [
          [
            {
              node: "Portfolio Data Transformer",
              type: "main",
              index: 0
            }
          ]
        ]
      }
    },
    active: false,
    settings: {
      executionOrder: "v1"
    },
    versionId: "folioforge-n8n-v2.0.0"
  };

  return new NextResponse(JSON.stringify(workflowBlueprint, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="folioforge-n8n-workflow.json"'
    }
  });
}
