import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { S3Service } from '../../s3/s3.service';

@Injectable()
export class UploadsService {
  constructor(private readonly s3: S3Service) {}

  async presign(userId: string, fileName: string, contentType: string) {
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `users/${userId}/uploads/${randomUUID()}_${safeName}`;

    const uploadUrl = await this.s3.presignPut(key, contentType);

    return {
      uploadUrl,
      key,
      getUrl: this.s3.getObjectUrl(key)
    };
  }
}
