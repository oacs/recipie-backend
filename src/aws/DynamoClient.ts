import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
const REGION = "us-east-1";
// Create an Amazon DynamoDB service client object.
const DynamoClient = new DynamoDBClient({ region: REGION });
export { DynamoClient };
