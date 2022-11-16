FROM python:3.10.6-slim-buster

COPY requirements.txt requirements.txt

RUN pip install -r requirements.txt

ENV AWS_ACCESS_KEY --PLACEHOLDER--
ENV AWS_SECRET_KEY --PLACEHOLDER--
ENV AWS_S3_BUCKET_NAME --PLACEHOLDER--

COPY . .

CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0"]