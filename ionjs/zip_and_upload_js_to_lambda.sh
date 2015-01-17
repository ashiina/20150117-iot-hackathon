
zip -r ionjs.zip .

echo "Upload..."

aws lambda upload-function \
  --function-name ion-processing \
  --function-zip ionjs.zip \
  --runtime nodejs \
  --role arn:aws:iam::***:role/invocationrole \
  --handler handler \
  --mode event



