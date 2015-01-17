
zip -r ionjs.zip .

echo "Upload..."

aws lambda upload-function \
  --function-name ion-processing \
  --function-zip ionjs.zip \
  --runtime nodejs \
  --role arn:aws:iam::225011719747:role/invocationrole \
  --handler handler \
  --mode event



