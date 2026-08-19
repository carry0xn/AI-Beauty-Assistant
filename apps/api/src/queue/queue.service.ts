import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Channel, ChannelModel, connect } from 'amqplib';

export interface AnalysisJob {
  analysisId: string;
  imageKey: string;
  kind: 'face' | 'body';
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private connection!: ChannelModel;
  private channel!: Channel;
  private readonly url = process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';
  private readonly queue = process.env.ANALYSES_QUEUE ?? 'analyses';

  async onModuleInit() {
    this.connection = await connect(this.url);
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(this.queue, { durable: true });
    this.logger.log(`Conectado a RabbitMQ, cola '${this.queue}'`);
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }

  async publishJob(job: AnalysisJob) {
    this.channel.sendToQueue(this.queue, Buffer.from(JSON.stringify(job)), {
      persistent: true
    });
  }
}
