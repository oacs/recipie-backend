import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
const RECIPE_TABLE_NAME = process.env.RECIPE_TABLE_NAME || "";

const db = new DynamoDBClient();

export const handler = async (): Promise<any> => {
  const params = {
    TableName: RECIPE_TABLE_NAME,
  };

  try {
    const response = await db.scan(params).promise();
    return { statusCode: 200, body: JSON.stringify(response.Items) };
  } catch (dbError) {
    return { statusCode: 500, body: JSON.stringify(dbError) };
  }
};
