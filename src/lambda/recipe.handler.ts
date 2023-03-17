import {
  DeleteItemCommand,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayEvent, APIGatewayProxyCallback, Context } from "aws-lambda";
import { DynamoClient } from "../aws/DynamoClient";
const RECIPE_TABLE_NAME = process.env.RECIPE_TABLE_NAME || "";

export const handler = async (
  event: APIGatewayEvent,
  _context: Context,
  callback: APIGatewayProxyCallback
): Promise<any> => {
  let body;
  switch (event.httpMethod) {
    case "GET":
      if (event.pathParameters != null && event.pathParameters.id) {
        body = await getRecipe(event.pathParameters.id);
      } else {
        body = await getAllRecipes();
      }
    case "POST":
      body = await createRecipe(event);
      break;
    case "DELETE":
      if (event.pathParameters != null && event.pathParameters.id) {
        body = await deleteRecipe(event.pathParameters.id);
      } else {
        throw new Error("Missing recipe id");
      }
    default:
      throw new Error(`Unsupported route: '${event.httpMethod}'`);
  }

  callback(null, {
    statusCode: 200,
    body: JSON.stringify(body),
  });
};

const getRecipe = async (recipeId: string) => {
  try {
    const params = {
      TableName: RECIPE_TABLE_NAME,
      Key: marshall({ id: recipeId }),
    };

    const { Item } = await DynamoClient.send(new GetItemCommand(params));
    return Item ? unmarshall(Item) : {};
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const getAllRecipes = async () => {
  try {
    const params = {
      TableName: RECIPE_TABLE_NAME,
    };

    const { Items } = await DynamoClient.send(new ScanCommand(params));
    return Items ? Items.map((item) => unmarshall(item)) : {};
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const deleteRecipe = async (recipeId: string) => {
  try {
    const params = {
      TableName: RECIPE_TABLE_NAME,
      Key: marshall({ id: recipeId }),
    };
    await DynamoClient.send(new DeleteItemCommand(params));
    return {};
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const createRecipe = async (event: APIGatewayEvent) => {
  if (!event.body) {
    throw " Missing recipe body";
  }
  try {
    const recipe = JSON.parse(event.body);
    if (!recipe.id) {
      throw new Error("Missing recipe id");
    }
    const params = {
      TableName: RECIPE_TABLE_NAME,
      Item: marshall(recipe),
    };
    await DynamoClient.send(new PutItemCommand(params));
    return recipe;
  } catch (e) {
    console.error(e);
    throw e;
  }
};
