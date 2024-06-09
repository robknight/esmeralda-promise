import { MessagePCDPackage } from "@pcd/message-pcd";
import { ArgumentTypeName } from "@pcd/pcd-types";
import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  const { name, friend, promise } = await req.json();

  const promiseMade = await MessagePCDPackage.prove({
    id: {
      argumentType: ArgumentTypeName.String,
      value: uuidv4() //(friend, promise)
    },
    privateKey: {
      argumentType: ArgumentTypeName.String,
      value: process.env.PRIVATE_KEY
    },
    message: {
      argumentType: ArgumentTypeName.Object,
      value: {
        displayName: `Promise to ${friend}`,
        mdBody: `${promise}`
      }
    }
  });

  const promiseReceived = await MessagePCDPackage.prove({
    id: {
      argumentType: ArgumentTypeName.String,
      value: uuidv4() //(friend, promise)
    },
    privateKey: {
      argumentType: ArgumentTypeName.String,
      value: process.env.PRIVATE_KEY
    },
    message: {
      argumentType: ArgumentTypeName.Object,
      value: {
        displayName: `Promise by ${name}`,
        mdBody: `${promise}`
      }
    }
  });

  const serializedPM = await MessagePCDPackage.serialize(promiseMade);
  const serializedPR = await MessagePCDPackage.serialize(promiseReceived);

  return Response.json({ made: serializedPM, received: serializedPR });
}
