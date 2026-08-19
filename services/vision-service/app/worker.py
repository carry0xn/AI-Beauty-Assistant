import json
import logging

import httpx
import pika

from app.analysis.face import analyze_face
from app.config import (
    ANALYSES_QUEUE,
    BFF_URL,
    INTERNAL_API_KEY,
    RABBITMQ_URL,
)
from app.storage import download_image

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aura.vision-worker")


def notify_result(analysis_id: str, result_json=None, error=None):
    payload = {}
    if error is not None:
        payload["error"] = error
    else:
        payload["resultJson"] = result_json

    response = httpx.patch(
        f"{BFF_URL}/analyses/{analysis_id}/result",
        json=payload,
        headers={"x-internal-key": INTERNAL_API_KEY},
        timeout=15,
    )
    if response.status_code >= 300:
        logger.error("Callback falló %s: %s", response.status_code, response.text)
    else:
        logger.info("Resultado guardado para análisis %s", analysis_id)


def handle_job(channel, method, properties, body):
    job = json.loads(body)
    analysis_id = job["analysisId"]
    image_key = job["imageKey"]
    kind = job["kind"]
    logger.info("Procesando análisis %s (%s)", analysis_id, kind)

    try:
        image_bytes = download_image(image_key)
        if kind == "face":
            result = analyze_face(image_bytes)
        else:
            raise ValueError("Análisis de cuerpo aún no implementado")
        notify_result(analysis_id, result_json=result)
    except Exception as exc:
        logger.exception("Error procesando análisis %s", analysis_id)
        notify_result(analysis_id, error=str(exc))
    finally:
        channel.basic_ack(delivery_tag=method.delivery_tag)


def main():
    connection = pika.BlockingConnection(
        pika.URLParameters(RABBITMQ_URL)
    )
    channel = connection.channel()
    channel.queue_declare(queue=ANALYSES_QUEUE, durable=True)
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue=ANALYSES_QUEUE, on_message_callback=handle_job)
    logger.info("Worker escuchando en la cola '%s'", ANALYSES_QUEUE)

    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        channel.stop_consuming()
    finally:
        connection.close()


if __name__ == "__main__":
    main()
