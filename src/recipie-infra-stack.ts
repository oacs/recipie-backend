import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { join } from "path";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Cors, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";

export class RecipieInfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const recipeTable = createDynamoDBTable(this, "recipe");

    const ingredientTable = createDynamoDBTable(this, "ingredients");

    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          "aws-sdk", // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      depsLockFilePath: join(__dirname, "../pnpm-lock.yaml"),
      environment: {
        RECIPE_TABLE_NAME: recipeTable.tableName,
        INGREDIENT_TABLE_NAME: ingredientTable.tableName,
      },
      runtime: Runtime.NODEJS_16_X,
    };

    const getRecipes = createLambda(
      this,
      "getRecipesFunction",
      nodeJsFunctionProps
    );
    recipeTable.grantReadData(getRecipes);
    ingredientTable.grantReadData(getRecipes);

    const getRecipesIntegration = new LambdaIntegration(getRecipes);

    const api = createApiGateway(this, "recipeApi");

    const recipes = api.root.addResource("recipeApiResource");
    recipes.addMethod("GET", getRecipesIntegration);
  }
}

function createDynamoDBTable(scope: Construct, name: string) {
  return new Table(scope, name, {
    partitionKey: { name: "id", type: AttributeType.STRING },
  });
}

function createLambda(
  scope: Construct,
  name: string,
  props: NodejsFunctionProps
) {
  return new NodejsFunction(scope, name, {
    entry: join(__dirname, "lambda", "recipe.handler.ts"),
    ...props,
  });
}

function createApiGateway(scope: Construct, name: string) {
  return new RestApi(scope, name, {
    defaultCorsPreflightOptions: {
      allowOrigins: Cors.ALL_ORIGINS,
    },
    restApiName: `${name} Service`,
  });
}
