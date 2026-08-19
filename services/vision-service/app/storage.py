import boto3

from app.config import S3_ACCESS_KEY, S3_BUCKET, S3_ENDPOINT, S3_SECRET_KEY

_client = boto3.client(
    "s3",
    endpoint_url=S3_ENDPOINT,
    aws_access_key_id=S3_ACCESS_KEY,
    aws_secret_access_key=S3_SECRET_KEY,
    region_name="us-east-1",
)


def download_image(key: str) -> bytes:
    obj = _client.get_object(Bucket=S3_BUCKET, Key=key)
    return obj["Body"].read()
