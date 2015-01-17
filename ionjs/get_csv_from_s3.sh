aws s3api get-object \
 --bucket "ion-sensors" \
 --key "$1" \
 out.csv

csvData=`cat out.csv`

node ion.js $csvData

