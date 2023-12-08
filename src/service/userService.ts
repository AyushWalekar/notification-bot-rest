import { COLLECTIONS } from "../constants";
import { db } from "../db";
import { Channel, UserMapping } from "../model/UserMapping";

async function getUserMappingByChannelInfo(
  channelUserId: string,
  channel: Channel
): Promise<UserMapping | undefined> {
  try {
    const result = await db
      .collection<UserMapping>(COLLECTIONS.USER_MAPPING)
      .findOne({
        channelUserId: channelUserId,
        channel: channel,
      });
    return result;
  } catch (error) {
    console.error("Error fetching internal user ID:", error);
    return null;
  }
}

async function getUserMappingByUserIdChannel(
  userId: string,
  channel: Channel
): Promise<UserMapping | undefined> {
  try {
    const result = await db
      .collection<UserMapping>(COLLECTIONS.USER_MAPPING)
      .findOne({
        userId: userId,
        channel: channel,
      });
    return result;
  } catch (error) {
    console.error("Error fetching internal user ID:", error);
    return null;
  }
}

async function upsertUserMapping(
  userMapping: Partial<UserMapping>
): Promise<void> {
  try {
    if (!userMapping._id) {
      userMapping._id = `${userMapping.channel}:${userMapping.channelUserId}`;
    }
    //upsert in mongo db
    await db
      .collection<UserMapping>(COLLECTIONS.USER_MAPPING)
      .updateOne(
        { _id: userMapping._id },
        { $set: userMapping },
        { upsert: true }
      );
  } catch (error) {
    console.error("Error saving user mapping:", error);
  }
}

export {
  getUserMappingByChannelInfo,
  getUserMappingByUserIdChannel,
  upsertUserMapping,
};
