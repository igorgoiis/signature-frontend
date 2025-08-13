import { NextRequest, NextResponse } from 'next/server';
import {getServerSession} from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
      return new NextResponse('Não autorizado', { status: 401 });
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

    const response = await fetch(`${API_URL}/documents/${id}/download`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro ao obter documento: ${response.status}`, errorText);
      return new NextResponse(`Erro ao obter documento: ${response.status}`, {
        status: response.status
      });
    }

    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="document-${id}.pdf"`
      }
    });
  } catch (error) {
    console.error('Erro ao processar o documento:', error);
    return new NextResponse('Erro ao processar o documento', { status: 500 });
  }
}