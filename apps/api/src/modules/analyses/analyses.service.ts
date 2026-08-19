import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Analysis, AnalysisStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { QueueService } from '../../queue/queue.service';

@Injectable()
export class AnalysesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService
  ) {}

  async create(userId: string, kind: 'face' | 'body', imageKey: string) {
    const analysis = await this.prisma.analysis.create({
      data: {
        userId,
        kind,
        imageKey,
        status: AnalysisStatus.PROCESSING
      }
    });

    await this.queue.publishJob({
      analysisId: analysis.id,
      imageKey,
      kind
    });

    return { analysisId: analysis.id, status: analysis.status };
  }

  async findById(userId: string, analysisId: string): Promise<Analysis> {
    const analysis = await this.prisma.analysis.findUnique({
      where: { id: analysisId }
    });

    if (!analysis) {
      throw new NotFoundException('Análisis no encontrado');
    }

    if (analysis.userId !== userId) {
      throw new ForbiddenException('No podés acceder a este análisis');
    }

    return analysis;
  }

  async updateResult(analysisId: string, resultJson: unknown, error?: string | null) {
    const analysis = await this.prisma.analysis.findUnique({
      where: { id: analysisId }
    });

    if (!analysis) {
      throw new NotFoundException('Análisis no encontrado');
    }

    return this.prisma.analysis.update({
      where: { id: analysisId },
      data: {
        resultJson:
          resultJson === null || resultJson === undefined
            ? Prisma.JsonNull
            : (resultJson as Prisma.InputJsonValue),
        error: error ?? null,
        status: error ? AnalysisStatus.FAILED : AnalysisStatus.COMPLETED
      }
    });
  }

  async markProcessing(analysisId: string) {
    return this.prisma.analysis.update({
      where: { id: analysisId },
      data: { status: AnalysisStatus.PROCESSING }
    });
  }
}
