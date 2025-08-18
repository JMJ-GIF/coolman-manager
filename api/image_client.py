import os
import boto3
from dotenv import load_dotenv
from botocore.config import Config

load_dotenv()

# TODO: make this into a single S3Client class

session = boto3.session.Session(
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION_NAME")
)

s3 = session.client(
    's3',
    endpoint_url=os.getenv("S3_ENDPOINT_URL"),
    config=Config(signature_version='s3v4') 
)

BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
STAGE = os.getenv('API_STAGE')

def upload_image(image: bytes, user_idx: int, session_type: str) -> str:
    object_name = f'{STAGE}/{session_type}/{user_idx}.jpeg'
    try:
        s3.upload_fileobj(
            Fileobj = image, 
            Bucket = BUCKET_NAME, 
            Key = object_name,
            ExtraArgs={"ACL": "public-read"} 
        )

        image_url = f"{os.getenv('S3_ENDPOINT_URL')}/{BUCKET_NAME}/{object_name}"
        print(f"Image uploaded successfully: {image_url}")
        return image_url
    except Exception as e:
        print(f"Error uploading image: {e}")
        raise

def delete_image(user_idx: int, session_type: str) -> dict:
    
    object_name = f'{STAGE}/{session_type}/{user_idx}.jpeg'
    s3.delete_object(Bucket=BUCKET_NAME, Key=object_name)

    return {"message": "Image deleted successfully!"}

if __name__ == "__main__":

    with open("test.png", "rb") as image_file:
        
        print(upload_image(image_file, 14))