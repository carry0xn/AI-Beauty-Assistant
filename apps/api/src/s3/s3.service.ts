import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;
  private readonly bucket = process.env.S3_BUCKET ?? 'aura-photos';

  constructor() {
    this.client = new S3Client({
      region: process.env.S3_REGION ?? 'us-east-1',
      endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
      forcePathStyle: true,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY ?? 'minioadmin',
        secretAccessKey: process.env.S3_SECRET_KEY ?? 'minioadmin'
      }
    });
  }

  async onModuleInit() {
    try {
      await this.ensureBucket();
      this.logger.log(`Bucket S3 '${this.bucket}' listo`);
    } catch (error) {
      this.logger.warn(
        `No se pudo inicializar S3/MinIO (el bucket se reintentará en cada upload): ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private async ensureBucket() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }

    await this.client.send(
      new PutBucketCorsCommand({
        Bucket: this.bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: [process.env.WEB_URL ?? 'http://localhost:3000'],
              AllowedMethods: ['PUT', 'GET', 'HEAD'],
              AllowedHeaders: ['*'],
              MaxAgeSeconds: 3600
            }
          ]
        }
      })
    );
  }

  async presignPut(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType
    });
    return getSignedUrl(this.client, command, { expiresIn: 60 * 10 });
  }

  async presignGet(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key
    });
    return getSignedUrl(this.client, command, { expiresIn: 60 * 10 });
  }

  getObjectUrl(key: string): string {
    return `${process.env.S3_PUBLIC_ENDPOINT ?? 'http://localhost:9000'}/${this.bucket}/${key}`;
  }
}
