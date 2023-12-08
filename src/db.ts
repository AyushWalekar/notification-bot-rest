import { Db, MongoClient, MongoClientOptions } from "mongodb";
import config from "./internal/config";
const dbName = "bot-poc";

let db: Db;

const connectToMongo = async () => {
  const client = await MongoClient.connect(config.mongoDbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as MongoClientOptions);
  db = client.db(dbName);
};

export { db, connectToMongo };
