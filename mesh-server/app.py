from flask import Flask
import boto3
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

BUCKET_NAME = os.environ('AWS_S3_BUCKET_NAME')
ACCESS_KEY = os.environ('AWS_ACCESS_KEY')
SECRET_KEY = os.environ('AWS_SECRET_KEY')

s3_client = boto3.client('s3',region_name='eu-north-1',
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY,)

@app.route("/")
def hello_world():
    return {'Content': 'Hello Benchmark'}


@app.route("/checkpoint/1")
def checkpoint_1_gltf():
    full_keys = get_object_keys_for_prefix('gltf/checkpoint-1/full/')
    full_urls = convert_keys_to_presigned_urls(full_keys)

    simple_keys = get_object_keys_for_prefix('gltf/checkpoint-1/simple/')
    simple_urls = convert_keys_to_presigned_urls(simple_keys)

    multiple_keys = get_object_keys_for_prefix('gltf/checkpoint-1/multiple/')
    multiple_urls = convert_keys_to_presigned_urls(multiple_keys)

    json_keys = get_object_keys_for_prefix('json/checkpoint-1/')
    json_urls = convert_keys_to_presigned_urls(json_keys)

    position = {'x': 500, 'y': 0, 'z': -500}

    return {'full_urls': full_urls, 'simple_urls': simple_urls, 'multiple_urls': multiple_urls, 'json_urls': json_urls, 'position': position }

@app.route("/checkpoint/2")
def checkpoint_2_gltf():
    full_keys = get_object_keys_for_prefix('gltf/checkpoint-2/full/')
    full_urls = convert_keys_to_presigned_urls(full_keys)

    simple_keys = get_object_keys_for_prefix('gltf/checkpoint-2/simple/')
    simple_urls = convert_keys_to_presigned_urls(simple_keys)

    multiple_keys = get_object_keys_for_prefix('gltf/checkpoint-2/multiple/')
    multiple_urls = convert_keys_to_presigned_urls(multiple_keys)

    json_keys = get_object_keys_for_prefix('json/checkpoint-2/')
    json_urls = convert_keys_to_presigned_urls(json_keys)

    position = {'x': -500, 'y': 0, 'z': -500}

    return {'full_urls': full_urls, 'simple_urls': simple_urls, 'multiple_urls': multiple_urls, 'json_urls': json_urls, 'position': position }

@app.route("/checkpoint/3")
def checkpoint_3_gltf():
    full_keys = get_object_keys_for_prefix('gltf/checkpoint-3/full/')
    full_urls = convert_keys_to_presigned_urls(full_keys)

    simple_keys = get_object_keys_for_prefix('gltf/checkpoint-3/simple/')
    simple_urls = convert_keys_to_presigned_urls(simple_keys)

    multiple_keys = get_object_keys_for_prefix('gltf/checkpoint-3/multiple/')
    multiple_urls = convert_keys_to_presigned_urls(multiple_keys)

    json_keys = get_object_keys_for_prefix('json/checkpoint-3/')
    json_urls = convert_keys_to_presigned_urls(json_keys)

    position = {'x': -500, 'y': 0, 'z': 500}

    return {'full_urls': full_urls, 'simple_urls': simple_urls, 'multiple_urls': multiple_urls, 'json_urls': json_urls, 'position': position }

@app.route("/checkpoint/4")
def checkpoint_4_gltf():
    full_keys = get_object_keys_for_prefix('gltf/checkpoint-4/full/')
    full_urls = convert_keys_to_presigned_urls(full_keys)

    simple_keys = get_object_keys_for_prefix('gltf/checkpoint-4/simple/')
    simple_urls = convert_keys_to_presigned_urls(simple_keys)

    multiple_keys = get_object_keys_for_prefix('gltf/checkpoint-4/multiple/')
    multiple_urls = convert_keys_to_presigned_urls(multiple_keys)

    json_keys = get_object_keys_for_prefix('json/checkpoint-4/')
    json_urls = convert_keys_to_presigned_urls(json_keys)

    position = {'x': 0, 'y': 0, 'z': 1500}

    return {'full_urls': full_urls, 'simple_urls': simple_urls, 'multiple_urls': multiple_urls, 'json_urls': json_urls, 'position': position }

@app.route("/checkpoint/5")
def checkpoint_5_gltf():
    full_keys = get_object_keys_for_prefix('gltf/checkpoint-5/full/')
    full_urls = convert_keys_to_presigned_urls(full_keys)

    simple_keys = get_object_keys_for_prefix('gltf/checkpoint-5/simple/')
    simple_urls = convert_keys_to_presigned_urls(simple_keys)

    multiple_keys = get_object_keys_for_prefix('gltf/checkpoint-5/multiple/')
    multiple_urls = convert_keys_to_presigned_urls(multiple_keys)

    json_keys = get_object_keys_for_prefix('json/checkpoint-5/')
    json_urls = convert_keys_to_presigned_urls(json_keys)

    position = {'x': 500,'y': 0, 'z': 500}

    return {'full_urls': full_urls, 'simple_urls': simple_urls, 'multiple_urls': multiple_urls, 'json_urls': json_urls, 'position': position }


def get_object_keys_for_prefix(prefix):
    s3_result = s3_client.list_objects(
        Bucket=BUCKET_NAME,
        Prefix=prefix
    )

    objects = s3_result['Contents']
    keys = [o['Key'] for o in objects if o['Size'] > 0]

    return keys

def convert_keys_to_presigned_urls(keys):
    urls = list(map(lambda key: s3_client.generate_presigned_url(
        ClientMethod='get_object',
        Params={'Bucket': BUCKET_NAME, 'Key': key, },
        ExpiresIn=900,), keys))

    return urls
